import { Component, input, output, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ToolbarModule } from 'primeng/toolbar';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { ConfirmationService, MessageService } from 'primeng/api';

export interface CrudColumn {
  field: string;
  header: string;
  sortable?: boolean;
  width?: string;
  type?: 'text' | 'date' | 'status' | 'actions' | 'custom';
  customTemplate?: string;
}

export interface CrudAction {
  icon: string;
  label: string;
  severity: 'success' | 'info' | 'warn' | 'danger' | 'secondary';
  tooltip: string;
  show?: (item: any) => boolean;
  action: (item: any) => void;
}

@Component({
  selector: 'app-crud-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TagModule,
    ConfirmDialogModule,
    ToastModule,
    TooltipModule,
    ToolbarModule,
    InputIconModule,
    IconFieldModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './crud-table.component.html',
  styleUrls: ['./crud-table.component.scss']
})
export class CrudTableComponent {
  // Input signals
  title = input<string>('');
  description = input<string>('');
  data = input.required<any[]>();
  columns = input.required<CrudColumn[]>();
  actions = input.required<CrudAction[]>();
  loading = input<boolean>(false);
  showCreateButton = input<boolean>(true);
  createButtonLabel = input<string>('New');
  createButtonIcon = input<string>('pi pi-plus');
  showDeleteButton = input<boolean>(false);
  showExportButton = input<boolean>(false);
  showFilters = input<boolean>(true);
  filterFields = input<string[]>([]);
  statusOptions = input<any[]>([]);
  selectedStatus = input<any>(null);
  globalFilter = input<string>('');
  selectedItems = input<any[]>([]);
  showSelection = input<boolean>(true);
  showPagination = input<boolean>(true);
  rows = input<number>(10);
  rowsPerPageOptions = input<number[]>([10, 25, 50]);

  // Output signals
  onCreate = output<void>();
  onEdit = output<any>();
  onView = output<any>();
  onDelete = output<any>();
  onDeleteSelected = output<any[]>();
  onExport = output<void>();
  onSelectionChange = output<any[]>();
  onGlobalFilterChange = output<string>();
  onStatusFilterChange = output<any>();
  onClearFilters = output<void>();
  onAction = output<{ action: CrudAction, item: any }>();

  // Internal signals
  private _selectedItems = signal<any[]>([]);
  private _globalFilter = signal<string>('');
  private _selectedStatus = signal<any>(null);

  // Computed signals
  selectedItemsCount = computed(() => this._selectedItems().length);
  hasSelection = computed(() => this.selectedItemsCount() > 0);
  filteredData = computed(() => {
    const data = this.data();
    const filter = this._globalFilter();
    const status = this._selectedStatus();
    
    let filtered = data;
    
    if (filter) {
      filtered = filtered.filter(item => 
        Object.values(item).some(value => 
          String(value).toLowerCase().includes(filter.toLowerCase())
        )
      );
    }
    
    if (status) {
      filtered = filtered.filter(item => {
        // Assuming status field exists, adjust as needed
        return item.status === status.value || item.enabled === status.value;
      });
    }
    
    return filtered;
  });

  // Effects
  constructor(
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {
    // Sync input signals with internal signals
    effect(() => {
      this._selectedItems.set(this.selectedItems());
    });
    
    effect(() => {
      this._globalFilter.set(this.globalFilter());
    });
    
    effect(() => {
      this._selectedStatus.set(this.selectedStatus());
    });
  }

  // Methods
  onCreateClick(): void {
    this.onCreate.emit();
  }

  onEditClick(item: any): void {
    this.onEdit.emit(item);
  }

  onViewClick(item: any): void {
    this.onView.emit(item);
  }

  onDeleteClick(item: any): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete this item?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.onDelete.emit(item);
      }
    });
  }

  onActionClick(action: CrudAction, item: any): void {
    this.onAction.emit({ action, item });
  }

  onGlobalFilterChangeEvent(event: any): void {
    this._globalFilter.set(event.target.value);
    this.onGlobalFilterChange.emit(event.target.value);
  }

  onStatusFilterChangeEvent(event: any): void {
    this._selectedStatus.set(event.value);
    this.onStatusFilterChange.emit(event.value);
  }

  onClearFiltersClick(): void {
    this._globalFilter.set('');
    this._selectedStatus.set(null);
    this.onClearFilters.emit();
  }

  onSelectionChangeEvent(event: any): void {
    this._selectedItems.set(event);
    this.onSelectionChange.emit(event);
  }

  getSeverity(value: any): 'success' | 'danger' | 'warn' | 'info' | 'secondary' {
    if (typeof value === 'boolean') {
      return value ? 'success' : 'danger';
    }
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      if (lowerValue.includes('success') || lowerValue.includes('enabled')) return 'success';
      if (lowerValue.includes('failed') || lowerValue.includes('disabled')) return 'danger';
      if (lowerValue.includes('warning')) return 'warn';
      if (lowerValue.includes('info')) return 'info';
    }
    return 'secondary';
  }

  getStatusLabel(value: any): string {
    if (typeof value === 'boolean') {
      return value ? 'Enabled' : 'Disabled';
    }
    return value;
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  }

  shouldShowAction(action: CrudAction, item: any): boolean {
    return action.show ? action.show(item) : true;
  }

  onDeleteSelectedClick(): void {
    this.onDeleteSelected.emit(this._selectedItems());
  }

  onExportClick(): void {
    this.onExport.emit();
  }
}