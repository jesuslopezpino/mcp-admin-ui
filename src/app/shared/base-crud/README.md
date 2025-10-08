# BaseCrudComponent

Una clase abstracta base para componentes CRUD que centraliza la lógica común de operaciones Create, Read, Update, Delete.

## 🎯 **Beneficios**

- ✅ **Elimina duplicación de código** entre componentes CRUD
- ✅ **Centraliza lógica común** (modales, formularios, confirmaciones)
- ✅ **Manejo consistente de errores** y notificaciones
- ✅ **Signals integrados** para reactividad
- ✅ **Configuración declarativa** de columnas y acciones

## 📋 **Uso Básico**

```typescript
import { BaseCrudComponent } from '../shared/base-crud/base-crud.component';

@Component({
  selector: 'app-my-crud',
  standalone: true,
  imports: [CrudTableComponent, CrudFormComponent],
  templateUrl: './my-crud.component.html'
})
export class MyCrudComponent extends BaseCrudComponent<MyEntity> implements OnInit {
  
  constructor(
    apiService: ApiService,
    notifyService: NotifyService,
    confirmationService: ConfirmationService,
    messageService: MessageService
  ) {
    super(apiService, notifyService, confirmationService, messageService);
  }

  // Implementar métodos abstractos
  loadData(): void { /* ... */ }
  getColumns(): CrudColumn[] { /* ... */ }
  getActions(): CrudAction[] { /* ... */ }
  getFormConfig(): CrudFormConfig { /* ... */ }
  getEntityName(): string { return 'my-entity'; }
  getEntityNamePlural(): string { return 'my-entities'; }
  
  protected async createItem(data: any): Promise<void> { /* ... */ }
  protected async updateItem(data: any): Promise<void> { /* ... */ }
  protected async performDelete(item: MyEntity): Promise<void> { /* ... */ }
}
```

## 🔧 **Métodos Abstractos Requeridos**

### **Configuración de Datos**
- `loadData()`: Cargar datos desde la API
- `getColumns()`: Definir columnas de la tabla
- `getActions()`: Definir acciones de fila
- `getFormConfig()`: Configurar formulario modal

### **Identificación de Entidad**
- `getEntityName()`: Nombre singular (ej: "plan")
- `getEntityNamePlural()`: Nombre plural (ej: "plans")

### **Operaciones CRUD**
- `createItem(data)`: Crear nuevo elemento
- `updateItem(data)`: Actualizar elemento existente
- `performDelete(item)`: Eliminar elemento

## 🎨 **Template Simplificado**

```html
<div class="card">
  <h5>📋 My Entities</h5>
  
  <app-crud-table
    [data]="data"
    [columns]="getColumns()"
    [actions]="getActions()"
    [loading]="loading()"
    [globalFilter]="globalFilter"
    [selectedItems]="selectedItems"
    (onGlobalFilterChange)="globalFilter = $event"
    (onSelectionChange)="selectedItems = $event"
    (onNew)="openNewModal()"
    (onEdit)="openEditModal($event)"
    (onDelete)="deleteItem($event)"
    [entityName]="getEntityName()"
    [entityNamePlural]="getEntityNamePlural()">
  </app-crud-table>
</div>

<app-crud-form
  [visible]="showModal()"
  [mode]="'create'"
  [config]="getFormConfig()"
  [data]="editingItem"
  [loading]="loading()"
  (onSave)="onFormSave($event)"
  (onCancel)="onFormCancel()"
  (onClose)="onFormClose()">
</app-crud-form>
```

## 🚀 **Propiedades Disponibles**

### **Estado de Datos**
- `data: T[]` - Array de elementos
- `loading: Signal<boolean>` - Estado de carga
- `selectedItems: T[]` - Elementos seleccionados
- `globalFilter: string` - Filtro global

### **Estado de Modal**
- `showModal: Signal<boolean>` - Visibilidad del modal
- `editingItem: T | undefined` - Elemento siendo editado

### **Utilidades**
- `actionInProgress: Set<string>` - IDs de acciones en progreso

## 🛠 **Métodos Útiles**

### **Manejo de Modal**
- `openNewModal()`: Abrir modal para crear
- `openEditModal(item)`: Abrir modal para editar
- `onFormSave(data)`: Guardar formulario
- `onFormCancel()`: Cancelar formulario
- `onFormClose()`: Cerrar formulario

### **Manejo de Errores**
- `handleSuccess(message)`: Mostrar éxito y recargar
- `handleError(message)`: Mostrar error
- `isActionInProgress(id)`: Verificar si acción está en progreso
- `setActionInProgress(id, inProgress)`: Controlar estado de acción

## 📝 **Ejemplo Completo**

Ver `plans-prime-refactored.component.ts` para un ejemplo completo de implementación.

## 🎯 **Ventajas vs Implementación Manual**

| Aspecto | Manual | Con BaseCrudComponent |
|---------|--------|----------------------|
| **Líneas de código** | ~300-400 | ~150-200 |
| **Duplicación** | Alta | Eliminada |
| **Consistencia** | Variable | Garantizada |
| **Mantenimiento** | Difícil | Fácil |
| **Testing** | Complejo | Simplificado |

## 🔄 **Migración**

1. **Extender BaseCrudComponent** en lugar de implementar OnInit
2. **Implementar métodos abstractos** requeridos
3. **Simplificar template** usando propiedades de la clase base
4. **Eliminar código duplicado** (manejo de modales, formularios, etc.)
5. **Mantener lógica específica** en métodos protegidos

## 🎨 **Personalización**

La clase base permite personalización completa:
- **Columnas específicas** en `getColumns()`
- **Acciones personalizadas** en `getActions()`
- **Formularios únicos** en `getFormConfig()`
- **Lógica de negocio** en métodos protegidos
- **Propiedades adicionales** según necesidades
