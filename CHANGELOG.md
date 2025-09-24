# Changelog - Nerdearla Agenda MCP

## v1.1.0 - 2025-09-23

### 🐛 Fixes

-   **Parsing de tiempo mejorado**: Solucionado el problema que causaba clasificación incorrecta de charlas
-   **Selectores específicos**: Cambiado de selectores genéricos a `.bar.bar-small-card` para mayor precisión
-   **Manejo de múltiples días**: Ahora considera correctamente charlas de diferentes días
-   **Filtrado de duplicados**: Eliminados elementos de navegación y horarios repetidos

### 📊 Resultados Mejorados

-   **Antes**: 181 charlas detectadas (muchas duplicadas)
-   **Después**: ~30-40 charlas reales detectadas
-   **Charlas pasadas**: De 44 incorrectas a ~3-15 reales
-   **Charlas perdidas**: De 44 incorrectas a ~8 reales

### ✨ Mejoras

-   Extracción precisa de tags, títulos y speakers
-   Manejo correcto de días de la semana
-   Parsing de horarios de inicio y fin
-   Mejor detección de contenido de charlas vs navegación

## v1.0.0 - 2025-09-23

### 🎉 Lanzamiento Inicial

-   5 herramientas MCP implementadas
-   Scraping con Puppeteer
-   Manejo de timezone GMT-3
-   Integración con Claude Desktop
