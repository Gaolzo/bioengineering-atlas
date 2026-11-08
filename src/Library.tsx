import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { attributionLabels, evidenceLabels, normalize, publications, publicationById, topicLabel, topics, typeLabels, entities, type Level, type Publication } from './content';
import { useLocale } from './locale';
import { Empty, EvidenceTag, Icon, OutLink, PageIntro, PublicLink, SearchField, SelectField } from './ui';
import { bibliography, download, evidenceRecord } from './exports';

function textFor(p: Publication) {
  return normalize([p.title, p.year, p.doi, p.journal, ...p.authors, ...p.topics.flatMap(id => Object.values(topicLabel(id))),
    ...p.organisms, ...p.genes, ...p.metabolites, ...(p.affiliation ?? []), ...(p.techniques ?? []).flatMap(Object.values),
    p.result.es, p.result.en, p.objective.es, p.objective.en, p.methods.es, p.methods.en].join(' '));
}
const searchable = new Map(publications.map(p => [p.id, textFor(p)]));
const keys = ['topic', 'year', 'organism', 'gene', 'metabolite', 'author', 'institution', 'type', 'evidence', 'attribution'] as const;
type FilterKey = typeof keys[number];
const unique = (items: string[]) => [...new Set(items)].sort((a, b) => a.localeCompare(b));
function optionsFor(key: FilterKey) {
  switch (key) {
    case 'topic': return Object.keys(topics);
    case 'year': return [...new Set(publications.map(p => p.year))].map(String);
    case 'organism': return unique(publications.flatMap(p => p.organisms));
    case 'gene': return unique(publications.flatMap(p => p.genes));
    case 'metabolite': return unique(publications.flatMap(p => p.metabolites));
    case 'author': return unique(publications.flatMap(p => p.authors));
    case 'institution': return unique(publications.flatMap(p => p.affiliation ?? []));
    case 'type': return Object.keys(typeLabels).filter(type => publications.some(p => p.type === type));
    case 'evidence': return Object.keys(evidenceLabels).filter(grade => publications.some(p => p.evidence === grade));
    case 'attribution': return Object.keys(attributionLabels).filter(attribution => publications.some(p => p.attribution === attribution));
  }
}
function matches(p: Publication, key: FilterKey, value: string) {
  switch (key) {
    case 'topic': return p.topics.includes(value);
    case 'year': return String(p.year) === value;
    case 'organism': return p.organisms.includes(value);
    case 'gene': return p.genes.includes(value);
    case 'metabolite': return p.metabolites.includes(value);
    case 'author': return p.authors.includes(value);
    case 'institution': return p.affiliation?.includes(value);
    case 'type': return p.type === value;
    case 'evidence': return p.evidence === value;
    case 'attribution': return p.attribution === value;
  }
}
function ResultCard({ item }: { item: Publication }) {
  const { tr, l } = useLocale();
  return <article className="result">
    <div className="result-meta"><span className="year">{item.year}</span><span className="tag">{l(typeLabels[item.type])}</span><span className="tag">{l(attributionLabels[item.attribution])}</span></div>
    <h2><Link to={'/biblioteca/' + item.id}>{item.title}</Link></h2>
    <p className="byline">{item.authors.slice(0, 3).join(', ')}{item.authors.length > 3 ? ' et al.' : ''} · {item.journal}</p>
    <p>{l(item.result)}</p>
    <div className="result-foot"><EvidenceTag grade={item.evidence}/><Link to={'/biblioteca/' + item.id} className="text-link" aria-label={tr('Abrir ficha de ', 'Open record for ') + item.title}>{tr('Abrir ficha', 'Open record')} <Icon name="arrow" size={17}/></Link></div>
  </article>;
}
export function Library() {
  const { l, tr, t } = useLocale();
  const [params, setParams] = useSearchParams();
  const [format, setFormat] = useState('csv');
  const [more, setMore] = useState(keys.slice(4).some(key => params.has(key)));
  const query = params.get('q') ?? '';
  function change(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
  }
  const labels = {
    topic: tr('Tema o aplicación', 'Topic or application'), year: tr('Año', 'Year'), organism: tr('Organismo', 'Organism'),
    gene: tr('Gen o proteína', 'Gene or protein'), metabolite: tr('Metabolito', 'Metabolite'), author: tr('Coautor', 'Coauthor'),
    institution: tr('Institución', 'Institution'), type: tr('Tipo de publicación', 'Publication type'),
    evidence: tr('Tipo de evidencia', 'Evidence type'), attribution: tr('Atribución', 'Attribution'),
  };
  function optionLabel(key: FilterKey, id: string) {
    switch (key) {
      case 'topic': return l(topicLabel(id));
      case 'type': return l(typeLabels[id as keyof typeof typeLabels]);
      case 'evidence': return id + ' · ' + l(evidenceLabels[id as keyof typeof evidenceLabels]);
      case 'attribution': return l(attributionLabels[id as keyof typeof attributionLabels]);
      default: return id;
    }
  }
  const filtered = publications.filter(p => normalize(query).split(/\s+/).every(word => searchable.get(p.id)?.includes(word))
    && keys.every(key => !params.has(key) || matches(p, key, params.get(key)!))
    && (!params.has('peer') || (params.get('peer') === 'preprint' ? p.type === 'preprint' : ['article', 'review'].includes(p.type))));
  return <>
    <PageIntro index="03" label={t('library').toUpperCase()} title={tr('Biblioteca científica', 'Research library')} description={tr('Busca estudios, compara tipos de evidencia y sigue los vínculos entre resultados, organismos y métodos.', 'Search studies, compare types of evidence and follow links among findings, organisms and methods.')}/>
    <section className="filter-box" aria-label={tr('Filtros de publicaciones', 'Publication filters')}>
      <SearchField value={query} onChange={value => change('q', value)} label={tr('Buscar en la biblioteca', 'Search the library')} placeholder={tr('Título, DOI, gen, autor o técnica…', 'Title, DOI, gene, author or technique…')}/>
      <div className="fields">
        {keys.slice(0, more ? keys.length : 4).map(key => <SelectField key={key} label={labels[key]} value={params.get(key) ?? ''} onChange={value => change(key, value)}>
          <option value="">{t('all')}</option>{optionsFor(key).map(id => <option key={id} value={id}>{optionLabel(key, id)}</option>)}
        </SelectField>)}
        {more && <SelectField label={tr('Estado editorial', 'Editorial status')} value={params.get('peer') ?? ''} onChange={value => change('peer', value)}>
          <option value="">{t('all')}</option><option value="journal">{tr('Artículos y revisiones publicados', 'Published articles and reviews')}</option><option value="preprint">Preprint</option>
        </SelectField>}
      </div>
      <div className="actions"><button type="button" className="btn secondary" aria-expanded={more} onClick={() => setMore(!more)}>{more ? tr('Menos filtros', 'Fewer filters') : tr('Más filtros', 'More filters')}</button>
        {params.size > 0 && <button className="plain" type="button" onClick={() => setParams({})}>{t('clear')}</button>}
      </div>
    </section>
    <div className="results-toolbar">
      <p role="status"><strong>{filtered.length}</strong> {tr('de', 'of')} {publications.length} {tr('registros', 'records')}</p>
      <div className="actions">
        <SelectField label={tr('Formato', 'Format')} value={format} onChange={setFormat}>
          <option value="csv">CSV</option><option value="json">JSON</option><option value="bib">BibTeX</option><option value="ris">RIS</option>
        </SelectField>
        <button className="btn secondary" type="button" disabled={!filtered.length} onClick={() => download('bioengineering-atlas.' + format, bibliography(filtered, format))}><Icon name="download" size={17}/>{tr('Exportar selección', 'Export selection')}</button>
      </div>
    </div>
    <div className="result-list">{filtered.length ? filtered.map(p => <ResultCard key={p.id} item={p}/>) : <Empty/>}</div>
  </>;
}
export function PublicationDetail({ level }: { level: Level }) {
  const { id = '' } = useParams();
  const { l, tr, t } = useLocale();
  const p = publicationById.get(id);
  if (!p) return <PageIntro index="404" label={t('library')} title={tr('Ficha no encontrada', 'Record not found')} description={tr('Busca la publicación en la biblioteca.', 'Find the publication in the library.')}/>;
  const related = publications.filter(other => other.id !== id && other.topics.some(topic => p.topics.includes(topic))).slice(0, 4);
  const linked = entities.filter(entity => entity.publications.includes(id));
  return <>
    <Link to="/biblioteca" className="text-link back-link"><Icon name="back" size={17}/>{t('library')}</Link>
    <PageIntro index={String(p.year)} label={l(typeLabels[p.type])} title={p.title} description={p.authors.join(', ') + ' · ' + p.journal}/>
    <div className="actions detail-tags"><EvidenceTag grade={p.evidence}/><span className="tag">{l(attributionLabels[p.attribution])}</span><PublicLink item={p}/>{p.doi && <OutLink href={'https://doi.org/' + p.doi}>DOI {p.doi}</OutLink>}</div>
    <div className="detail-grid">
      <div className="panel reading">
        <h2>{t('objective')}</h2><p>{l(p.objective)}</p>
        <h2>{t('findings')}</h2><p>{l(p.result)}</p>
        {level !== 'general' && <><h2>{t('methods')}</h2><p>{l(p.methods)}</p>{p.techniques?.length ? <ul>{p.techniques.map(technique => <li key={technique.en}>{l(technique)}</li>)}</ul> : null}</>}
        {level === 'research' && p.numbers && <><h2>{tr('Datos reportados', 'Reported data')}</h2><p>{l(p.numbers)}</p></>}
        <h2>{t('limitations')}</h2><p>{l(p.limitation)}</p>
        {p.contributions && <><h2>{tr('Contribuciones documentadas', 'Documented contributions')}</h2><p>{l(p.contributions)}</p></>}
      </div>
      <aside className="panel reading">
        <h2>{tr('Conexiones', 'Connections')}</h2>
        <div className="source-links">{p.topics.map(topic => <Link className="source-link" key={topic} to={'/biblioteca?topic=' + topic}>{l(topicLabel(topic))}</Link>)}
          {linked.map(entity => <Link key={entity.id} className="source-link" to={'/atlas?item=' + entity.id}>{entity.label ? l(entity.label) : entity.name}</Link>)}</div>
        {p.affiliation?.length ? <><h2>{tr('Afiliaciones consignadas', 'Recorded affiliations')}</h2><ul>{p.affiliation.map(value => <li key={value}>{value}</li>)}</ul></> : null}
        {p.support?.length ? <><h2>{tr('Fuentes adicionales', 'Additional sources')}</h2><div className="source-links">{p.support.map(s => <OutLink key={s.url} href={s.url}>{s.label}</OutLink>)}</div></> : null}
        <h2>{tr('Trazabilidad', 'Traceability')}</h2><p>{p.verification && <time dateTime={p.verification}>{p.verification}</time>}</p>
        <Link className="text-link" to={'/evidencia?id=' + p.id}>{tr('Consultar afirmación y fuente', 'View claim and source')} <Icon name="arrow" size={17}/></Link>
      </aside>
    </div>
    <section className="home-section"><h2>{tr('Investigaciones relacionadas', 'Related studies')}</h2>
      <div className="result-list">{related.map(item => <ResultCard key={item.id} item={item}/>)}</div>
    </section>
  </>;
}
export function EvidencePage() {
  const { tr, t, l } = useLocale();
  const [params] = useSearchParams();
  const [grade, setGrade] = useState('');
  const id = params.get('id');
  const rows = publications.filter(p => (!id || p.id === id) && (!grade || p.evidence === grade));
  return <>
    <PageIntro index="07" label={t('evidence').toUpperCase()} title={tr('Registro de evidencia', 'Evidence register')} description={tr('Cada afirmación se vincula con una fuente consultada, un tipo de evidencia y los límites de la interpretación.', 'Each claim links to a reviewed source, an evidence type and the limits of interpretation.')}/>
    <div className="results-toolbar">
      {id ? <Link className="text-link" to="/evidencia"><Icon name="back" size={17}/>{tr('Ver registro completo', 'View full register')}</Link> :
        <SelectField label={tr('Tipo de evidencia', 'Evidence type')} value={grade} onChange={setGrade}>
          <option value="">{t('all')}</option>{Object.entries(evidenceLabels).map(([key, val]) => <option key={key} value={key}>{key} · {l(val)}</option>)}
        </SelectField>}
      <button type="button" className="btn secondary" disabled={!rows.length} onClick={() => download('evidence.json', JSON.stringify(rows.map(evidenceRecord), null, 2), 'application/json')}><Icon name="download" size={17}/>JSON</button>
    </div>
    <div className="result-list">{rows.length ? rows.map(p => <article className="result" key={p.id}>
      <EvidenceTag grade={p.evidence}/><h2>{l(p.result)}</h2><p>{l(p.limitation)}</p>
      <div className="actions"><Link to={'/biblioteca/' + p.id} className="text-link">{p.authors[0]} · {p.year} <Icon name="arrow" size={17}/></Link><PublicLink item={p}/><small>{p.verification}</small></div>
    </article>) : <Empty/>}</div>
  </>;
}
