import { Link } from 'react-router';
import { diagrams, profile, publications, topicLabel } from './content';
import { useLocale } from './locale';
import { Icon, OutLink, type IconName } from './ui';

function CellIllustration() {
  const { tr } = useLocale();
  return <svg className="hero-cell" role="img" aria-label={tr('Célula bacteriana esquemática con una red de regulación', 'Schematic bacterial cell with a regulatory network')} viewBox="0 0 680 360">
    <defs>
      <pattern id="cell-grid" width="27" height="27" patternUnits="userSpaceOnUse"><path d="M 27 0 H0 V27" stroke="#7eacac" strokeOpacity=".13" fill="none"/></pattern>
      <pattern id="cell-dots" width="11" height="11" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="#b7ed80" opacity=".27"/></pattern>
      <linearGradient id="cell-fill" x1="0%" y1="0%" x2="100%" y2="100%"><stop stopColor="#2f6557"/><stop offset="1" stopColor="#172e30"/></linearGradient>
      <radialGradient id="cell-glow"><stop stopColor="#8ade91" stopOpacity=".18"/><stop offset="1" stopColor="#8ade91" stopOpacity="0"/></radialGradient>
      <marker id="hero-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="m1 1 7 4-7 4" fill="none" stroke="#c6ec88" strokeWidth="1.5"/></marker>
    </defs>
    <rect width="680" height="360" fill="url(#cell-grid)"/>
    <ellipse cx="362" cy="184" rx="293" ry="168" fill="url(#cell-glow)"/>
    <g fill="none" stroke="#77b199" opacity=".53" strokeWidth="1">
      <circle cx="351" cy="185" r="131" strokeDasharray="2 5"/><circle cx="351" cy="185" r="161" strokeDasharray="2 5"/>
      <path d="M61 295h16m-8-8v16m527-232h16m-8-8v16M90 96h16m-8-8v16m490 183h16m-8-8v16M351 18v36m0 263v24"/>
    </g>
    <g transform="rotate(-20 351 184)">
      <path d="M514 155c62-12 57 85 102 74 27-7 4-35 34-49M515 171c53-11 57 86 106 69 35-13 8-40 36-47" stroke="#8cc6a1" strokeWidth="1.5" opacity=".53" fill="none"/>
      <rect x="154" y="99" width="394" height="170" rx="85" fill="url(#cell-fill)" stroke="#7aaf92" strokeWidth="2"/>
      <rect x="162" y="107" width="378" height="154" rx="77" fill="url(#cell-dots)" stroke="#c6ee9c" strokeOpacity=".8"/>
      <rect x="175" y="120" width="352" height="128" rx="64" fill="none" stroke="#8ecb9d" strokeOpacity=".55" strokeDasharray="4 5"/>
      <path d="M198 191c18-51 57-48 84-18s52 38 77-2 60-53 91-16 39 38 58 24M197 182c17-31 53-41 75-11s59 50 90 8 60-50 86-16 41 30 61 11" stroke="#9fd5af" strokeOpacity=".37" fill="none"/>
      <g fill="none" stroke="#c6ec88" strokeWidth="1.6">
        <path d="M264 155h57l40 43h70" markerEnd="url(#hero-arrow)"/>
        <path d="M264 155l28 54h55l32-65h53" markerEnd="url(#hero-arrow)"/>
        <path d="M361 198l19-54" strokeDasharray="3 4"/>
      </g>
      <g stroke="#142b2b" strokeWidth="3"><circle cx="264" cy="155" r="9" fill="#c7ec88"/><circle cx="321" cy="155" r="6" fill="#78c7ad"/>
        <circle cx="292" cy="209" r="7" fill="#80cbb1"/><circle cx="361" cy="198" r="8" fill="#c7ec88"/><circle cx="380" cy="144" r="9" fill="#c7ec88"/>
        <circle cx="435" cy="144" r="8" fill="#e9b083"/><circle cx="435" cy="198" r="8" fill="#7dccae"/></g>
    </g>
    <g fontSize="11" fontFamily="ui-monospace, monospace" letterSpacing="1.3" fill="#c4e8ce" stroke="none">
      <text x="73" y="73">{tr('01 / SEÑAL', '01 / SIGNAL')}</text>
      <text x="479" y="69">{tr('02 / REGULACIÓN', '02 / REGULATION')}</text>
      <text x="446" y="312">{tr('03 / RESPUESTA', '03 / RESPONSE')}</text>
    </g>
    <g fill="none" stroke="#8ac2a4" strokeWidth="1">
      <path d="M76 84h81l57 62m267-65h-54l-36 34m62 181h-52l-39-70"/>
    </g>
  </svg>;
}
export function Home() {
  const { tr, l } = useLocale();
  const researcherPubs = publications.filter(p => p.attribution !== 'context');
  const cards: { path: string; index: string; icon: IconName; title: string; desc: string; color: string }[] = [
    { path: '/laboratorio', index: '01', icon: 'lab', color: 'green', title: tr('Laboratorio interactivo', 'Interactive lab'), desc: tr('Explora la regulación de genes, compara condiciones y sigue rutas desde el sustrato hasta el producto.', 'Explore gene regulation, compare conditions and follow routes from substrate to product.') },
    { path: '/atlas', index: '02', icon: 'atlas', color: 'mint', title: tr('Atlas molecular', 'Molecular atlas'), desc: tr('Conecta organismos, genes, proteínas y metabolitos con los estudios en los que aparecen.', 'Connect organisms, genes, proteins and metabolites to the studies in which they appear.') },
    { path: '/biblioteca', index: '03', icon: 'book', color: 'sand', title: tr('Biblioteca científica', 'Research library'), desc: tr('Filtra publicaciones por tema, método o evidencia y consulta los resultados en su contexto.', 'Filter publications by topic, method or evidence and read the findings in context.') },
  ];
  return <>
    <section className="hero">
      <div className="hero-copy">
        <p className="kicker"><span className="status-dot"/> {tr('ATLAS CIENTÍFICO INTERACTIVO', 'INTERACTIVE SCIENCE ATLAS')}</p>
        <h1>{tr('Atlas de Ingeniería', 'BioEngineering')}<br/><em>{tr('Biológica', 'Atlas')}</em></h1>
        <p>{tr('Explora cómo se regulan los genes, cómo se diseñan circuitos y cómo se transforma el metabolismo a través de la investigación de Agustino Martínez-Antonio y sus colaboradores.', 'Explore how genes are regulated, how circuits are designed and how metabolism is engineered through the research of Agustino Martínez-Antonio and collaborators.')}</p>
        <div className="actions"><Link to="/laboratorio" className="btn primary"><Icon name="lab" size={18}/>{tr('Explorar el laboratorio', 'Explore the lab')}<Icon name="arrow" size={18}/></Link>
          <Link to="/biblioteca" className="btn outline-dark">{tr('Ver publicaciones', 'Browse publications')}</Link></div>
      </div>
      <div className="hero-visual">
        <span className="hero-fig-label">{tr('FIG. 01 / CÉLULA BACTERIANA', 'FIG. 01 / BACTERIAL CELL')}</span>
        <CellIllustration/>
        <span className="hero-fig-note">{tr('Ilustración conceptual', 'Conceptual illustration')}</span>
      </div>
    </section>
    <div className="stat-band" aria-label={tr('Contenido del atlas', 'Atlas contents')}>
      <div><strong>{researcherPubs.length}</strong><span>{tr('Registros del investigador', 'Researcher records')}</span></div>
      <div><strong>12</strong><span>{tr('Líneas temáticas', 'Research topics')}</span></div>
      <div><strong>{diagrams.length + 3}</strong><span>{tr('Visualizaciones', 'Visualizations')}</span></div>
      <div><strong>2</strong><span>{tr('Idiomas', 'Languages')}</span></div>
    </div>
    <section className="home-section">
      <p className="kicker"><span className="status-dot"/> {tr('EXPLORA EL ATLAS', 'EXPLORE THE ATLAS')}</p>
      <div className="section-heading"><h2>{tr('Tres puertas de entrada', 'Three ways to explore')}</h2><p>{tr('Del mecanismo a la publicación original.', 'From the mechanism to the original study.')}</p></div>
      <div className="card-grid">
        {cards.map(card => <Link className="entry-card" to={card.path} key={card.path}>
          <div className="card-top"><span className={'icon-square ' + card.color}><Icon name={card.icon}/></span><span className="kicker muted">{card.index}</span></div>
          <h3>{card.title}</h3><p>{card.desc}</p><span className="card-link">{tr('Explorar', 'Explore')} <Icon name="arrow" size={17}/></span>
        </Link>)}
      </div>
      <div className="actions" style={{ marginTop: 14 }}><Link className="btn secondary" to="/mapa"><Icon name="network" size={18}/>{tr('Abrir el mapa de investigaciones', 'Open the research map')}<Icon name="arrow" size={17}/></Link></div>
    </section>
    <section className="home-section feature">
      <div className="feature-copy"><p className="kicker"><span className="status-dot"/> {tr('EL INVESTIGADOR', 'THE RESEARCHER')}</p>
        <h2>Agustino<br/>Martínez-Antonio</h2>
        <p>{tr('La trayectoria documentada conecta estudios de regulación bacteriana en la UNAM con el trabajo en ingeniería biológica en Cinvestav Irapuato. El atlas distingue contribuciones históricas, trabajos del laboratorio y colaboraciones.', 'The documented trajectory connects bacterial regulation studies at UNAM with biological engineering research at Cinvestav Irapuato. The atlas distinguishes historical contributions, laboratory research and collaborations.')}</p>
        <div className="actions"><Link to="/cronologia" className="btn secondary"><Icon name="clock" size={17}/>{tr('Ver trayectoria', 'View timeline')}</Link><OutLink href={profile.source}>{tr('Semblanza institucional', 'Institutional profile')}</OutLink><OutLink href={profile.orcid}>ORCID</OutLink></div>
      </div>
      <div className="feature-studies"><p className="kicker">{tr('SELECCIÓN DEL ATLAS', 'FROM THE ATLAS')}</p>
        {['regulondb-4', 'iaa-avocado-2026', 'mucuna-ldopa-2026'].map(id => {
          const item = publications.find(p => p.id === id);
          return item && <Link key={item.id} className="feature-study" to={'/biblioteca/' + item.id}>
            <span className="year">{item.year}</span><span><strong>{l(topicLabel(item.topics[0]))}</strong><span lang="en">{item.title}</span></span><Icon name="arrow" size={16}/>
          </Link>;
        })}
        <p className="small muted" style={{ marginTop: 12 }}>{tr('Cada ficha indica su tipo de evidencia y las fuentes consultadas.', 'Each record identifies its evidence type and reviewed sources.')}</p>
      </div>
    </section>
  </>;
}
