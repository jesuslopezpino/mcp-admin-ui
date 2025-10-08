import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ApiService } from '../services/api.service';
import { NotifyService } from '../services/notify.service';
import { PlanTemplate } from '../models/plans';
import { CrudTableComponent, CrudColumn, CrudAction } from '../shared/crud-table/crud-table.component';
import { CrudFormComponent, CrudFormConfig } from '../shared/crud-form/crud-form.component';
import { BaseCrudComponent } from '../shared/base-crud/base-crud.component';

@Component({
  selector: 'app-plans-prime',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    CrudTableComponent,
    CrudFormComponent
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './plans-prime.component.html',
  styleUrls: ['./plans-prime.component.scss']
})
export class PlansPrimeComponent extends BaseCrudComponent<PlanTemplate> implements OnInit {
  // Additional properties specific to Plans
  statusOptions = [
    { label: 'All', value: null },
    { label: 'Enabled', value: true },
    { label: 'Disabled', value: false }
  ];
  selectedStatus: boolean | null = null;

  // CRUD Configuration
  columns: CrudColumn[] = [
    { field: 'name', header: 'Name', sortable: true, width: '20%' },
    { field: 'description', header: 'Description', width: '25%' },
    { field: 'tagsDisplay', header: 'Tags', width: '15%' },
    { field: 'enabled', header: 'Status', sortable: true, width: '10%', type: 'status' },
    { field: 'stepsCount', header: 'Steps', sortable: true, width: '10%' },
    { field: 'createdAt', header: 'Created', sortable: true, width: '10%', type: 'date' },
    { field: 'actions', header: 'Actions', width: '15%', type: 'actions' },
  ];

  actions: CrudAction[] = [
    {
      label: 'View',
      icon: 'pi pi-eye',
      severity: 'info',
      tooltip: 'View plan details',
      action: (item) => this.viewPlan(item)
    },
    {
      label: 'Edit',
      icon: 'pi pi-pencil',
      severity: 'warn',
      tooltip: 'Edit plan',
      action: (item) => this.openEditModal(item)
    },
    {
      label: 'Run Plan',
      icon: 'pi pi-play',
      severity: 'success',
      tooltip: 'Run plan',
      action: (item) => this.runPlan(item)
    },
    {
      label: 'Delete',
      icon: 'pi pi-trash',
      severity: 'danger',
      tooltip: 'Delete plan',
      action: (item) => this.deleteItem(item)
    }
  ];

  constructor(
    apiService: ApiService,
    notifyService: NotifyService,
    confirmationService: ConfirmationService,
    messageService: MessageService,
    private router: Router
  ) {
    super(apiService, notifyService, confirmationService, messageService);
  }

  override ngOnInit(): void {
    super.ngOnInit();
  }

  // Implement abstract methods
  override loadData(): void {
    this.loading.set(true);
    this.apiService.getPlans().subscribe({
      next: (response) => {
        this.data = response.content.map(plan => ({
          ...plan,
          tagsDisplay: plan.tags?.join(', ') || '',
          stepsCount: plan.steps?.length || 0
        }));
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading plans:', error);
        this.notifyService.error('Failed to load plans');
        this.loading.set(false);
      }
    });
  }

  getColumns(): CrudColumn[] {
    return this.columns;
  }

  getActions(): CrudAction[] {
    return this.actions;
  }

  getFormConfig(): CrudFormConfig {
    return {
      title: 'Plan',
      sections: [
        {
          name: 'basic',
          title: 'Basic Information',
          description: 'Configure the basic plan details'
        }
      ],
      fields: [
        {
          key: 'name',
          label: 'Plan Name',
          type: 'text',
          required: true,
          placeholder: 'Enter plan name',
          section: 'basic',
          order: 1
        },
        {
          key: 'description',
          label: 'Description',
          type: 'textarea',
          required: false,
          placeholder: 'Enter plan description',
          section: 'basic',
          order: 2
        },
        {
          key: 'enabled',
          label: 'Enabled',
          type: 'checkbox',
          required: false,
          section: 'basic',
          order: 3
        }
      ]
    };
  }

  getEntityName(): string {
    return 'plan';
  }

  getEntityNamePlural(): string {
    return 'plans';
  }

  protected async createItem(data: any): Promise<void> {
    try {
      const plan: Partial<PlanTemplate> = {
        name: data.name,
        description: data.description,
        enabled: data.enabled || false,
        steps: [],
        tags: []
      };

      await this.apiService.createPlan(plan as PlanTemplate).toPromise();
      this.handleSuccess('Plan created successfully');
    } catch (error) {
      this.handleError('Failed to create plan');
    }
  }

  protected async updateItem(data: any): Promise<void> {
    try {
      if (!this.editingItem) return;

      const updatedPlan: Partial<PlanTemplate> = {
        ...this.editingItem,
        name: data.name,
        description: data.description,
        enabled: data.enabled
      };

      await this.apiService.updatePlan(this.editingItem.id!, updatedPlan as PlanTemplate).toPromise();
      this.handleSuccess('Plan updated successfully');
    } catch (error) {
      this.handleError('Failed to update plan');
    }
  }

  protected async performDelete(item: PlanTemplate): Promise<void> {
    try {
      await this.apiService.deletePlan(item.id!).toPromise();
      this.handleSuccess('Plan deleted successfully');
    } catch (error) {
      this.handleError('Failed to delete plan');
    }
  }

  // Additional methods specific to Plans
  viewPlan(plan: PlanTemplate): void {
    this.router.navigate(['/plans', plan.id]);
  }

  runPlan(plan: PlanTemplate): void {
    this.router.navigate(['/plans', plan.id]);
  }
}