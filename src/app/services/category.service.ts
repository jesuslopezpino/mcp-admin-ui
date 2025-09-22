import { Injectable } from '@angular/core';

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
}

export interface CategorizedTool {
  id: string;
  name: string;
  description: string;
  requiresConfirmation: boolean;
  category: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  
  private categories: Category[] = [
    {
      id: 'system',
      name: 'Sistema',
      icon: '⚙️',
      description: 'Herramientas de administración del sistema',
      color: '#667eea'
    },
    {
      id: 'apps',
      name: 'Aplicaciones',
      icon: '📱',
      description: 'Gestión de aplicaciones y software',
      color: '#764ba2'
    },
    {
      id: 'security',
      name: 'Seguridad',
      icon: '🔒',
      description: 'Herramientas de seguridad y protección',
      color: '#f093fb'
    },
    {
      id: 'files',
      name: 'Archivos',
      icon: '📁',
      description: 'Gestión de archivos y respaldos',
      color: '#4facfe'
    },
    {
      id: 'user',
      name: 'Usuarios',
      icon: '👤',
      description: 'Gestión de usuarios y cuentas',
      color: '#43e97b'
    },
    {
      id: 'process',
      name: 'Procesos',
      icon: '⚡',
      description: 'Gestión de procesos del sistema',
      color: '#fa709a'
    },
    {
      id: 'disk',
      name: 'Almacenamiento',
      icon: '💾',
      description: 'Gestión de discos y almacenamiento',
      color: '#ffecd2'
    },
    {
      id: 'network',
      name: 'Red',
      icon: '🌐',
      description: 'Herramientas de red y conectividad',
      color: '#a8edea'
    },
    {
      id: 'log',
      name: 'Registros',
      icon: '📋',
      description: 'Visualización de registros del sistema',
      color: '#d299c2'
    },
    {
      id: 'update',
      name: 'Actualizaciones',
      icon: '🔄',
      description: 'Gestión de actualizaciones del sistema',
      color: '#fad0c4'
    },
    {
      id: 'policy',
      name: 'Políticas',
      icon: '📜',
      description: 'Gestión de políticas de grupo',
      color: '#a1c4fd'
    }
  ];

  getCategories(): Category[] {
    return this.categories;
  }

  getCategoryById(id: string): Category | undefined {
    return this.categories.find(cat => cat.id === id);
  }

  categorizeTools(tools: any[]): Map<string, CategorizedTool[]> {
    const categorized = new Map<string, CategorizedTool[]>();
    
    // Initialize all categories
    this.categories.forEach(category => {
      categorized.set(category.id, []);
    });

    // Categorize tools
    tools.forEach(tool => {
      const categoryId = this.extractCategoryFromToolName(tool.name);
      const categorizedTool: CategorizedTool = {
        id: tool.name,
        name: this.formatToolName(tool.name),
        description: tool.description,
        requiresConfirmation: tool.requiresConfirmation,
        category: categoryId
      };
      
      if (categorized.has(categoryId)) {
        categorized.get(categoryId)!.push(categorizedTool);
      }
    });

    return categorized;
  }

  private extractCategoryFromToolName(toolName: string): string {
    const parts = toolName.split('.');
    return parts[0] || 'system';
  }

  private formatToolName(toolName: string): string {
    const parts = toolName.split('.');
    if (parts.length > 1) {
      return parts[1].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    return toolName;
  }

  getCategoryDisplayName(categoryId: string): string {
    const category = this.getCategoryById(categoryId);
    return category ? category.name : categoryId;
  }
}
