import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { crossref, doiUrl, matchText, normalizeDoi, summarizeMetadata } from './crossref.mjs';

const contentDirectory = new URL('../content/', import.meta.url);
const yearMonthDay = date => date.toISOString().slice(0, 10);
const profileVariants = ['Agustino Martínez-Antonio', 'Agustino Martinez Antonio', 'A Martinez-Antonio'];
const profileResultLimit = 50;

export async function checkLink(link, fetcher = fetch) {
  if (new URL(link).protocol !== 'https:') return { status: 'skipped_non_https', url: link };
  const options = { signal: AbortSignal.timeout(8000) };
  let response = await fetcher(link, { ...options, method: 'HEAD' });
  if ([405, 501].includes(response.status)) {
    await response.body?.cancel();
    response = await fetcher(link, { ...options, headers: { Range: 'bytes=0-0' } });
  }
  await response.body?.cancel();
  const restricted = [401, 403, 429, 451].includes(response.status);
  const status = response.ok ? 'reachable' : restricted ? 'access_restricted' : 'review_required';
  return { status, httpStatus: response.status, url: response.url || link };
}

export async function findCandidates(publications, since, until, request = crossref) {
  const known = new Set(publications.map(publication => normalizeDoi(publication.doi)).filter(Boolean));
  const candidates = new Map();
  const searches = [];
  for (const variant of profileVariants) {
    try {
      const result = await request({ query: {
        'query.author': variant, filter: 'from-pub-date:' + since + ',until-pub-date:' + until,
        rows: String(profileResultLimit),
      } });
      const items = result.items ?? [];
      searches.push({
        variant,
        examined: items.length,
        resultCount: result['total-results'] ?? null,
        truncated: result['total-results'] > items.length,
      });
      for (const metadata of items.map(summarizeMetadata)) {
        if (!metadata.doi || known.has(metadata.doi) || !metadata.researcherNameMatch) continue;
        candidates.set(metadata.doi, { ...metadata, status: 'needs_identity_and_publication_review' });
      }
    } catch (error) {
      searches.push({ variant, error: error.message });
      if (error.status === 429) break;
    }
  }
  return { searches, candidates: [...candidates.values()] };
}

export async function auditPublication(publication, request = crossref, verifyLink = checkLink) {
  const { id, title, authors, year, url } = publication;
  const doi = normalizeDoi(publication.doi);
  const result = { id, doi, editorialNotices: [], versionCandidates: [], differences: [], failures: [], links: [] };
  const tasks = {};
  if (doi) {
    tasks.metadata = request({ doi });
    tasks.notices = request({ query: { filter: 'updates:' + doi, rows: '20' } });
    tasks.doiLink = verifyLink(doiUrl(doi));
  } else {
    result.differences.push('doi_missing_or_invalid');
  }
  if (url && url !== (doi ? doiUrl(doi) : '')) tasks.catalogueLink = verifyLink(url);
  if (/preprint|posted content/u.test(matchText(publication.type)) || /preprints\.org/iu.test(url ?? '')) {
    tasks.versions = request({ query: {
      'query.bibliographic': title, filter: 'type:journal-article', rows: '5',
    } });
  }

  const names = Object.keys(tasks);
  const responses = await Promise.allSettled(Object.values(tasks));
  const settled = Object.fromEntries(responses.flatMap((response, index) => {
    const name = names[index];
    if (response.status === 'fulfilled') return [[name, response.value]];
    result.failures.push({ check: name, message: response.reason.message });
    return [];
  }));

  if (settled.metadata) {
    const metadata = summarizeMetadata(settled.metadata);
    result.crossref = metadata;
    if (doi !== metadata.doi) result.differences.push('doi_deposit_mismatch');
    if (matchText(title) !== matchText(metadata.title)) result.differences.push('title_deposit_mismatch');
    if (authors?.length && authors.map(matchText).join('|') !== metadata.authors.map(author => matchText(author.name)).join('|')) {
      result.differences.push('author_deposit_mismatch');
    }
    const years = [metadata.published, metadata.publishedOnline, metadata.publishedPrint].filter(Boolean).map(date => date.slice(0, 4));
    if (year && !years.includes(String(year))) result.differences.push('year_deposit_mismatch');
    result.editorialNotices.push(...metadata.updatedBy);
  }
  if (settled.notices) {
    const items = settled.notices.items ?? [];
    for (const notice of items) {
      const found = (notice['update-to'] ?? []).find(entry => normalizeDoi(entry.DOI) === doi);
      if (normalizeDoi(notice.DOI)) {
        result.editorialNotices.push({ doi: normalizeDoi(notice.DOI), type: found?.type ?? null });
      }
    }
    if (settled.notices['total-results'] > items.length) result.failures.push({ check: 'notices', message: 'result_limit_reached' });
  }
  result.editorialNotices = [...new Map(result.editorialNotices.map(notice =>
    [JSON.stringify([notice.doi, notice.type]), notice],
  )).values()];
  if (settled.versions) {
    const matched = (settled.versions.items ?? []).map(summarizeMetadata).filter(candidate =>
      candidate.doi && candidate.doi !== doi &&
      (candidate.researcherNameMatch || matchText(candidate.title) === matchText(title)),
    );
    result.versionCandidates = matched.map(candidate => ({ ...candidate, status: 'possible_version_review_required' }));
  }
  if (settled.doiLink) result.links.push(settled.doiLink);
  if (settled.catalogueLink) result.links.push(settled.catalogueLink);
  return result;
}

async function readCatalogue() {
  const sources = [];
  for (const name of ['historical.json', 'recent.json', 'context.json']) {
    let data;
    try {
      data = JSON.parse(await readFile(new URL(name, contentDirectory), 'utf8'));
    } catch (error) {
      if (error.code === 'ENOENT') continue;
      throw error;
    }
    if (!Array.isArray(data) || data.some(entry => !entry.id || typeof entry.title !== 'string')) {
      throw new Error('Catálogo inválido: ' + name);
    }
    sources.push({ name, data });
  }
  const catalogue = sources.flatMap(source => source.data);
  if (!catalogue.length) throw new Error('No se encontraron publicaciones en content/{historical,recent,context}.json.');
  return { sources: sources.map(source => source.name), catalogue };
}

async function main() {
  const today = new Date();
  const cutoff = new Date(today);
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 2);
  const { values } = parseArgs({ options: {
    since: { type: 'string', default: yearMonthDay(cutoff) },
    out: { type: 'string', default: fileURLToPath(new URL('../research/generated/bibliography-update.json', import.meta.url)) },
    'max-records': { type: 'string' },
  } });
  const until = yearMonthDay(today);
  const since = values.since;
  const parsedSince = new Date(since + 'T00:00:00Z');
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(since) || Number.isNaN(parsedSince.valueOf()) ||
      since !== yearMonthDay(parsedSince) || since > until) {
    throw new Error('--since debe ser una fecha válida anterior o igual a hoy (AAAA-MM-DD).');
  }
  const { sources, catalogue } = await readCatalogue();
  const limit = values['max-records'] ? Number(values['max-records']) : catalogue.length;
  if (!Number.isSafeInteger(limit) || limit < 1) throw new Error('--max-records debe ser un entero positivo.');
  const discovery = await findCandidates(catalogue, since, until);
  const checks = [];
  for (const publication of catalogue.slice(0, limit)) checks.push(await auditPublication(publication));
  const report = {
    status: 'needs_review',
    checkedAt: today.toISOString(),
    sources,
    totals: { catalogue: catalogue.length, checked: checks.length },
    discovery: { since, until, perNameLimit: profileResultLimit, ...discovery },
    checks,
    limits: [
      'Los nombres y metadatos son candidatos para revisión de identidad, autoría y versión editorial.',
      'La ausencia de avisos recuperados no verifica que un trabajo carezca de correcciones o retractaciones.',
      'Los enlaces con restricciones, bloqueos o tiempos de espera requieren comprobación manual.',
    ],
  };
  const out = resolve(values.out);
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, JSON.stringify(report, null, 2) + '\n');
  console.log(out + ' · ' + checks.length + ' registros consultados · ' + discovery.candidates.length + ' candidatos');
  if (discovery.searches.length && discovery.searches.every(search => search.error)) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
