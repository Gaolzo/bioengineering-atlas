import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, NavLink, Route, Routes, useLocation } from 'react-router';
import { changeLanguage, useLevel, useLocale } from './locale';
import { Icon, Mark, PageIntro, SelectField } from './ui';
import { Home } from './Home';
import { Library, PublicationDetail, EvidencePage } from './Library';
import { Atlas, Timeline, Collaborations, Methodology } from './Atlas';
import { Lab } from './Lab';
import { KnowledgeMap } from './KnowledgeMap';
import './styles.css';

const nav = [
  ['home', '/'], ['labs', '/laboratorio'], ['atlas', '/atlas'],
  ['library', '/biblioteca'], ['timeline', '/cronologia'],
] as const;
function Shell() {
  const { lang, t, tr } = useLocale();
  const [level, setLevel] = useLevel();
  const [expanded, setExpanded] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => {
    if (!window.location.hash) window.scrollTo(0, 0);
    setExpanded(false);
  }, [pathname]);
  return <>
    <a href="#main" className="skip">{t('skip')}</a>
    <header className="site-header">
      <div className="shell header-inner">
        <Link to="/" className="brand"><Mark/><span><strong>BioEngineering Atlas</strong><small>{tr('ATLAS DE INGENIERÍA BIOLÓGICA', 'BIOLOGICAL ENGINEERING ATLAS')}</small></span></Link>
        <button type="button" className="menu-toggle" aria-expanded={expanded} aria-controls="primary-nav" onClick={() => setExpanded(!expanded)}><Icon name={expanded ? 'close' : 'menu'}/>{t('menu')}</button>
        <nav id="primary-nav" className={expanded ? 'nav open' : 'nav'} aria-label={tr('Navegación principal', 'Main navigation')}>
          {nav.map(([key, path]) => <NavLink key={key} to={path} end={path === '/'}>{t(key)}</NavLink>)}
        </nav>
        <div className="header-controls">
          <Link className="icon-btn" to="/biblioteca" aria-label={tr('Buscar publicaciones', 'Search publications')}><Icon name="search" size={19}/></Link>
          <div className="language" role="group" aria-label={t('language')}>
            <button lang="es" type="button" aria-label="ES · Español" aria-pressed={lang === 'es'} onClick={() => changeLanguage('es')}>ES</button>
            <button lang="en" type="button" aria-label="EN · English" aria-pressed={lang === 'en'} onClick={() => changeLanguage('en')}>EN</button>
          </div>
        </div>
      </div>
    </header>
    <div className="toolbar"><div className="shell toolbar-inner">
      <span><span className="status-dot"/> {tr('BIOLOGÍA DE SISTEMAS · CIENCIA ABIERTA', 'SYSTEMS BIOLOGY · OPEN SCIENCE')}</span>
      <SelectField label={t('level')} value={level} onChange={value => setLevel(value as typeof level)}>{(['general', 'university', 'research'] as const).map(value => <option key={value} value={value}>{t(value)}</option>)}</SelectField>
    </div></div>
    <main id="main" className="shell" tabIndex={-1}>
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/laboratorio" element={<Lab level={level}/>}/>
        <Route path="/atlas" element={<Atlas/>}/>
        <Route path="/biblioteca" element={<Library/>}/>
        <Route path="/biblioteca/:id" element={<PublicationDetail level={level}/>}/>
        <Route path="/cronologia" element={<Timeline/>}/>
        <Route path="/colaboraciones" element={<Collaborations/>}/>
        <Route path="/mapa" element={<KnowledgeMap/>}/>
        <Route path="/evidencia" element={<EvidencePage/>}/>
        <Route path="/metodologia" element={<Methodology/>}/>
        <Route path="*" element={<PageIntro index="404" label="ATLAS" title={tr('Página no encontrada', 'Page not found')} description={tr('El menú principal enlaza a todas las secciones disponibles.', 'The main menu links to every available section.')}/>}/>
      </Routes>
    </main>
    <footer className="site-footer"><div className="shell">
      <div className="footer-top"><Link to="/" className="brand"><Mark/><span><strong>BioEngineering Atlas</strong><small>{t('independent')}</small></span></Link>
        <nav aria-label={tr('Enlaces del pie de página', 'Footer links')}>{(['collaborations', 'evidence', 'methodology'] as const).map((key, i) => <Link key={key} to={['/colaboraciones', '/evidencia', '/metodologia'][i]}>{t(key)}</Link>)}</nav></div>
      <div className="footer-bottom"><span>{t('checked')}</span><span>v0.1.0 · ES / EN</span></div>
    </div></footer>
  </>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><BrowserRouter><Shell/></BrowserRouter></StrictMode>);
