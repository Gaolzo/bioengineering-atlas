import { Link, useSearchParams } from 'react-router';
import { entities, normalize, pair, publications, publicationById, topicLabel, topics, type Entity, type Language, type Publication } from './content';
import { useLocale } from './locale';
import { Empty, EvidenceTag, Figure, Icon, PageIntro, SelectField } from './ui';
import './knowledge-map.css';

const featured = publicationById.get('iaa-avocado-2026');
const topicIds = Object.keys(topics);
const groups = [
  { field: 'organisms', kind: 'organism', title: pair('Organismos', 'Organisms') },
  { field: 'genes', kind: 'gene', title: pair('Genes y proteínas', 'Genes and proteins') },
  { field: 'metabolites', kind: 'metabolite', title: pair('Moléculas y materiales', 'Molecules and materials') },
] as const;
const translatedTerms: Record<string, string> = { 'D-glucosa': 'D-glucose', Limoneno: 'Limonene' };
const aliases = (entry: Entity) => [entry.name, ...Object.values(entry.label ?? {})]
  .flatMap(name => [name, ...name.split(/[()/]/)])
  .map(normalize)
  .filter(Boolean);
const entityAliases = new Map(entities.map(entry => [entry.id, aliases(entry)]));

function connections(study: Publication, group: typeof groups[number], lang: Language) {
  const linked = entities.filter(entry => entry.kind === group.kind && entry.publications.includes(study.id));
  const known = new Set(linked.flatMap(entry => entityAliases.get(entry.id) ?? []));
  return [
    ...linked.map(entry => ({
      name: entry.kind === 'organism' ? entry.name : entry.label?.[lang] ?? entry.name,
      href: '/atlas?item=' + entry.id,
    })),
    ...study[group.field].filter(name => !known.has(normalize(name))).map(name => ({
      name: lang === 'en' ? translatedTerms[name] ?? name : name,
      href: '/biblioteca?' + new URLSearchParams({ [group.kind]: name }).toString(),
    })),
  ];
}

function ResearchFigure({ counts }: { counts: number[] }) {
  const { l, tr } = useLocale();
  const names = [tr('Tema', 'Topic'), tr('Estudio', 'Study')];
  return <Figure className="knowledge-figure" title={tr('Conexiones de la publicación', 'Connections of the publication')}
    description={tr('Las ramas cuentan las entradas de cada categoría para el estudio seleccionado.', 'The branches count the entries in each category for the selected study.')}>
    <svg viewBox="0 0 480 208" role="img" className="knowledge-svg" aria-label={groups.map((group, index) => l(group.title) + ' ' + counts[index]).join(', ')}>
      <path d="M106 104h35m89 0h26V40h24m-24 64h24m-24 0v64h24"/>
      <rect x="16" y="84" width="90" height="40" rx="8"/>
      <rect x="141" y="84" width="89" height="40" rx="8" className="map-study-node"/>
      {names.map((name, index) => <text key={name} x={index === 0 ? 61 : 185} y="110" className={index === 1 ? 'map-study-label' : undefined}>{name}</text>)}
      {groups.map((group, index) => {
        const y = 40 + index * 64;
        return <g key={group.kind} className={counts[index] === 0 ? 'map-empty-node' : undefined}>
          <rect x="280" y={y - 20} width="184" height="40" rx="8"/>
          <text x="293" y={y + 5} textAnchor="start">{l(group.title)}</text>
          <text x="449" y={y + 5} textAnchor="end" className="map-count">{counts[index]}</text>
        </g>;
      })}
    </svg>
  </Figure>;
}

export function KnowledgeMap() {
  const { lang, l, t, tr } = useLocale();
  const [params, setParams] = useSearchParams();
  const requestedStudy = publicationById.get(params.get('study') ?? '');
  const requestedTopic = params.get('topic');
  const topic = requestedTopic && topicIds.includes(requestedTopic) ? requestedTopic : requestedStudy?.topics[0] ?? 'synthetic';
  const studies = publications.filter(study => study.topics.includes(topic));
  const study = studies.find(entry => entry.id === requestedStudy?.id) ?? studies.find(entry => entry.id === featured?.id) ?? studies[0];
  const entitiesByGroup = study ? groups.map(group => connections(study, group, lang)) : [];
  function changeTopic(value: string) {
    const next = new URLSearchParams({ topic: value });
    if (study?.topics.includes(value)) next.set('study', study.id);
    setParams(next);
  }
  return <>
    <PageIntro index="05" label={tr('CONEXIONES', 'CONNECTIONS')} title={tr('Mapa de investigaciones', 'Research map')}
      description={tr('Elige un tema y una publicación para explorar los organismos, componentes y métodos documentados en el estudio.', 'Choose a topic and publication to explore the organisms, components and methods documented in the study.')}/>
    <div className="filter-box fields knowledge-filter">
      <SelectField label={tr('Línea de investigación', 'Research area')} value={topic} onChange={changeTopic}>
        {topicIds.map(id => <option key={id} value={id}>{l(topicLabel(id))}</option>)}
      </SelectField>
      <SelectField label={tr('Publicación', 'Publication')} value={study?.id ?? ''} onChange={id => setParams({ topic, study: id })}>
        {studies.length ? studies.map(entry => <option key={entry.id} value={entry.id}>{entry.year} · {entry.title}</option>) : <option value="">{tr('Sin publicaciones', 'No publications')}</option>}
      </SelectField>
    </div>
    <div className="results-toolbar"><p role="status">
      <strong>{studies.length}</strong> {studies.length === 1 ? tr('publicación en esta línea', 'publication in this area') : tr('publicaciones en esta línea', 'publications in this area')}
    </p></div>
    {study ? <>
      <div className="detail-grid knowledge-grid">
        <section className="panel reading knowledge-summary">
          <div className="result-meta"><span className="tag">{study.year}</span><EvidenceTag grade={study.evidence}/></div>
          <h2>{study.title}</h2>
          <p>{l(study.result)}</p>
          <Link className="text-link" to={'/biblioteca/' + study.id}>{t('details')} <Icon name="arrow" size={17}/></Link>
          <ResearchFigure counts={entitiesByGroup.map(group => group.length)}/>
          <div className="source-links" aria-label={tr('Líneas vinculadas', 'Linked areas')}>
            {study.topics.map(id => <Link key={id} className="source-link" to={'/mapa?' + new URLSearchParams({ topic: id, study: study.id }).toString()}
              aria-current={id === topic ? 'page' : undefined}>{l(topicLabel(id))}</Link>)}
          </div>
        </section>
        <aside className="panel reading knowledge-entities">
          {groups.map((group, index) => <section key={group.kind}>
            <h2>{l(group.title)}</h2>
            {entitiesByGroup[index].length > 0 ? <ul className="knowledge-chips">{entitiesByGroup[index].map(entry => <li key={entry.href}>
              <Link className="source-link" to={entry.href}>{entry.name}</Link>
            </li>)}</ul> : <p className="byline">{tr('Sin entradas indexadas en esta categoría.', 'No entries indexed in this category.')}</p>}
          </section>)}
        </aside>
      </div>
      <div className="detail-grid knowledge-metadata">
        <section className="panel reading">
          <h2>{tr('Autores', 'Authors')}</h2>
          <ul className="knowledge-chips">{study.authors.map(name => <li key={name}><Link className="source-link" to={'/biblioteca?' + new URLSearchParams({ author: name }).toString()}>{name}</Link></li>)}</ul>
          {study.affiliation?.length ? <>
            <h2>{tr('Afiliaciones consignadas', 'Recorded affiliations')}</h2>
            <ul className="knowledge-chips">{study.affiliation.map(name => <li key={name}><Link className="source-link" to={'/biblioteca?' + new URLSearchParams({ institution: name }).toString()}>{name}</Link></li>)}</ul>
          </> : null}
        </section>
        <section className="panel reading">
          <h2>{t('methods')}</h2><p>{l(study.methods)}</p>
          {study.techniques?.length ? <ul className="knowledge-chips">{study.techniques.map(technique => <li key={technique.en}>
            <Link className="source-link" to={'/biblioteca?' + new URLSearchParams({ q: l(technique) }).toString()}>{l(technique)}</Link>
          </li>)}</ul> : null}
          <Link className="text-link" to={'/evidencia?id=' + study.id}>{tr('Consultar evidencia', 'View evidence')} <Icon name="arrow" size={17}/></Link>
        </section>
      </div>
    </> : <Empty/>}
  </>;
}
