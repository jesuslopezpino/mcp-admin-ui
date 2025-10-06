import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ApiService } from '../services/api.service';
import { NotifyService } from '../services/notify.service';
import { ScheduledTask, Tool, Asset } from '../models/api';
import { ScheduleModalComponent } from './schedule-modal.component';
import { CrudTableComponent, CrudColumn, CrudAction } from '../shared/crud-table/crud-table.component';
import { CrudFormComponent, CrudFormConfig, CrudFormField, CrudFormMode } from '../shared/crud-form/crud-form.component';

@Component({
  selector: 'app-schedules-prime',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CrudTableComponent,
    CrudFormComponent,
    ScheduleModalComponent
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './schedules-prime.component.html',
  styleUrls: ['./schedules-prime.component.scss']
})
export class SchedulesPrimeComponent implements OnInit {
  schedules: ScheduledTask[] = [];
  tools: Tool[] = [];
  assets: Asset[] = [];
  loading = true;
  showModal = false;
  editingTask: ScheduledTask | undefined = undefined;
  actionInProgress: Set<string> = new Set();

  // Form state
  showForm = signal<boolean>(false);
  formMode = signal<CrudFormMode>('create');
  formData = signal<ScheduledTask | null>(null);
  formLoading = signal<boolean>(false);

  // Table state
  selectedSchedules: ScheduledTask[] = [];
  globalFilter = '';
  statusOptions = [
    { label: 'All', value: null },
    { label: 'Enabled', value: true },
    { label: 'Disabled', value: false }
  ];
  selectedStatus: boolean | null = null;

  // Form Configuration
  formConfig: CrudFormConfig = {
    title: 'Schedule',
    sections: [
      {
        name: 'basic',
        title: 'Basic Information',
        description: 'Configure the basic schedule details'
      },
      {
        name: 'execution',
        title: 'Execution Settings',
        description: 'Set up the tool execution parameters'
      },
      {
        name: 'schedule',
        title: 'Schedule Configuration',
        description: 'Define when and how often to run'
      }
    ],
    fields: [
      // Basic Information
      {
        key: 'name',
        label: 'Schedule Name',
        type: 'text',
        required: true,
        placeholder: 'Enter schedule name',
        section: 'basic',
        order: 1
      },
      {
        key: 'description',
        label: 'Description',
        type: 'textarea',
        placeholder: 'Enter schedule description',
        rows: 3,
        section: 'basic',
        order: 2
      },
      {
        key: 'enabled',
        label: 'Enabled',
        type: 'checkbox',
        section: 'basic',
        order: 3
      },
      // Execution Settings
      {
        key: 'toolId',
        label: 'Tool',
        type: 'dropdown',
        required: true,
        section: 'execution',
        order: 1
      },
      {
        key: 'destination',
        label: 'Destination',
        type: 'text',
        required: true,
        placeholder: 'Enter destination (e.g., server name)',
        section: 'execution',
        order: 2
      },
      {
        key: 'args',
        label: 'Tool Arguments',
        type: 'json',
        placeholder: 'Enter tool arguments as JSON',
        rows: 5,
        section: 'execution',
        order: 3
      },
      // Schedule Configuration
      {
        key: 'cronExpr',
        label: 'Cron Expression',
        type: 'text',
        required: true,
        placeholder: 'Enter cron expression (e.g., */10 * * * * *)',
        helpText: 'Use standard cron format: minute hour day month weekday',
        section: 'schedule',
        order: 1
      },
      {
        key: 'timezone',
        label: 'Timezone',
        type: 'text',
        placeholder: 'Enter timezone (e.g., UTC)',
        section: 'schedule',
        order: 2
      }
    ],
    showPreview: true,
    previewTitle: 'Schedule Preview'
  };

  // CRUD Configuration
  columns: CrudColumn[] = [
    { field: 'name', header: 'Name', sortable: true, width: '20%' },
    { field: 'toolName', header: 'Tool', sortable: true, width: '15%' },
    { field: 'destination', header: 'Destination', width: '15%' },
    { field: 'cronExpr', header: 'Cron', sortable: true, width: '15%' },
    { field: 'enabled', header: 'Status', sortable: true, width: '10%', type: 'status' },
    { field: 'nextRunAt', header: 'Next Run', sortable: true, width: '15%', type: 'date' },
    { field: 'lastRunAt', header: 'Last Run', sortable: true, width: '15%', type: 'date' },
    { field: 'actions', header: 'Actions', width: '20%', type: 'actions' }
  ];

  actions: CrudAction[] = [
    {
      icon: 'pi pi-play',
      label: 'Run Now',
      severity: 'success',
      tooltip: 'Execute immediately',
      action: (schedule: ScheduledTask) => this.runTaskNow(schedule)
    },
    {
      icon: 'pi pi-pause',
      label: 'Pause',
      severity: 'warn',
      tooltip: 'Pause automatic execution',
      show: (schedule: ScheduledTask) => schedule.enabled,
      action: (schedule: ScheduledTask) => this.pauseTask(schedule)
    },
    {
      icon: 'pi pi-play',
      label: 'Resume',
      severity: 'info',
      tooltip: 'Resume automatic execution',
      show: (schedule: ScheduledTask) => !schedule.enabled,
      action: (schedule: ScheduledTask) => this.resumeTask(schedule)
    },
    {
      icon: 'pi pi-pencil',
      label: 'Edit',
      severity: 'secondary',
      tooltip: 'Edit schedule',
      action: (schedule: ScheduledTask) => this.openEditModal(schedule)
    },
    {
      icon: 'pi pi-trash',
      label: 'Delete',
      severity: 'danger',
      tooltip: 'Delete schedule',
      action: (schedule: ScheduledTask) => this.deleteTask(schedule)
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
    
    // Load schedules, tools, and assets in parallel
    this.apiService.getSchedules().subscribe({
      next: (schedules) => {
        this.schedules = schedules.map(schedule => ({
          ...schedule,
          toolName: this.getToolName(schedule),
          destinationLabel: this.getDestinationLabel(schedule)
        }));
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading schedules:', error);
        this.notifyService.error('Error loading scheduled tasks');
        this.loading = false;
      }
    });

    this.apiService.tools().subscribe({
      next: (tools) => {
        this.tools = tools;
      },
      error: (error) => {
        console.error('Error loading tools:', error);
        this.notifyService.error('Error loading tools');
      }
    });

    this.apiService.getAssets().subscribe({
      next: (assets) => {
        this.assets = assets || [];
      },
      error: (error) => {
        console.error('Error loading assets:', error);
        this.notifyService.error('Error loading assets');
      }
    });
  }

  openNewModal(): void {
    this.editingTask = undefined;
    this.showModal = true;
  }

  openEditModal(task: ScheduledTask): void {
    this.editingTask = task;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingTask = undefined;
  }

  onTaskSaved(savedTask: ScheduledTask): void {
    if (this.editingTask) {
      // Update existing task in the list
      const index = this.schedules.findIndex(t => t.id === savedTask.id);
      if (index !== -1) {
        this.schedules[index] = savedTask;
      }
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Scheduled task updated successfully' });
    } else {
      // Add new task to the list
      this.schedules.push(savedTask);
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Scheduled task created successfully' });
    }
    this.closeModal();
  }

  deleteTask(task: ScheduledTask): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete the scheduled task "${task.name}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.apiService.deleteSchedule(task.id).subscribe({
          next: () => {
            this.schedules = this.schedules.filter(t => t.id !== task.id);
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Scheduled task deleted successfully' });
          },
          error: (error) => {
            console.error('Error deleting task:', error);
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error deleting scheduled task' });
          }
        });
      }
    });
  }

  getDestinationLabel(task: ScheduledTask): string {
    if (!task.assetId) {
      return 'Servidor (local)';
    }
    
    const asset = this.assets.find(a => a.id === task.assetId);
    if (asset) {
      return asset.hostname || asset.ip;
    }
    
    return 'Unknown asset';
  }

  getToolName(task: ScheduledTask): string {
    const tool = this.tools.find(t => t.name === task.toolName);
    return tool ? tool.name : task.toolName;
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  }

  trackByTaskId(index: number, task: ScheduledTask): string {
    return task.id;
  }

  runTaskNow(task: ScheduledTask): void {
    if (this.actionInProgress.has(task.id)) {
      return;
    }

    this.actionInProgress.add(task.id);
    
    this.apiService.runNowSchedule(task.id).subscribe({
      next: (response) => {
        console.log('Run now success:', response);
        this.messageService.add({ severity: 'success', summary: 'Success', detail: `Encolado (executionId: ${response.executionId})` });
        this.actionInProgress.delete(task.id);
        // Refresh list to get updated lastRunAt
        this.loadData();
      },
      error: (error) => {
        console.error('Error running task now:', error);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al ejecutar tarea ahora' });
        this.actionInProgress.delete(task.id);
      }
    });
  }

  pauseTask(task: ScheduledTask): void {
    if (this.actionInProgress.has(task.id)) {
      return;
    }

    this.confirmationService.confirm({
      message: `¿Pausar la tarea "${task.name}"? Dejará de ejecutarse automáticamente.`,
      header: 'Confirm Pause',
      icon: 'pi pi-pause',
      accept: () => {
        this.actionInProgress.add(task.id);
        
        this.apiService.pauseSchedule(task.id).subscribe({
          next: () => {
            console.log('Pause success:', task.id);
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Tarea pausada' });
            this.actionInProgress.delete(task.id);
            // Update task in list
            const index = this.schedules.findIndex(t => t.id === task.id);
            if (index !== -1) {
              this.schedules[index].enabled = false;
            }
            this.loadData();
          },
          error: (error) => {
            console.error('Error pausing task:', error);
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al pausar tarea' });
            this.actionInProgress.delete(task.id);
          }
        });
      }
    });
  }

  resumeTask(task: ScheduledTask): void {
    if (this.actionInProgress.has(task.id)) {
      return;
    }

    this.actionInProgress.add(task.id);
    
    this.apiService.resumeSchedule(task.id).subscribe({
      next: () => {
        console.log('Resume success:', task.id);
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Tarea reanudada' });
        this.actionInProgress.delete(task.id);
        // Update task in list
        const index = this.schedules.findIndex(t => t.id === task.id);
        if (index !== -1) {
          this.schedules[index].enabled = true;
        }
        this.loadData();
      },
      error: (error) => {
        console.error('Error resuming task:', error);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al reanudar tarea' });
        this.actionInProgress.delete(task.id);
      }
    });
  }

  isActionInProgress(taskId: string): boolean {
    return this.actionInProgress.has(taskId);
  }

  getSeverity(enabled: boolean): 'success' | 'danger' {
    return enabled ? 'success' : 'danger';
  }

  getStatusLabel(enabled: boolean): string {
    return enabled ? 'Enabled' : 'Disabled';
  }

  clearFilters(): void {
    this.globalFilter = '';
    this.selectedStatus = null;
  }

  // Form Methods
  onCreateSchedule(): void {
    this.formMode.set('create');
    this.formData.set(null);
    this.showForm.set(true);
  }

  onEditSchedule(schedule: ScheduledTask): void {
    this.formMode.set('edit');
    this.formData.set(schedule);
    this.showForm.set(true);
  }

  onViewSchedule(schedule: ScheduledTask): void {
    this.formMode.set('view');
    this.formData.set(schedule);
    this.showForm.set(true);
  }

  onFormSave(formData: any): void {
    this.formLoading.set(true);
    
    if (this.formMode() === 'create') {
      this.createSchedule(formData);
    } else {
      this.updateSchedule(formData);
    }
  }

  onFormCancel(): void {
    this.showForm.set(false);
    this.formData.set(null);
  }

  onFormClose(): void {
    this.showForm.set(false);
    this.formData.set(null);
  }

  private async createSchedule(data: any): Promise<void> {
    try {
      const schedule: Partial<ScheduledTask> = {
        name: data.name,
        toolName: this.tools.find(t => t.name === data.toolId)?.name || data.toolId,
        assetId: data.assetId || null,
        cronExpr: data.cronExpr,
        enabled: data.enabled || false,
        arguments: data.args || {}
      };

      await this.apiService.createSchedule(schedule as ScheduledTask);
      this.notifyService.success('Schedule created successfully');
      this.showForm.set(false);
      this.loadData();
    } catch (error) {
      this.notifyService.error('Failed to create schedule');
      console.error('Error creating schedule:', error);
    } finally {
      this.formLoading.set(false);
    }
  }

  private async updateSchedule(data: any): Promise<void> {
    try {
      const currentData = this.formData();
      if (!currentData) return;

      const updatedSchedule: Partial<ScheduledTask> = {
        ...currentData,
        name: data.name,
        toolName: this.tools.find(t => t.name === data.toolId)?.name || currentData.toolName,
        cronExpr: data.cronExpr,
        enabled: data.enabled,
        arguments: data.args || {}
      };

      await this.apiService.updateSchedule(currentData.id!, updatedSchedule as ScheduledTask);
      this.notifyService.success('Schedule updated successfully');
      this.showForm.set(false);
      this.loadData();
    } catch (error) {
      this.notifyService.error('Failed to update schedule');
      console.error('Error updating schedule:', error);
    } finally {
      this.formLoading.set(false);
    }
  }

  // Get form options
  getToolOptions(): { label: string; value: string }[] {
    return this.tools.map(tool => ({
      label: tool.name,
      value: tool.name
    }));
  }

  // Update form config with dynamic options
  getFormConfig(): CrudFormConfig {
    const config = { ...this.formConfig };
    
    // Update tool dropdown options
    const toolField = config.fields.find(f => f.key === 'toolId');
    if (toolField) {
      toolField.options = this.getToolOptions();
    }
    
    return config;
  }
}
