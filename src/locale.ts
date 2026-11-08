import i18next from 'i18next';
import { useEffect, useState } from 'react';
import { pair, type Language, type Level, type Pair } from './content';

const strings = {
  home: pair('Inicio', 'Home'), labs: pair('Laboratorio', 'Lab'), atlas: pair('Atlas', 'Atlas'),
  library: pair('Biblioteca', 'Library'), timeline: pair('Cronología', 'Timeline'),
  collaborations: pair('Colaboraciones', 'Collaborations'), evidence: pair('Evidencia', 'Evidence'),
  methodology: pair('Metodología', 'Methodology'), search: pair('Buscar', 'Search'),
  level: pair('Nivel de lectura', 'Reading level'), menu: pair('Menú', 'Menu'),
  general: pair('Público general', 'General audience'),
  university: pair('Universitario', 'University'), research: pair('Investigador', 'Researcher'),
  skip: pair('Ir al contenido', 'Skip to content'), language: pair('Idioma', 'Language'),
  clear: pair('Limpiar filtros', 'Clear filters'), all: pair('Todos', 'All'),
  sources: pair('Fuentes', 'Sources'), details: pair('Abrir ficha', 'Open record'),
  limitations: pair('Límites', 'Limitations'), results: pair('Resultados', 'Results'),
  objective: pair('Pregunta y objetivo', 'Question and objective'),
  methods: pair('Métodos', 'Methods'), findings: pair('Hallazgos', 'Findings'),
  independent: pair('Proyecto independiente de divulgación científica', 'Independent science education project'),
  checked: pair('Selección revisada el 8 de noviembre de 2026', 'Selection reviewed November 8, 2026'),
  back: pair('Volver', 'Back'), conceptual: pair('Esquema conceptual', 'Conceptual diagram'),
};

const resources = (lang: Language) => ({
  translation: Object.fromEntries(Object.entries(strings).map(([key, value]) => [key, value[lang]])),
});
function read(key: string) { try { return localStorage.getItem(key); } catch { return null; } }
function persist(key: string, value: string) { try { localStorage.setItem(key, value); } catch { /* Session remains usable. */ } }

const instance = i18next.createInstance();
void instance.init({ lng: read('bioatlas-lang') === 'en' ? 'en' : 'es', fallbackLng: 'es',
  resources: { es: resources('es'), en: resources('en') }, initAsync: false });
document.documentElement.lang = instance.language;
export function useLocale() {
  const [lang, setLang] = useState<Language>(() => instance.language as Language);
  useEffect(() => {
    const handler = (value: string) => setLang(value === 'en' ? 'en' : 'es');
    instance.on('languageChanged', handler);
    return () => { instance.off('languageChanged', handler); };
  }, []);
  return { lang, t: (key: keyof typeof strings) => instance.t(key), l: (value: Pair) => value[lang],
    tr: (es: string, en: string) => lang === 'en' ? en : es };
}
export function changeLanguage(lang: Language) {
  persist('bioatlas-lang', lang);
  document.documentElement.lang = lang;
  void instance.changeLanguage(lang);
}

export function useLevel() {
  const [level, setLevel] = useState<Level>(() => {
    const saved = read('bioatlas-level');
    return saved === 'research' || saved === 'university' ? saved : 'general';
  });
  return [level, (value: Level) => { persist('bioatlas-level', value); setLevel(value); }] as const;
}
