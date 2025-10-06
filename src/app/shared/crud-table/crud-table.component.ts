import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
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
  severity: 'success' | 'info' | 'warning' | 'danger' | 'secondary';
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
    TooltipModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './crud-table.component.html',
  styleUrls: ['./crud-table.component.scss']
})
export class CrudTableComponent implements OnInit {
  @Input() title: string = '';
  @Input() description: string = '';
  @Input() data: any[] = [];
  @Input() columns: CrudColumn[] = [];
  @Input() actions: CrudAction[] = [];
  @Input() loading: boolean = false;
  @Input() showCreateButton: boolean = true;
  @Input() createButtonLabel: string = 'New';
  @Input() createButtonIcon: string = 'pi pi-plus';
  @Input() showFilters: boolean = true;
  @Input() filterFields: string[] = [];
  @Input() statusOptions: any[] = [];
  @Input() selectedStatus: any = null;
  @Input() globalFilter: string = '';
  @Input() selectedItems: any[] = [];
  @Input() showSelection: boolean = true;
  @Input() showPagination: boolean = true;
  @Input() rows: number = 10;
  @Input() rowsPerPageOptions: number[] = [10, 25, 50];

  @Output() onCreate = new EventEmitter<void>();
  @Output() onEdit = new EventEmitter<any>();
  @Output() onDelete = new EventEmitter<any>();
  @Output() onSelectionChange = new EventEmitter<any[]>();
  @Output() onGlobalFilterChange = new EventEmitter<string>();
  @Output() onStatusFilterChange = new EventEmitter<any>();
  @Output() onClearFilters = new EventEmitter<void>();

  constructor(
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    // Initialize component
  }

  onCreateClick(): void {
    this.onCreate.emit();
  }

  onEditClick(item: any): void {
    this.onEdit.emit(item);
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
    action.action(item);
  }

  onGlobalFilterChangeEvent(event: any): void {
    this.onGlobalFilterChange.emit(event.target.value);
  }

  onStatusFilterChangeEvent(event: any): void {
    this.onStatusFilterChange.emit(event.value);
  }

  onClearFiltersClick(): void {
    this.onClearFilters.emit();
  }

  onSelectionChangeEvent(event: any): void {
    this.onSelectionChange.emit(event);
  }

  getSeverity(value: any): 'success' | 'danger' | 'warning' | 'info' | 'secondary' {
    if (typeof value === 'boolean') {
      return value ? 'success' : 'danger';
    }
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      if (lowerValue.includes('success') || lowerValue.includes('enabled')) return 'success';
      if (lowerValue.includes('failed') || lowerValue.includes('disabled')) return 'danger';
      if (lowerValue.includes('warning')) return 'warning';
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
}
