# MCP Admin UI

Panel de administración Angular 17 para la plataforma MCP (Model Context Protocol). Permite gestionar y ejecutar herramientas de sistema a través de un asistente AI y un catálogo de herramientas.

## 🚀 Características

- **🤖 AI Assistant**: Interfaz conversacional para crear planes de ejecución
- **🛠️ Catálogo de Herramientas**: Tabla con herramientas disponibles y ejecución directa
- **📦 Inventario de Equipos**: Gestión de assets de red con descubrimiento automático
- **🌐 Ejecución Remota**: Ejecutar herramientas en equipos específicos via WinRM
- **⚡ Ejecución Asíncrona**: Sistema de jobs con polling automático para herramientas de larga duración
- **📊 Resultados en Tiempo Real**: Visualización de resultados de ejecución con estados PENDING/RUNNING/SUCCESS
- **🔒 Seguridad**: Autenticación por API Key y validación por allowlist
- **📱 Responsive**: Diseño adaptativo para móviles y desktop
- **💾 Descarga de Resultados**: Copiar y descargar salidas con metadatos completos

## 🛠️ Tecnologías

- **Angular 17** con Standalone Components
- **TypeScript** para tipado estático
- **SCSS** para estilos
- **RxJS** para programación reactiva
- **Angular Router** para navegación

## 📋 Prerrequisitos

- Node.js 18+ 
- npm 9+
- Backend MCP Controller corriendo en `http://localhost:8081` con PostgreSQL
- Docker y Docker Compose (para PostgreSQL del backend)

## 🚀 Instalación y Arranque

### 1. Instalar dependencias

```bash
npm install
```

### 2. Arrancar el servidor de desarrollo

```bash
npm start
```

### 3. Abrir en el navegador

Navega a `http://localhost:4200`

## 🎯 Uso

### Assistant (/assistant)

1. **Escribir mensaje**: Describe lo que necesitas hacer
2. **Asset ID (opcional)**: Especifica el ID del activo objetivo
3. **Planificar**: El AI creará un plan de ejecución
4. **Revisar plan**: Ver tool, riesgo, razonamiento y confirmación requerida
5. **Ejecutar**: Si requiere confirmación, ejecuta el plan
6. **Ver resultados**: Estado, salida y errores

**Ejemplo:**
```
Mensaje: "El portátil de Marta no tiene internet"
Asset ID: "WIN-123"
```

### Catalog (/catalog)

1. **Seleccionar destino**: Usa el selector de destino para elegir entre:
   - **Servidor (local)**: Ejecuta en el backend local
   - **Asset remoto**: Ejecuta en un equipo específico de la red
2. **Ver herramientas**: Tabla con todas las herramientas disponibles
3. **Ejecutar directamente**: Botón "Configurar y Ejecutar" para cada herramienta
4. **Ver resultados**: Resultados de ejecución en tiempo real con indicación del destino

**Funcionalidades del Catálogo:**
- **Selector de destino**: Permite elegir entre ejecución local o remota
- **Persistencia**: Recuerda la última selección de destino
- **Ejecución unificada**: Mismo flujo para ejecución local y remota
- **Indicador de destino**: Muestra claramente dónde se ejecutará la herramienta

### Inventory (/inventory)

1. **Ver equipos**: Tabla con todos los assets descubiertos en la red
2. **Descubrir equipos**: Botón "Descubrir ahora" para escanear la red
3. **Ejecutar en equipo**: Botón "Ejecutar Tool" para ejecutar herramientas en equipos específicos
4. **Estado de equipos**: Visualización de estado, WinRM y última vez visto

**Funcionalidades del Inventario:**
- **Descubrimiento automático**: Escanea rangos de red configurados
- **Detección WinRM**: Identifica equipos con WinRM habilitado
- **Ejecución remota**: Ejecuta herramientas en equipos específicos
- **Gestión de estado**: Seguimiento de equipos online/offline

## ⚡ Ejecución Asíncrona (Nuevo)

La UI ahora soporta ejecución asíncrona con polling automático para herramientas de larga duración.

### Flujo de Ejecución

1. **Crear Ejecución**: Al hacer clic en "Ejecutar", se llama a `POST /recipes/execute`
2. **Recibir Execution ID**: El backend devuelve inmediatamente un UUID de ejecución
3. **Polling Automático**: La UI hace polling a `GET /executions/{id}` cada 1.5 segundos
4. **Estados**:
   - `PENDING` ⏳ - En cola, esperando procesamiento
   - `RUNNING` ▶️ - Ejecutando actualmente
   - `SUCCESS` ✅ - Completado exitosamente
   - `FAILED` ❌ - Falló con error
   - `ERROR` ⚠️ - Error del sistema
5. **Resultado Final**: Al completar, muestra exitCode, stdout, stderr con opciones de copiar/descargar

### Ventajas

- **No-blocking**: La UI no se queda bloqueada durante ejecuciones largas
- **Resistente**: Reintentos automáticos con exponential backoff (5s -> 30s -> 2m)
- **Trazabilidad**: Cada ejecución tiene un UUID único para auditoría
- **Seguridad**: Positive allowlist valida todos los comandos antes de ejecutar

### Ejemplo de Uso

```typescript
// Desde Catálogo
1. Seleccionar destino (local o asset remoto)
2. Hacer clic en herramienta deseada
3. Completar formulario (con validación JSON Schema)
4. Confirmar si la tool lo requiere
5. Ver progreso en tiempo real
6. Copiar o descargar resultados

// Desde Inventario
1. Seleccionar asset en la tabla
2. Hacer clic en "⚡ Ejecutar Tool"
3. Mismo flujo que catálogo, con destino pre-seleccionado
```

### Requisitos Backend

Para que la ejecución asíncrona funcione correctamente, asegúrate de:

1. **Iniciar PostgreSQL**:
   ```bash
   cd mcp-controller-server
   docker compose up -d
   ```

2. **Verificar Migraciones**: Flyway debe crear las tablas automáticamente:
   - `tool` - Catálogo de herramientas
   - `tool_version` - Versiones con scripts y allowlist
   - `execution` - Registro de ejecuciones
   - `job` - Cola de trabajos

3. **Iniciar Backend**:
   ```bash
   ./mvnw spring-boot:run
   ```

4. **Verificar Endpoint**:
   ```bash
   curl -H "X-API-Key: dev-token" http://localhost:8081/tools
   ```

## 🔧 Configuración

### Environment

Edita `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  baseUrl: 'http://localhost:8081',  // URL del backend
  apiKey: 'dev-token',                // API Key para autenticación
  pollingIntervalMs: 1500,            // Intervalo de polling para ejecuciones async
  featureFlags: {
    rememberArgs: false  // Desactivar por ahora (feature inestable)
  }
};
```

### Backend

Asegúrate de que el backend MCP Controller esté corriendo:

```bash
# En mcp-controller-server
./mvnw spring-boot:run
```

## 📡 API Endpoints

El frontend consume estos endpoints del backend:

- `POST /ai/plan` - Crear plan de ejecución
- `POST /recipes/execute` - Ejecutar plan
- `GET /tools` - Obtener catálogo de herramientas
- `GET /assets` - Obtener inventario de equipos
- `POST /assets/discover` - Descubrir equipos en la red
- `POST /recipes/executeForAsset` - Ejecutar herramienta en equipo específico

Todos los requests incluyen:
- Header `X-API-Key: dev-token`
- Header `Content-Type: application/json`

## 🎨 Estructura del Proyecto

```
src/
├── app/
│   ├── assistant/           # Componente Assistant
│   ├── catalog/            # Componente Catalog
│   ├── inventory/          # Componente Inventory
│   ├── services/
│   │   └── api.service.ts  # Servicio API central
│   ├── app.component.*     # Componente raíz
│   ├── app.routes.ts       # Configuración de rutas
│   └── app.config.ts       # Configuración de la app
├── environments/           # Configuración de entornos
└── styles.scss            # Estilos globales
```

## 🔍 Desarrollo

### Comandos disponibles

```bash
# Servidor de desarrollo
npm start

# Build para producción
npm run build

# Tests unitarios
npm test

# Linting
npm run lint
```

### Estructura de Componentes

**AssistantComponent:**
- `plan()` - Crear plan de ejecución
- `execute()` - Ejecutar plan
- `onReset()` - Limpiar formulario

**CatalogComponent:**
- `loadTools()` - Cargar catálogo
- `loadAssets()` - Cargar inventario de equipos
- `openToolModal()` - Abrir modal de ejecución
- `onToolExecute()` - Manejar resultado de ejecución

**TargetSelectorComponent:**
- `onSelectionChange()` - Manejar cambio de destino
- `getDisplayName()` - Formatear nombre del asset
- Persistencia automática en localStorage

**InventoryComponent:**
- `loadAssets()` - Cargar inventario de equipos
- `discoverAssets()` - Descubrir equipos en la red
- `openRunToolModal()` - Abrir modal de ejecución en equipo
- `executeTool()` - Ejecutar herramienta en equipo específico

**ApiService:**
- `plan()` - POST /ai/plan
- `execute()` - POST /recipes/execute  
- `tools()` - GET /tools
- `getAssets()` - GET /assets
- `discoverAssets()` - POST /assets/discover
- `executeDirect()` - POST /recipes/executeDirect (local o con assetId)
- `executeForAsset()` - POST /recipes/executeForAsset (remoto)

## 🐛 Troubleshooting

### Error de CORS
El backend ya tiene configurado CORS para `http://localhost:4200`. Si ves errores de CORS, verifica que el backend esté corriendo correctamente.

### Error de conexión
Verifica que el backend esté corriendo en `http://localhost:8080` y que la API Key sea correcta.

### Error de compilación
Asegúrate de tener Node.js 18+ y ejecuta `npm install` para instalar todas las dependencias.

## 📝 Licencia

Este proyecto es parte de la plataforma MCP (Model Context Protocol).