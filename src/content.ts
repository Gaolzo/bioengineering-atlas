import historical from '../content/historical.json';
import recent from '../content/recent.json';
import entityData from '../content/entities.json';
import diagramData from '../content/diagrams.json';

export type Pair = { es: string; en: string };
export type Language = keyof Pair;
export type Level = 'general' | 'university' | 'research';
export type Evidence = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
export type Attribution = 'group' | 'collaborative' | 'historical' | 'context' | 'pending';
export type PublicationType = 'article' | 'review' | 'preprint' | 'resource' | 'chapter' | 'conference' | 'patent';
export const pair = (es: string, en: string): Pair => ({ es, en });

export type Publication = {
  id: string; title: string; year: number; authors: string[]; journal: string;
  doi?: string; url: string; date?: string; affiliation?: string[];
  topics: string[]; organisms: string[]; genes: string[]; metabolites: string[];
  techniques?: Pair[]; type: PublicationType; attribution: Attribution; evidence: Evidence;
  objective: Pair; methods: Pair; result: Pair; limitation: Pair; numbers?: Pair;
  support?: { url: string; label: string }[]; verification?: string; contributions?: Pair;
};

export type Entity = {
  id: string; kind: 'organism' | 'gene' | 'metabolite'; name: string; label?: Pair;
  detail: Pair; taxonomy?: string; publications: string[]; related?: string[];
};

export type Diagram = {
  id: string; title: Pair; summary: Pair; steps: Pair[]; publications: string[];
  category: 'mechanism' | 'process' | 'plant' | 'method'; limitation: Pair;
};

export const publications = ([...historical, ...recent] as Publication[])
  .sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));
export const publicationById = new Map(publications.map(record => [record.id, record]));
export const entities = entityData as Entity[];
export const diagrams = diagramData as Diagram[];

export const normalize = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();

export const topics = {
  regulation: pair('Regulación genética', 'Gene regulation'),
  databases: pair('Bases de datos regulatorias', 'Regulatory databases'),
  systems: pair('Biología de sistemas', 'Systems biology'),
  synthetic: pair('Biología sintética', 'Synthetic biology'),
  metabolism: pair('Ingeniería metabólica', 'Metabolic engineering'),
  eragene: pair('EraGene', 'EraGene'),
  bioprocess: pair('Bioprocesos', 'Bioprocesses'),
  plants: pair('Biotecnología vegetal', 'Plant biotechnology'),
  mucuna: pair('Mucuna y L-DOPA', 'Mucuna and L-DOPA'),
  materials: pair('Biomateriales', 'Biomaterials'),
  diagnosis: pair('Diagnóstico molecular', 'Molecular diagnostics'),
  biomedical: pair('Colaboraciones biomédicas', 'Biomedical collaborations'),
};
export const evidenceLabels: Record<Evidence, Pair> = {
  A: pair('Evidencia experimental directa', 'Direct experimental evidence'),
  B: pair('Síntesis, curación o revisión', 'Synthesis, curation or review'),
  C: pair('Modelo, hipótesis o predicción', 'Model, hypothesis or prediction'),
  D: pair('Preprint o evidencia preliminar', 'Preprint or preliminary evidence'),
  E: pair('Pendiente de verificación', 'Verification pending'),
  F: pair('Corregido o retractado', 'Corrected or retracted'),
};
export const attributionLabels: Record<Attribution, Pair> = {
  group: pair('Investigación del grupo', 'Laboratory research'),
  collaborative: pair('Investigación colaborativa', 'Collaborative research'),
  historical: pair('Contribución histórica', 'Historical contribution'),
  context: pair('Contexto externo', 'External context'),
  pending: pair('Atribución pendiente', 'Attribution pending'),
};
export const typeLabels: Record<PublicationType, Pair> = {
  article: pair('Artículo original', 'Original article'),
  review: pair('Revisión', 'Review'),
  preprint: pair('Preprint', 'Preprint'),
  resource: pair('Recurso', 'Resource'),
  chapter: pair('Capítulo', 'Book chapter'),
  conference: pair('Comunicación de congreso', 'Conference contribution'),
  patent: pair('Patente o solicitud', 'Patent or application'),
};
export const profile = {
  name: 'Agustino Martínez-Antonio',
  institution: 'Cinvestav Irapuato',
  orcid: 'https://orcid.org/0000-0003-2231-5014',
  source: 'https://conahcyt.mx/cibiogem/images/cibiogem/Herramientas-ensenanza-investigacion/Seminarios/Docs/semblanza-AMA.pdf',
  date: '2026-11-08',
};

export const topicLabel = (id: string) => topics[id as keyof typeof topics] ?? pair(id, id);
export const authorIsResearcher = (author: string) => /martinez[ -]antonio/.test(normalize(author));
