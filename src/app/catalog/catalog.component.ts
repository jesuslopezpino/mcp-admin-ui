import { Component, OnInit, OnDestroy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ApiService, ToolDetails } from '../services/api.service';
import { Tool, Asset } from '../models/api';
import { RunToolModalComponent } from '../run-tool-modal/run-tool-modal.component';
import { TargetSelectorComponent } from '../components/target-selector/target-selector.component';
import { CategoryGridComponent } from '../components/category-grid/category-grid.component';
import { CategoryToolsComponent } from '../components/category-tools/category-tools.component';
import { BreadcrumbComponent, BreadcrumbItem } from '../components/breadcrumb/breadcrumb.component';
import { CategoryService, Category, CategorizedTool } from '../services/category.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-catalog',
    imports: [FormsModule, RunToolModalComponent, TargetSelectorComponent, CategoryGridComponent, CategoryToolsComponent, BreadcrumbComponent],
    templateUrl: './catalog.component.html',
    styleUrl: './catalog.component.scss'
})
export class CatalogComponent implements OnInit, OnDestroy {
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
  
  private destroy$ = new Subject<void>();

  constructor(
    private apiService: ApiService,
    private categoryService: CategoryService
  ) {}

  ngOnInit() {
    this.loadTools();
    this.loadAssets();
    this.initializeCategories();
    this.updateBreadcrumb();
    this.setupStorageListener();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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

  onToolExecute(execution: any) {
    console.log('Tool execution completed:', execution);
    // El modal maneja la ejecución asíncrona, aquí solo podemos hacer logging o notificaciones
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

  onAssetSelected(assetId: string | null) {
    this.selectedAssetId = assetId;
  }

  private setupStorageListener() {
    // Listen for storage changes to sync with modal
    if (typeof window !== 'undefined') {
      // Listen for cross-tab storage changes
      window.addEventListener('storage', (event) => {
        if (event.key === 'mcp.ui.selectedAsset' || event.key === 'mcp.ui.rememberedAsset') {
          this.syncWithStorage();
        }
      });
      
      // Listen for custom events from the same tab (modal changes)
      window.addEventListener('mcp-storage-change', (event: any) => {
        if (event.detail && event.detail.key === 'mcp.ui.selectedAsset') {
          this.syncWithStorage();
        }
      });
    }
    
    // Also check storage on initialization
    this.syncWithStorage();
  }

  private syncWithStorage() {
    if (typeof localStorage !== 'undefined') {
      const savedAssetId = localStorage.getItem('mcp.ui.selectedAsset');
      const isRemembered = localStorage.getItem('mcp.ui.rememberedAsset') === 'true';
      
      if (savedAssetId && savedAssetId !== 'null' && isRemembered) {
        // Verify the saved asset still exists in the current assets list
        const savedAsset = this.assets.find(asset => asset.id === savedAssetId);
        if (savedAsset) {
          this.selectedAssetId = savedAssetId;
        }
      } else if (!isRemembered) {
        // If not remembered, clear the selection
        this.selectedAssetId = null;
      }
    }
  }
}
