import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Tool, ToolDetails, Asset } from '../services/api.service';
import { RunToolModalComponent } from '../run-tool-modal/run-tool-modal.component';
import { TargetSelectorComponent } from '../components/target-selector/target-selector.component';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, RunToolModalComponent, TargetSelectorComponent],
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

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadTools();
    this.loadAssets();
  }

  loadTools() {
    this.isLoading = true;
    this.error = '';

    this.apiService.tools().subscribe({
      next: (tools) => {
        this.tools = tools;
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
}
