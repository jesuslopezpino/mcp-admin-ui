import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ApiService } from '../services/api.service';
import { PlanTemplate, PlanStep, RunPlanRequest, OnFail } from '../models/plans';

@Component({
    selector: 'app-plan-detail',
    imports: [FormsModule, RouterModule],
    templateUrl: './plan-detail.component.html',
    styleUrls: ['./plan-detail.component.scss']
})
export class PlanDetailComponent implements OnInit, OnDestroy {
  
  // Data
  plan: PlanTemplate | null = null;
  tools: any[] = [];
  assets: any[] = [];
  loading = false;
  saving = false;
  error: string | null = null;
  
  // Form data
  planForm = {
    name: '',
    description: '',
    tags: [] as string[],
    enabled: true
  };
  
  steps: PlanStep[] = [];
  newTag = '';
  
  // Run plan modal
  showRunModal = false;
  runForm = {
    assetId: '',
    requestedBy: '',
    correlationId: ''
  };
  
  // State
  isNew = false;
  planId: string | null = null;
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private apiService: ApiService,
    public router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}
  
  ngOnInit(): void {
    this.planId = this.route.snapshot.paramMap.get('id');
    this.isNew = this.planId === 'new' || !this.planId;
    
    if (this.isNew) {
      this.initializeNewPlan();
    } else {
      this.loadPlan();
    }
    
    this.loadTools();
    this.loadAssets();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  // ================================================
  // Data Loading
  // ================================================
  
  loadPlan(): void {
    if (!this.planId) return;
    
    this.loading = true;
    this.error = null;
    
    this.apiService.getPlan(this.planId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (plan) => {
        this.plan = plan;
        this.planForm = {
          name: plan.name,
          description: plan.description || '',
          tags: plan.tags || [],
          enabled: plan.enabled
        };
        this.steps = [...(plan.steps || [])];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Error loading plan: ' + (err.error?.message || err.message);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
  
  loadTools(): void {
    this.apiService.getTools().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (tools: any[]) => {
        this.tools = tools;
      },
      error: (err: any) => {
        console.error('Error loading tools:', err);
      }
    });
  }
  
  loadAssets(): void {
    this.apiService.getAssets().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (assets: any[]) => {
        this.assets = assets;
      },
      error: (err: any) => {
        console.error('Error loading assets:', err);
      }
    });
  }
  
  initializeNewPlan(): void {
    this.plan = {
      id: '',
      name: '',
      description: '',
      tags: [],
      enabled: true,
      steps: []
    };
    this.steps = [];
  }
  
  // ================================================
  // Form Actions
  // ================================================
  
  savePlan(): void {
    if (!this.validateForm()) return;
    
    this.saving = true;
    this.error = null;
    
    const planData = {
      ...this.planForm,
      steps: this.steps
    };
    
    const operation = this.isNew 
      ? this.apiService.createPlan(planData)
      : this.apiService.updatePlan(this.planId!, planData);
    
    operation.pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (savedPlan) => {
        this.plan = savedPlan;
        this.planId = savedPlan.id;
        this.isNew = false;
        this.saving = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Error saving plan: ' + (err.error?.message || err.message);
        this.saving = false;
        this.cdr.detectChanges();
      }
    });
  }
  
  saveAndBack(): void {
    this.savePlan();
    // Navigate back after a short delay to allow save to complete
    setTimeout(() => {
      this.router.navigate(['/plans']);
    }, 1000);
  }
  
  runPlan(): void {
    if (!this.planId) {
      this.error = 'Please save the plan before running it';
      return;
    }
    
    this.showRunModal = true;
  }
  
  executeRun(): void {
    if (!this.planId) return;
    
    const runRequest: RunPlanRequest = {
      assetId: this.runForm.assetId || undefined,
      requestedBy: this.runForm.requestedBy,
      correlationId: this.runForm.correlationId || undefined
    };
    
    this.apiService.runPlan(this.planId, runRequest).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (planRun) => {
        this.showRunModal = false;
        this.router.navigate(['/plans/runs', planRun.id]);
      },
      error: (err) => {
        this.error = 'Error running plan: ' + (err.error?.message || err.message);
        this.cdr.detectChanges();
      }
    });
  }
  
  cancelRun(): void {
    this.showRunModal = false;
    this.runForm = {
      assetId: '',
      requestedBy: '',
      correlationId: ''
    };
  }
  
  // ================================================
  // Steps Management
  // ================================================
  
  addStep(): void {
    const newStep: PlanStep = {
      orderIndex: this.steps.length + 1,
      toolName: '',
      argumentsJson: {},
      onFail: 'ABORT',
      retryCount: 0,
      retryDelayMs: 0,
      requiresConfirm: false
    };
    this.steps.push(newStep);
  }
  
  removeStep(index: number): void {
    this.steps.splice(index, 1);
    this.reorderSteps();
  }
  
  moveStepUp(index: number): void {
    if (index > 0) {
      const step = this.steps.splice(index, 1)[0];
      this.steps.splice(index - 1, 0, step);
      this.reorderSteps();
    }
  }
  
  moveStepDown(index: number): void {
    if (index < this.steps.length - 1) {
      const step = this.steps.splice(index, 1)[0];
      this.steps.splice(index + 1, 0, step);
      this.reorderSteps();
    }
  }
  
  reorderSteps(): void {
    this.steps.forEach((step, index) => {
      step.orderIndex = index + 1;
    });
  }
  
  // ================================================
  // Tags Management
  // ================================================
  
  addTag(): void {
    if (this.newTag.trim() && !this.planForm.tags.includes(this.newTag.trim())) {
      this.planForm.tags.push(this.newTag.trim());
      this.newTag = '';
    }
  }
  
  removeTag(tag: string): void {
    const index = this.planForm.tags.indexOf(tag);
    if (index > -1) {
      this.planForm.tags.splice(index, 1);
    }
  }
  
  // ================================================
  // Validation
  // ================================================
  
  validateForm(): boolean {
    if (!this.planForm.name.trim()) {
      this.error = 'Plan name is required';
      return false;
    }
    
    if (this.steps.length === 0) {
      this.error = 'At least one step is required';
      return false;
    }
    
    for (let i = 0; i < this.steps.length; i++) {
      const step = this.steps[i];
      
      if (!step.toolName.trim()) {
        this.error = `Step ${i + 1}: Tool name is required`;
        return false;
      }
      
      if (step.onFail === 'RETRY' && step.retryCount < 1) {
        this.error = `Step ${i + 1}: Retry count must be at least 1 when onFail is RETRY`;
        return false;
      }
      
      if (!this.isValidJson(step.argumentsJson)) {
        this.error = `Step ${i + 1}: Invalid JSON in arguments`;
        return false;
      }
    }
    
    return true;
  }
  
  isValidJson(json: any): boolean {
    if (typeof json === 'string') {
      try {
        JSON.parse(json);
        return true;
      } catch {
        return false;
      }
    }
    return true;
  }
  
  // ================================================
  // Helper Methods
  // ================================================
  
  getOnFailOptions(): OnFail[] {
    return ['ABORT', 'CONTINUE', 'RETRY'];
  }
  
  formatJson(json: any): string {
    if (typeof json === 'string') {
      try {
        return JSON.stringify(JSON.parse(json), null, 2);
      } catch {
        return json;
      }
    }
    return JSON.stringify(json, null, 2);
  }
  
  updateJsonValue(step: PlanStep, value: string): void {
    try {
      step.argumentsJson = JSON.parse(value);
    } catch {
      // Keep the string value for editing
      step.argumentsJson = value;
    }
  }
}
