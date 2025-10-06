import { Component, OnInit } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ApiService, DiscoveryResult, ToolDetails, ExecuteResult } from '../services/api.service';
import { Asset, Tool } from '../models/api';
import { RunToolModalComponent } from '../run-tool-modal/run-tool-modal.component';

@Component({
    selector: 'app-inventory',
    imports: [FormsModule, RunToolModalComponent],
    templateUrl: './inventory.component.html',
    styleUrls: ['./inventory.component.scss']
})
export class InventoryComponent implements OnInit {
  assets: Asset[] = [];
  filteredAssets: Asset[] = [];
  paginatedAssets: Asset[] = [];
  selectedAssets: string[] = [];
  selectAll = false;
  
  // Filters
  searchTerm = '';
  statusFilter = '';
  osFilter = '';
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 12;
  totalPages = 1;
  
  // States
  isLoading = false;
  isDiscovering = false;
  errorMessage = '';
  scanProgress = 0;
  discoveryResult: DiscoveryResult | null = null;
  
  // Modals
  showAssetDetailsModal = false;
  showRunToolModal = false;
  selectedAssetDetails: Asset | null = null;
  selectedAsset: Asset | null = null;
  selectedTool: ToolDetails | null = null;
  
  // Math for template
  Math = Math;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadAssets();
  }

  loadAssets(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.apiService.getAssets().subscribe({
      next: (assets) => {
        this.assets = assets;
        this.filterAssets();
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Error al cargar equipos: ' + error.message;
        this.isLoading = false;
      }
    });
  }

  discoverAssets(): void {
    this.isDiscovering = true;
    this.scanProgress = 0;
    this.errorMessage = '';
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      this.scanProgress += Math.random() * 10;
      if (this.scanProgress >= 100) {
        this.scanProgress = 100;
        clearInterval(progressInterval);
      }
    }, 200);
    
    this.apiService.discoverAssets().subscribe({
      next: (result) => {
        this.discoveryResult = result;
        this.isDiscovering = false;
        clearInterval(progressInterval);
        this.loadAssets();
      },
      error: (error) => {
        this.errorMessage = 'Error en el descubrimiento: ' + error.message;
        this.isDiscovering = false;
        clearInterval(progressInterval);
      }
    });
  }

  filterAssets(): void {
    let filtered = [...this.assets];
    
    // Search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(asset => 
        asset.hostname.toLowerCase().includes(term) || 
        asset.ip.toLowerCase().includes(term)
      );
    }
    
    // Status filter
    if (this.statusFilter) {
      filtered = filtered.filter(asset => asset.status === this.statusFilter);
    }
    
    // OS filter
    if (this.osFilter) {
      filtered = filtered.filter(asset => asset.os.toLowerCase() === this.osFilter);
    }
    
    this.filteredAssets = filtered;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredAssets.length / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
    
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedAssets = this.filteredAssets.slice(startIndex, endIndex);
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  toggleSelectAll(): void {
    if (this.selectAll) {
      this.selectedAssets = this.filteredAssets.map(asset => asset.id);
    } else {
      this.selectedAssets = [];
    }
  }

  toggleAssetSelection(assetId: string): void {
    const index = this.selectedAssets.indexOf(assetId);
    if (index > -1) {
      this.selectedAssets.splice(index, 1);
    } else {
      this.selectedAssets.push(assetId);
    }
    this.selectAll = this.selectedAssets.length === this.filteredAssets.length;
  }

  executeBulkAction(action: string): void {
    if (this.selectedAssets.length === 0) return;
    
    const selectedAssets = this.assets.filter(asset => 
      this.selectedAssets.includes(asset.id)
    );
    
    console.log(`Executing ${action} on ${selectedAssets.length} assets`);
    // Implementation would go here
  }

  exportSelected(): void {
    if (this.selectedAssets.length === 0) return;
    
    const selectedAssets = this.assets.filter(asset => 
      this.selectedAssets.includes(asset.id)
    );
    
    const csvContent = this.generateCSV(selectedAssets);
    this.downloadCSV(csvContent, 'assets.csv');
  }

  generateCSV(assets: Asset[]): string {
    const headers = ['Hostname', 'IP', 'OS', 'Status', 'WinRM', 'Last Seen'];
    const rows = assets.map(asset => [
      asset.hostname,
      asset.ip,
      asset.os,
      asset.status,
      asset.winrmEnabled ? 'Yes' : 'No',
      this.formatDate(asset.lastSeen)
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  downloadCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  viewAssetDetails(asset: Asset): void {
    this.selectedAssetDetails = asset;
    this.showAssetDetailsModal = true;
  }

  closeAssetDetailsModal(): void {
    this.showAssetDetailsModal = false;
    this.selectedAssetDetails = null;
  }

  openRunToolModal(asset: Asset): void {
    this.selectedAsset = asset;
    this.showRunToolModal = true;
  }

  closeRunToolModal(): void {
    this.showRunToolModal = false;
    this.selectedAsset = null;
    this.selectedTool = null;
  }

  executeTool(result: any): void {
    console.log('Tool execution result:', result);
    this.closeRunToolModal();
  }

  pingAsset(asset: Asset): void {
    // Implementation would go here
    console.log(`Pinging ${asset.hostname}`);
  }

  formatDate(date: string | Date): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleString();
  }

  formatTime(timestamp: number | Date): string {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleTimeString();
  }

  formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}