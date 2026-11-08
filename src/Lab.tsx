import { useId, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { diagrams, normalize, pair, publicationById, type Diagram, type Level } from './content';
import { download, evidenceRecord } from './exports';
import { useLocale } from './locale';
import { hasScientificFigure, ScientificFigure } from './ScientificFigures';
import { EvidenceTag, Figure, Icon, PageIntro, SearchField, SelectField, SourceLinks } from './ui';

const labModes = {
  cell: pair('Célula virtual', 'Virtual cell'),
  network: pair('Red regulatoria', 'Regulatory network'),
  process: pair('Bioprocesos', 'Bioprocesses'),
  plant: pair('Fitoreguladores', 'Plant growth regulators'),
  gallery: pair('Diagramas', 'Diagrams'),
};
type Mode = keyof typeof labModes;
type Sign = 'activate' | 'repress';
const nodes = [
  { id: 'crp', label: 'CRP–cAMP', x: 86, y: 77, role: pair('Complejo activador', 'Activator complex'), entity: 'crp' },
  { id: 'laci', label: 'LacI', x: 86, y: 151, role: pair('Represor', 'Repressor'), entity: 'laci' },
  { id: 'trpr', label: 'TrpR', x: 86, y: 251, role: pair('Represor', 'Repressor'), entity: 'trpr' },
  { id: 'lac', label: 'lac P1', x: 349, y: 114, role: pair('Promotor', 'Promoter'), entity: 'lacz' },
  { id: 'trp', label: 'trp', x: 349, y: 251, role: pair('Promotor y operador', 'Promoter and operator'), entity: 'trpe' },
];
const edges = [
  { from: 'crp', to: 'lac', sign: 'activate' as const, path: 'M148 77 H200 Q214 77 223 89 L246 108 Q254 114 273 114 H280',
    source: 'crp-lac-p1', detail: pair('CRP unido a AMPc favorece el reclutamiento de ARN polimerasa en el promotor lac P1.', 'cAMP-bound CRP promotes RNA polymerase recruitment at the lac P1 promoter.') },
  { from: 'laci', to: 'lac', sign: 'repress' as const, path: 'M148 151 H200 Q214 151 223 139 L246 120 Q254 114 273 114 H280',
    source: 'laci-lac-operators', detail: pair('LacI reprime la transcripción de lac mediante operadores que pueden cooperar entre sí.', 'LacI represses lac transcription through operators that can cooperate with one another.') },
  { from: 'trpr', to: 'trp', sign: 'repress' as const, path: 'M148 251 H280',
    source: 'trpr-operator-repression', detail: pair('El triptófano actúa como correpresor. TrpR unido al triptófano reprime la transcripción del operón trp.', 'Tryptophan acts as a corepressor. Tryptophan-bound TrpR represses transcription of the trp operon.') },
];
const phases = {
  basal: pair('Referencia conceptual', 'Conceptual baseline'),
  camp: pair('Complejo CRP–AMPc', 'CRP–cAMP complex'),
  trp: pair('Triptófano unido a TrpR', 'Tryptophan bound to TrpR'),
};
const stateCopy = {
  basal: pair('Se muestran las relaciones descritas para dos operones. La vista basal sirve como referencia visual.', 'The view shows documented relationships for two operons. The baseline serves as a visual reference.'),
  camp: pair('El complejo CRP–AMPc resalta la activación de lac P1. El estado de LacI y otros factores también influye en la expresión.', 'The CRP–cAMP complex highlights activation of lac P1. LacI status and other factors also influence expression.'),
  trp: pair('El triptófano permite la represión por TrpR. La atenuación de la transcripción es otro mecanismo regulatorio del operón trp.', 'Tryptophan enables TrpR-mediated repression. Transcriptional attenuation is another regulatory mechanism of the trp operon.'),
};

function Network({ mode, level, params, set }: { mode: 'cell' | 'network'; level: Level; params: URLSearchParams; set: (key: string, value: string) => void }) {
  const { tr, t, l } = useLocale();
  const marker = useId();
  const [query, setQuery] = useState('');
  const sign = mode === 'network' ? params.get('sign') ?? '' : '';
  const phaseKey = params.get('phase');
  const phase = phaseKey === 'camp' || phaseKey === 'trp' ? phaseKey : 'basal';
  const selected = nodes.find(node => node.id === params.get('node')) ?? nodes[0];
  const lookup = normalize(query);
  const signLabel = (value: Sign) => value === 'activate' ? tr('Activación', 'Activation') : tr('Represión', 'Repression');
  const visible = edges.filter(edge => !sign || edge.sign === sign);
  const adjacent = visible.filter(edge => edge.from === selected.id || edge.to === selected.id);
  const publications = [...new Set(adjacent.map(edge => edge.source))];
  function focused(edge: typeof edges[number]) {
    if (phase === 'camp') return edge.from === 'crp';
    if (phase === 'trp') return edge.from === 'trpr';
    return adjacent.includes(edge);
  }
  return <>
    <section className="lab-workbench">
      <div className="network-board">
        <div className="board-label"><span className="status-dot"/> E. COLI / K-12 <span>{mode === 'cell' ? '01' : '02'}</span></div>
        <Figure title={mode === 'cell' ? tr('Célula bacteriana virtual', 'Virtual bacterial cell') : tr('Fragmento de red regulatoria', 'Regulatory network excerpt')} description={tr('Ilustración cualitativa de relaciones documentadas', 'Qualitative illustration of documented relationships')}>
          <svg role="img" aria-label={tr('CRP–AMPc activa lac P1. LacI reprime lac y TrpR reprime trp.', 'CRP–cAMP activates lac P1. LacI represses lac and TrpR represses trp.')} viewBox="0 0 442 322">
            <defs>
              <pattern id={marker + '-grid'} width="18" height="18" patternUnits="userSpaceOnUse"><path d="M18 0H0v18" stroke="#82b5a4" strokeOpacity=".14" fill="none"/></pattern>
              <marker id={marker + '-activate'} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="m1 1 5 3-5 3" fill="none" stroke="#c9f18e" strokeWidth="1.3"/></marker>
              <marker id={marker + '-repress'} markerWidth="8" markerHeight="10" refX="5" refY="5" orient="auto"><path d="M5 1v8" stroke="#fab79c" strokeWidth="1.4"/></marker>
            </defs>
            <rect width="442" height="322" rx="14" fill={'url(#' + marker + '-grid)'}/>
            {mode === 'cell' && <g fill="none" stroke="#589589" opacity=".72"><rect x="12" y="22" width="414" height="278" rx="116"/><rect x="20" y="30" width="398" height="262" rx="109" strokeDasharray="3 5"/><path d="M427 136c23-10 5-41 14-47"/></g>}
            {visible.map(edge => <path key={edge.from} d={edge.path} fill="none" stroke={edge.sign === 'activate' ? '#c9f18e' : '#fab79c'} strokeDasharray={edge.sign === 'repress' ? '5 4' : undefined} strokeWidth={focused(edge) ? 3 : 1.6} opacity={focused(edge) ? 1 : .64} markerEnd={'url(#' + marker + '-' + edge.sign + ')'}/>)}
            {nodes.map(node => <g key={node.id}>
              <rect x={node.x - 57} y={node.y - 19} width="114" height="38" rx="10" fill={node.id === selected.id ? '#c9f18e' : '#234745'} stroke={node.id === selected.id ? '#c9f18e' : '#83b5a5'}/>
              <text x={node.x} y={node.y + 5} textAnchor="middle" fill={node.id === selected.id ? '#132825' : '#eff8ea'} fontSize="16" fontWeight="700">{node.id === 'crp' && tr('CRP–AMPc', 'CRP–cAMP') || node.label}</text>
            </g>)}
          </svg>
        </Figure>
        <div className="network-legend"><span><i className="activate-key"/> {signLabel('activate')}</span><span><i className="repress-key"/> {signLabel('repress')}</span></div>
      </div>
      <div className="panel lab-panel">
        <p className="kicker"><span className="status-dot"/> {tr('CONTROLES DEL MODELO', 'MODEL CONTROLS')}</p>
        <SelectField label={tr('Condición representada', 'Illustrated condition')} value={phase} onChange={value => {
          set('phase', value);
        }}>{Object.entries(phases).map(([id, label]) => <option key={id} value={id}>{l(label)}</option>)}</SelectField>
        {mode === 'network' && <SelectField label={tr('Tipo de conexión', 'Connection type')} value={sign} onChange={value => set('sign', value)}>
          <option value="">{t('all')}</option><option value="activate">{signLabel('activate')}</option><option value="repress">{signLabel('repress')}</option>
        </SelectField>}
        <SearchField value={query} onChange={setQuery} label={tr('Buscar nodo', 'Find a node')} placeholder={tr('Gen, proteína o promotor…', 'Gene, protein or promoter…')}/>
        <div className="node-list" role="group" aria-label={tr('Nodos de la red', 'Network nodes')}>
          {nodes.filter(node => normalize([node.id, node.label, l(node.role), node.id === 'crp' ? 'AMPc cAMP' : ''].join(' ')).includes(lookup)).map(node =>
            <button type="button" key={node.id} aria-pressed={selected.id === node.id} onClick={() => set('node', node.id)}>{node.id === 'crp' ? tr('CRP–AMPc', 'CRP–cAMP') : node.label}</button>)}
          {!nodes.some(node => normalize([node.id, node.label, l(node.role), node.id === 'crp' ? 'AMPc cAMP' : ''].join(' ')).includes(lookup)) && <p>{tr('No hay nodos que coincidan.', 'No matching nodes.')}</p>}
        </div>
        <div className="readout" aria-live="polite">
          <span className="kicker">{l(selected.role)}</span>
          <h2>{selected.id === 'crp' ? tr('CRP–AMPc', 'CRP–cAMP') : selected.label}</h2>
          <p>{l(stateCopy[phase])}</p>
          {adjacent.map(edge => <p key={edge.from}>{l(edge.detail)}</p>)}
          {level !== 'general' && <p>{tr('Los genes lacZ, lacY y lacA comparten una unidad de transcripción. El esquema trp agrupa la regulación del promotor y el operador.', 'lacZ, lacY and lacA share a transcription unit. The trp diagram groups promoter and operator regulation.')}</p>}
          <div className="source-links">
            <Link className="source-link" to={'/atlas?item=' + selected.entity}>{tr('Ficha molecular', 'Molecular record')} <Icon name="arrow" size={15}/></Link>
            <Link className="source-link" to="/laboratorio?mode=gallery&diagram=operon-architecture">{tr('Ver un operón', 'View an operon')} <Icon name="arrow" size={15}/></Link>
          </div>
        </div>
      </div>
    </section>
    <div className="panel lab-citation">
      <div><h2>{tr('Evidencia del diagrama', 'Diagram evidence')}</h2><EvidenceTag grade="A"/><p>{tr('Las conexiones se apoyan en estudios externos de regulación. La vista omite otras interacciones de la red y no calcula niveles de expresión, flujos ni respuestas cuantitativas.', 'The links draw on external regulation studies. The view omits other network interactions and does not calculate expression levels, fluxes or quantitative responses.')}</p>
        <SourceLinks ids={[...new Set([...publications, ...edges.map(edge => edge.source), 'regulondb-4'])]}/></div>
      {level === 'research' && <div className="actions">
        <button className="btn secondary" type="button" onClick={() => download('red-regulatoria.json', JSON.stringify(visible.map(edge => ({
          from: edge.from, to: edge.to, effect: edge.sign, statement: edge.detail,
          evidence: evidenceRecord(publicationById.get(edge.source)!),
        })), null, 2), 'application/json')}><Icon name="download" size={16}/> JSON</button>
      </div>}
    </div>
  </>;
}

const comparison = new Set(['activation-repression', 'cytokinins-lemongrass', 'mucuna-ldopa-tissues', 'eragene-links', 'transcription-hierarchy', 'cell-states']);
function DiagramFigure({ item, stage, onStage }: { item: Diagram; stage: number; onStage: (value: number) => void }) {
  const { l, tr, t } = useLocale();
  const branched = comparison.has(item.id);
  const x = (index: number) => 52 + index * (316 / Math.max(1, item.steps.length - 1));
  const y = (index: number) => branched && index % 2 ? 111 : 66;
  return <Figure title={l(item.title)} description={t('conceptual')} className="diagram-figure">
    {hasScientificFigure(item.id) ? <ScientificFigure item={item} stage={stage}/> : <svg role="img" aria-label={l(item.summary)} viewBox="0 0 420 172">
      <rect x="12" y="13" width="396" height="144" rx="20" fill="#e5eee4" stroke="#c4d6c8"/>
      {item.steps.slice(1).map((step, i) => {
        const from = branched ? 0 : i;
        const to = i + 1;
        return <path key={step.en} d={'M' + x(from) + ' ' + y(from) + ' Q' + ((x(from) + x(to)) / 2) + ' ' + y(to) + ' ' + x(to) + ' ' + y(to)}
          fill="none" stroke="#49766b" strokeWidth="2" strokeDasharray={branched ? '4 4' : undefined}/>;
      })}
      {item.steps.map((step, i) => <g key={step.en}>
        <circle cx={x(i)} cy={y(i)} r="25" fill={stage === i ? '#183d36' : '#f8fbf2'} stroke="#49766b" strokeWidth="2"/>
        <text x={x(i)} y={y(i) + 6} textAnchor="middle" fill={stage === i ? '#dcf6aa' : '#27493e'} fontWeight="700" fontSize="17">{String(i + 1).padStart(2, '0')}</text>
      </g>)}
    </svg>}
    <div className="diagram-legend" role="group" aria-label={branched ? tr('Elementos del diagrama', 'Diagram elements') : tr('Pasos del diagrama', 'Diagram steps')}>
      {item.steps.map((step, i) => <button type="button" aria-pressed={stage === i} key={step.en} onClick={() => onStage(i)}><span>{String(i + 1).padStart(2, '0')}</span>{l(step)}</button>)}
    </div>
  </Figure>;
}
const plantCases = [
  { id: 'cytokinins-lemongrass', organism: 'Cymbopogon citratus', compound: 'BAP / 2-iP', process: pair('Aplicación exógena', 'Exogenous application') },
  { id: 'mucuna-ldopa-tissues', organism: 'Mucuna pruriens', compound: 'L-DOPA', process: pair('Distribución endógena', 'Endogenous distribution') },
  { id: 'iaa-tobacco-explants', organism: 'Nicotiana tabacum', compound: 'IAA', process: pair('Biosíntesis microbiana', 'Microbial biosynthesis') },
  { id: 'papaya-sex-markers', organism: 'Carica papaya', compound: 'DNA', process: pair('Detección molecular', 'Molecular detection') },
];
function Applied({ mode, level, params, set }: { mode: 'process' | 'plant' | 'gallery'; level: Level; params: URLSearchParams; set: (key: string, value: string) => void }) {
  const { l, tr, t } = useLocale();
  const plantKey = params.get('organism') ?? '';
  const compound = params.get('compound') ?? '';
  const process = params.get('process') ?? '';
  const applicable = plantCases.filter(item => (!plantKey || item.organism === plantKey) && (!compound || item.compound === compound) && (!process || item.id === process));
  const options = diagrams.filter(item => mode === 'gallery' || (mode === 'process' && item.category === 'process') || (mode === 'plant' && applicable.some(c => c.id === item.id)));
  const item = options.find(d => d.id === params.get('diagram')) ?? options[0];
  const stage = Math.min(item?.steps.length ? item.steps.length - 1 : 0, Math.max(0, Number(params.get('step')) || 0));
  return <div>
    {mode === 'plant' && <section className="filter-box fields" aria-label={tr('Filtros de fitoreguladores', 'Plant growth regulator filters')}>
      <SelectField label={tr('Organismo', 'Organism')} value={plantKey} onChange={value => set('organism', value)}>
        <option value="">{t('all')}</option>{plantCases.map(c => <option key={c.id} value={c.organism}>{c.organism}</option>)}
      </SelectField>
      <SelectField label={tr('Molécula', 'Molecule')} value={compound} onChange={value => set('compound', value)}>
        <option value="">{t('all')}</option>{plantCases.map(c => <option key={c.id} value={c.compound}>{c.compound === 'DNA' ? tr('ADN', 'DNA') : c.compound}</option>)}
      </SelectField>
      <SelectField label={tr('Proceso', 'Process')} value={process} onChange={value => set('process', value)}>
        <option value="">{t('all')}</option>{plantCases.map(c => <option key={c.id} value={c.id}>{l(c.process)}</option>)}
      </SelectField>
    </section>}
    {item ? <>
      <div className="panel applied-panel">
        <SelectField label={tr('Elegir visualización', 'Choose a visualization')} value={item.id} onChange={value => set('diagram', value)}>
          {options.map(d => <option key={d.id} value={d.id}>{l(d.title)}</option>)}
        </SelectField>
        <div className="applied-grid">
          <DiagramFigure item={item} stage={stage} onStage={value => set('step', String(value))}/>
          <div className="reading" aria-live="polite">
            <p className="kicker"><span className="status-dot"/> {t('conceptual')}</p>
            <h2>{l(item.title)}</h2><p>{l(item.summary)}</p>
            <div className="readout"><span className="kicker">{tr('SELECCIÓN', 'SELECTION')} {String(stage + 1).padStart(2, '0')}</span><p>{item.steps[stage] && l(item.steps[stage])}</p></div>
            <h3>{t('limitations')}</h3><p>{l(item.limitation)}</p>
            <div className="evidence-tags">{[...new Set(item.publications.map(id => publicationById.get(id)?.evidence))].map(grade => grade && <EvidenceTag grade={grade} key={grade}/>)}</div>
            <SourceLinks ids={item.publications}/>
            {level === 'research' && item.publications.map(id => {
              const p = publicationById.get(id);
              return p?.numbers && <p className="readout" key={id}><strong>{p.authors[0]} · {p.year}</strong><br/>{l(p.numbers)}</p>;
            })}
          </div>
        </div>
      </div>
    </> : <div className="empty" role="status">{tr('No hay casos documentados con esta combinación de filtros.', 'No documented cases match this combination of filters.')}</div>}
  </div>;
}
export function Lab({ level }: { level: Level }) {
  const { l, t, tr } = useLocale();
  const [params, setParams] = useSearchParams();
  const candidate = params.get('mode');
  const mode = candidate && Object.hasOwn(labModes, candidate) ? candidate as Mode : 'cell';
  function set(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    if (key === 'diagram' || key === 'organism' || key === 'compound' || key === 'process') next.delete('step');
    setParams(next, { replace: true });
  }
  return <>
    <PageIntro index="01" label={t('labs').toUpperCase()} title={tr('Laboratorio interactivo', 'Interactive lab')} description={tr('Explora una célula bacteriana, sigue una ruta de ingeniería y consulta la evidencia detrás de cada caso.', 'Explore a bacterial cell, follow an engineering pathway and review the evidence behind each case.')}/>
    <nav className="tabs" aria-label={tr('Experiencias de laboratorio', 'Lab experiences')}>
      {Object.entries(labModes).map(([id, label]) => <Link key={id} aria-current={id === mode ? 'page' : undefined} to={'?mode=' + id}>{l(label)}</Link>)}
    </nav>
    {mode === 'cell' || mode === 'network' ? <Network mode={mode} level={level} params={params} set={set}/> : <Applied mode={mode} level={level} params={params} set={set}/>}
  </>;
}
