import { describe, expect, it } from 'vitest';
import { diagrams, entities, normalize, publications, publicationById, topics, typeLabels } from '../src/content';
import { bibliography, evidenceRecord } from '../src/exports';

function bilingual(value: { es: string; en: string }) {
  expect(value.es.trim()).not.toBe('');
  expect(value.en.trim()).not.toBe('');
}

describe('Atlas content', () => {
  it('keeps unique IDs and DOI records with traceable bilingual findings', () => {
    expect(publicationById.size).toBe(publications.length);
    const dois = publications.flatMap(p => p.doi ? [p.doi.toLowerCase()] : []);
    expect(new Set(dois).size).toBe(dois.length);
    for (const p of publications) {
      expect(p.authors.length).toBeGreaterThan(0);
      expect(p.url).toMatch(/^https:\/\//);
      expect(p.verification).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(p.type in typeLabels).toBe(true);
      expect(p.topics.every(t => t in topics)).toBe(true);
      expect([p.organisms, p.genes, p.metabolites].every(Array.isArray)).toBe(true);
      if (p.type === 'preprint') expect(p.evidence).toBe('D');
      for (const field of [p.objective, p.methods, p.result, p.limitation]) bilingual(field);
    }
  });
  it('checks catalog and diagram references and diagram accessibility copy', () => {
    const ids = new Set(entities.map(e => e.id));
    expect(ids.size).toBe(entities.length);
    expect(new Set(diagrams.map(d => d.id)).size).toBe(diagrams.length);
    for (const entity of entities) {
      bilingual(entity.detail);
      expect((entity.related ?? []).every(id => ids.has(id))).toBe(true);
    }
    for (const diagram of diagrams) {
      bilingual(diagram.summary);
      bilingual(diagram.limitation);
      expect(diagram.steps.length).toBeGreaterThan(1);
      diagram.steps.forEach(bilingual);
    }
    for (const item of [...entities, ...diagrams]) {
      expect(item.publications.length).toBeGreaterThan(0);
      expect(item.publications.every(id => publicationById.has(id))).toBe(true);
    }
  });
  it('keeps literature status distinct from evidence type and exports all four formats', () => {
    const era = publicationById.get('eragene-2026')!;
    const record = evidenceRecord(era);
    expect(era.type).toBe('article');
    expect(record.evidence_level).toBe('C');
    expect(record.verification_status).toBe('source_checked');
    expect(record.source_ids).toEqual(['doi:10.3390/synbio4040023']);
    expect(era.support?.some(source => source.label === 'Preprint v1')).toBe(true);
    expect(JSON.parse(bibliography([era], 'json'))[0].id).toBe(era.id);
    expect(bibliography([era], 'csv')).toContain('"eragene-2026"');
    expect(bibliography([era], 'ris')).toContain('TY  - JOUR');
    expect(bibliography([era], 'bib')).toContain('@article{eragene-2026,');
    expect(normalize('   Martínez  ')).toBe('martinez');
  });
});
