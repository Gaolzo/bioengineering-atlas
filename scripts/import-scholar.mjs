import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { cleanText, crossref, doiUrl, matchText, mentionsResearcher, normalizeDoi, summarizeMetadata } from './crossref.mjs';

const types = new Map([
  ['journal article', 'journal-article'], ['article', 'journal-article'], ['articulo', 'journal-article'],
  ['review', 'review'], ['revision', 'review'], ['articulo de revision', 'review'],
  ['preprint', 'posted-content'], ['posted content', 'posted-content'],
  ['tesis', 'dissertation'], ['thesis', 'dissertation'], ['dissertation', 'dissertation'],
  ['capitulo', 'book-chapter'], ['book chapter', 'book-chapter'], ['capitulo de libro', 'book-chapter'],
  ['libro', 'book'], ['book', 'book'],
  ['patente', 'patent'], ['patent', 'patent'],
  ['conferencia', 'proceedings-article'], ['conference', 'proceedings-article'], ['proceedings article', 'proceedings-article'],
]);

const topicalRules = [
  ['bacterial-regulation', /\b(regulondb|regulomepa|operon|regulon|transcriptional|transcripcional)\b/u],
  ['systems-biology', /\b(networks?|redes|boolean|dynamic model|modelo dinamico|systems biology)\b/u],
  ['synthetic-biology', /\b(synthetic biology|synthetic gene|biologia sintetica|circuito genetico)\b/u],
  ['metabolic-engineering', /\b(tryptophan|triptofano|eragene|metabolite overproduction|metabolic engineering)\b/u],
  ['bioprocesses', /\b(fermentation|fermentacion|avocado|aguacate|hydrolysate|hidrolizado)\b/u],
  ['plant-biotechnology', /\b(cytokinin|citocinina|auxin|auxina|papaya|cymbopogon|nicotiana)\b/u],
  ['mucuna', /\b(mucuna|dopa|polyphenol oxidase)\b/u],
  ['biomaterials', /\b(eumelanin|eumelanina|melanin|melanina|optoelectronic|supercapacitor)\b/u],
  ['molecular-diagnostics', /\b(rpa|recombinase polymerase amplification|biosensor|isothermal amplification)\b/u],
];

const fieldNames = new Map([
  ['title', 'title'], ['titulo', 'title'], ['authors', 'authors'], ['autores', 'authors'],
  ['journal', 'venue'], ['revista', 'venue'], ['venue', 'venue'], ['fuente', 'venue'],
  ['year', 'year'], ['ano', 'year'], ['doi', 'doi'], ['type', 'type'], ['tipo', 'type'],
  ['cited by', 'citations'], ['citado por', 'citations'], ['citas', 'citations'], ['citations', 'citations'],
]);

const headerKeys = new Set(['title cited by year', 'titulo citado por ano', 'titulo citas ano',
  'title authors journal cited by year', 'titulo autores revista citado por ano']);
const yearPattern = /^(?:18|19|20|21)\d{2}$/u;
const countPattern = /^\d+(?:(?:[.,\u00a0\u202f ]\d{3})+)?$/u;
const count = value => value && countPattern.test(value) ? Number(value.replace(/\D/gu, '')) : null;
const noAuthor = value => /^(?:\.{3}|…|et al\.?)$/iu.test(value);
const splitAuthors = value => value
  ? value.split(value.includes(';') ? ';' : ',').map(cleanText).filter(author => author && !noAuthor(author))
  : [];

function tabRow(line) {
  const cells = line.split('\t').map(cleanText);
  if (cells.length === 5 && (!cells[4] || yearPattern.test(cells[4])) && (!cells[3] || count(cells[3]) !== null)) {
    return { title: cells[0], authors: cells[1], venue: cells[2], citations: cells[3], year: cells[4] };
  }
  if (cells.length === 3 && (!cells[2] || yearPattern.test(cells[2])) && (!cells[1] || count(cells[1]) !== null)) {
    return { title: cells[0], citations: cells[1], year: cells[2] };
  }
  return null;
}

function labeledField(line) {
  if (/^https?:\/\/(?:dx\.)?doi\.org\/\S+$/iu.test(line)) return ['doi', line];
  const match = /^([^:]{1,20}):\s*(.+)$/u.exec(line);
  const field = match && fieldNames.get(matchText(match[1]));
  return field ? [field, match[2]] : null;
}

function readBlock(block) {
  const fields = { ...block.fields };
  const plain = [];
  const unparsedLines = [];
  for (const raw of block.lines) {
    const line = cleanText(raw);
    if (!line) continue;
    const labeled = labeledField(line);
    if (!labeled) {
      plain.push(line);
    } else if (!fields[labeled[0]]) {
      fields[labeled[0]] = labeled[1];
    } else if (fields[labeled[0]] !== labeled[1]) {
      unparsedLines.push(line);
    }
  }

  // An isolated four-digit line is a year only after bibliographic text.
  if (!fields.year && plain.length >= (fields.title ? 1 : 2) && yearPattern.test(plain.at(-1))) {
    fields.year = plain.pop();
    if (!fields.citations && plain.length >= (fields.title ? 2 : 3) && count(plain.at(-1)) !== null) {
      fields.citations = plain.pop();
    }
  }
  for (const field of ['title', 'authors', 'venue']) {
    if (!fields[field] && plain.length) fields[field] = plain.shift();
  }
  unparsedLines.push(...plain);
  const title = cleanText(fields.title);
  const venue = cleanText(fields.venue);
  const authorString = cleanText(fields.authors);
  const authors = splitAuthors(authorString);
  const year = yearPattern.test(fields.year ?? '') ? Number(fields.year) : null;
  const citations = count(fields.citations);
  const doi = normalizeDoi(fields.doi);
  let type = types.get(matchText(fields.type)) ?? 'unknown';
  if (type === 'unknown' && /\b(?:biorxiv|medrxiv|arxiv|preprints org|preprints)\b/u.test(matchText(venue))) {
    type = 'posted-content';
  }
  const flags = [];
  if (!title) flags.push('missing_title');
  if (!authors.length) flags.push('missing_authors');
  if (!year) flags.push('missing_or_invalid_year');
  if (!venue) flags.push('missing_venue');
  if (!doi) flags.push(fields.doi ? 'invalid_doi' : 'missing_doi');
  if (fields.citations && citations === null) flags.push('invalid_citation_count');
  if (/…|\.{3}|\bet al\.?(?:$|,)/iu.test(authorString)) flags.push('truncated_authors');
  if (/…|\.{3}/u.test(title)) flags.push('truncated_title');
  if (authors.length && !authors.some(mentionsResearcher)) flags.push('researcher_name_not_matched');
  if (type === 'unknown') flags.push('publication_type_pending');
  if (unparsedLines.length) flags.push('unparsed_lines');
  const scope = matchText(title + ' ' + venue);
  const suggestedTopics = topicalRules.filter(([, pattern]) => pattern.test(scope)).map(([topic]) => topic);
  return {
    title, authors, authorString, venue, year, citations, doi, type, suggestedTopics, flags,
    source: { firstLine: block.firstLine, lastLine: block.lastLine, fields, unparsedLines },
  };
}

export function parseScholar(text) {
  const records = [];
  let block;
  function finish() {
    if (block) records.push(readBlock(block));
    block = undefined;
  }
  for (const [index, line] of text.replace(/^\uFEFF/u, '').split(/\r\n|\n|\r/u).entries()) {
    const lineNumber = index + 1;
    const normalized = cleanText(line);
    if (!normalized || headerKeys.has(matchText(normalized))) {
      finish();
      continue;
    }
    const row = tabRow(line);
    if (row && !('authors' in row) && block && !Object.keys(block.fields).length &&
        block.lines.length === 2 && block.lines.every(entry => !labeledField(cleanText(entry)))) {
      // Browser table copies sometimes attach cited/year columns to the journal line.
      block.lines.push(row.title);
      block.fields = { citations: row.citations, year: row.year };
      block.lastLine = lineNumber;
      finish();
      continue;
    }
    if (row) finish();
    block ??= { fields: row ?? {}, firstLine: lineNumber, lastLine: lineNumber, lines: [] };
    block.lastLine = lineNumber;
    if (!row) block.lines.push(line);
    if (row && 'authors' in row) finish();
    if (!row && !Object.keys(block.fields).length && yearPattern.test(normalized) && block.lines.length >= 4) {
      finish();
    }
  }
  finish();
  return records;
}

const exact = value => cleanText(value).toLowerCase();
function fingerprint(entry) {
  return JSON.stringify([exact(entry.title), entry.authors.map(exact), entry.year, exact(entry.venue)]);
}

export function deduplicate(records) {
  const groups = new Map();
  for (const entry of records) {
    const complete = entry.title && entry.authors.length && entry.year && entry.venue &&
      !entry.flags.includes('truncated_authors') && !entry.flags.includes('truncated_title');
    const key = entry.doi ? 'doi:' + entry.doi : complete ? 'metadata:' + fingerprint(entry) : 'line:' + entry.source.firstLine;
    const group = groups.get(key) ?? [];
    group.push(entry);
    groups.set(key, group);
  }

  const catalogue = Array.from(groups.values(), (variants, index) => {
    const [first] = [...variants].sort((left, right) => left.flags.length - right.flags.length);
    const flags = new Set(variants.flatMap(variant => variant.flags));
    if (variants.length > 1) flags.add('duplicate_records_grouped');
    if (first.doi && new Set(variants.map(fingerprint)).size > 1) flags.add('conflicting_metadata_for_doi');
    const { source, ...entry } = first;
    return { id: 'scholar-' + (index + 1), ...entry, flags: [...flags], status: 'needs_review', variants };
  });

  const byTitle = new Map();
  for (const entry of catalogue) {
    const key = matchText(entry.title);
    if (!key) continue;
    const list = byTitle.get(key) ?? [];
    list.push(entry.id);
    byTitle.set(key, list);
  }
  for (const entry of catalogue) {
    entry.possibleRelatedRecords = (byTitle.get(matchText(entry.title)) ?? []).filter(id => id !== entry.id);
    if (entry.possibleRelatedRecords.length) entry.flags.push('possible_related_work_or_version');
  }
  return catalogue;
}

export async function enrichEntry(entry, request = crossref) {
  if (!entry.doi && !entry.title) return { status: 'skipped_missing_identifier_and_title' };
  try {
    if (entry.doi) {
      const deposit = summarizeMetadata(await request({ doi: entry.doi }));
      return {
        status: 'deposit_found_review_required',
        deposit,
        titleMatch: matchText(entry.title) === matchText(deposit.title),
        yearMatch: entry.year === null ? null : [deposit.published, deposit.publishedOnline, deposit.publishedPrint]
          .some(date => date?.slice(0, 4) === String(entry.year)),
      };
    }
    const result = await request({ query: { 'query.bibliographic': entry.title, rows: '5' } });
    const candidates = (result.items ?? []).map(summarizeMetadata).filter(candidate => candidate.doi);
    return { status: 'candidates_review_required', candidates };
  } catch (error) {
    return { status: 'request_failed', error: error.message };
  }
}

function spreadsheetCell(value) {
  const line = cleanText(value);
  const guarded = /^[=+\-@]/u.test(line) ? "'" + line : line;
  return '"' + guarded.replace(/"/gu, '""') + '"';
}

export function toCsv(entries) {
  const fields = ['id', 'title', 'authors', 'venue', 'year', 'doi', 'type', 'citations', 'status', 'flags'];
  const rows = entries.map(entry => fields.map(field =>
    spreadsheetCell(Array.isArray(entry[field]) ? entry[field].join('; ') : entry[field]),
  ).join(','));
  return [fields.join(','), ...rows, ''].join('\r\n');
}

const bibTypes = {
  'journal-article': 'article', review: 'article', 'book-chapter': 'incollection', book: 'book',
  'proceedings-article': 'inproceedings', dissertation: 'phdthesis',
};
const bibEscape = value => cleanText(value).replace(/[\\{}&%$#_^~]/gu, character =>
  ({ '\\': '\\textbackslash{}', '^': '\\textasciicircum{}', '~': '\\textasciitilde{}' })[character] ?? '\\' + character);

export function toBibtex(entries) {
  return entries.map(entry => {
    const venueField = ['book-chapter', 'proceedings-article'].includes(entry.type) ? 'booktitle' : 'journal';
    const fields = { title: entry.title, author: entry.authors.map(bibEscape).join(' and '),
      [venueField]: entry.venue, year: entry.year, doi: entry.doi,
      url: entry.doi ? doiUrl(entry.doi) : null, note: 'Bibliographic data require review' };
    return '@' + (bibTypes[entry.type] ?? 'misc') + '{' + entry.id + ',\n' +
      Object.entries(fields).filter(([, value]) => value).map(([key, value]) =>
        '  ' + key + ' = {' + (key === 'author' ? value : bibEscape(value)) + '},',
      ).join('\n') + '\n}\n';
  }).join('\n');
}

const risTypes = {
  'journal-article': 'JOUR', review: 'JOUR', 'posted-content': 'UNPB', 'book-chapter': 'CHAP',
  book: 'BOOK', dissertation: 'THES', 'proceedings-article': 'CPAPER', patent: 'PAT',
};

export function toRis(entries) {
  return entries.map(entry => {
    const fields = [
      ['TY', risTypes[entry.type] ?? 'GEN'], ['ID', entry.id], ['TI', entry.title],
      ...entry.authors.map(author => ['AU', author]), ['T2', entry.venue], ['PY', entry.year],
      ['DO', entry.doi], ['UR', entry.doi ? doiUrl(entry.doi) : null],
      ['N1', 'Bibliographic data require review'],
    ];
    return fields.filter(([, value]) => value).map(([tag, value]) => tag + '  - ' + cleanText(value)).join('\r\n') +
      '\r\nER  - \r\n\r\n';
  }).join('');
}

async function main() {
  const { values, positionals } = parseArgs({
    options: { out: { type: 'string' }, crossref: { type: 'boolean' }, limit: { type: 'string', default: '100' } },
    allowPositionals: true,
  });
  const [file] = positionals;
  if (!file || positionals.length !== 1) {
    throw new Error('Uso: node scripts/import-scholar.mjs ARCHIVO.txt [--out DIRECTORIO] [--crossref] [--limit N]');
  }
  const limit = Number(values.limit);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 500) throw new Error('--limit debe ser un entero entre 1 y 500');
  const input = await readFile(file);
  const entries = parseScholar(new TextDecoder('utf-8', { fatal: true }).decode(input));
  if (!entries.length) throw new Error('El archivo no contiene bloques bibliográficos reconocibles.');
  const catalogue = deduplicate(entries);
  const output = resolve(values.out ?? fileURLToPath(new URL('../research/scholar-import/', import.meta.url)));
  const original = join(output, 'original.txt');
  await mkdir(output, { recursive: true });
  try {
    await writeFile(original, input, { flag: 'wx' });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    if (!input.equals(await readFile(original))) {
      throw new Error('El directorio conserva otro original. Elige un directorio distinto con --out.');
    }
  }

  if (values.crossref) {
    for (const entry of catalogue.slice(0, limit)) {
      entry.crossref = await enrichEntry(entry);
      if (entry.crossref.status === 'request_failed' && entry.crossref.error === 'Crossref HTTP 429') break;
    }
  }
  const report = {
    status: 'needs_review',
    sourceFilename: basename(file),
    sha256: createHash('sha256').update(input).digest('hex'),
    inputBlocks: entries.length,
    outputRecords: catalogue.length,
    groupedRecords: entries.length - catalogue.length,
    requestedCrossref: Boolean(values.crossref),
    queriedCrossref: catalogue.filter(entry => entry.crossref).length,
    flags: Object.fromEntries([...new Set(catalogue.flatMap(entry => entry.flags))].sort().map(flag =>
      [flag, catalogue.filter(entry => entry.flags.includes(flag)).map(entry => entry.id)],
    )),
    crossrefFailures: catalogue.filter(entry => entry.crossref?.status === 'request_failed').map(entry =>
      ({ id: entry.id, error: entry.crossref.error }),
    ),
  };
  await Promise.all(Object.entries({
    'bibliography.json': JSON.stringify(catalogue, null, 2) + '\n',
    'bibliography.csv': toCsv(catalogue),
    'bibliography.bib': toBibtex(catalogue),
    'bibliography.ris': toRis(catalogue),
    'review-report.json': JSON.stringify(report, null, 2) + '\n',
  }).map(([name, data]) => writeFile(join(output, name), data)));
  console.log(catalogue.length + ' registros para revisión en ' + output);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
