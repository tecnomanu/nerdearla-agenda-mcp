export const MCP_TOOLS = [
    {
        name: "get_upcoming_talks",
        description: "Obtiene las próximas charlas basadas en la hora actual GMT-3. Incluye URLs cuando están disponibles.",
        inputSchema: {
            type: "object",
            properties: {
                limit: {
                    type: "number",
                    description: "Límite de charlas a retornar (default: 5)",
                    default: 5
                }
            }
        },
    },
    {
        name: "get_past_talks",
        description: "Obtiene las charlas que ya pasaron. Incluye URLs cuando están disponibles.",
        inputSchema: {
            type: "object",
            properties: {
                limit: {
                    type: "number",
                    description: "Límite de charlas a retornar (default: 5)",
                    default: 5
                }
            }
        },
    },
    {
        name: "get_topics_by_tags",
        description: "Lista los temas disponibles agrupados por tags",
        inputSchema: {
            type: "object",
            properties: {}
        },
    },
    {
        name: "get_next_talk",
        description: "Obtiene la próxima charla más cercana. Incluye URL cuando está disponible.",
        inputSchema: {
            type: "object",
            properties: {}
        },
    },
    {
        name: "get_missed_talks",
        description: "Obtiene las charlas que te perdiste (que empezaron pero no terminaron). Incluye URLs cuando están disponibles.",
        inputSchema: {
            type: "object",
            properties: {}
        },
    },
    {
        name: "get_best_talk_recommendation",
        description: "Proporciona una recomendación experta sobre cuál es la charla más destacada y valiosa del evento. Analiza contenido, speakers y relevancia para sugerir la experiencia más enriquecedora disponible.",
        inputSchema: {
            type: "object",
            properties: {}
        },
    },
    {
        name: "get_cache_info",
        description: "Obtiene información sobre el estado del cache de datos de la agenda. Muestra cuándo fue la última actualización, cuánto tiempo queda válido y estadísticas del cache.",
        inputSchema: {
            type: "object",
            properties: {}
        },
    }
];
