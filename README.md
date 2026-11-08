# BioEngineering Atlas | Atlas de Ingeniería Biológica

Atlas científico independiente y bilingüe sobre la investigación de Agustino Martínez-Antonio y sus colaboradores. El MVP explora la regulación bacteriana, la biología de sistemas, la ingeniería metabólica y sus conexiones con bioprocesos, plantas, biomateriales y diagnóstico molecular.

## Desarrollo local

Se necesita Node.js 24 y npm. Ejecuta estos comandos en la carpeta que contiene `package.json`.

```sh
npm ci
npm run dev
```

Abre la dirección que imprime Vite. Para comprobar la versión de producción, genera `dist/` y sirve esa carpeta con Vite.

```sh
npm run build
npm run preview
```

La aplicación usa React, TypeScript, Vite, Tailwind CSS, React Router e i18next. Los diagramas están hechos en SVG y el sitio funciona como una aplicación estática. La navegación y el contenido compilado funcionan sin una cuenta ni una API de aplicación.

## Recorridos

| Ruta | Contenido |
| --- | --- |
| `/` | Presentación del atlas y del investigador |
| `/laboratorio` | Célula, redes y recorridos experimentales |
| `/atlas` | Organismos, genes, proteínas, metabolitos y visualizaciones |
| `/biblioteca` | Búsqueda, filtros, exportaciones y fichas enlazadas a publicaciones |
| `/biblioteca/:id` | Pregunta, métodos, resultado, límites y atribución de un estudio |
| `/cronologia` | Evolución temática con fuentes |
| `/evidencia` | Registro de afirmaciones y evidencias |
| `/colaboraciones` | Coautorías de la selección bibliográfica |
| `/mapa` | Mapa interactivo de publicaciones, temas y entidades |
| `/metodologia` | Criterios editoriales y límites de cobertura |

El selector ES / EN mantiene la ruta y guarda el idioma elegido en el navegador. Los tres niveles educativos permiten recorrer los materiales con distinta profundidad.

## Archivos del proyecto

- `src/` contiene la interfaz, las rutas, los recorridos y las exportaciones.
- `content/` contiene los registros de publicaciones, las fichas moleculares y el contenido de los diagramas en español e inglés.
- `research/` documenta la revisión de las fuentes, las atribuciones y los pendientes.
- `scripts/` contiene la importación bibliográfica y las consultas de mantenimiento.
- `tests/` contiene las comprobaciones de software y contenido.
- `public/` y `netlify.toml` contienen los recursos estáticos y la configuración del sitio publicado.

Consulta la [metodología científica](SCIENTIFIC_METHODOLOGY.md), el [índice de referencias](REFERENCES.md), el [manual de contribución](CONTRIBUTING.md), el [historial de versiones](CHANGELOG.md) y los [pendientes científicos](research/pending-verification.md).

## Pruebas y mantenimiento

```sh
npm test
npx playwright install chromium
npm run build
npm run test:e2e
```

Playwright usa un navegador local. La instalación del navegador se realiza una vez por entorno. La auditoría bibliográfica consulta Crossref y verifica enlaces. Su reporte de trabajo se guarda en `research/generated/`.

```sh
npm run bibliography:audit
```

El flujo de GitHub Actions ejecuta esta auditoría mensualmente y bajo demanda. Publica el reporte de candidatos como artefacto de la ejecución. El catálogo cambia mediante revisión editorial y actualización de los archivos fuente. Se puede configurar la variable opcional `CROSSREF_MAILTO` con un correo de contacto para las consultas de metadatos.

## Importación de Google Scholar

Cuando esté disponible el archivo original, ejecuta el importador con su ruta. El modo local analiza y agrupa registros. El modo con Crossref añade depósitos o candidatos para verificación.

```sh
npm run scholar:import -- "ruta/al/listado.txt"
npm run scholar:import -- "ruta/al/listado.txt" --crossref --limit 50
```

Por defecto, el importador conserva el original y genera JSON, CSV, BibTeX, RIS y un informe de incidencias en `research/scholar-import/`. Usa `--out` para trabajar con otro listado y conservar el anterior. Los resultados de importación requieren revisión antes de promoverlos al catálogo. Consulta la [guía de importación y auditoría](research/import-method.md).

## Publicación en GitHub y Netlify

1. Crea un repositorio público en la cuenta u organización que administrará el atlas. Si vas a subir esta carpeta completa, crea el repositorio vacío. Usa la rama principal para el código revisado. [Guía de GitHub](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository)
2. Desde esta carpeta, sube el código al repositorio vacío. Sustituye `CUENTA` por el propietario del repositorio y usa el nombre que hayas elegido.

   ```sh
   git init -b main
   git add .
   git status --short
   git commit -m "BioEngineering Atlas v0.1.0"
   git remote add origin https://github.com/CUENTA/bioengineering-atlas.git
   git push -u origin main
   ```

3. En Netlify, importa el proyecto desde ese repositorio y autoriza su acceso. Si esta carpeta es la raíz del repositorio, deja vacío el directorio base. Si el repositorio contiene una carpeta superior, configura `bioengineering-atlas` como base. [Guía de Netlify para Vite](https://docs.netlify.com/build/frameworks/framework-setup-guides/vite/)
4. Comprueba que Netlify lea `netlify.toml`. La versión configurada de Node es `24`, el comando es `npm run build` y el directorio publicado es `dist`. La regla de redirección permite abrir rutas internas directamente.
5. Después de desplegar, abre la portada y una ficha de `/biblioteca/` por su URL directa. Comprueba el selector de idioma y registra el enlace público junto con la revisión de código desplegada.
6. Una vez aprobada la publicación, etiqueta el código correspondiente con `v0.1.0` y publica las notas del historial.

## English overview

BioEngineering Atlas is an independent bilingual research explorer. Use Node.js 24 and run `npm ci` followed by `npm run dev` from this directory. `npm run build` produces the static app in `dist/`, and `npm run preview` serves it locally. GitHub Actions is configured for bibliography review, and `netlify.toml` configures the production build and direct URLs for client routes. The [methodology](SCIENTIFIC_METHODOLOGY.md), [references](REFERENCES.md), and [contribution guide](CONTRIBUTING.md) document the editorial workflow.

El código y la documentación original se distribuyen bajo la [licencia MIT](LICENSE). Las publicaciones, figuras, marcas y bases enlazadas conservan sus propios derechos.

## Repositorio y verificación

El repositorio preparado para esta entrega está en [GitHub](https://github.com/Gaolzo/bioengineering-atlas). Consulta el [informe de pruebas](docs/TEST_REPORT.md) para conocer la cobertura técnica y los límites de las comprobaciones.
