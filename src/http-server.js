import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express from 'express';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Compatible JSON import para Node.js
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(
    readFileSync(join(__dirname, '../package.json'), 'utf8')
);

export async function startHttpServer(registerTools, opts = {}) {
    const app = express();
    app.use(express.json({ limit: process.env.MCP_BODY_LIMIT ?? '1mb' }));

    // CREAR UN SOLO SERVIDOR MCP (como en puppeteer-server)
    const server = new Server(
        { name: 'nerdearla-agenda-mcp', version: pkg.version },
        { capabilities: { tools: { listChanged: true } } }
    );
    registerTools(server);

    const transports = new Map(); // Map<string, SSEServerTransport>
    const POST_ENDPOINT = '/messages';

    // POST endpoint para mensajes JSON-RPC
    app.post(POST_ENDPOINT, async (req, res) => {
        console.log(`[http] POST ${req.url} - ${req.body?.method || 'unknown'}`);

        if (!isAuthorized(req)) return res.status(401).end();
        if (!isAllowedOrigin(req)) return res.status(403).end();

        const sessionId = String(req.query.sessionId || '');
        if (!sessionId) {
            return res.status(400).json({ error: 'Missing sessionId' });
        }

        const transport = transports.get(sessionId);
        if (!transport) {
            return res.status(400).json({ error: 'Unknown session' });
        }

        try {
            await transport.handlePostMessage(req, res, req.body);
        } catch (e) {
            console.error('[http] Error:', e.message);
            if (!res.headersSent) {
                res.status(500).json({ error: 'handlePostMessage failed' });
            }
        }
    });

    // SSE endpoint para establecer conexión
    app.get('/sse', async (req, res) => {
        console.log(`[http] SSE connection - session: ${req.query.sessionId}`);

        if (!isAuthorized(req)) return res.status(401).end();
        if (!isAllowedOrigin(req)) return res.status(403).end();

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders?.();

        // Workaround para SSE (exactamente como puppeteer-server)
        res.writeHead = () => res;

        const transport = new SSEServerTransport(POST_ENDPOINT, res);
        transports.set(transport.sessionId, transport);

        const keepAlive = setInterval(() => {
            try {
                res.write(':keep-alive\n\n');
            } catch {
                // ignore
            }
        }, 30000);

        const cleanup = () => {
            clearInterval(keepAlive);
            transports.delete(transport.sessionId);
        };

        res.on('close', cleanup);
        res.on('error', cleanup);

        try {
            // CONECTAR EL TRANSPORT AL SERVIDOR EXISTENTE (no crear nuevo servidor)
            await server.connect(transport);
        } catch (e) {
            console.error('[http] Connect error:', e.message);
            try {
                res.end();
            } catch {
                // ignore
            }
            cleanup();
        }
    });

    // Health check endpoint
    app.get('/health', (req, res) => {
        const bearerConfigured = !!process.env.MCP_BEARER;
        res.json({
            ok: true,
            transport: 'http',
            version: pkg.version,
            sessions: transports.size,
            auth: {
                bearer_required: bearerConfigured,
                status: bearerConfigured ? 'protected' : 'open'
            }
        });
    });

    // Información del servidor
    app.get('/', (req, res) => {
        const bearerConfigured = !!process.env.MCP_BEARER;
        res.json({
            name: 'Nerdearla Agenda MCP Server',
            version: pkg.version,
            description: 'MCP Server para consultar la agenda de Nerdearla',
            transport: 'HTTP/SSE',
            endpoints: {
                sse: '/sse',
                messages: POST_ENDPOINT,
                health: '/health'
            },
            tools: 7,
            sessions: transports.size,
            security: {
                bearer_required: bearerConfigured,
                status: bearerConfigured ? 'protected' : 'open',
                message: bearerConfigured ?
                    'Bearer token required in Authorization header' :
                    'No authentication required'
            }
        });
    });

    // Endpoint /mcp para compatibilidad (como puppeteer-server)
    app.post('/mcp', (req, res) => {
        res.status(501).json({ error: 'Not implemented' });
    });

    const port = Number(opts?.port ?? process.env.MCP_PORT ?? process.env.PORT ?? 3000);
    app.listen(port, () => {
        console.log(`[http] Server ready on http://localhost:${port}`);
    });

    function isAuthorized(req) {
        const expected = process.env.MCP_BEARER;

        if (!expected) {
            return true;
        }

        // Buscar token en diferentes headers (n8n y otros sistemas usan diferentes formatos)
        let token = '';
        let headerSource = '';

        // Opción 1: Header Authorization estándar "Bearer token"
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.slice(7);
            headerSource = 'Authorization (Bearer)';
        }
        // Opción 2: Header bearer directo (n8n y otros)
        else if (req.headers.bearer) {
            token = req.headers.bearer;
            headerSource = 'Bearer (direct)';
        }
        // Opción 3: Header authorization sin "Bearer " prefix
        else if (req.headers.authorization) {
            token = req.headers.authorization;
            headerSource = 'Authorization (direct)';
        }

        if (!token) {
            console.log('[auth] ❌ No token found');
            return false;
        }

        const isValid = token === expected;
        console.log(`[auth] ${isValid ? '✅' : '❌'} Token ${isValid ? 'valid' : 'invalid'}`);
        return isValid;
    }

    function isAllowedOrigin(req) {
        const list = (process.env.ALLOWED_ORIGINS || '*')
            .split(',')
            .map(s => s.trim());
        if (list.includes('*')) return true;
        const origin = String(req.headers.origin || '');
        if (!origin) return true;
        return list.includes(origin);
    }

    return { app, transports };
}