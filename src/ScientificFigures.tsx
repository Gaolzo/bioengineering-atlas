import { useId } from 'react';
import type { Diagram } from './content';
import { useLocale } from './locale';

const ink = '#20443a';
const line = '#598074';
const dark = '#173d34';
const lime = '#d3eb99';
const mint = '#dceee2';
const blue = '#d6e8ed';
const sand = '#f3e2c4';
const paper = '#f6faf1';

type Translate = (es: string, en: string) => string;
type FigureProps = { stage: number; tr: Translate; arrow: string };

function Caption({ x, y, children, size = 16 }: { x: number; y: number; children: string; size?: number }) {
  return <text x={x} y={y} textAnchor="middle" fill={ink} fontSize={size} fontWeight="650">{children}</text>;
}

function Operon({ stage, tr, arrow }: FigureProps) {
  const genes = [{ name: 'lacZ', start: 185, end: 318 }, { name: 'lacY', start: 324, end: 415 }, { name: 'lacA', start: 421, end: 505 }];
  return <>
    <path d="M40 99H520M40 117H520" stroke={line} strokeWidth="2"/>
    {[55, 75, 95, 115, 135, 155, 175, 516].map(x => <path key={x} d={'M' + x + ' 99v18'} stroke={line}/>)}
    <path d="M52 78V65h120v13" fill="none" stroke={ink} strokeWidth={stage === 0 ? 3 : 1.5}/>
    <Caption x={112} y={52} size={14}>{tr('Región reguladora', 'Regulatory region')}</Caption>
    <path d="M133 100V81h48" fill="none" stroke={ink} strokeWidth={stage === 1 ? 4 : 2} markerEnd={arrow}/>
    <Caption x={152} y={75} size={13}>P1</Caption>
    {genes.map(({ name, start, end }) => <g key={name}>
      <path d={`M${start} 91H${end - 14}l14 17-14 17H${start}z`} fill={stage === 2 ? lime : mint} stroke={ink} strokeWidth={stage === 2 ? 3 : 1.5}/>
      <text x={(start + end) / 2 - 5} y="113" textAnchor="middle" fontStyle="italic" fontSize="17" fontWeight="700" fill={ink}>{name}</text>
    </g>)}
    {[{ name: 'O3', x: 69 }, { name: 'O1', x: 174 }, { name: 'O2', x: 264 }].map(({ name, x }) => <g key={name}>
      <path d={`M${x} 118v18`} stroke={ink} strokeWidth={stage === 0 ? 2.5 : 1}/>
      <rect x={x - 5} y="133" width="10" height="10" rx="2" fill={stage === 0 ? lime : sand} stroke={ink}/>
      <Caption x={x} y={159} size={13}>{name}</Caption>
    </g>)}
    <path d="M179 187q18-14 36 0t36 0t36 0t36 0t36 0t36 0t36 0t36 0t36 0" fill="none" stroke={ink} strokeWidth={stage === 3 ? 4 : 2} markerEnd={arrow}/>
    <Caption x={342} y={217}>{tr('ARN policistrónico', 'Polycistronic RNA')}</Caption>
  </>;
}

function Rpa({ stage, tr, arrow }: FigureProps) {
  const bound = stage >= 1;
  return <>
    <Caption x={280} y={39}>{tr('ADN diana de doble cadena', 'Double-stranded target DNA')}</Caption>
    <path d={bound ? 'M49 109H156C208 49 352 49 405 109H511' : 'M49 109H511'} fill="none" stroke={ink} strokeWidth="3.5"/>
    <path d="M49 135H511" fill="none" stroke={ink} strokeWidth="3.5"/>
    {[60, 83, 106, 129, 152, 175, 198, 221, 244, 267, 290, 313, 336, 359, 382, 405, 428, 451, 474, 497]
      .filter(x => !bound || x <= 152 || x >= 405).map(x => <path key={x} d={'M' + x + ' 109v26'} stroke={line} strokeWidth="1.5"/>)}
    <path d={bound ? 'M177 119H293' : 'M112 179h116'} stroke="#267455" strokeWidth={stage < 2 ? 6 : 4} strokeLinecap="round"/>
    {stage < 2 && [0, 1, 2, 3, 4].map(i => <circle key={i} cx={(bound ? 190 : 125) + 22 * i} cy={bound ? 113 : 173}
      r="10" fill={lime} stroke={ink} strokeWidth="1.5"/>)}
    {stage >= 2 && [{ x: 222, y: 75 }, { x: 280, y: 67 }, { x: 337, y: 75 }].map(({ x, y }) =>
      <rect key={x} x={x - 16} y={y - 10} width="32" height="20" rx="5" fill={stage === 2 ? lime : mint} stroke={ink} strokeWidth={stage === 2 ? 2.5 : 1.5}/>)}
    {stage === 3 && <>
      <path d="M294 119H386" stroke="#267455" strokeWidth="4" markerEnd={arrow}/>
      <path d="M301 125c-13-9-4-29 12-27 16-5 28 4 27 18-1 13-19 15-28 10z" fill={lime} stroke={ink} strokeWidth="2.5"/>
    </>}
    <Caption x={280} y={218}>
      {[tr('Recombinasa y cebador', 'Recombinase and primer'), tr('Apareamiento y desplazamiento', 'Pairing and strand displacement'),
        tr('La SSB estabiliza la cadena', 'SSB stabilizes the strand'), tr('La polimerasa extiende el cebador', 'Polymerase extends the primer')][stage]}
    </Caption>
  </>;
}

function Tryptophan({ stage, tr, arrow }: FigureProps) {
  const compounds = [
    { x: 15, width: 116, label: tr('Corismato', 'Chorismate') },
    { x: 157, width: 117, label: tr('Antranilato', 'Anthranilate') },
    { x: 301, width: 117, label: tr('Intermedios', 'Intermediates') },
    { x: 443, width: 103, label: tr('L-triptófano', 'L-tryptophan') },
  ];
  return <>
    <path d="M73 137V76Q73 62 88 62H189" fill="none" stroke={line} strokeWidth="2" strokeDasharray="5 5" markerEnd={arrow}/>
    <rect x="200" y="39" width="239" height="47" rx="11" fill={blue} stroke={ink}/>
    <Caption x={320} y={68}>{tr('Otras rutas aromáticas', 'Other aromatic pathways')}</Caption>
    <path d="M131 160h20m123 0h20m124 0h20" fill="none" stroke={line} strokeWidth="2.5"/>
    {[151, 294, 438].map(x => <path key={x} d={`M${x - 8} 160h8`} fill="none" stroke={ink} strokeWidth="2" markerEnd={arrow}/>)}
    {compounds.map(({ x, width, label }, i) => <g key={label}>
      <rect x={x} y="137" width={width} height="48" rx="10" fill={stage === i ? lime : mint} stroke={ink} strokeWidth={stage === i ? 3 : 1.5}/>
      <Caption x={x + width / 2} y={166} size={15}>{label}</Caption>
    </g>)}
    <Caption x={280} y={219} size={14}>{tr('Ruta de biosíntesis simplificada', 'Simplified biosynthesis pathway')}</Caption>
  </>;
}

function Mucuna({ stage, tr }: FigureProps) {
  const left = 'M274 79C243 41 181 37 146 68c-26 24-25 66 6 87 39 26 83 8 113-13 15-11 18-42 9-63z';
  const right = 'M284 81c18-39 79-43 113-16 31 25 30 67 5 92-34 33-82 16-111-11-13-13-16-43-7-65z';
  return <>
    <path d="M277 69c-31-47-105-50-146-12-37 34-31 88 8 116 49 35 99 16 140-10 36 28 93 43 133 4 38-36 32-94-9-121-44-29-100-18-126 23z"
      fill={paper} stroke={ink} strokeWidth={stage === 0 ? 4 : 1.5}/>
    <path d={left} fill={stage === 1 ? lime : sand} stroke={ink} strokeWidth={stage === 1 ? 3 : 1.5}/>
    <path d={right} fill={stage === 1 ? lime : sand} stroke={ink} strokeWidth={stage === 1 ? 3 : 1.5}/>
    {[174, 202, 230, 326, 353, 380].map(x => <g key={x} fill={ink} opacity=".36">
      <circle cx={x} cy="93" r="2"/><circle cx={x - 8} cy="116" r="2.5"/><circle cx={x + 7} cy="137" r="2"/>
    </g>)}
    <path d="M280 100q-8 18-1 40t1 38q-2 12-11 23" fill="none" stroke={dark} strokeWidth={stage === 2 ? 11 : 7} strokeLinecap="round"/>
    <path d="M280 100q-8 18-1 40t1 38q-2 12-11 23" fill="none" stroke={stage === 2 ? lime : mint} strokeWidth={stage === 2 ? 6 : 3} strokeLinecap="round"/>
    <circle cx="280" cy="100" r="6.5" fill={stage === 2 ? lime : blue} stroke={ink} strokeWidth="1.5"/>
    <circle cx="269" cy="201" r="6.5" fill={stage === 2 ? lime : blue} stroke={ink} strokeWidth="1.5"/>
    <path d="M105 101h45m259 1h52m-82 98h-98" fill="none" stroke={line} strokeWidth="1.5"/>
    <Caption x={67} y={96} size={14}>{tr('Cotiledón', 'Cotyledon')}</Caption>
    <Caption x={494} y={96} size={14}>{tr('Cotiledón', 'Cotyledon')}</Caption>
    <Caption x={438} y={205} size={14}>{tr('Eje embrionario', 'Embryonic axis')}</Caption>
  </>;
}

function MicrobialIaa({ stage, tr, arrow }: FigureProps) {
  return <>
    <rect x="24" y="55" width="386" height="104" rx="52" fill={mint} stroke={ink} strokeWidth="2"/>
    <path d="M47 107a30 30 0 0 1 30-30h280a30 30 0 0 1 0 60H77a30 30 0 0 1-30-30z" fill={paper} stroke={line} strokeDasharray="4 4"/>
    <text x="216" y="42" textAnchor="middle" fill={ink} fontSize="17" fontStyle="italic" fontWeight="650">E. coli</text>
    {[{ x: 66, width: 62, name: 'L-Trp' }, { x: 183, width: 62, name: 'IAM' }, { x: 310, width: 62, name: 'IAA' }].map(({ x, width, name }, i) => <g key={name}>
      <rect x={x} y="93" width={width} height="31" rx="8" fill={stage === i ? lime : blue} stroke={ink} strokeWidth={stage === i ? 3 : 1.5}/>
      <Caption x={x + width / 2} y={114} size={15}>{name}</Caption>
    </g>)}
    <path d="M134 110h42" stroke={ink} strokeWidth="2" fill="none" markerEnd={arrow}/>
    <path d="M251 110h52" stroke={ink} strokeWidth="2" fill="none" markerEnd={arrow}/>
    <Caption x={155} y={100} size={13}>IaaM</Caption>
    <Caption x={276} y={100} size={13}>IaaH</Caption>
    <path d="M415 117h38" stroke={ink} strokeWidth={stage === 3 ? 3 : 1.5} fill="none" markerEnd={arrow}/>
    <path d="M493 105c-10-19-25-22-32-19 0 16 11 25 32 26 19-2 26-16 27-24-12-1-22 4-27 17z" fill={stage === 3 ? lime : mint} stroke={ink} strokeWidth="2"/>
    <path d="M493 105v22m0-3q-9 7-12 21m12-21q9 6 12 21m-12-18 1 22" stroke={ink} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <Caption x={493} y={176} size={14}>{tr('Explante', 'Explant')}</Caption>
    <Caption x={280} y={218} size={14}>{tr('Síntesis bacteriana y bioensayo en tabaco', 'Bacterial biosynthesis and tobacco bioassay')}</Caption>
  </>;
}

function Cytokinins({ stage, tr, arrow }: FigureProps) {
  return <>
    <rect x="16" y="88" width="131" height="64" rx="12" fill={stage === 0 ? lime : mint} stroke={ink} strokeWidth={stage === 0 ? 3 : 1.5}/>
    <Caption x={81} y={115} size={15}>{tr('Explante de', 'Lemongrass')}</Caption>
    <Caption x={81} y={137} size={15}>{tr('zacate limón', 'explant')}</Caption>
    <path d="M148 119h34q19 0 26-12l21-39q7-12 22-12h85" fill="none" stroke={ink} strokeWidth={stage === 1 ? 3.5 : 1.75} markerEnd={arrow}/>
    <path d="M148 119h34q19 0 26 12l21 39q7 12 22 12h85" fill="none" stroke={ink} strokeWidth={stage === 2 ? 3.5 : 1.75} markerEnd={arrow}/>
    <Caption x={276} y={43}>BAP</Caption>
    <Caption x={276} y={167}>2-iP</Caption>
    <rect x="345" y="24" width="197" height="72" rx="12" fill={stage === 1 ? lime : mint} stroke={ink} strokeWidth={stage === 1 ? 3 : 1.5}/>
    <rect x="345" y="144" width="197" height="72" rx="12" fill={stage === 2 ? lime : mint} stroke={ink} strokeWidth={stage === 2 ? 3 : 1.5}/>
    <path d="M374 79V53m0 14q-9-13-17-12m17 12q9-13 17-12m-17 4q-5-16-1-19" fill="none" stroke={ink} strokeWidth="2.3" strokeLinecap="round"/>
    <path d="M374 160v22m0-6q-6 6-12 19m12-19q6 6 11 19m-11-11v19" fill="none" stroke={ink} strokeWidth="2.3" strokeLinecap="round"/>
    <Caption x={468} y={65} size={14}>{tr('Proliferación de brotes', 'Shoot proliferation')}</Caption>
    <Caption x={468} y={185} size={14}>{tr('Desarrollo de raíces', 'Root development')}</Caption>
  </>;
}

const figures = {
  'operon-architecture': Operon,
  'rpa-principle': Rpa,
  'tryptophan-route': Tryptophan,
  'mucuna-ldopa-tissues': Mucuna,
  'microbial-iaa': MicrobialIaa,
  'cytokinins-lemongrass': Cytokinins,
};

export function hasScientificFigure(id: string): id is keyof typeof figures {
  return Object.hasOwn(figures, id);
}

export function ScientificFigure({ item, stage }: { item: Diagram; stage: number }) {
  const { l, tr } = useLocale();
  const id = useId();
  if (!hasScientificFigure(item.id)) return null;
  const Figure = figures[item.id];
  const titleId = id + '-title';
  const descriptionId = id + '-description';
  const arrowId = id + '-arrow';
  const selection = Math.max(0, Math.min(item.steps.length - 1, Math.trunc(stage)));
  return <svg viewBox="0 0 560 236" role="img" aria-labelledby={titleId + ' ' + descriptionId}>
    <title id={titleId}>{l(item.title)}</title>
    <desc id={descriptionId}>{l(item.summary)} {tr('Selección', 'Selection')}: {l(item.steps[selection])}. {l(item.limitation)}</desc>
    <defs>
      <marker id={arrowId} viewBox="0 0 9 9" refX="7" refY="4.5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
        <path d="M1 1l6 3.5L1 8" fill="none" stroke={ink} strokeWidth="1.5" strokeLinecap="round"/>
      </marker>
    </defs>
    <rect width="560" height="236" rx="14" fill={paper}/>
    <Figure stage={selection} tr={tr} arrow={'url(#' + arrowId + ')'}/>
  </svg>;
}
