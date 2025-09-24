# 🔐 Guía de Autenticación - Bearer Token

## 🚀 Configuración del Bearer Token

### 1. Crear archivo `.env`

```bash
# Copiar el archivo de ejemplo
cp env-with-auth.example .env
```

### 2. Configurar token personalizado

Editar el archivo `.env`:

```env
# === CONFIGURACIÓN PRINCIPAL ===
MCP_TRANSPORT=http
MCP_PORT=3334

# === CONFIGURACIÓN DE SEGURIDAD ===
# Token Bearer para autenticación HTTP (REQUERIDO para producción)
MCP_BEARER=tu-token-super-secreto-aqui

# Orígenes permitidos para CORS
ALLOWED_ORIGINS=*
```

### 3. Generar token seguro

```bash
# Opción 1: Usar openssl
openssl rand -hex 32

# Opción 2: Usar Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Opción 3: Token personalizado
MCP_BEARER=nerdearla-$(date +%Y%m%d)-$(openssl rand -hex 16)
```

## 🔧 Uso del Bearer Token

### 1. Iniciar servidor con autenticación

```bash
# Con archivo .env
node src/index.js

# O directamente con variable de entorno
MCP_BEARER=mi-token-secreto MCP_TRANSPORT=http node src/index.js
```

### 2. Verificar estado de autenticación

```bash
# Health check - muestra si auth está habilitada
curl http://localhost:3334/health

# Respuesta con auth habilitada:
{
  "ok": true,
  "transport": "http",
  "version": "1.1.0",
  "sessions": 0,
  "auth": {
    "bearer_required": true,
    "status": "protected"
  }
}
```

### 3. Hacer requests autenticados

```bash
# Con token válido ✅
curl -H "Authorization: Bearer mi-token-secreto" http://localhost:3334/sse

# Sin token ❌
curl http://localhost:3334/sse
# Respuesta: HTTP 401 Unauthorized

# Con token inválido ❌
curl -H "Authorization: Bearer token-incorrecto" http://localhost:3334/sse
# Respuesta: HTTP 401 Unauthorized
```

## 🔍 MCP Inspector con Autenticación

### Configuración en la interfaz

1. **Transport Type**: `SSE`
2. **URL**: `http://localhost:3334/sse`
3. **Authentication**: Expandir sección
4. **Type**: `Bearer Token`
5. **Token**: `tu-token-super-secreto-aqui`

### Configuración por línea de comandos

```bash
# El MCP Inspector también respeta variables de entorno
MCP_BEARER=tu-token-super-secreto-aqui npx @modelcontextprotocol/inspector npx nerdearla-agenda
```

## 🧪 Testing de Autenticación

### 1. Test sin autenticación (modo abierto)

```bash
# Sin MCP_BEARER configurado
MCP_TRANSPORT=http node src/index.js

# Debería funcionar sin token
curl http://localhost:3334/sse
```

### 2. Test con autenticación (modo protegido)

```bash
# Con MCP_BEARER configurado
MCP_BEARER=test-token MCP_TRANSPORT=http node src/index.js

# Sin token - debería fallar
curl http://localhost:3334/sse
# HTTP 401

# Con token correcto - debería funcionar
curl -H "Authorization: Bearer test-token" http://localhost:3334/sse
# Conexión SSE exitosa

# Con token incorrecto - debería fallar
curl -H "Authorization: Bearer wrong-token" http://localhost:3334/sse
# HTTP 401
```

## 📊 Logs de Autenticación

El servidor mostrará logs detallados:

```
[mcp:auth] No bearer token configured - allowing all requests
[mcp:auth] Missing Authorization header
[mcp:auth] Invalid Authorization header format
[mcp:auth] Invalid bearer token provided
[mcp:auth] Valid bearer token - access granted
```

## 🛡️ Mejores Prácticas de Seguridad

### 1. Tokens seguros

```bash
# ✅ Bueno: Token aleatorio largo
MCP_BEARER=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0

# ❌ Malo: Token predecible
MCP_BEARER=password123
```

### 2. Variables de entorno

```bash
# ✅ Bueno: Variable de entorno
export MCP_BEARER=$(openssl rand -hex 32)
node src/index.js

# ❌ Malo: Hardcodeado en código
```

### 3. CORS restrictivo

```bash
# ✅ Bueno: Orígenes específicos
ALLOWED_ORIGINS=https://mi-app.com,https://otro-cliente.com

# ❌ Malo: Wildcard en producción (solo OK para desarrollo)
ALLOWED_ORIGINS=*
```

### 4. HTTPS en producción

```bash
# ✅ Bueno: HTTPS en producción
https://mi-servidor.com:3334/sse

# ❌ Malo: HTTP en producción (tokens visibles)
http://mi-servidor.com:3334/sse
```

## 🚨 Troubleshooting

### Error: "Missing Authorization header"

```bash
# Solución: Agregar header Authorization
curl -H "Authorization: Bearer tu-token" http://localhost:3334/sse
```

### Error: "Invalid Authorization header format"

```bash
# ❌ Incorrecto
curl -H "Authorization: tu-token" http://localhost:3334/sse

# ✅ Correcto
curl -H "Authorization: Bearer tu-token" http://localhost:3334/sse
```

### Error: "Invalid bearer token provided"

```bash
# Verificar que el token coincida exactamente
echo $MCP_BEARER
# Usar exactamente ese valor en el header
```

## 🔄 Rotación de Tokens

```bash
# 1. Generar nuevo token
NEW_TOKEN=$(openssl rand -hex 32)

# 2. Actualizar .env
echo "MCP_BEARER=$NEW_TOKEN" >> .env

# 3. Reiniciar servidor
# 4. Actualizar clientes con nuevo token
```
