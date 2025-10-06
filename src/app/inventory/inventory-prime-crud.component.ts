import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ApiService } from '../services/api.service';
import { NotifyService } from '../services/notify.service';
import { Asset } from '../models/api';
import { CrudTableComponent, CrudColumn, CrudAction } from '../shared/crud-table/crud-table.component';

@Component({
  selector: 'app-inventory-prime-crud',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DialogModule,
    TagModule,
    CrudTableComponent
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './inventory-prime-crud.component.html',
  styleUrls: ['./inventory-prime-crud.component.scss']
})
export class InventoryPrimeCrudComponent implements OnInit {
  assets: Asset[] = [];
  loading = true;
  showModal = false;
  selectedAsset: Asset | undefined = undefined;
  actionInProgress: Set<string> = new Set();

  // Table state
  selectedAssets: Asset[] = [];
  globalFilter = '';
  statusOptions = [
    { label: 'All', value: null },
    { label: 'Online', value: 'online' },
    { label: 'Offline', value: 'offline' },
    { label: 'Unknown', value: 'unknown' }
  ];
  selectedStatus: string | null = null;

  // CRUD Configuration
  columns: CrudColumn[] = [
    { field: 'hostname', header: 'Hostname', sortable: true, width: '20%' },
    { field: 'ip', header: 'IP Address', sortable: true, width: '15%' },
    { field: 'os', header: 'OS', sortable: true, width: '15%' },
    { field: 'status', header: 'Status', sortable: true, width: '10%', type: 'status' },
    { field: 'winrmEnabled', header: 'WinRM', sortable: true, width: '10%', type: 'status' },
    { field: 'lastSeen', header: 'Last Seen', sortable: true, width: '15%', type: 'date' },
    { field: 'actions', header: 'Actions', width: '15%', type: 'actions' }
  ];

  actions: CrudAction[] = [
    {
      icon: 'pi pi-eye',
      label: 'View Details',
      severity: 'info',
      tooltip: 'View asset details',
      action: (asset: Asset) => this.viewDetails(asset)
    },
    {
      icon: 'pi pi-refresh',
      label: 'Ping',
      severity: 'success',
      tooltip: 'Ping asset to check connectivity',
      action: (asset: Asset) => this.pingAsset(asset)
    },
    {
      icon: 'pi pi-cog',
      label: 'Run Tool',
      severity: 'secondary',
      tooltip: 'Run a tool on this asset',
      action: (asset: Asset) => this.runTool(asset)
    },
    {
      icon: 'pi pi-trash',
      label: 'Remove',
      severity: 'danger',
      tooltip: 'Remove asset from inventory',
      action: (asset: Asset) => this.removeAsset(asset)
    }
  ];

  constructor(
    private apiService: ApiService,
    private notifyService: NotifyService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    
    this.apiService.getAssets().subscribe({
      next: (assets) => {
        this.assets = assets || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading assets:', error);
        this.notifyService.error('Error loading assets');
        this.loading = false;
      }
    });
  }

  viewDetails(asset: Asset): void {
    this.selectedAsset = asset;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedAsset = undefined;
  }

  pingAsset(asset: Asset): void {
    if (this.actionInProgress.has(asset.id)) {
      return;
    }

    this.actionInProgress.add(asset.id);
    
    // TODO: Implement ping API call
    this.messageService.add({ severity: 'info', summary: 'Info', detail: `Pinging ${asset.hostname}...` });
    
    // Simulate ping delay
    setTimeout(() => {
      this.actionInProgress.delete(asset.id);
      this.messageService.add({ severity: 'success', summary: 'Success', detail: `${asset.hostname} is reachable` });
    }, 2000);
  }

  runTool(asset: Asset): void {
    // TODO: Implement run tool functionality
    this.messageService.add({ severity: 'info', summary: 'Info', detail: `Opening tool runner for ${asset.hostname}` });
  }

  removeAsset(asset: Asset): void {
    this.confirmationService.confirm({
      message: `Remove asset "${asset.hostname}" from inventory?`,
      header: 'Confirm Remove',
      icon: 'pi pi-trash',
      accept: () => {
        this.actionInProgress.add(asset.id);
        
        // TODO: Implement remove asset API call
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Asset removed from inventory' });
        this.actionInProgress.delete(asset.id);
        
        // Remove from local list
        this.assets = this.assets.filter(a => a.id !== asset.id);
      }
    });
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  }

  trackByAssetId(index: number, asset: Asset): string {
    return asset.id;
  }

  isActionInProgress(assetId: string): boolean {
    return this.actionInProgress.has(assetId);
  }

  getSeverity(status: string): 'success' | 'danger' | 'warn' | 'info' {
    switch (status.toLowerCase()) {
      case 'online': return 'success';
      case 'offline': return 'danger';
      case 'unknown': return 'warn';
      default: return 'info';
    }
  }

  getStatusLabel(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }

  getWinrmSeverity(winrmEnabled: boolean): 'success' | 'danger' {
    return winrmEnabled ? 'success' : 'danger';
  }

  getWinrmLabel(winrmEnabled: boolean): string {
    return winrmEnabled ? 'Enabled' : 'Disabled';
  }

  clearFilters(): void {
    this.globalFilter = '';
    this.selectedStatus = null;
  }

  onActionClick(event: { action: CrudAction, item: Asset }): void {
    event.action.action(event.item);
  }
}
