import { useId, type ReactNode } from 'react';
import { Link } from 'react-router';
import { evidenceLabels, publicationById, type Evidence, type Publication } from './content';
import { useLocale } from './locale';

const paths = {
  atlas: 'M3 5.5 9 3l6 2.5 6-2.5v15.5L15 21l-6-2.5L3 21zM9 3v15.5m6-13V21',
  lab: 'M9 3h6m-5 0v7l-6 9a1 1 0 0 0 1 2h14a1 1 0 0 0 1-2l-6-9V3M7 15h10',
  book: 'M4 5h13a3 3 0 0 1 3 3v12H7a3 3 0 0 1 0-6h13M4 17V5Zm4-8h8',
  network: 'M6 5h.01M18 8h.01M8 19h.01M7.5 6l9 1.5m.5 2L9 17m-2-9 1 8M4 5a2 2 0 1 0 4 0 2 2 0 1 0-4 0Zm12 3a2 2 0 1 0 4 0 2 2 0 1 0-4 0ZM6 19a2 2 0 1 0 4 0 2 2 0 1 0-4 0Z',
  leaf: 'M20 4c-1 8-3 14-10 14a5 5 0 0 1-5-5c0-7 7-8 15-9ZM4 21l8-9',
  dna: 'M5 3c0 10 14 8 14 18M19 3C19 13 5 11 5 21m2-15h10M7 18h10m-7-9h4m-4 6h4',
  clock: 'M12 7v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  arrow: 'M4 12h15m-6-6 6 6-6 6', external: 'M12 5h7v7m0-7-9 9m8 0v5H5V6h5',
  search: 'M21 21l-4-4m1-6a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z',
  menu: 'M3 6h18M3 12h18M3 18h18', close: 'm6 6 12 12M18 6 6 18',
  download: 'M12 3v12m-5-5 5 5 5-5M5 16v4h14v-4', back: 'M20 12H5m6-6-6 6 6 6',
  box: 'M4 7l8-4 8 4v10l-8 4-8-4Zm0 0 8 4 8-4m-8 4v10',
};
export type IconName = keyof typeof paths;
export function Icon({ name, size = 21 }: { name: IconName; size?: number }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]}/></svg>;
}
export function Mark() {
  return <svg aria-hidden="true" className="brand-mark" width="38" height="38" viewBox="0 0 64 64">
    <rect width="64" height="64" rx="14" fill="currentColor"/>
    <path d="M16 24h11l10 16h11M16 40h11l10-16h11" stroke="#b6ed7a" strokeWidth="3" fill="none"/>
    <g fill="#b6ed7a"><circle cx="16" cy="24" r="4"/><circle cx="48" cy="40" r="4"/><circle cx="16" cy="40" r="4"/><circle cx="48" cy="24" r="4"/></g>
  </svg>;
}
export function PageIntro({ index, label, title, description }: { index: string; label: string; title: string; description: string }) {
  return <div className="page-intro">
    <p className="kicker"><span className="status-dot"/> {index} / {label}</p>
    <h1>{title}</h1><p className="intro-copy">{description}</p>
  </div>;
}
export function EvidenceTag({ grade }: { grade: Evidence }) {
  const { l } = useLocale();
  return <span className={'tag evidence grade-' + grade}>{grade} · {l(evidenceLabels[grade])}</span>;
}
export function SourceLinks({ ids }: { ids: string[] }) {
  const { t } = useLocale();
  return <div className="source-links" aria-label={t('sources')}>
    {ids.map(id => {
      const item = publicationById.get(id);
      return item && <Link key={id} className="source-link" to={'/biblioteca/' + id}>
        <Icon name="book" size={16}/><span>{item.authors[0]} {item.year}</span>
      </Link>;
    })}
  </div>;
}
export function OutLink({ href, children }: { href: string; children: ReactNode }) {
  return <a className="source-link" href={href} target="_blank" rel="noreferrer">{children}<Icon name="external" size={15}/></a>;
}
export function PublicLink({ item }: { item: Publication }) {
  const { tr } = useLocale();
  return <OutLink href={item.url}>{tr('Fuente consultada', 'Source reviewed')}</OutLink>;
}
export function SelectField({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  const id = useId();
  return <div className="field"><label htmlFor={id}>{label}</label><select id={id} value={value} onChange={event => onChange(event.target.value)}>{children}</select></div>;
}
export function SearchField({ value, onChange, label, placeholder }: { value: string; onChange: (s: string) => void; label: string; placeholder?: string }) {
  return <label className="field search-field"><span>{label}</span><span className="search-inner"><Icon name="search" size={19}/>
    <input type="search" value={value} placeholder={placeholder} onChange={event => onChange(event.target.value)}/></span></label>;
}
export function Empty() {
  const { tr } = useLocale();
  return <div className="empty"><strong>{tr('Sin coincidencias', 'No matches')}</strong><p>{tr('Prueba con otra búsqueda o ajusta los filtros.', 'Try another search or adjust the filters.')}</p></div>;
}
export function Figure({ title, description, children, className }: { title: string; description: string; children: ReactNode; className?: string }) {
  const id = useId();
  return <figure className={className} aria-labelledby={id}>
    {children}
    <figcaption id={id}><strong>{title}</strong> · {description}</figcaption>
  </figure>;
}
