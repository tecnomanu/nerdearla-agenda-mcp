# 🐳 Docker Guide - Nerdearla Agenda MCP Server

## 🚀 Ejecución Rápida

### Opción 1: Docker Compose (Recomendado)

```bash
# Construir y ejecutar
docker-compose up --build

# Ejecutar en background
docker-compose up -d --build

# Ver logs
docker-compose logs -f

# Parar el servicio
docker-compose down
```

### Opción 2: Docker Run

```bash
# Construir imagen
docker build -t nerdearla-agenda-mcp .

# Ejecutar contenedor
docker run -p 3000:3000 nerdearla-agenda-mcp

# Con variables de entorno
docker run -p 3000:3000 \
  -e MCP_BEARER=mi-token-secreto \
  nerdearla-agenda-mcp
```

---

## ⚙️ Configuración

### Variables de Entorno

| Variable          | Descripción              | Default     | Ejemplo              |
| ----------------- | ------------------------ | ----------- | -------------------- |
| `MCP_PORT`        | Puerto del servidor      | `3000`      | `8080`               |
| `MCP_BEARER`      | Token de autenticación   | `undefined` | `mi-token-123`       |
| `ALLOWED_ORIGINS` | Orígenes CORS permitidos | `*`         | `https://mi-app.com` |
| `MCP_BODY_LIMIT`  | Límite de body requests  | `1mb`       | `5mb`                |
| `LOG_LEVEL`       | Nivel de logging         | `info`      | `debug`              |

### Archivo .env

```bash
# Copia el archivo de ejemplo
cp env.docker.example .env

# Edita la configuración
nano .env
```

---

## 🔒 Configuraciones de Seguridad

### Sin Autenticación (Desarrollo)

```yaml
# docker-compose.yml
environment:
    - MCP_PORT=3000
    - ALLOWED_ORIGINS=*
    # MCP_BEARER no configurado = modo abierto
```

### Con Autenticación (Producción)

```yaml
# docker-compose.yml
environment:
    - MCP_PORT=8080
    - MCP_BEARER=nerdearla-super-secret-2024
    - ALLOWED_ORIGINS=https://mi-dominio.com,https://n8n.mi-dominio.com
```

### Para n8n

```yaml
# docker-compose.yml
environment:
    - MCP_PORT=3000
    - MCP_BEARER=n8n-integration-token
    - ALLOWED_ORIGINS=http://localhost:5678
```

---

## 🧪 Testing del Container

### Health Check

```bash
# Verificar estado del contenedor
docker-compose ps

# Health check manual
curl http://localhost:3000/health

# Respuesta esperada:
# {
#   "ok": true,
#   "transport": "http",
#   "version": "1.1.0",
#   "sessions": 0,
#   "auth": {
#     "bearer_required": false,
#     "status": "open"
#   }
# }
```

### Test de Herramientas MCP

```bash
# Listar herramientas disponibles
curl -X POST http://localhost:3000/messages?sessionId=test \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}'

# Ejecutar herramienta (próximas charlas)
curl -X POST http://localhost:3000/messages?sessionId=test \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "get_upcoming_talks",
      "arguments": {"limit": 3}
    }
  }'
```

### Test con Bearer Token

```bash
# Con token en header Authorization
curl -X POST http://localhost:3000/messages?sessionId=test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer mi-token-secreto" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}'

# Con token en header bearer (n8n style)
curl -X POST http://localhost:3000/messages?sessionId=test \
  -H "Content-Type: application/json" \
  -H "bearer: mi-token-secreto" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}'
```

---

## 📊 Monitoreo

### Logs del Contenedor

```bash
# Ver logs en tiempo real
docker-compose logs -f nerdearla-agenda-mcp

# Ver logs específicos
docker logs nerdearla-agenda-mcp

# Ver últimas 100 líneas
docker logs --tail 100 nerdearla-agenda-mcp
```

### Métricas del Contenedor

```bash
# Estadísticas en tiempo real
docker stats nerdearla-agenda-mcp

# Información del contenedor
docker inspect nerdearla-agenda-mcp
```

---

## 🔧 Troubleshooting

### Problemas Comunes

#### Puerto Ocupado

```bash
# Error: "port is already allocated"
# Solución: Cambiar puerto en .env
MCP_PORT=3001
```

#### Puppeteer No Funciona

```bash
# Error: "No usable sandbox!"
# Verificar que Chromium esté instalado en el container
docker exec -it nerdearla-agenda-mcp which chromium-browser
```

#### Autenticación Fallando

```bash
# Verificar configuración de token
docker exec -it nerdearla-agenda-mcp env | grep MCP_BEARER

# Ver logs de autenticación
docker logs nerdearla-agenda-mcp | grep auth
```

### Debugging

```bash
# Ejecutar container en modo debug
docker run -it --rm \
  -p 3000:3000 \
  -e LOG_LEVEL=debug \
  nerdearla-agenda-mcp

# Entrar al container para debugging
docker exec -it nerdearla-agenda-mcp sh
```

---

## 🚀 Despliegue en Producción

### Docker Compose Producción

```yaml
version: '3.8'
services:
    nerdearla-agenda-mcp:
        build: .
        restart: always
        ports:
            - '8080:8080'
        environment:
            - MCP_PORT=8080
            - MCP_BEARER=${MCP_BEARER}
            - ALLOWED_ORIGINS=${ALLOWED_ORIGINS}
            - NODE_ENV=production
        deploy:
            resources:
                limits:
                    memory: 512M
                    cpus: '0.5'
        healthcheck:
            test: ['CMD', 'wget', '--spider', 'http://localhost:8080/health']
            interval: 30s
            timeout: 10s
            retries: 3
```

### Con Reverse Proxy (nginx)

```nginx
# nginx.conf
server {
    listen 80;
    server_name mcp.mi-dominio.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # Para SSE
        proxy_buffering off;
        proxy_cache off;
        proxy_set_header Connection '';
        proxy_http_version 1.1;
        chunked_transfer_encoding off;
    }
}
```

---

## 📚 Integración con n8n

### n8n Docker Compose

```yaml
version: '3.8'
services:
    n8n:
        image: n8nio/n8n
        ports:
            - '5678:5678'
        environment:
            - N8N_BASIC_AUTH_ACTIVE=true
            - N8N_BASIC_AUTH_USER=admin
            - N8N_BASIC_AUTH_PASSWORD=password
        volumes:
            - n8n_data:/home/node/.n8n
        depends_on:
            - nerdearla-agenda-mcp

    nerdearla-agenda-mcp:
        build: .
        ports:
            - '3000:3000'
        environment:
            - MCP_BEARER=n8n-integration-token
            - ALLOWED_ORIGINS=http://localhost:5678

volumes:
    n8n_data:
```

### Configuración en n8n

1. **HTTP Request Node**:
    - Method: `POST`
    - URL: `http://nerdearla-agenda-mcp:3000/messages?sessionId=n8n`
    - Headers: `bearer: n8n-integration-token`
    - Body: JSON con request MCP

---

**🎪 Desarrollado para la charla "Automatizá con flow: IA, n8n y MCP sin morir en el intento" - Nerdearla 2024**
