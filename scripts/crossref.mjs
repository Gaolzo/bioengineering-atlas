export function cleanText(value) {
  return String(value ?? '').normalize('NFC').replace(/\s+/gu, ' ').trim();
}

export function matchText(value) {
  return cleanText(value).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

export function normalizeDoi(value) {
  const doi = cleanText(value).replace(/^(?:https?:\/\/(?:dx\.)?doi\.org\/|doi:\s*)/iu, '');
  try {
    const decoded = decodeURIComponent(doi).toLowerCase();
    return /^10\.\d{4,9}\/[^\s<>"]+$/u.test(decoded) ? decoded : null;
  } catch {
    return null;
  }
}

export function doiUrl(doi) {
  return 'https://doi.org/' + doi.split('/').map(encodeURIComponent).join('/');
}

export function isResearcher(author) {
  const surname = matchText(author.family);
  if (surname === 'martinez antonio') return /^(a|agustino)$/u.test(matchText(author.given));
  return surname === 'antonio' && /^(a|agustino) martinez$/u.test(matchText(author.given));
}

export function mentionsResearcher(value) {
  const name = matchText(value);
  return /^(?:(?:a|agustino) martinez antonio|martinez antonio (?:a|agustino))$/u.test(name);
}

function dateValue(record, key) {
  return record[key]?.['date-parts']?.[0]?.map((part, i) => String(part).padStart(i === 0 ? 4 : 2, '0')).join('-') || null;
}

export function summarizeMetadata(record) {
  return {
    doi: normalizeDoi(record.DOI),
    title: cleanText(record.title?.[0]?.replace(/<[^>]+>/gu, ' ')),
    authors: (record.author ?? []).map(author => ({
      name: cleanText(author.name ?? [author.given, author.family].filter(Boolean).join(' ')),
      orcid: author.ORCID ?? null,
      affiliations: (author.affiliation ?? []).map(entry => cleanText(entry.name)).filter(Boolean),
    })),
    researcherNameMatch: (record.author ?? []).some(isResearcher),
    venue: cleanText(record['container-title']?.[0]),
    type: record.type ?? null,
    published: dateValue(record, 'published'),
    publishedOnline: dateValue(record, 'published-online'),
    publishedPrint: dateValue(record, 'published-print'),
    updatedBy: (record['updated-by'] ?? []).map(update => ({
      doi: normalizeDoi(update.DOI),
      type: update.type ?? null,
    })),
    relations: Object.fromEntries(Object.entries(record.relation ?? {}).filter(([key]) =>
      /preprint|version|update|replace/u.test(key),
    )),
  };
}

export async function crossref({ doi, query = {}, fetcher = fetch } = {}) {
  const url = new URL('https://api.crossref.org/works' + (doi ? '/' + doi.split('/').map(encodeURIComponent).join('/') : ''));
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
  if (process.env.CROSSREF_MAILTO) url.searchParams.set('mailto', process.env.CROSSREF_MAILTO.trim());
  const response = await fetcher(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'BioEngineeringAtlas/1.0 (bibliography review)' },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) {
    await response.body?.cancel();
    const error = new Error('Crossref HTTP ' + response.status);
    error.status = response.status;
    throw error;
  }
  const { message } = await response.json();
  if (!message || typeof message !== 'object') throw new Error('Crossref response has no metadata');
  return message;
}
