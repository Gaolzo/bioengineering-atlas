import { attributionLabels, evidenceLabels, type Language, type Publication } from './content';

export function download(name: string, content: string, type = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const csv = (value: string | number) => '"' + String(value).replaceAll('"', '""') + '"';
const bib = (value: string) => value.replace(/[{}\\]/g, '\\$&');
const recordTypes = {
  article: ['article', 'JOUR'], review: ['article', 'JOUR'], preprint: ['unpublished', 'UNPB'],
  resource: ['misc', 'DATA'], chapter: ['incollection', 'CHAP'],
  conference: ['inproceedings', 'CONF'], patent: ['misc', 'PAT'],
};
export function bibliography(records: Publication[], format: string) {
  switch (format) {
    case 'json': return JSON.stringify(records, null, 2);
    case 'bib': return records.map(p => [
      '@' + recordTypes[p.type][0] + '{' + p.id + ',',
      '  title = {{' + bib(p.title) + '}},',
      '  author = {' + p.authors.map(a => '{' + bib(a) + '}').join(' and ') + '},',
      '  year = {' + p.year + '},',
      '  ' + (p.type === 'chapter' || p.type === 'conference' ? 'booktitle' : 'journal') + ' = {' + bib(p.journal) + '},',
      ...(p.doi ? ['  doi = {' + p.doi + '},'] : []),
      '  url = {' + p.url + '}', '}',
    ].join('\n')).join('\n\n');
    case 'ris': return records.map(p => [
      'TY  - ' + recordTypes[p.type][1], 'TI  - ' + p.title, ...p.authors.map(a => 'AU  - ' + a),
      'PY  - ' + p.year, 'T2  - ' + p.journal, ...(p.doi ? ['DO  - ' + p.doi] : []), 'UR  - ' + p.url, 'ER  - ',
    ].join('\r\n')).join('\r\n\r\n');
    default: return '\uFEFF' + [
      ['id', 'title', 'year', 'authors', 'venue', 'type', 'doi', 'url', 'evidence', 'attribution'],
      ...records.map(p => [p.id, p.title, p.year, p.authors.join(' | '), p.journal, p.type, p.doi ?? '', p.url, p.evidence, p.attribution]),
    ].map(row => row.map(csv).join(',')).join('\r\n');
  }
}
export function evidenceRecord(p: Publication) {
  return {
    claim_id: p.id + '-result', statement_es: p.result.es, statement_en: p.result.en,
    source_ids: [p.doi ? 'doi:' + p.doi.toLowerCase() : p.url], source_url: p.url,
    evidence_level: p.evidence, researcher_involvement: p.attribution,
    verification_status: p.evidence === 'D' ? 'preliminary' : p.evidence === 'E' ? 'pending' : p.evidence === 'F' ? 'corrected_or_retracted' : 'source_checked',
    verified_at: p.verification, limitations: p.limitation,
  };
}
export function evidenceSummary(p: Publication, lang: Language) {
  return [evidenceLabels[p.evidence][lang], attributionLabels[p.attribution][lang]].join(' · ');
}
