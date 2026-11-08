# Contribuir al atlas / Contributing

## Agregar una publicación

1. Confirma título, fecha, autoría, afiliación y tipo en la fuente editorial, el DOI o un registro bibliográfico autorizado. Registra las versiones relacionadas y revisa si existen avisos editoriales.
2. Añade una ficha con identificador estable en `content/historical.json` o `content/recent.json`. Sigue los campos de `Publication` en `src/content.ts`. Usa un DOI sin prefijo URL cuando exista y añade el enlace directo a la fuente.
3. Escribe objetivo, método, resultado y límite en los pares `es` y `en`. Conserva el título editorial y la nomenclatura científica. Añade la fecha de consulta, las unidades originales y los roles de autoría corroborados.
4. Indica los temas, organismos, genes, metabolitos y técnicas que la fuente realmente trata. Asigna evidencia y atribución con la [metodología](SCIENTIFIC_METHODOLOGY.md). Comprueba la coherencia con las fichas y los diagramas que enlazan el estudio.
5. Actualiza el [índice bibliográfico](REFERENCES.md) y la nota de auditoría correspondiente. Si faltan datos, registra el caso en [pendientes](research/pending-verification.md).

## Ampliar el atlas

- Añade fichas a `content/entities.json` con identificadores de publicaciones y conexiones entre entidades. Si el nombre común se traduce, usa el par de idiomas disponible en la ficha.
- Añade diagramas a `content/diagrams.json` con título, texto explicativo, pasos, referencias y limitación en ambos idiomas. Distingue una secuencia temporal de una comparación o una relación regulatoria.
- Los SVG deben tener una descripción accesible. Verifica contraste, lectura móvil, navegación por teclado y alternativas textuales para los elementos interactivos.
- Conserva nombres científicos, símbolos génicos y unidades. Traduce la interfaz y los textos didácticos en ambos idiomas. Revisa que cambiar de idioma mantenga la ruta y la interacción seleccionada.

## Revisar un cambio

Ejecuta `npm test`, `npm run test:e2e` y `npm run build`. Resume los resultados que realmente se ejecutaron. Incluye en la descripción del cambio los DOI o enlaces relevantes, qué se verificó y qué queda pendiente. Una actualización automatizada se propone para revisión. El archivo original de una importación se conserva en el área de trabajo local.

Mantén el [historial de versiones](CHANGELOG.md) con cambios editoriales y técnicos. Usa etiquetas de Git para identificar versiones publicadas. Verifica la licencia antes de incorporar material de terceros. En caso de duda, enlaza a la fuente.

## English checklist

Verify each publication in a primary or authorized source. Add bilingual summaries and limits, stable identifiers, attribution, and evidence. Link entities and original diagrams to publication records. Update the bibliography and research notes. Run and report the local checks before submitting changes. Use the changelog and Git tags for releases.
