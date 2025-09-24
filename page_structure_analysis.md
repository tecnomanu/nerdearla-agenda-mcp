# Análisis de Estructura - Nerdearla Agenda

## Elementos Clave Identificados

### Contenedor Principal de Agenda

-   `.agenda-container` - Contenedor principal de toda la agenda
-   `.schedule-section` - Secciones por día/horario

### Elementos de Charlas

-   `.talk-card` - Tarjetas individuales de charlas
-   `.session-item` - Items de sesión
-   `.event-item` - Items de eventos

### Información de Timing

-   `.time-slot` - Slots de tiempo
-   `.schedule-time` - Horarios específicos
-   `[data-start-time]` - Atributo con hora de inicio
-   `[data-end-time]` - Atributo con hora de fin

### Tags y Categorías

-   `.tag` - Tags de categorización
-   `.topic-tag` - Tags específicos de temas
-   `.track` - Tracks/pistas de contenido
-   `[data-track]` - Atributo de track
-   `[data-tags]` - Atributo con tags

### Información de Charlas

-   `.talk-title` - Títulos de charlas
-   `.speaker-name` - Nombres de speakers
-   `.talk-description` - Descripciones
-   `.talk-duration` - Duración
-   `.talk-room` - Sala/ubicación

### Estados y Filtros

-   `.past` - Charlas pasadas
-   `.upcoming` - Charlas próximas
-   `.live` - Charlas en vivo
-   `[data-status]` - Estado de la charla

### Filtros Disponibles

-   `[data-topic]` - Filtro por tema
-   `[data-difficulty]` - Filtro por dificultad
-   `[data-language]` - Filtro por idioma

## Estructura JSON Esperada

```json
{
	"talks": [
		{
			"id": "string",
			"title": "string",
			"speakers": ["string"],
			"startTime": "ISO8601",
			"endTime": "ISO8601",
			"duration": "number",
			"room": "string",
			"track": "string",
			"tags": ["string"],
			"description": "string",
			"status": "upcoming|live|past"
		}
	]
}
```
