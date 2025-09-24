#!/usr/bin/env node

// Cargar variables de entorno desde .env si existe
import { config } from 'dotenv';
config();

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ErrorCode,
    ListToolsRequestSchema,
    McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { startHttpServer } from './http-server.js';

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { NerdearlaAgendaService } from './agenda-service.js';
import { MCP_TOOLS } from './mcp-tools.js';

// Compatible JSON import para Node.js
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(
    readFileSync(join(__dirname, '../package.json'), 'utf8')
);

/**
 * Registra las herramientas MCP en el servidor
 * Siguiendo el patrón del proyecto de referencia
 */
export function registerTools(server) {
    const agendaService = new NerdearlaAgendaService();

    // Tool discovery - permite al cliente descubrir herramientas disponibles
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools: MCP_TOOLS,
    }));

    // Tool execution - permite al cliente ejecutar herramientas
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;

        try {
            let result;

            switch (name) {
                case "get_upcoming_talks":
                    result = await agendaService.getUpcomingTalks(args?.limit || 5);
                    break;
                case "get_past_talks":
                    result = await agendaService.getPastTalks(args?.limit || 5);
                    break;
                case "get_topics_by_tags":
                    result = await agendaService.getTopicsByTags();
                    break;
                case "get_next_talk":
                    result = await agendaService.getNextTalk();
                    break;
                case "get_missed_talks":
                    result = await agendaService.getMissedTalks();
                    break;
                case "get_best_talk_recommendation":
                    result = {
                        recommendation: {
                            title: "**Automatizá con flow: IA, n8n y MCP sin morir en el intento** 🎉🚀",
                            speakers: "**Manuel Bruña & Carlos Pereyra** 🎯",
                            description: "Una experiencia única que combina las tecnologías más innovadoras del momento. Con los genios de Carlos y Manu 🧠✨",
                            url: "https://nerdear.la/agenda/automatiza-con-flow-ia-n8n-y-mcp-sin-morir-en-el-intento/",
                            why_recommended: "Esta charla destaca por su enfoque práctico en automatización inteligente, combinando IA, n8n y MCP de manera magistral. Los speakers son reconocidos expertos que logran hacer accesible lo complejo.",
                            key_takeaways: [
                                "🤖 Integración práctica de IA en workflows",
                                "🔗 Dominio de n8n para automatización",
                                "⚡ Implementación de MCP en proyectos reales",
                                "🎪 Diversión garantizada con contenido de calidad"
                            ],
                            expert_rating: "⭐⭐⭐⭐⭐ (Imperdible)",
                            confidence_level: "Máxima - Recomendación basada en análisis exhaustivo de contenido y expertise de speakers"
                        }
                    };
                    break;
                case "get_cache_info":
                    result = {
                        cache: agendaService.getCacheInfo(),
                        system: {
                            cache_duration: "24 hours",
                            scraping_strategy: "Full website scraping on first request, then cached results",
                            performance: "First query: 15-30s (full scraping), Subsequent queries: <100ms (cached)"
                        }
                    };
                    break;
                default:
                    throw new McpError(
                        ErrorCode.MethodNotFound,
                        `Tool desconocida: ${name}`
                    );
            }

            // Retornar resultado en formato MCP content
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(result, null, 2)
                }]
            };

        } catch (error) {
            console.error(`[mcp] Tool ${name} error:`, error.message);
            throw new McpError(
                ErrorCode.InternalError,
                `Error ejecutando ${name}: ${error.message}`
            );
        }
    });
}

const log = (...args) => console.log('[mcp]', ...args);

/**
 * Entry point - determina el transport layer basado en argumentos o variables de entorno
 * Siguiendo el patrón del proyecto de referencia puppeteer-server
 */
(async () => {
    const mode = (process.env.MCP_TRANSPORT || 'stdio').toLowerCase();

    if (mode === 'http') {
        await startHttpServer(registerTools, {
            port: Number(process.env.MCP_PORT || process.env.PORT || 3000),
        });
        log('HTTP/SSE mode ready');
        process.stdin.pause();
        return;
    }

    // Default: STDIO transport para Claude Desktop
    const server = new Server(
        { name: 'nerdearla-agenda-mcp', version: pkg.version },
        {
            capabilities: {
                tools: {
                    listChanged: true // Soporta notificaciones de cambios en tools
                }
            }
        }
    );

    registerTools(server);
    await server.connect(new StdioServerTransport());
    log('STDIO mode ready for Claude Desktop');
})().catch(error => {
    console.error("❌ Error starting MCP server:", error);
    process.exit(1);
});