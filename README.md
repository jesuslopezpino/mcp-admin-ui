# MCP Admin UI

Panel de administración Angular 17 para la plataforma MCP (Model Context Protocol). Permite gestionar y ejecutar herramientas de sistema a través de un asistente AI y un catálogo de herramientas.

## 🚀 Características

- **🤖 AI Assistant**: Interfaz conversacional para crear planes de ejecución
- **🛠️ Catálogo de Herramientas**: Tabla con herramientas disponibles y ejecución directa
- **📦 Inventario de Equipos**: Gestión de assets de red con descubrimiento automático
- **🌐 Ejecución Remota**: Ejecutar herramientas en equipos específicos via WinRM
- **📊 Resultados en Tiempo Real**: Visualización de resultados de ejecución
- **🔒 Seguridad**: Autenticación por API Key
- **📱 Responsive**: Diseño adaptativo para móviles y desktop

## 🛠️ Tecnologías

- **Angular 17** con Standalone Components
- **TypeScript** para tipado estático
- **SCSS** para estilos
- **RxJS** para programación reactiva
- **Angular Router** para navegación

## 📋 Prerrequisitos

- Node.js 18+ 
- npm 9+
- Backend MCP Controller corriendo en `http://localhost:8080`

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

1. **Ver herramientas**: Tabla con todas las herramientas disponibles
2. **Ejecutar directamente**: Botón "Ejecutar" para cada herramienta
3. **Ver resultados**: Resultados de ejecución en tiempo real

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

## 🔧 Configuración

### Environment

Edita `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  baseUrl: 'http://localhost:8080',  // URL del backend
  apiKey: 'dev-token'                // API Key para autenticación
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
- `executeTool()` - Ejecutar herramienta
- `getResult()` - Obtener resultados

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
- `executeForAsset()` - POST /recipes/executeForAsset

## 🐛 Troubleshooting

### Error de CORS
El backend ya tiene configurado CORS para `http://localhost:4200`. Si ves errores de CORS, verifica que el backend esté corriendo correctamente.

### Error de conexión
Verifica que el backend esté corriendo en `http://localhost:8080` y que la API Key sea correcta.

### Error de compilación
Asegúrate de tener Node.js 18+ y ejecuta `npm install` para instalar todas las dependencias.

## 📝 Licencia

Este proyecto es parte de la plataforma MCP (Model Context Protocol).