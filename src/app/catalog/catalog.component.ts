import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Tool, ToolDetails, Asset } from '../services/api.service';
import { RunToolModalComponent } from '../run-tool-modal/run-tool-modal.component';
import { TargetSelectorComponent } from '../components/target-selector/target-selector.component';
import { CategoryGridComponent } from '../components/category-grid/category-grid.component';
import { CategoryToolsComponent } from '../components/category-tools/category-tools.component';
import { BreadcrumbComponent, BreadcrumbItem } from '../components/breadcrumb/breadcrumb.component';
import { CategoryService, Category, CategorizedTool } from '../services/category.service';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, RunToolModalComponent, TargetSelectorComponent, CategoryGridComponent, CategoryToolsComponent, BreadcrumbComponent],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.scss'
})
export class CatalogComponent implements OnInit {
  tools: Tool[] = [];
  assets: Asset[] = [];
  isLoading: boolean = false;
  error: string = '';
  selectedTool: ToolDetails | null = null;
  showModal = false;
  selectedAssetId: string | null = null;
  
  // New category-related properties
  categories: Category[] = [];
  categorizedTools: Map<string, CategorizedTool[]> = new Map();
  currentView: 'categories' | 'tools' = 'categories';
  selectedCategory: string = '';
  breadcrumbItems: BreadcrumbItem[] = [];

  constructor(
    private apiService: ApiService,
    private categoryService: CategoryService
  ) {}

  ngOnInit() {
    this.loadTools();
    this.loadAssets();
    this.initializeCategories();
    this.updateBreadcrumb();
  }

  initializeCategories() {
    this.categories = this.categoryService.getCategories();
  }

  loadTools() {
    this.isLoading = true;
    this.error = '';

    this.apiService.tools().subscribe({
      next: (tools) => {
        this.tools = tools;
        this.categorizedTools = this.categoryService.categorizeTools(tools);
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar herramientas: ' + (err.error?.message || err.message || 'Error desconocido');
        this.isLoading = false;
      }
    });
  }

  loadAssets() {
    this.apiService.getAssets().subscribe({
      next: (assets) => {
        this.assets = assets;
      },
      error: (err) => {
        console.warn('Error loading assets:', err);
        // Don't show error to user, just log it
      }
    });
  }

  openToolModal(tool: Tool) {
    this.isLoading = true;
    this.error = '';

    this.apiService.getTool(tool.name).subscribe({
      next: (toolDetails) => {
        this.selectedTool = toolDetails;
        this.showModal = true;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = `Error al cargar detalles de ${tool.name}: ` + (err.error?.message || err.message || 'Error desconocido');
        this.isLoading = false;
      }
    });
  }

  onModalClose() {
    this.showModal = false;
    this.selectedTool = null;
  }

  onToolExecute(event: {tool: ToolDetails, arguments: any, userConfirmed: boolean}) {
    console.log('Tool executed:', event);
    // El modal maneja la ejecución, aquí solo podemos hacer logging o notificaciones
  }

  // Category navigation methods
  onCategorySelected(categoryId: string) {
    this.selectedCategory = categoryId;
    this.currentView = 'tools';
    this.updateBreadcrumb();
  }

  onBackToCategories() {
    this.currentView = 'categories';
    this.selectedCategory = '';
    this.updateBreadcrumb();
  }

  onToolSelected(toolId: string) {
    const tool = this.tools.find(t => t.name === toolId);
    if (tool) {
      this.openToolModal(tool);
    }
  }

  onBreadcrumbItemClicked(item: BreadcrumbItem) {
    if (item.path === 'categories') {
      this.onBackToCategories();
    }
  }

  updateBreadcrumb() {
    this.breadcrumbItems = [
      { label: 'Inicio', path: 'home', icon: '🏠' },
      { label: 'Catálogo', path: 'categories', icon: '🛠️' }
    ];

    if (this.currentView === 'tools' && this.selectedCategory) {
      const category = this.categoryService.getCategoryById(this.selectedCategory);
      if (category) {
        this.breadcrumbItems.push({
          label: category.name,
          path: undefined,
          icon: category.icon
        });
      }
    }
  }

  getCurrentCategoryTools(): CategorizedTool[] {
    if (this.selectedCategory && this.categorizedTools.has(this.selectedCategory)) {
      return this.categorizedTools.get(this.selectedCategory) || [];
    }
    return [];
  }
}
