import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { auditPublication, checkLink, findCandidates } from '../scripts/audit-bibliography.mjs';
import { crossref, normalizeDoi } from '../scripts/crossref.mjs';
import { deduplicate, enrichEntry, parseScholar, toBibtex, toCsv, toRis } from '../scripts/import-scholar.mjs';

const scholarText = [
  'Título\tCitado por\tAño',
  'Experimental regulation\t1,207\t2022',
  'A Martínez-Antonio, C Person',
  'Illustrative Journal 10 (1), 50–54',
  'DOI: https://doi.org/10.1234/AB',
  'Tipo: artículo',
  '',
  'Experimental regulation',
  'A Martínez-Antonio, C Person',
  'Illustrative Journal 10 (1), 50–54\t1,300\t2022',
  '',
  'A plant preprint',
  'C Person, …',
  'bioRxiv',
  '8',
  '2023',
].join('\r\n');

const articleDeposit = {
  DOI: '10.1234/ab', title: ['Experimental regulation'],
  author: [{ given: 'Agustino', family: 'Martínez-Antonio', affiliation: [{ name: 'Example Institute' }] }],
  'container-title': ['Illustrative Journal'], type: 'journal-article',
  published: { 'date-parts': [[2022]] }, 'published-online': { 'date-parts': [[2021, 9, 3]] },
};

test('parses common clipboard table and multiline patterns', () => {
  const entries = parseScholar(scholarText);
  assert.equal(entries.length, 3);
  assert.equal(entries[0].citations, 1207);
  assert.equal(entries[0].doi, '10.1234/ab');
  assert.equal(entries[0].type, 'journal-article');
  assert.deepEqual(entries[0].authors, ['A Martínez-Antonio', 'C Person']);
  assert.equal(entries[0].source.firstLine, 2);
  assert.equal(entries[1].venue, 'Illustrative Journal 10 (1), 50–54');
  assert.equal(entries[1].citations, 1300);
  assert.equal(entries[2].type, 'posted-content');
  assert.ok(entries[2].flags.includes('truncated_authors'));
  assert.ok(entries[2].flags.includes('researcher_name_not_matched'));
});

test('deduplicates strong identifiers and preserves same-title candidates separately', () => {
  const exact = parseScholar(scholarText);
  const duplicate = { ...exact[0], title: 'Different title', source: { firstLine: 30, lastLine: 34 } };
  const catalogue = deduplicate([...exact, duplicate, exact[1]]);
  assert.equal(catalogue.length, 3);
  assert.equal(catalogue[0].variants.length, 2);
  assert.equal(catalogue[1].variants.length, 2);
  assert.ok(catalogue[0].flags.includes('conflicting_metadata_for_doi'));
  assert.deepEqual(catalogue[1].possibleRelatedRecords, ['scholar-1']);
  assert.ok(catalogue.every(entry => entry.status === 'needs_review'));
});

test('keeps distinct DOI records with the same title, including a possible preprint', () => {
  const base = parseScholar(scholarText)[0];
  const catalogue = deduplicate([base, { ...base, doi: '10.1234/xy', type: 'posted-content' }]);
  assert.equal(catalogue.length, 2);
  assert.deepEqual(catalogue[0].possibleRelatedRecords, ['scholar-2']);
});

test('escapes bibliographic export fields and retains review status', () => {
  const [entry] = deduplicate(parseScholar([
    'Title: =An article with "quotes" & braces {A}', 'Authors: A Martínez-Antonio; C Person',
    'Year: 2024', 'DOI: 10.1234/fun;3', 'Type: review',
  ].join('\n')));
  assert.match(toCsv([entry]), /"'=An article with ""quotes"" & braces \{A\}"/u);
  assert.match(toBibtex([entry]), /&/u);
  assert.match(toBibtex([entry]), /\\\{A\\\}/u);
  assert.match(toRis([entry]), /TY  - JOUR\r\n/u);
  assert.match(toRis([entry]), /AU  - C Person\r\n/u);
  assert.match(toRis([entry]), /UR  - https:\/\/doi\.org\/10\.1234\/fun%3B3\r\n/u);
});

test('writes original bytes and four exchange files, and protects the original from replacement', async t => {
  const temp = await mkdtemp(join(tmpdir(), 'bioengineering-scholar-'));
  t.after(() => rm(temp, { recursive: true, force: true }));
  const file = join(temp, 'Scholar lista.txt');
  const out = join(temp, 'review');
  const original = Buffer.from('\uFEFF' + scholarText);
  const script = fileURLToPath(new URL('../scripts/import-scholar.mjs', import.meta.url));
  await writeFile(file, original);
  const run = () => execFileSync(process.execPath, [script, file, '--out', out], { stdio: 'pipe' });
  run();
  assert.deepEqual(await readFile(join(out, 'original.txt')), original);
  const report = JSON.parse(await readFile(join(out, 'review-report.json'), 'utf8'));
  assert.equal(report.inputBlocks, 3);
  assert.equal(report.queriedCrossref, 0);
  assert.equal(report.sha256.length, 64);
  for (const name of ['bibliography.json', 'bibliography.csv', 'bibliography.bib', 'bibliography.ris']) {
    assert.ok((await readFile(join(out, name))).length > 30);
  }
  await writeFile(file, 'Different source');
  assert.throws(run, /El directorio conserva otro original/u);
  assert.deepEqual(await readFile(join(out, 'original.txt')), original);
});

test('Crossref requests encode DOI components and keep imported records pending', async () => {
  assert.equal(normalizeDoi('https://doi.org/10.1234/AB%28cd%29'), '10.1234/ab(cd)');
  const [entry] = parseScholar(scholarText);
  const result = await enrichEntry(entry, ({ doi }) => crossref({
    doi,
    fetcher: async url => {
      assert.equal(url.origin + url.pathname, 'https://api.crossref.org/works/10.1234/ab');
      return Response.json({ message: articleDeposit });
    },
  }));
  assert.equal(result.status, 'deposit_found_review_required');
  assert.equal(result.deposit.publishedOnline, '2021-09-03');
  assert.deepEqual(result.deposit.authors[0].affiliations, ['Example Institute']);
  assert.equal(result.yearMatch, true);
});

test('discovery excludes known identifiers and similar surnames', async () => {
  const rows = [
    articleDeposit,
    { ...articleDeposit, DOI: '10.1234/cd', author: [{ given: 'Agustin', family: 'Martínez-Antonio' }] },
    { ...articleDeposit, DOI: '10.1234/ef', author: [{ given: 'Agustino Martínez', family: 'Antonio' }] },
  ];
  const report = await findCandidates([{ doi: '10.1234/ab' }], '2022-01-01', '2025-01-01', async () =>
    ({ items: rows, 'total-results': 110 }));
  assert.deepEqual(report.candidates.map(entry => entry.doi), ['10.1234/ef']);
  assert.equal(report.candidates[0].status, 'needs_identity_and_publication_review');
  assert.ok(report.searches.every(search => search.truncated));
});

test('audits notices, version candidates and restricted links without updating catalogue', async () => {
  const publication = {
    id: 'example', title: 'Experimental regulation', year: 2022,
    type: 'preprint', doi: '10.1234/ab', authors: ['Agustino Martínez-Antonio'],
  };
  const notice = { DOI: '10.1234/notice', 'update-to': [{ DOI: publication.doi, type: 'correction' }] };
  const result = await auditPublication(
    publication,
    async ({ doi, query }) => doi ? { ...articleDeposit, 'updated-by': [{ DOI: notice.DOI, type: 'correction' }] }
      : query.filter.startsWith('updates:') ? { items: [notice], 'total-results': 1 }
        : { items: [{ ...articleDeposit, DOI: '10.1234/article' }] },
    async url => ({ status: 'access_restricted', url }),
  );
  assert.deepEqual(result.editorialNotices, [{ doi: '10.1234/notice', type: 'correction' }]);
  assert.equal(result.versionCandidates[0].status, 'possible_version_review_required');
  assert.equal(result.links[0].status, 'access_restricted');
  assert.deepEqual(result.differences, []);
  assert.equal(publication.type, 'preprint');
});

test('falls back to a ranged request when HEAD is unsupported', async () => {
  const status = await checkLink('https://example.org/article', async (_, options) => {
    if (options.method === 'HEAD') return new Response(null, { status: 405 });
    assert.equal(options.headers.Range, 'bytes=0-0');
    return new Response('x', { status: 206 });
  });
  assert.deepEqual(status, { status: 'reachable', httpStatus: 206, url: 'https://example.org/article' });
});
