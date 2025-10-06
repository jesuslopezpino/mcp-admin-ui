import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ApiService } from '../services/api.service';
import { NotifyService } from '../services/notify.service';
import { PlanTemplate } from '../models/plans';
import { CrudTableComponent, CrudColumn, CrudAction } from '../shared/crud-table/crud-table.component';

@Component({
  selector: 'app-plans-prime',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CrudTableComponent
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './plans-prime.component.html',
  styleUrls: ['./plans-prime.component.scss']
})
export class PlansPrimeComponent implements OnInit {
  plans: PlanTemplate[] = [];
  loading = true;
  showModal = false;
  editingPlan: PlanTemplate | undefined = undefined;
  actionInProgress: Set<string> = new Set();

  // Table state
  selectedPlans: PlanTemplate[] = [];
  globalFilter = '';
  statusOptions = [
    { label: 'All', value: null },
    { label: 'Enabled', value: true },
    { label: 'Disabled', value: false }
  ];
  selectedStatus: boolean | null = null;

  // CRUD Configuration
  columns: CrudColumn[] = [
    { field: 'name', header: 'Name', sortable: true, width: '25%' },
    { field: 'description', header: 'Description', width: '30%' },
    { field: 'tags', header: 'Tags', width: '15%' },
    { field: 'enabled', header: 'Status', sortable: true, width: '10%', type: 'status' },
    { field: 'steps', header: 'Steps', sortable: true, width: '10%' },
    { field: 'createdAt', header: 'Created', sortable: true, width: '15%', type: 'date' },
    { field: 'actions', header: 'Actions', width: '20%', type: 'actions' }
  ];

  actions: CrudAction[] = [
    {
      icon: 'pi pi-play',
      label: 'Run Plan',
      severity: 'success',
      tooltip: 'Execute plan immediately',
      action: (plan: PlanTemplate) => this.runPlan(plan)
    },
    {
      icon: 'pi pi-pause',
      label: 'Disable',
      severity: 'warn',
      tooltip: 'Disable plan',
      show: (plan: PlanTemplate) => plan.enabled,
      action: (plan: PlanTemplate) => this.disablePlan(plan)
    },
    {
      icon: 'pi pi-play',
      label: 'Enable',
      severity: 'info',
      tooltip: 'Enable plan',
      show: (plan: PlanTemplate) => !plan.enabled,
      action: (plan: PlanTemplate) => this.enablePlan(plan)
    },
    {
      icon: 'pi pi-pencil',
      label: 'Edit',
      severity: 'secondary',
      tooltip: 'Edit plan',
      action: (plan: PlanTemplate) => this.openEditModal(plan)
    },
    {
      icon: 'pi pi-list',
      label: 'View Runs',
      severity: 'info',
      tooltip: 'View plan runs',
      action: (plan: PlanTemplate) => this.viewRuns(plan)
    },
    {
      icon: 'pi pi-trash',
      label: 'Delete',
      severity: 'danger',
      tooltip: 'Delete plan',
      action: (plan: PlanTemplate) => this.deletePlan(plan)
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
    
    this.apiService.getPlans({}).subscribe({
      next: (response) => {
        this.plans = response.content || response;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading plans:', error);
        this.notifyService.error('Error loading plans');
        this.loading = false;
      }
    });
  }

  openNewModal(): void {
    this.editingPlan = undefined;
    this.showModal = true;
  }

  openEditModal(plan: PlanTemplate): void {
    this.editingPlan = plan;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingPlan = undefined;
  }

  onPlanSaved(savedPlan: PlanTemplate): void {
    if (this.editingPlan) {
      // Update existing plan in the list
      const index = this.plans.findIndex(p => p.id === savedPlan.id);
      if (index !== -1) {
        this.plans[index] = savedPlan;
      }
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Plan updated successfully' });
    } else {
      // Add new plan to the list
      this.plans.push(savedPlan);
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Plan created successfully' });
    }
    this.closeModal();
  }

  deletePlan(plan: PlanTemplate): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete the plan "${plan.name}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.apiService.deletePlan(plan.id).subscribe({
          next: () => {
            this.plans = this.plans.filter(p => p.id !== plan.id);
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Plan deleted successfully' });
          },
          error: (error) => {
            console.error('Error deleting plan:', error);
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error deleting plan' });
          }
        });
      }
    });
  }

  runPlan(plan: PlanTemplate): void {
    if (this.actionInProgress.has(plan.id)) {
      return;
    }

    this.actionInProgress.add(plan.id);
    
    // Navigate to plan detail with run action
    window.location.href = `/plans/${plan.id}?action=run`;
  }

  disablePlan(plan: PlanTemplate): void {
    if (this.actionInProgress.has(plan.id)) {
      return;
    }

    this.confirmationService.confirm({
      message: `Disable plan "${plan.name}"?`,
      header: 'Confirm Disable',
      icon: 'pi pi-pause',
      accept: () => {
        this.actionInProgress.add(plan.id);
        
        // Update plan in list
        const index = this.plans.findIndex(p => p.id === plan.id);
        if (index !== -1) {
          this.plans[index].enabled = false;
        }
        
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Plan disabled' });
        this.actionInProgress.delete(plan.id);
      }
    });
  }

  enablePlan(plan: PlanTemplate): void {
    if (this.actionInProgress.has(plan.id)) {
      return;
    }

    this.actionInProgress.add(plan.id);
    
    // Update plan in list
    const index = this.plans.findIndex(p => p.id === plan.id);
    if (index !== -1) {
      this.plans[index].enabled = true;
    }
    
    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Plan enabled' });
    this.actionInProgress.delete(plan.id);
  }

  viewRuns(plan: PlanTemplate): void {
    window.location.href = `/plans/runs?planId=${plan.id}`;
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  }

  trackByPlanId(index: number, plan: PlanTemplate): string {
    return plan.id;
  }

  isActionInProgress(planId: string): boolean {
    return this.actionInProgress.has(planId);
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
}
