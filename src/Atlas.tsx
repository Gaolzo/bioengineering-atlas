import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import learning from '../content/learning.json';
import { attributionLabels, authorIsResearcher, entities, evidenceLabels, normalize, pair, profile, publications, publicationById, topicLabel, topics, type Entity, type Evidence, type Language, type Publication } from './content';
import { useLocale } from './locale';
import { Empty, EvidenceTag, Figure, Icon, OutLink, PageIntro, SearchField, SelectField, SourceLinks } from './ui';
import './atlas.css';

const atlasViews = {
  organism: pair('Organismos', 'Organisms'),
  gene: pair('Genes y proteínas', 'Genes and proteins'),
  metabolite: pair('Moléculas y materiales', 'Molecules and materials'),
  topics: pair('Líneas científicas', 'Research areas'),
  glossary: pair('Glosario', 'Glossary'),
  quiz: pair('Preguntas', 'Quiz'),
};
type AtlasView = keyof typeof atlasViews;
const entityById = new Map(entities.map(entity => [entity.id, entity]));
const topicIds = Object.keys(topics);
const researched = publications.filter(record => record.attribution !== 'context' && record.attribution !== 'pending' && record.authors.some(authorIsResearcher));
const lines = Object.fromEntries(topicIds.map(topic => [topic, publications.filter(record => record.topics.includes(topic))]));
const kinds = {
  organism: pair('Organismo', 'Organism'),
  gene: pair('Gen o proteína', 'Gene or protein'),
  metabolite: pair('Molécula o material', 'Molecule or material'),
};
const entityTitle = (entity: Entity, lang: Language) => entity.kind === 'metabolite' ? entity.label?.[lang] ?? entity.name : entity.name;

function EntityDetail({ item, back }: { item: Entity; back: string }) {
  const { lang, l, t, tr } = useLocale();
  const top = useRef<HTMLDivElement>(null);
  useEffect(() => top.current?.focus(), [item.id]);
  const related = (item.related ?? []).flatMap(id => {
    const entry = entityById.get(id);
    return entry ? [entry] : [];
  });
  const records = item.publications.flatMap(id => {
    const record = publicationById.get(id);
    return record ? [record] : [];
  });
  return <>
    <Link to={back} className="text-link back-link"><Icon name="back" size={17}/>{l(atlasViews[item.kind])}</Link>
    <div ref={top} tabIndex={-1} className="entity-heading">
      <PageIntro index="02" label={l(kinds[item.kind]).toUpperCase()} title={entityTitle(item, lang)} description={l(item.detail)}/>
    </div>
    {item.kind === 'organism' && item.label && l(item.label) !== item.name && <p className="entity-alias"><strong>{l(item.label)}</strong></p>}
    <div className="detail-grid">
      <section className="panel reading">
        <h2>{tr('Publicaciones vinculadas', 'Linked publications')}</h2>
        <ul className="atlas-study-list">{records.map(record => <li key={record.id}>
          <Link className="text-link" to={'/biblioteca/' + record.id}>{record.title}</Link>
          <p className="byline">{record.year} · {record.journal}</p>
          <EvidenceTag grade={record.evidence}/>
        </li>)}</ul>
      </section>
      <aside className="panel reading">
        <h2>{tr('Conexiones', 'Connections')}</h2>
        {item.taxonomy && <p>{item.taxonomy}</p>}
        {related.length ? <div className="source-links">{related.map(entity => <Link className="source-link" key={entity.id} to={'/atlas?item=' + entity.id}>{entityTitle(entity, lang)}</Link>)}</div>
          : <p>{tr('La ficha enlaza a sus fuentes en la biblioteca.', 'This record links to its sources in the library.')}</p>}
        <Link className="text-link" to="/evidencia">{t('evidence')} <Icon name="arrow" size={16}/></Link>
      </aside>
    </div>
  </>;
}

function Quiz() {
  const { l, tr } = useLocale();
  const [choices, setChoices] = useState<Record<number, number>>({});
  return <div className="quiz-grid">
    {learning.quiz.map((question, index) => <section className="panel reading" key={question.prompt.en}>
      <fieldset className="quiz-question">
        <legend>{index + 1}. {l(question.prompt)}</legend>
        {question.choices.map((choice, choiceIndex) => <label key={choice.en}>
          <input type="radio" name={'question-' + index} checked={choices[index] === choiceIndex} onChange={() => setChoices({ ...choices, [index]: choiceIndex })}/>
          <span>{l(choice)}</span>
        </label>)}
      </fieldset>
      <div role="status" className="quiz-feedback">
        {choices[index] !== undefined && <p><strong>{choices[index] === question.answer ? tr('Correcto. ', 'Correct. ') : tr('Vuelve a intentarlo. ', 'Try again. ')}</strong>{l(question.feedback)}</p>}
      </div>
      <SourceLinks ids={question.publications}/>
    </section>)}
  </div>;
}

export function Atlas() {
  const { lang, l, tr, t } = useLocale();
  const [params] = useSearchParams();
  const [query, setQuery] = useState('');
  const requested = params.get('view');
  const view = requested && Object.hasOwn(atlasViews, requested) ? requested as AtlasView : 'organism';
  const itemId = params.get('item');
  const item = itemId ? entityById.get(itemId) : undefined;
  if (item) return <EntityDetail item={item} back={'/atlas?view=' + item.kind}/>;
  const words = normalize(query).split(/\s+/);
  const matches = (...fields: string[]) => words.every(word => normalize(fields.join(' ')).includes(word));
  const filtered = entities.filter(entity => entity.kind === view && matches(entity.name, ...(entity.label ? Object.values(entity.label) : []), ...Object.values(entity.detail), entity.taxonomy ?? ''));
  const glossary = learning.glossary.filter(row => matches(...Object.values(row.term), ...Object.values(row.meaning)));
  const areas = topicIds.filter(id => matches(...Object.values(topicLabel(id))));
  const isCatalog = view === 'organism' || view === 'gene' || view === 'metabolite';
  const total = isCatalog ? filtered.length : view === 'glossary' ? glossary.length : areas.length;
  return <>
    <PageIntro index="02" label={t('atlas').toUpperCase()} title={tr('Atlas molecular', 'Molecular atlas')} description={tr('Explora qué organismos, componentes y procesos se estudiaron, y consulta la evidencia de cada conexión.', 'Explore which organisms, components and processes were studied, and view the evidence for each connection.')}/>
    <nav className="atlas-tabs" aria-label={tr('Vistas del atlas', 'Atlas views')}>
      {Object.entries(atlasViews).map(([id, label]) => <Link key={id} className="tag atlas-tab" to={'/atlas?view=' + id} aria-current={id === view ? 'page' : undefined} onClick={() => setQuery('')}>{l(label)}</Link>)}
    </nav>
    {itemId && !item && <p className="byline">{tr('No se encontró esa ficha en el catálogo. Puedes buscarla aquí.', 'That record was not found in the catalog. You can search for it here.')}</p>}
    {view === 'quiz' ? <Quiz/> : <>
      <div className="filter-box"><SearchField value={query} onChange={setQuery} label={tr('Buscar en el atlas', 'Search the atlas')} placeholder={tr('Nombre, identificador o concepto…', 'Name, identifier or concept…')}/></div>
      <div className="results-toolbar"><p role="status"><strong>{total}</strong> {total === 1 ? tr('resultado', 'result') : tr('resultados', 'results')}</p></div>
      {total ? <div className="card-grid atlas-card-grid">
        {isCatalog && filtered.map(entity => <article key={entity.id} className="panel entry-card atlas-entry">
          <div className="result-meta"><span className="tag">{l(kinds[entity.kind])}</span></div>
          <h2><Link to={'/atlas?item=' + entity.id}>{entityTitle(entity, lang)}</Link></h2>
          {entity.kind === 'organism' && entity.label && l(entity.label) !== entity.name && <p className="byline">{l(entity.label)}</p>}
          <p>{l(entity.detail)}</p>
          <Link className="text-link" to={'/atlas?item=' + entity.id}>{t('details')} <Icon name="arrow" size={17}/></Link>
        </article>)}
        {view === 'topics' && areas.map(id => <article key={id} className="panel entry-card atlas-entry">
          <div className="result-meta"><span className="tag">{lines[id].length} {tr('publicaciones', 'publications')}</span></div>
          <h2>{l(topicLabel(id))}</h2>
          {lines[id].length ? <SourceLinks ids={lines[id].slice(0, 2).map(record => record.id)}/> : <p>{tr('Selección documental pendiente.', 'Source selection pending.')}</p>}
          <Link className="text-link" to={'/biblioteca?topic=' + id}>{tr('Explorar publicaciones', 'Explore publications')} <Icon name="arrow" size={17}/></Link>
        </article>)}
        {view === 'glossary' && glossary.map(row => <article key={row.term.en} className="panel entry-card atlas-entry">
          <h2>{l(row.term)}</h2><p>{l(row.meaning)}</p><SourceLinks ids={row.publications}/>
        </article>)}
      </div> : <Empty/>}
    </>}
  </>;
}

function TopicSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { l, tr, t } = useLocale();
  return <SelectField label={tr('Línea científica', 'Research area')} value={value} onChange={onChange}>
    <option value="">{t('all')}</option>
    {topicIds.filter(id => researched.some(record => record.topics.includes(id))).map(id => <option key={id} value={id}>{l(topicLabel(id))}</option>)}
  </SelectField>;
}

export function Timeline() {
  const { tr, t, l } = useLocale();
  const [topic, setTopic] = useState('');
  const [order, setOrder] = useState('earliest');
  const direction = order === 'earliest' ? 1 : -1;
  const timeline = researched.filter(record => !topic || record.topics.includes(topic))
    .sort((a, b) => direction * (a.year - b.year || (a.date ?? '').localeCompare(b.date ?? '')) || a.title.localeCompare(b.title));
  return <>
    <PageIntro index="04" label={t('timeline').toUpperCase()} title={tr('Trayectoria científica', 'Research timeline')} description={tr('Sigue la evolución de la investigación a través de documentos fechados y atribuciones verificadas.', 'Follow the evolution of the research through dated records and verified attributions.')}/>
    <div className="filter-box fields">
      <TopicSelect value={topic} onChange={setTopic}/>
      <SelectField label={tr('Orden', 'Order')} value={order} onChange={setOrder}>
        <option value="earliest">{tr('Primeros trabajos primero', 'Earliest work first')}</option>
        <option value="latest">{tr('Trabajos recientes primero', 'Latest work first')}</option>
      </SelectField>
    </div>
    <div className="results-toolbar"><p role="status"><strong>{timeline.length}</strong> {tr('registros en la cronología', 'records on the timeline')}</p></div>
    {timeline.length ? <ol className="atlas-timeline">
      {timeline.map(record => <li key={record.id}>
        <span className="timeline-year">{record.year}</span>
        <article className="panel reading timeline-card">
          <div className="result-meta"><span className="tag">{l(attributionLabels[record.attribution])}</span><EvidenceTag grade={record.evidence}/></div>
          <h2><Link to={'/biblioteca/' + record.id}>{record.title}</Link></h2>
          <p>{l(record.result)}</p>
          <div className="source-links">{record.topics.map(id => <Link className="source-link" key={id} to={'/biblioteca?topic=' + id}>{l(topicLabel(id))}</Link>)}</div>
        </article>
      </li>)}
    </ol> : <Empty/>}
  </>;
}

type Coauthor = { name: string; records: Publication[] };
function coauthorList(records: Publication[]) {
  const entries = new Map<string, Coauthor>();
  for (const record of records) {
    for (const name of new Set(record.authors)) {
      if (authorIsResearcher(name)) continue;
      const key = normalize(name);
      const entry = entries.get(key);
      if (entry) entry.records.push(record);
      else entries.set(key, { name, records: [record] });
    }
  }
  return [...entries.values()].sort((a, b) => b.records.length - a.records.length || a.name.localeCompare(b.name));
}

function CollaborationFigure({ list, selected }: { list: Coauthor[]; selected: Coauthor }) {
  const { tr } = useLocale();
  const nodes = list.map((entry, index) => {
    const angle = -Math.PI / 2 + index * 2 * Math.PI / list.length;
    return { entry, x: 260 + 160 * Math.cos(angle), y: 163 + 112 * Math.sin(angle) };
  });
  return <Figure className="collaboration-figure" title={tr('Red de coautorías', 'Coauthorship network')}
    description={tr('El centro representa a Agustino Martínez-Antonio. El número en cada nodo indica las publicaciones compartidas.', 'The center represents Agustino Martínez-Antonio. The number on each node gives the count of shared publications.')}>
    <svg className="collaboration-svg" viewBox="0 0 520 330" role="img"
      aria-label={tr('Diagrama de coautoría con Martínez-Antonio en el centro. Selección: ', 'Coauthorship diagram with Martínez-Antonio at the center. Selected: ') + selected.name}>
      {nodes.map(({ entry, x, y }) => <line key={entry.name} x1="260" y1="163" x2={x} y2={y} className={entry === selected ? 'selected-edge' : undefined}/>)}
      {nodes.map(({ entry, x, y }) => <g key={entry.name} className={entry === selected ? 'selected-node' : undefined}>
        <circle cx={x} cy={y} r="20"/>
        <text x={x} y={y + 5} className="network-count">{entry.records.length}</text>
        <text x={x} y={y + 37}>{entry.name.length > 26 ? entry.name.slice(0, 24) + '…' : entry.name}</text>
      </g>)}
      <g className="network-core"><circle cx="260" cy="163" r="39"/><text x="260" y="168">AMA</text></g>
    </svg>
  </Figure>;
}

export function Collaborations() {
  const { tr, t } = useLocale();
  const [topic, setTopic] = useState('');
  const [year, setYear] = useState('');
  const [query, setQuery] = useState('');
  const [name, setName] = useState('');
  const visible = researched.filter(record => (!topic || record.topics.includes(topic)) && (!year || String(record.year) === year));
  const list = coauthorList(visible).filter(entry => normalize(entry.name).includes(normalize(query)));
  const selected = list.find(entry => entry.name === name) ?? list[0];
  const shown = selected && !list.slice(0, 8).includes(selected) ? [...list.slice(0, 7), selected] : list.slice(0, 8);
  return <>
    <PageIntro index="06" label={t('collaborations').toUpperCase()} title={tr('Red de colaboraciones', 'Collaboration network')} description={tr('Explora coautorías documentadas en las publicaciones de la selección. Puedes acotar por año o línea científica.', 'Explore documented coauthorship in the selected publications. Narrow the scope by year or research area.')}/>
    <div className="filter-box">
      <SearchField label={tr('Buscar coautor', 'Search coauthors')} placeholder={tr('Nombre o apellido…', 'First or last name…')} value={query} onChange={setQuery}/>
      <div className="fields">
        <TopicSelect value={topic} onChange={setTopic}/>
        <SelectField label={tr('Año', 'Year')} value={year} onChange={setYear}>
          <option value="">{t('all')}</option>
          {[...new Set(researched.map(record => record.year))].map(value => <option key={value} value={value}>{value}</option>)}
        </SelectField>
        <SelectField label={tr('Coautor seleccionado', 'Selected coauthor')} value={selected?.name ?? ''} onChange={setName}>
          {!selected && <option value="">{tr('Sin coincidencias', 'No matches')}</option>}
          {list.map(entry => <option key={entry.name} value={entry.name}>{entry.name} ({entry.records.length})</option>)}
        </SelectField>
      </div>
    </div>
    <div className="results-toolbar"><p role="status"><strong>{list.length}</strong> {list.length === 1 ? tr('coautor en la selección', 'coauthor in the selection') : tr('coautores en la selección', 'coauthors in the selection')}</p></div>
    {selected ? <div className="detail-grid collaboration-grid">
      <section className="panel reading">
        <CollaborationFigure list={shown} selected={selected}/>
        <div className="source-links" role="group" aria-label={tr('Coautores en el diagrama', 'Coauthors shown in the diagram')}>
          {shown.map(entry => <button type="button" className="source-link" key={entry.name} aria-pressed={entry === selected} onClick={() => setName(entry.name)}>{entry.name} · {entry.records.length}</button>)}
        </div>
      </section>
      <aside className="panel reading">
        <h2>{selected.name}</h2>
        <p>{tr('Publicaciones en común dentro de la selección:', 'Shared publications in this selection:')} <strong>{selected.records.length}</strong></p>
        <ul className="atlas-study-list">{selected.records.map(record => <li key={record.id}>
          <Link className="text-link" to={'/biblioteca/' + record.id}>{record.title}</Link>
          <p className="byline">{record.year} · {record.journal}</p>
        </li>)}</ul>
        <p className="byline">{tr('Los nombres proceden de cada publicación. Se conservan variantes de iniciales cuando la identidad compartida no está documentada.', 'Names come from each publication. Initials are retained as variants when a shared identity is undocumented.')}</p>
        <p className="byline">{tr('La red representa coautoría. Los roles y afiliaciones se documentan en las fichas cuando la fuente los identifica.', 'The network represents coauthorship. Roles and affiliations appear in the records when identified by the source.')}</p>
      </aside>
    </div> : <Empty/>}
  </>;
}

const gradeDetails = {
  A: pair('Observación o medición en las condiciones del experimento.', 'Observation or measurement under the experimental conditions.'),
  B: pair('Interpretación de literatura o datos curados con referencias.', 'Interpretation of literature or curated data with references.'),
  C: pair('Análisis computacional o propuesta que requiere contrastación para sustentar efectos experimentales.', 'Computational analysis or proposal requiring testing before experimental effects can be established.'),
  D: pair('Resultado preliminar o documento que se distingue de un artículo publicado con revisión por pares.', 'Preliminary finding or a document classified separately from published peer-reviewed articles.'),
  E: pair('La verificación documental aún está en curso.', 'Documentary verification is still in progress.'),
  F: pair('Existe un aviso editorial que cambia la interpretación o disponibilidad de la publicación.', 'An editorial notice changes how a publication should be interpreted or accessed.'),
};

export function Methodology() {
  const { tr, t, l } = useLocale();
  const grades = Object.keys(evidenceLabels) as Evidence[];
  return <>
    <PageIntro index="08" label={t('methodology').toUpperCase()} title={tr('Metodología y alcance', 'Methods and scope')} description={tr('Cómo se verifican las fuentes y se distingue una observación, una síntesis y una predicción.', 'How sources are checked and observations, syntheses and predictions are distinguished.')}/>
    <div className="detail-grid">
      <section className="panel reading">
        <h2>{tr('Clasificación de evidencia', 'Evidence classification')}</h2>
        <dl className="method-grades">{grades.map(grade => <div key={grade}><dt><EvidenceTag grade={grade}/></dt><dd>{l(gradeDetails[grade])}</dd></div>)}</dl>
        <Link className="text-link" to="/evidencia">{tr('Abrir el registro de evidencia', 'Open the evidence register')} <Icon name="arrow" size={17}/></Link>
      </section>
      <aside className="panel reading">
        <h2>{tr('Fuentes y atribución', 'Sources and attribution')}</h2>
        <p>{tr('Cada registro enlaza a una fuente consultada. Los documentos editoriales, los identificadores persistentes y los archivos institucionales sustentan la verificación. La autoría, la afiliación y las contribuciones se registran con el alcance que permite la fuente.', 'Each record links to a reviewed source. Publisher documents, persistent identifiers and institutional archives underpin verification. Authorship, affiliation and contributions are recorded to the extent supported by the source.')}</p>
        <p>{tr('La coautoría documenta participación. Una función específica se atribuye cuando existe una declaración de contribuciones u otra fuente que la identifique.', 'Coauthorship documents participation. A specific role is attributed when an author contribution statement or another source identifies it.')}</p>
        <div className="source-links"><OutLink href={profile.source}>{tr('Semblanza institucional', 'Institutional biography')}</OutLink><OutLink href={profile.orcid}>ORCID</OutLink></div>
      </aside>
    </div>
    <section className="home-section panel reading">
      <h2>{tr('Cobertura y revisión', 'Coverage and review')}</h2>
      <p>{t('checked')}. {tr('El atlas contiene una selección inicial de la trayectoria y de sus contextos científicos. La integración del listado separado de Google Scholar y la revisión sistemática de avisos editoriales permanecen pendientes.', 'The atlas contains an initial selection of the research and its scientific context. Importing the separate Google Scholar list and systematically reviewing editorial notices are pending.')}</p>
      <p>{tr('Los diagramas educativos indican su alcance y enlazan a fuentes. Los resultados de laboratorio corresponden al sistema ensayado, y las simulaciones dependen de las reglas y parámetros que se indiquen.', 'Educational diagrams state their scope and link to sources. Laboratory results apply to the system tested, and simulations depend on their stated rules and parameters.')}</p>
      <p>{tr('El atlas es un proyecto independiente de divulgación. La revisión documental asistida por IA está abierta a revisión científica humana.', 'The atlas is an independent educational project. The AI-assisted documentary review is open to human scientific review.')}</p>
    </section>
  </>;
}
