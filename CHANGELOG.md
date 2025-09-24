# Changelog - Nerdearla Agenda MCP

## v1.2.0 - 2025-09-24

### 🚀 Sistema de Cache Inteligente

#### **Nuevas Funcionalidades:**

-   ✅ **Cache automático al arrancar**: El servidor hace scraping completo automáticamente al inicializarse
-   ✅ **Cache de 24 horas**: Duración extendida de 5 minutos a 24 horas para máximo rendimiento
-   ✅ **Respuestas instantáneas**: Todas las consultas responden en <100ms después del cache inicial
-   ✅ **Nueva herramienta**: `get_cache_info` para monitorear el estado del sistema de cache

#### **Mejoras de Performance:**

-   **Primera consulta**: Ya no existe "consulta lenta inicial" - todo es instantáneo desde el arranque
-   **Inicialización asíncrona**: No bloquea el arranque del servidor
-   **Fallback inteligente**: Si falla el scraping, usa cache anterior disponible
-   **Renovación automática**: Después de 24h, se actualiza automáticamente en la siguiente consulta

#### **Logs Mejorados:**

```bash
[agenda-service] 🚀 Initializing MCP Server - Starting initial cache...
[agenda-service] ✅ Initial cache ready! Scraped 45 talks in 8500ms
[agenda-service] ⚡ MCP Server ready - All queries will be INSTANT for 24 hours!
```

### 🐳 Docker y pnpm

#### **Package Manager:**

-   ✅ **Migración a pnpm**: Package manager oficial del proyecto
-   ✅ **Dockerfile optimizado**: Usa `pnpm install --prod` para instalación más eficiente
-   ✅ **Scripts actualizados**: Todos los comandos usan pnpm

#### **Docker Mejorado:**

-   ✅ **pnpm-lock.yaml**: Incluido en imagen Docker para builds determinísticos
-   ✅ **Store cleanup**: `pnpm store prune` para optimizar tamaño de imagen
-   ✅ **Memoria asignada**: Configurado con 1GB para Puppeteer

### 🛠️ Herramientas y Funcionalidades

#### **Nueva Herramienta:**

-   **get_cache_info**: Información detallada del sistema de cache
    -   Estado actual (válido/expirado/inicializando)
    -   Número de charlas cacheadas
    -   Tiempo restante de validez
    -   Próxima renovación programada

#### **URLs en Charlas:**

-   ✅ **Extracción de URLs**: Agregadas URLs de charlas cuando están disponibles
-   ✅ **Links absolutos**: Conversión correcta de enlaces relativos a absolutos
-   ✅ **Todas las herramientas**: URLs incluidas en `get_upcoming_talks`, `get_past_talks`, `get_next_talk`, `get_missed_talks`

#### **Easter Egg Mejorado:**

-   ✅ **get_best_talk_recommendation**: Recomendación especial con formato enriquecido
-   ✅ **Contenido personalizado**: "Con los genios de Carlos y Manu" incluido
-   ✅ **Formato profesional**: Respuesta estructurada con ratings y takeaways

### 🔧 Mejoras Técnicas

#### **Timeouts Optimizados:**

-   **Navegación**: Reducido de 60s a 30s
-   **Selectors**: Optimizado de 15s a 10s
-   **Logs informativos**: Progreso detallado del scraping

#### **Error Handling:**

-   ✅ **Manejo robusto**: Fallback a cache anterior en caso de errores
-   ✅ **Logs estructurados**: Diferenciación clara entre inicialización y refresh
-   ✅ **Thread safety**: Manejo correcto de consultas concurrentes

#### **Autenticación Bearer:**

-   ✅ **Múltiples formatos**: Soporte para `Authorization: Bearer`, `bearer:`, `Authorization:` directo
-   ✅ **Logs de debug**: Información detallada del proceso de autenticación
-   ✅ **Compatibilidad n8n**: Soporte específico para headers de n8n

### 📚 Documentación

#### **README Actualizado:**

-   ✅ **Sección de cache**: Explicación completa del sistema de cache inteligente
-   ✅ **Badges profesionales**: MCP, versión, Node.js, TypeScript, licencia
-   ✅ **Banner de la charla**: Imagen visual del proyecto
-   ✅ **Información de speakers**: Créditos completos para Manuel Bruña y Carlos Pereyra

#### **Guías Técnicas:**

-   ✅ **DOCKER_GUIDE.md**: Guía completa de Docker con ejemplos
-   ✅ **AUTHENTICATION_GUIDE.md**: Documentación de autenticación Bearer
-   ✅ **MCP_BEST_PRACTICES_GUIDE.md**: Template para futuros proyectos MCP

### 🎪 Para la Charla de Nerdearla

#### **Demo Ready:**

-   **Arranque instantáneo**: Cache listo al iniciar el servidor
-   **Respuestas inmediatas**: Todas las herramientas responden <100ms
-   **Logs informativos**: Muestra claramente el proceso de cache
-   **Docker optimizado**: Listo para demos en vivo

#### **Integración n8n:**

-   **Headers flexibles**: Soporte completo para autenticación de n8n
-   **Docker Compose**: Configuración lista para integración
-   **Documentación completa**: Ejemplos de uso con n8n

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
