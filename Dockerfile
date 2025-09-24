# Dockerfile para Nerdearla Agenda MCP Server
FROM node:20-alpine

# Metadatos
LABEL maintainer="Manuel Bruña & Carlos Pereyra"
LABEL description="Servidor MCP para consultar la agenda de Nerdearla - Charla Nerdearla 2024"
LABEL version="1.1.0"

# Crear directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema necesarias para Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && rm -rf /var/cache/apk/*

# Configurar Puppeteer para usar Chromium instalado
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copiar archivos de configuración
COPY package*.json pnpm-lock.yaml ./

# Instalar pnpm globalmente y las dependencias
RUN npm install -g pnpm && \
    pnpm install --prod && \
    pnpm store prune

# Copiar código fuente
COPY src/ ./src/

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mcpuser -u 1001 -G nodejs

# Cambiar permisos
RUN chown -R mcpuser:nodejs /app
USER mcpuser

# Variables de entorno por defecto
ENV NODE_ENV=production \
    MCP_TRANSPORT=http \
    MCP_PORT=3000 \
    PORT=3000

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "const http=require('http');http.get('http://localhost:${MCP_PORT:-3000}/health',(r)=>{process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"

# Comando por defecto
CMD ["node", "src/index.js"]
