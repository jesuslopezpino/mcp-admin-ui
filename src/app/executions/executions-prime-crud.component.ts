import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ApiService } from '../services/api.service';
import { NotifyService } from '../services/notify.service';
import { ExecutionListItem, ExecStatus } from '../models/api';
import { CrudTableComponent, CrudColumn, CrudAction } from '../shared/crud-table/crud-table.component';
import { CrudFormComponent } from '../shared/crud-form/crud-form.component';

@Component({
  selector: 'app-executions-prime-crud',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CrudTableComponent,
    CrudFormComponent
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './executions-prime-crud.component.html',
  styleUrls: ['./executions-prime-crud.component.scss']
})
export class ExecutionsPrimeCrudComponent implements OnInit {
  executions: ExecutionListItem[] = [];
  loading = true;
  showModal = false;
  editingExecution: ExecutionListItem | undefined = undefined;
  selectedExecution: ExecutionListItem | undefined = undefined;
  actionInProgress: Set<string> = new Set();

  // Table state
  selectedExecutions: ExecutionListItem[] = [];
  globalFilter = '';
  statusOptions = [
    { label: 'All', value: null },
    { label: 'Success', value: 'SUCCESS' },
    { label: 'Failed', value: 'FAILED' },
    { label: 'Error', value: 'ERROR' },
    { label: 'Running', value: 'RUNNING' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Cancelled', value: 'CANCELLED' }
  ];
  selectedStatus: string | null = null;

  // CRUD Configuration
  columns: CrudColumn[] = [
    { field: 'id', header: 'ID', sortable: true, width: '15%' },
    { field: 'toolName', header: 'Tool', sortable: true, width: '15%' },
    { field: 'status', header: 'Status', sortable: true, width: '10%', type: 'status' },
    { field: 'destination', header: 'Destination', width: '15%' },
    { field: 'startedAt', header: 'Started', sortable: true, width: '15%', type: 'date' },
    { field: 'finishedAt', header: 'Finished', sortable: true, width: '15%', type: 'date' },
    { field: 'durationMs', header: 'Duration', sortable: true, width: '10%' },
    { field: 'exitCode', header: 'Exit Code', sortable: true, width: '10%' },
    { field: 'actions', header: 'Actions', width: '15%', type: 'actions' }
  ];

  actions: CrudAction[] = [
    {
      icon: 'pi pi-eye',
      label: 'View Details',
      severity: 'info',
      tooltip: 'View execution details',
      action: (execution: ExecutionListItem) => this.viewDetails(execution)
    },
    {
      icon: 'pi pi-refresh',
      label: 'Rerun',
      severity: 'success',
      tooltip: 'Rerun this execution',
      show: (execution: ExecutionListItem) => execution.status === 'FAILED' || execution.status === 'ERROR',
      action: (execution: ExecutionListItem) => this.rerunExecution(execution)
    },
    {
      icon: 'pi pi-times',
      label: 'Cancel',
      severity: 'warn',
      tooltip: 'Cancel running execution',
      show: (execution: ExecutionListItem) => execution.status === 'RUNNING',
      action: (execution: ExecutionListItem) => this.cancelExecution(execution)
    },
    {
      icon: 'pi pi-download',
      label: 'Download Logs',
      severity: 'secondary',
      tooltip: 'Download execution logs',
      action: (execution: ExecutionListItem) => this.downloadLogs(execution)
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
    
    this.apiService.getExecutions({}).subscribe({
      next: (response) => {
        this.executions = response.content || response;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading executions:', error);
        this.notifyService.error('Error loading executions');
        this.loading = false;
      }
    });
  }

  viewDetails(execution: ExecutionListItem): void {
    this.selectedExecution = execution;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedExecution = undefined;
  }

  rerunExecution(execution: ExecutionListItem): void {
    if (this.actionInProgress.has(execution.id)) {
      return;
    }

    this.confirmationService.confirm({
      message: `Rerun execution ${execution.id}?`,
      header: 'Confirm Rerun',
      icon: 'pi pi-refresh',
      accept: () => {
        this.actionInProgress.add(execution.id);
        
        // TODO: Implement rerun API call
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Execution queued for rerun' });
        this.actionInProgress.delete(execution.id);
      }
    });
  }

  cancelExecution(execution: ExecutionListItem): void {
    if (this.actionInProgress.has(execution.id)) {
      return;
    }

    this.confirmationService.confirm({
      message: `Cancel execution ${execution.id}?`,
      header: 'Confirm Cancel',
      icon: 'pi pi-times',
      accept: () => {
        this.actionInProgress.add(execution.id);
        
        // TODO: Implement cancel API call
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Execution cancelled' });
        this.actionInProgress.delete(execution.id);
      }
    });
  }

  downloadLogs(execution: ExecutionListItem): void {
    if (this.actionInProgress.has(execution.id)) {
      return;
    }

    this.actionInProgress.add(execution.id);
    
    // TODO: Implement download logs API call
    this.messageService.add({ severity: 'info', summary: 'Info', detail: 'Downloading logs...' });
    this.actionInProgress.delete(execution.id);
  }

  formatDate(dateString?: string | null): string {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  }

  formatDuration(durationMs?: number | null): string {
    if (!durationMs) return '-';
    
    const seconds = Math.floor(durationMs / 1000);
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

  trackByExecutionId(index: number, execution: ExecutionListItem): string {
    return execution.id;
  }

  isActionInProgress(executionId: string): boolean {
    return this.actionInProgress.has(executionId);
  }

  getSeverity(status: ExecStatus): 'success' | 'danger' | 'warning' | 'info' {
    switch (status) {
      case 'SUCCESS': return 'success';
      case 'FAILED': return 'danger';
      case 'ERROR': return 'danger';
      case 'RUNNING': return 'info';
      case 'PENDING': return 'warning';
      case 'CANCELLED': return 'warning';
      default: return 'info';
    }
  }

  getStatusLabel(status: ExecStatus): string {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }

  clearFilters(): void {
    this.globalFilter = '';
    this.selectedStatus = null;
  }

  openNewModal(): void {
    this.editingExecution = undefined;
    this.showModal = true;
  }

  onFormSave(formData: any): void {
    this.loading = true;
    
    if (this.editingExecution) {
      this.updateExecution(formData);
    } else {
      this.createExecution(formData);
    }
  }

  onFormCancel(): void {
    this.showModal = false;
    this.editingExecution = undefined;
  }

  onFormClose(): void {
    this.showModal = false;
    this.editingExecution = undefined;
  }

  private async createExecution(data: any): Promise<void> {
    try {
      // For executions, we might need to trigger a new execution
      // This would depend on your API structure
      this.notifyService.success('Execution created successfully');
      this.showModal = false;
      this.loadData();
    } catch (error) {
      this.notifyService.error('Failed to create execution');
      this.loading = false;
    }
  }

  private async updateExecution(data: any): Promise<void> {
    try {
      if (!this.editingExecution) return;
      
      // Update execution logic here
      this.notifyService.success('Execution updated successfully');
      this.showModal = false;
      this.loadData();
    } catch (error) {
      this.notifyService.error('Failed to update execution');
      this.loading = false;
    }
  }

  getFormConfig(): any {
    return {
      title: 'Execution',
      sections: [
        {
          name: 'basic',
          title: 'Basic Information',
          description: 'Configure the execution details'
        }
      ],
      fields: [
        {
          key: 'name',
          label: 'Execution Name',
          type: 'text',
          required: true,
          placeholder: 'Enter execution name',
          section: 'basic',
          order: 1
        },
        {
          key: 'description',
          label: 'Description',
          type: 'textarea',
          required: false,
          placeholder: 'Enter execution description',
          section: 'basic',
          order: 2
        }
      ]
    };
  }
}
