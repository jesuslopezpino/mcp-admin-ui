import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Asset, DiscoveryResult, Tool, ToolDetails, ExecuteResult } from '../services/api.service';
import { RunToolModalComponent } from '../run-tool-modal/run-tool-modal.component';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, RunToolModalComponent],
  template: `
    <div class="container-fluid">
      <div class="row">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2>Inventario de Equipos</h2>
            <div>
              <button 
                class="btn btn-primary me-2" 
                (click)="discoverAssets()" 
                [disabled]="isDiscovering">
                <span *ngIf="isDiscovering" class="spinner-border spinner-border-sm me-2"></span>
                {{ isDiscovering ? 'Descubriendo...' : 'Descubrir ahora' }}
              </button>
              <button 
                class="btn btn-outline-secondary" 
                (click)="loadAssets()" 
                [disabled]="isLoading">
                <span *ngIf="isLoading" class="spinner-border spinner-border-sm me-2"></span>
                Actualizar
              </button>
            </div>
          </div>

          <!-- Discovery Results -->
          <div *ngIf="discoveryResult" class="alert alert-info mb-3">
            <h6>Último descubrimiento:</h6>
            <p class="mb-1">
              <strong>Hosts encontrados:</strong> {{ discoveryResult.countOnline }} | 
              <strong>Con WinRM:</strong> {{ discoveryResult.countWinRm }} | 
              <strong>Duración:</strong> {{ discoveryResult.durationMs }}ms
            </p>
            <small class="text-muted">Rangos escaneados: {{ discoveryResult.cidrs.join(', ') }}</small>
          </div>

          <!-- Error Message -->
          <div *ngIf="errorMessage" class="alert alert-danger mb-3">
            {{ errorMessage }}
          </div>

          <!-- Assets Table -->
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">Equipos Descubiertos ({{ assets.length }})</h5>
            </div>
            <div class="card-body p-0">
              <div *ngIf="assets.length === 0" class="text-center py-4 text-muted">
                <i class="fas fa-search fa-2x mb-2"></i>
                <p>No hay equipos descubiertos. Haz clic en "Descubrir ahora" para escanear la red.</p>
              </div>
              
              <div *ngIf="assets.length > 0" class="table-responsive">
                <table class="table table-hover mb-0">
                  <thead class="table-light">
                    <tr>
                      <th>Hostname</th>
                      <th>IP</th>
                      <th>OS</th>
                      <th>Estado</th>
                      <th>WinRM</th>
                      <th>Última vez visto</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let asset of assets">
                      <td>
                        <strong>{{ asset.hostname }}</strong>
                      </td>
                      <td>{{ asset.ip }}</td>
                      <td>
                        <span class="badge bg-secondary">{{ asset.os }}</span>
                      </td>
                      <td>
                        <span class="badge" 
                              [class.bg-success]="asset.status === 'online'"
                              [class.bg-danger]="asset.status === 'offline'"
                              [class.bg-warning]="asset.status === 'unknown'">
                          {{ asset.status }}
                        </span>
                      </td>
                      <td>
                        <span class="badge" 
                              [class.bg-success]="asset.winrmEnabled"
                              [class.bg-secondary]="!asset.winrmEnabled">
                          {{ asset.winrmEnabled ? 'Habilitado' : 'Deshabilitado' }}
                        </span>
                      </td>
                      <td>
                        <small class="text-muted">
                          {{ formatDate(asset.lastSeen) }}
                        </small>
                      </td>
                      <td>
                        <button 
                          class="btn btn-sm btn-outline-primary"
                          (click)="openRunToolModal(asset)"
                          [disabled]="asset.status !== 'online'">
                          <i class="fas fa-play me-1"></i>
                          Ejecutar Tool
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Run Tool Modal -->
    <app-run-tool-modal
      *ngIf="showRunToolModal"
      [tool]="selectedTool"
      [assetId]="selectedAsset?.id || ''"
      (close)="closeRunToolModal()"
      (execute)="executeTool($event)">
    </app-run-tool-modal>
  `,
  styles: [`
    .spinner-border-sm {
      width: 1rem;
      height: 1rem;
    }
    
    .table th {
      border-top: none;
      font-weight: 600;
    }
    
    .badge {
      font-size: 0.75em;
    }
    
    .btn-sm {
      padding: 0.25rem 0.5rem;
      font-size: 0.875rem;
    }
  `]
})
export class InventoryComponent implements OnInit {
  assets: Asset[] = [];
  tools: Tool[] = [];
  isLoading = false;
  isDiscovering = false;
  errorMessage = '';
  discoveryResult: DiscoveryResult | null = null;
  
  // Modal state
  showRunToolModal = false;
  selectedTool: ToolDetails | null = null;
  selectedAsset: Asset | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadAssets();
    this.loadTools();
  }

  loadAssets() {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.apiService.getAssets().subscribe({
      next: (assets) => {
        this.assets = assets;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Error al cargar los equipos: ' + error.message;
        this.isLoading = false;
      }
    });
  }

  loadTools() {
    this.apiService.tools().subscribe({
      next: (tools) => {
        this.tools = tools;
      },
      error: (error) => {
        console.error('Error loading tools:', error);
      }
    });
  }

  discoverAssets() {
    this.isDiscovering = true;
    this.errorMessage = '';
    
    this.apiService.discoverAssets().subscribe({
      next: (result) => {
        this.discoveryResult = result;
        this.isDiscovering = false;
        // Refresh assets after discovery
        this.loadAssets();
      },
      error: (error) => {
        this.errorMessage = 'Error durante el descubrimiento: ' + error.message;
        this.isDiscovering = false;
      }
    });
  }

  openRunToolModal(asset: Asset) {
    // For now, we'll use the first available tool
    // In a real implementation, you might want to show a tool selection dialog
    if (this.tools.length > 0) {
      // Get tool details for the first tool
      this.apiService.getTool(this.tools[0].name).subscribe({
        next: (toolDetails) => {
          this.selectedTool = toolDetails;
          this.selectedAsset = asset;
          this.showRunToolModal = true;
        },
        error: (error) => {
          console.error('Error loading tool details:', error);
        }
      });
    }
  }

  closeRunToolModal() {
    this.showRunToolModal = false;
    this.selectedTool = null;
    this.selectedAsset = null;
  }

  executeTool(event: { tool: ToolDetails; arguments: any; userConfirmed: boolean }) {
    if (!this.selectedAsset) return;

    this.apiService.executeForAsset(
      this.selectedAsset.id,
      event.tool.name,
      event.arguments,
      event.userConfirmed
    ).subscribe({
      next: (result) => {
        console.log('Tool executed successfully:', result);
        // You might want to show the result in a modal or notification
        alert(`Tool ejecutado exitosamente en ${this.selectedAsset?.hostname}\nExit Code: ${result.exitCode}\nStatus: ${result.status}`);
        this.closeRunToolModal();
      },
      error: (error) => {
        console.error('Error executing tool:', error);
        alert('Error al ejecutar la herramienta: ' + error.message);
      }
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
}
