# Importación y revisión bibliográfica

Ejecuta los comandos desde la carpeta del proyecto con un listado guardado como texto UTF-8. El importador admite filas separadas por tabulaciones y bloques con título, autores y publicación en líneas separadas. También acepta campos etiquetados como `Año:`, `DOI:` y `Tipo:`.

```sh
npm run scholar:import -- "ruta/al/listado.txt"
npm run scholar:import -- "ruta/al/listado.txt" --crossref --limit 50
```

La salida predeterminada es `research/scholar-import/`. Contiene una copia intacta del archivo en `original.txt`, la bibliografía en JSON, CSV, BibTeX y RIS, y `review-report.json` con la huella SHA-256, los conteos y las incidencias. Para importar un archivo distinto, indica otra carpeta con `--out`. Si vuelves a ejecutar la importación con el mismo original, se actualizan los archivos derivados de esa carpeta. Git excluye el directorio predeterminado.

El importador agrupa coincidencias por DOI o, si falta el identificador, por coincidencia de título, autores completos, año y publicación. Conserva las variantes con sus líneas de origen. Los títulos coincidentes de entradas separadas se marcan como posibles versiones o trabajos relacionados. Las entradas incompletas conservan sus campos disponibles y las incidencias quedan en el informe.

Con `--crossref`, el DOI permite consultar el depósito exacto. Cuando falta el DOI, se buscan hasta cinco candidatos por título. `--limit` limita los registros consultados en línea, con un valor predeterminado de 100 y un rango de 1 a 500. Los fallos de consulta quedan registrados. Un HTTP 429 detiene el enriquecimiento y permite guardar los resultados ya obtenidos. La importación local funciona sin conexión. Tanto los registros como los candidatos de Crossref quedan pendientes de revisión editorial antes de incorporarlos a `content/`.

Para revisar el catálogo existente, ejecuta la auditoría bibliográfica. Busca publicaciones candidatas, contrasta metadatos y avisos editoriales, y comprueba los enlaces HTTPS. El informe predeterminado se guarda en `research/generated/bibliography-update.json`, en otro directorio excluido de Git.

```sh
npm run bibliography:audit
npm run bibliography:audit -- --since 2024-01-01 --max-records 20 --out research/generated/revision-parcial.json
```

Sin `--since`, la búsqueda de candidatos abarca los últimos dos años. `--max-records` limita las fichas del catálogo que se comprueban. Los enlaces con restricciones y las posibles correcciones o versiones requieren revisión manual. El archivo `Texto pegado(2).txt` sigue pendiente de importación. Consulta el [registro de pendientes](pending-verification.md) y el [informe de enlaces](../docs/LINK_CHECK.md).
