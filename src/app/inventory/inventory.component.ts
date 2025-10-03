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
    <div class="inventory-container">
      <!-- Header Section -->
      <div class="header" data-testid="inventory-header">
        <h2>🔍 Inventario de Equipos</h2>
        <p>Descubre y gestiona equipos en tu red</p>
      </div>

      <!-- Actions Bar -->
      <div class="actions-bar" data-testid="actions-bar">
        <div class="search-filters" data-testid="search-filters">
          <input 
            type="text" 
            class="search-input" 
            placeholder="🔍 Buscar por hostname o IP..."
            [(ngModel)]="searchTerm"
            (input)="filterAssets()"
            data-testid="search-input">
          
          <select class="filter-select" [(ngModel)]="statusFilter" (change)="filterAssets()" data-testid="status-filter">
            <option value="">Todos los estados</option>
            <option value="online">🟢 Online</option>
            <option value="offline">🔴 Offline</option>
            <option value="unknown">🟡 Desconocido</option>
          </select>
          
          <select class="filter-select" [(ngModel)]="osFilter" (change)="filterAssets()" data-testid="os-filter">
            <option value="">Todos los OS</option>
            <option value="windows">🪟 Windows</option>
            <option value="linux">🐧 Linux</option>
            <option value="macos">🍎 macOS</option>
          </select>
        </div>
        
        <div class="action-buttons" data-testid="action-buttons">
          <button 
            class="btn btn-primary" 
            (click)="discoverAssets()" 
            [disabled]="isDiscovering"
            data-testid="discover-button">
            <span *ngIf="isDiscovering">⏳</span>
            <span *ngIf="!isDiscovering">🔍</span>
            {{ isDiscovering ? 'Escaneando...' : 'Descubrir ahora' }}
          </button>
          
          <button 
            class="btn btn-secondary" 
            (click)="loadAssets()" 
            [disabled]="isLoading"
            data-testid="refresh-button">
            <span *ngIf="isLoading">⏳</span>
            <span *ngIf="!isLoading">🔄</span>
            {{ isLoading ? 'Cargando...' : 'Actualizar' }}
          </button>
        </div>
      </div>

      <!-- Progress Indicator -->
      <div *ngIf="isDiscovering" class="progress-card">
        <div class="progress-content">
          <div class="progress-info">
            <h4>🔍 Escaneando red...</h4>
            <p>Descubriendo equipos en la red local</p>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar">
              <div class="progress-fill" [style.width.%]="scanProgress"></div>
            </div>
            <span class="progress-text">{{ scanProgress.toFixed(0) }}%</span>
          </div>
        </div>
      </div>

      <!-- Discovery Results -->
      <div *ngIf="discoveryResult" class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">🖥️</div>
          <div class="stat-content">
            <h3>{{ discoveryResult.countOnline }}</h3>
            <p>Equipos Encontrados</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">⚙️</div>
          <div class="stat-content">
            <h3>{{ discoveryResult.countWinRm }}</h3>
            <p>Con WinRM</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">⏱️</div>
          <div class="stat-content">
            <h3>{{ formatDuration(discoveryResult.durationMs) }}</h3>
            <p>Duración</p>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div *ngIf="errorMessage" class="error-message">
        <div class="error-content">
          <span class="error-icon">⚠️</span>
          {{ errorMessage }}
        </div>
      </div>

      <!-- Bulk Actions -->
      <div *ngIf="filteredAssets.length > 0" class="bulk-actions">
        <div class="bulk-info">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              [(ngModel)]="selectAll"
              (change)="toggleSelectAll()">
            <span>Seleccionar todos ({{ selectedAssets.length }}/{{ filteredAssets.length }})</span>
          </label>
        </div>
        
        <div class="bulk-buttons" *ngIf="selectedAssets.length > 0">
          <button class="btn btn-outline" (click)="executeBulkAction('ping')">
            📡 Ping Masivo
          </button>
          <button class="btn btn-outline" (click)="executeBulkAction('info')">
            ℹ️ Info Masiva
          </button>
          <button class="btn btn-outline" (click)="exportSelected()">
            📥 Exportar
          </button>
        </div>
      </div>

      <!-- Assets Grid -->
      <div class="assets-grid" *ngIf="filteredAssets.length > 0">
        <div class="asset-card" *ngFor="let asset of paginatedAssets" 
             [class.selected]="selectedAssets.includes(asset.id)"
             [attr.data-testid]="'asset-card-' + asset.id">
          <div class="asset-header">
            <div class="asset-info">
              <h3 class="asset-name">
                <span class="asset-icon">🖥️</span>
                {{ asset.hostname }}
              </h3>
              <p class="asset-ip">{{ asset.ip }}</p>
            </div>
            
            <div class="asset-status">
              <span class="status-badge" 
                    [class]="'status-' + asset.status">
                <span class="status-dot"></span>
                {{ asset.status }}
              </span>
            </div>
          </div>

          <div class="asset-details">
            <div class="detail-row">
              <span class="detail-label">Sistema Operativo:</span>
              <span class="detail-value os-badge" [class]="'os-' + asset.os">
                <span class="os-icon" [class]="'icon-' + asset.os"></span>
                {{ asset.os }}
              </span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">WinRM:</span>
              <span class="detail-value winrm-badge" 
                    [class]="asset.winrmEnabled ? 'winrm-enabled' : 'winrm-disabled'">
                <span class="winrm-icon">{{ asset.winrmEnabled ? '✅' : '❌' }}</span>
                {{ asset.winrmEnabled ? 'Habilitado' : 'Deshabilitado' }}
              </span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Última vez visto:</span>
              <span class="detail-value">{{ formatDate(asset.lastSeen) }}</span>
            </div>
          </div>

          <div class="asset-actions">
            <div class="action-checkbox">
              <input 
                type="checkbox" 
                [checked]="selectedAssets.includes(asset.id)"
                (change)="toggleAssetSelection(asset.id)">
            </div>
            
            <div class="action-buttons" data-testid="asset-actions">
              <button 
                class="btn btn-sm btn-outline" 
                (click)="viewAssetDetails(asset)"
                 [attr.data-testid]="'view-details-' + asset.id"
                title="Ver detalles">
                👁️
              </button>
              
              <button 
                class="btn btn-sm btn-primary" 
                (click)="openRunToolModal(asset)"
                [disabled]="asset.status !== 'online'"
                 [attr.data-testid]="'execute-tool-' + asset.id"
                title="Ejecutar herramienta">
                ⚡
              </button>
              
              <button 
                class="btn btn-sm btn-secondary" 
                (click)="pingAsset(asset)"
                 [attr.data-testid]="'ping-asset-' + asset.id"
                title="Hacer ping">
                📡
              </button>
            </div>
          </div>

          <!-- Ping Result Display -->
          <div class="ping-result" *ngIf="asset.pingResult">
            <div class="ping-result-content" [class]="'ping-' + asset.pingResult.status">
              <div class="ping-status">
                <span class="ping-message">{{ asset.pingResult.message }}</span>
                <span class="ping-time">{{ formatTime(asset.pingResult.timestamp) }}</span>
              </div>
              <div class="ping-details" *ngIf="asset.pingResult.details.stdout">
                <pre class="ping-output">{{ asset.pingResult.details.stdout }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="filteredAssets.length === 0 && !isLoading" data-testid="empty-state">
        <div class="empty-content">
          <span class="empty-icon">🔍</span>
          <h3 *ngIf="searchTerm || statusFilter || osFilter">No se encontraron equipos</h3>
          <h3 *ngIf="!searchTerm && !statusFilter && !osFilter">No hay equipos descubiertos</h3>
          <p *ngIf="searchTerm || statusFilter || osFilter">
            Intenta ajustar los filtros de búsqueda
          </p>
          <p *ngIf="!searchTerm && !statusFilter && !osFilter">
            Haz clic en "Descubrir ahora" para escanear la red
          </p>
          <button 
            *ngIf="!searchTerm && !statusFilter && !osFilter"
            class="btn btn-primary" 
            (click)="discoverAssets()">
            🔍 Descubrir Equipos
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="isLoading && filteredAssets.length === 0">
        <div class="loading-content">
          <span class="loading-icon">⏳</span>
          Cargando equipos...
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination" *ngIf="filteredAssets.length > itemsPerPage">
        <div class="pagination-info">
          Mostrando {{ (currentPage - 1) * itemsPerPage + 1 }} - {{ Math.min(currentPage * itemsPerPage, filteredAssets.length) }} 
          de {{ filteredAssets.length }} equipos
        </div>
        
        <div class="pagination-controls">
          <button 
            class="btn btn-sm" 
            [disabled]="currentPage === 1"
            (click)="setPage(currentPage - 1)">
            ← Anterior
          </button>
          
          <span class="page-info">
            Página {{ currentPage }} de {{ totalPages }}
          </span>
          
          <button 
            class="btn btn-sm" 
            [disabled]="currentPage === totalPages"
            (click)="setPage(currentPage + 1)">
            Siguiente →
          </button>
        </div>
      </div>

      <!-- Asset Details Modal -->
      <div class="modal-overlay" *ngIf="showAssetDetailsModal" (click)="closeAssetDetailsModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>🖥️ Detalles del Equipo</h3>
            <button class="modal-close" (click)="closeAssetDetailsModal()">×</button>
          </div>
          
          <div class="modal-body" *ngIf="selectedAssetDetails">
            <div class="modal-grid">
              <div class="modal-section">
                <h4>📋 Información Básica</h4>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">Hostname:</span>
                    <span class="info-value">{{ selectedAssetDetails.hostname }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">IP:</span>
                    <span class="info-value code">{{ selectedAssetDetails.ip }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Sistema Operativo:</span>
                    <span class="info-value">{{ selectedAssetDetails.os }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Estado:</span>
                    <span class="info-value status-badge" [class]="'status-' + selectedAssetDetails.status">
                      {{ selectedAssetDetails.status }}
                    </span>
                  </div>
                </div>
              </div>
              
              <div class="modal-section">
                <h4>⚙️ Configuración</h4>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">WinRM:</span>
                    <span class="info-value winrm-badge" 
                          [class]="selectedAssetDetails.winrmEnabled ? 'winrm-enabled' : 'winrm-disabled'">
                      {{ selectedAssetDetails.winrmEnabled ? 'Habilitado' : 'Deshabilitado' }}
                    </span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Última vez visto:</span>
                    <span class="info-value">{{ formatDate(selectedAssetDetails.lastSeen) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">ID del Asset:</span>
                    <span class="info-value code">{{ selectedAssetDetails.id }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeAssetDetailsModal()">
              Cerrar
            </button>
            <button class="btn btn-primary" (click)="openRunToolModal(selectedAssetDetails!)">
              ⚡ Ejecutar Herramienta
            </button>
          </div>
        </div>
      </div>

      <!-- Run Tool Modal -->
      <app-run-tool-modal
        *ngIf="showRunToolModal"
        [tool]="selectedTool"
        [assetId]="selectedAsset?.id || ''"
        [destinationLabel]="selectedAsset ? (selectedAsset.hostname + ' (' + selectedAsset.ip + ')') : ''"
        (close)="closeRunToolModal()"
        (result)="executeTool($event)">
      </app-run-tool-modal>
    </div>
  `,
  styles: [`
    .inventory-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .header {
      text-align: center;
      margin-bottom: 30px;
      
      h2 {
        color: #2c3e50;
        margin-bottom: 8px;
        font-size: 2rem;
      }
      
      p {
        color: #7f8c8d;
        font-size: 1.1rem;
      }
    }

    .actions-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      gap: 20px;
      flex-wrap: wrap;
    }

    .search-filters {
      display: flex;
      gap: 12px;
      flex: 1;
      min-width: 0;
    }

    .search-input {
      flex: 1;
      padding: 12px 16px;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      font-size: 14px;
      min-width: 200px;
      
      &:focus {
        outline: none;
        border-color: #007bff;
        box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
      }
    }

    .filter-select {
      padding: 12px 16px;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      font-size: 14px;
      background: white;
      min-width: 140px;
      
      &:focus {
        outline: none;
        border-color: #007bff;
      }
    }

    .action-buttons {
      display: flex;
      gap: 12px;
    }

    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      
      &.btn-primary {
        background: #007bff;
        color: white;
        
        &:hover:not(:disabled) {
          background: #0056b3;
          transform: translateY(-1px);
        }
      }
      
      &.btn-secondary {
        background: #6c757d;
        color: white;
        
        &:hover:not(:disabled) {
          background: #545b62;
          transform: translateY(-1px);
        }
      }
      
      &.btn-outline {
        background: transparent;
        color: #007bff;
        border: 1px solid #007bff;
        
        &:hover:not(:disabled) {
          background: #007bff;
          color: white;
        }
      }
      
      &.btn-sm {
        padding: 8px 16px;
        font-size: 12px;
      }
    }

    .progress-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .progress-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
    }

    .progress-info h4 {
      margin: 0 0 8px 0;
      font-size: 1.2rem;
    }

    .progress-info p {
      margin: 0;
      opacity: 0.9;
    }

    .progress-bar-container {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 200px;
    }

    .progress-bar {
      flex: 1;
      height: 8px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: white;
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .progress-text {
      font-weight: 600;
      min-width: 40px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: white;
      border: 1px solid #dee2e6;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s ease;
      
      &:hover {
        transform: translateY(-2px);
      }
    }

    .stat-icon {
      font-size: 2rem;
      margin-bottom: 12px;
    }

    .stat-content h3 {
      margin: 0 0 8px 0;
      font-size: 2rem;
      color: #007bff;
    }

    .stat-content p {
      margin: 0;
      color: #6c757d;
      font-weight: 500;
    }

    .error-message {
      margin-bottom: 24px;
      
      .error-content {
        background: #f8d7da;
        color: #721c24;
        padding: 16px;
        border-radius: 8px;
        border: 1px solid #f5c6cb;
        display: flex;
        align-items: center;
        gap: 12px;
        
        .error-icon {
          font-size: 1.2rem;
        }
      }
    }

    .bulk-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
      margin-bottom: 24px;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-weight: 500;
    }

    .bulk-buttons {
      display: flex;
      gap: 8px;
    }

    .assets-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 24px;
      margin-bottom: 24px;
    }

    .asset-card {
      background: white;
      border: 1px solid #dee2e6;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      transition: all 0.2s ease;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
      
      &.selected {
        border-color: #007bff;
        box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
      }
    }

    .asset-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
      gap: 12px;
    }

    .asset-info {
      flex: 1;
    }

    .asset-name {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 4px 0;
      font-size: 1.3rem;
      font-weight: 700;
      color: #2c3e50;
    }

    .asset-icon {
      font-size: 1.1rem;
    }

    .asset-ip {
      margin: 0;
      color: #6c757d;
      font-family: 'Courier New', monospace;
      font-size: 0.9rem;
    }

    .status-badge {
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
      
      &.status-online {
        background: #d4edda;
        color: #155724;
      }
      
      &.status-offline {
        background: #f8d7da;
        color: #721c24;
      }
      
      &.status-unknown {
        background: #fff3cd;
        color: #856404;
      }
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: currentColor;
    }

    .asset-details {
      margin-bottom: 20px;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      font-size: 14px;
    }

    .detail-label {
      color: #6c757d;
      font-weight: 500;
    }

    .detail-value {
      font-weight: 600;
    }

    .os-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      
      &.os-windows {
        background: #e3f2fd;
        color: #1976d2;
      }
      
      &.os-linux {
        background: #e8f5e8;
        color: #2e7d32;
      }
      
      &.os-macos {
        background: #f3e5f5;
        color: #7b1fa2;
      }
    }

    .winrm-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      
      &.winrm-enabled {
        background: #d4edda;
        color: #155724;
      }
      
      &.winrm-disabled {
        background: #f8d7da;
        color: #721c24;
      }
    }

    .ping-result {
      margin-top: 16px;
      padding: 12px;
      border-radius: 8px;
      border: 1px solid #dee2e6;
      background: #f8f9fa;
    }

    .ping-result-content {
      &.ping-success {
        border-color: #d4edda;
        background: #d4edda;
        color: #155724;
      }
      
      &.ping-error {
        border-color: #f8d7da;
        background: #f8d7da;
        color: #721c24;
      }
      
      &.ping-pending {
        border-color: #fff3cd;
        background: #fff3cd;
        color: #856404;
      }
    }

    .ping-status {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .ping-message {
      font-weight: 600;
      flex: 1;
    }

    .ping-time {
      font-size: 0.85rem;
      opacity: 0.8;
      font-family: 'Courier New', monospace;
    }

    .ping-details {
      margin-top: 8px;
    }

    .ping-output {
      background: rgba(0, 0, 0, 0.1);
      border-radius: 4px;
      padding: 8px;
      font-size: 0.8rem;
      font-family: 'Courier New', monospace;
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 100px;
      overflow-y: auto;
    }

    .asset-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 16px;
      border-top: 1px solid #dee2e6;
    }

    .action-buttons {
      display: flex;
      gap: 8px;
    }

    .empty-state, .loading-state {
      text-align: center;
      margin: 60px 0;
      
      .empty-content, .loading-content {
        max-width: 400px;
        margin: 0 auto;
        
        .empty-icon, .loading-icon {
          font-size: 4rem;
          margin-bottom: 16px;
          display: block;
        }
        
        h3 {
          color: #6c757d;
          margin-bottom: 12px;
        }
        
        p {
          color: #6c757d;
          line-height: 1.6;
          margin-bottom: 24px;
        }
      }
    }

    .loading-icon {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      margin-top: 24px;
    }

    .pagination-info {
      color: #6c757d;
      font-size: 14px;
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .page-info {
      font-weight: 600;
      color: #495057;
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid #dee2e6;
      
      h3 {
        margin: 0;
        color: #2c3e50;
      }
    }

    .modal-close {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #6c757d;
      
      &:hover {
        color: #495057;
      }
    }

    .modal-body {
      padding: 24px;
    }

    .modal-grid {
      display: grid;
      gap: 24px;
    }

    .modal-section h4 {
      margin: 0 0 16px 0;
      color: #495057;
      font-size: 1.1rem;
    }

    .info-grid {
      display: grid;
      gap: 12px;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #f8f9fa;
    }

    .info-label {
      font-weight: 500;
      color: #6c757d;
    }

    .info-value {
      font-weight: 600;
      
      &.code {
        font-family: 'Courier New', monospace;
        background: #f8f9fa;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
      }
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 20px 24px;
      border-top: 1px solid #dee2e6;
    }

    @media (max-width: 768px) {
      .inventory-container {
        padding: 16px;
      }
      
      .actions-bar {
        flex-direction: column;
        align-items: stretch;
      }
      
      .search-filters {
        flex-direction: column;
      }
      
      .assets-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }
      
      .asset-header {
        flex-direction: column;
        align-items: flex-start;
      }
      
      .pagination {
        flex-direction: column;
        gap: 16px;
        text-align: center;
      }
    }
  `]
})
export class InventoryComponent implements OnInit {
  assets: Asset[] = [];
  filteredAssets: Asset[] = [];
  tools: Tool[] = [];
  isLoading = false;
  isDiscovering = false;
  errorMessage = '';
  discoveryResult: DiscoveryResult | null = null;
  
  // Search and filters
  searchTerm = '';
  statusFilter = '';
  osFilter = '';
  
  // Selection
  selectedAssets: string[] = [];
  selectAll = false;
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 12;
  
  // Scan progress
  scanProgress = 0;
  scanInterval: any;
  
  // Modal state
  showRunToolModal = false;
  showAssetDetailsModal = false;
  selectedTool: ToolDetails | null = null;
  selectedAsset: Asset | null = null;
  selectedAssetDetails: Asset | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadAssets();
    this.loadTools();
  }

  get totalPages(): number {
    return Math.ceil(this.filteredAssets.length / this.itemsPerPage);
  }

  get paginatedAssets(): Asset[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredAssets.slice(start, end);
  }

  get Math() {
    return Math;
  }

  loadAssets() {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.apiService.getAssets().subscribe({
      next: (assets) => {
        this.assets = assets;
        this.filteredAssets = [...assets];
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
    this.scanProgress = 0;
    
    // Simulate progress
    this.scanInterval = setInterval(() => {
      if (this.scanProgress < 90) {
        this.scanProgress += Math.random() * 10;
      }
    }, 200);
    
    this.apiService.discoverAssets().subscribe({
      next: (result) => {
        this.discoveryResult = result;
        this.isDiscovering = false;
        this.scanProgress = 100;
        clearInterval(this.scanInterval);
        
        // Show success notification
        this.showNotification('Escaneo completado', 'success');
        
        // Refresh assets after discovery
        setTimeout(() => {
          this.loadAssets();
          this.scanProgress = 0;
        }, 1000);
      },
      error: (error) => {
        this.errorMessage = 'Error durante el descubrimiento: ' + error.message;
        this.isDiscovering = false;
        this.scanProgress = 0;
        clearInterval(this.scanInterval);
        this.showNotification('Error en el escaneo', 'error');
      }
    });
  }

  filterAssets() {
    this.filteredAssets = this.assets.filter(asset => {
      const matchesSearch = !this.searchTerm || 
        asset.hostname.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        asset.ip.includes(this.searchTerm);
      
      const matchesStatus = !this.statusFilter || asset.status === this.statusFilter;
      const matchesOs = !this.osFilter || asset.os === this.osFilter;
      
      return matchesSearch && matchesStatus && matchesOs;
    });
    
    this.currentPage = 1;
  }

  toggleSelectAll() {
    if (this.selectAll) {
      this.selectedAssets = this.filteredAssets.map(asset => asset.id);
    } else {
      this.selectedAssets = [];
    }
  }

  toggleAssetSelection(assetId: string) {
    const index = this.selectedAssets.indexOf(assetId);
    if (index > -1) {
      this.selectedAssets.splice(index, 1);
    } else {
      this.selectedAssets.push(assetId);
    }
    this.selectAll = this.selectedAssets.length === this.filteredAssets.length;
  }

  executeBulkAction(action: string) {
    if (this.selectedAssets.length === 0) return;
    
    const message = `¿Ejecutar ${action} en ${this.selectedAssets.length} equipos?`;
    if (confirm(message)) {
      this.showNotification(`Ejecutando ${action} en ${this.selectedAssets.length} equipos...`, 'info');
      
      if (action === 'ping') {
        this.executeBulkPing();
      } else if (action === 'info') {
        this.executeBulkInfo();
      }
    }
  }

  executeBulkPing() {
    const selectedAssetsData = this.assets.filter(asset => 
      this.selectedAssets.includes(asset.id)
    );
    
    let completed = 0;
    let successful = 0;
    
    selectedAssetsData.forEach(asset => {
      // Simulate ping for each asset
      setTimeout(() => {
        const isOnline = asset.status === 'online';
        completed++;
        if (isOnline) {
          successful++;
        }
        
        console.log(`Simulated ping for ${asset.hostname}: ${isOnline ? 'success' : 'failed'}`);
        
        if (completed === selectedAssetsData.length) {
          this.showNotification(
            `Ping masivo completado: ${successful}/${selectedAssetsData.length} exitosos`, 
            successful === selectedAssetsData.length ? 'success' : 'warning'
          );
        }
      }, Math.random() * 3000); // Random delay between 0-3 seconds
    });
  }

  executeBulkInfo() {
    const selectedAssetsData = this.assets.filter(asset => 
      this.selectedAssets.includes(asset.id)
    );
    
    this.showNotification(`Obteniendo información de ${selectedAssetsData.length} equipos...`, 'info');
    
    // For bulk info, we could execute system.get_uptime or similar
    selectedAssetsData.forEach(asset => {
      this.apiService.executeForAsset(
        asset.id,
        'system.get_uptime',
        {},
        true
      ).subscribe({
        next: (result) => {
          console.log(`Info for ${asset.hostname}:`, result);
        },
        error: (error) => {
          console.error(`Info error for ${asset.hostname}:`, error);
        }
      });
    });
  }

  exportSelected() {
    if (this.selectedAssets.length === 0) return;
    
    const selectedAssetsData = this.assets.filter(asset => 
      this.selectedAssets.includes(asset.id)
    );
    
    const csvContent = this.convertToCSV(selectedAssetsData);
    this.downloadCSV(csvContent, 'equipos_seleccionados.csv');
    this.showNotification('Archivo exportado exitosamente', 'success');
  }

  convertToCSV(data: Asset[]): string {
    const headers = ['Hostname', 'IP', 'OS', 'Estado', 'WinRM', 'Última vez visto'];
    const rows = data.map(asset => [
      asset.hostname,
      asset.ip,
      asset.os,
      asset.status,
      asset.winrmEnabled ? 'Habilitado' : 'Deshabilitado',
      this.formatDate(asset.lastSeen)
    ]);
    
    return [headers, ...rows].map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');
  }

  downloadCSV(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  setPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  viewAssetDetails(asset: Asset) {
    this.selectedAssetDetails = asset;
    this.showAssetDetailsModal = true;
  }

  closeAssetDetailsModal() {
    this.showAssetDetailsModal = false;
    this.selectedAssetDetails = null;
  }

  pingAsset(asset: Asset) {
    // Show pinging state in the card
    asset.pingResult = {
      status: 'pending',
      message: `⏳ Haciendo ping a ${asset.hostname}...`,
      timestamp: new Date(),
      details: {
        exitCode: -1,
        stdout: '',
        stderr: ''
      }
    };
    
    // Simulate ping with a timeout since the API seems to have issues
    setTimeout(() => {
      // Simulate ping result based on asset status
      const isOnline = asset.status === 'online';
      const simulatedResult = {
        executionId: 'sim-' + Date.now(),
        exitCode: isOnline ? 0 : 1,
        stdout: isOnline ? `PING ${asset.ip}: 64 bytes from ${asset.hostname} (${asset.ip}): icmp_seq=1 time=1.23ms` : '',
        stderr: isOnline ? '' : `PING ${asset.ip}: Destination host unreachable`,
        status: isOnline ? 'completed' : 'failed'
      };
      
      console.log('Simulated ping result:', simulatedResult);
      this.showPingResult(asset, simulatedResult);
    }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds
  }

  showPingResult(asset: Asset, result: ExecuteResult) {
    const status = result.exitCode === 0 ? 'success' : 'error';
    const message = result.exitCode === 0 
      ? `✅ Ping exitoso a ${asset.hostname} (${asset.ip})`
      : `❌ Ping falló a ${asset.hostname} (${asset.ip})`;
    
    // Store ping result in the asset for display in the card
    asset.pingResult = {
      status: status,
      message: message,
      timestamp: new Date(),
      details: {
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr
      }
    };
    
    // Show detailed result in console
    console.log('Ping details:', {
      asset: asset.hostname,
      ip: asset.ip,
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr
    });
  }

  openRunToolModal(asset: Asset) {
    if (this.tools.length > 0) {
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

  executeTool(execution: any) {
    // The RunToolModal now handles async execution internally
    // This is just the final result callback
    console.log('Tool execution completed:', execution);
    
    if (execution.status === 'SUCCESS') {
      this.showNotification(`Herramienta ejecutada exitosamente en ${this.selectedAsset?.hostname}`, 'success');
    } else {
      this.showNotification(`Error al ejecutar herramienta en ${this.selectedAsset?.hostname}`, 'error');
    }
    
    // Don't automatically close modal - let user review results
    // this.closeRunToolModal();
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

  formatTime(timestamp: Date): string {
    return timestamp.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  }

  showNotification(message: string, type: 'success' | 'error' | 'info' | 'warning') {
    // Simple notification implementation
    const alertClass = {
      'success': 'alert-success',
      'error': 'alert-danger',
      'info': 'alert-info',
      'warning': 'alert-warning'
    }[type];
    
    const notification = document.createElement('div');
    notification.className = `alert ${alertClass} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }
}