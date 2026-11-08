# Informe de pruebas de BioEngineering Atlas v0.1.0

Comprobaciones realizadas el 8 de noviembre de 2026, hora de Ciudad de México.

| Comprobación | Cobertura |
| --- | --- |
| Compilación de producción | TypeScript y Vite generan `dist/` con los recursos y la redirección de rutas. |
| Pruebas de contenido | 3 pruebas superadas. DOI e identificadores únicos, tipos de publicación, textos bilingües, referencias de fichas y diagramas, exportación y registro de evidencia. |
| Importación y auditoría | 9 pruebas superadas. Se usaron datos de prueba para verificar formatos, duplicados, preservación del original, estados de revisión y manejo de errores. |
| Pruebas en navegador | 16 casos comprobados en la pasada general y la repetición focalizada. Escritorio y móvil. Rutas, cambios de idioma, condiciones de la red, filtros, exportaciones, enlaces, catálogo, coautorías y mapa de investigaciones. |
| Accesibilidad | Análisis automático con axe en vistas representativas y etiquetas WCAG hasta 2.2 AA. La cobertura automatizada es parcial. |
| Dependencias | `npm audit` reportó cero vulnerabilidades tras actualizar Vite a 8.3.6. |
| Fuentes externas | [Informe de enlaces y metadatos](LINK_CHECK.md). |

La revisión de contenido se realizó con asistencia de IA. Consulta los [pendientes científicos](../research/pending-verification.md) para conocer el alcance editorial.
