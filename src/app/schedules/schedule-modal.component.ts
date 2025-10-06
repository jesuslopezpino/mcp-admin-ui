import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { NotifyService } from '../services/notify.service';
import { ToolSchemaService } from '../services/tool-schema.service';
import { ScheduledTask, Tool, Asset } from '../models/api';
import { JsonSchema } from '../models/json-schema';
import { ToolArgsFormComponent } from '../components/tool-args-form/tool-args-form.component';

@Component({
  selector: 'app-schedule-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ToolArgsFormComponent],
  template: `
<div class="modal-overlay" (click)="onCancel()">
  <div class="modal-container" (click)="$event.stopPropagation()" data-testid="schedule-modal">
    <div class="modal-header">
      <h2>{{ modalTitle }}</h2>
      <button class="modal-close" (click)="onCancel()" type="button">
        <span>&times;</span>
      </button>
    </div>

    <form [formGroup]="scheduleForm" (ngSubmit)="onSubmit()" class="modal-body">
      <div class="form-group">
        <label for="name">Name *</label>
        <input
          id="name"
          type="text"
          formControlName="name"
          class="form-control"
          placeholder="Enter task name">
      </div>

      <div class="form-group">
        <label for="toolName">Tool *</label>
        <select
          id="toolName"
          formControlName="toolName"
          class="form-control">
          <option value="">Select a tool</option>
          <option *ngFor="let tool of tools" [value]="tool.name">
            {{ tool.name }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="assetId">Destination</label>
        <select
          id="assetId"
          formControlName="assetId"
          class="form-control">
          <option [value]="null">Servidor (local)</option>
          <option *ngFor="let asset of assets" [value]="asset.id">
            {{ asset.hostname }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="cronExpr">Cron Expression *</label>
        <input
          id="cronExpr"
          type="text"
          formControlName="cronExpr"
          class="form-control"
          placeholder="e.g., */5 * * * *">
      </div>

      <!-- Dynamic Arguments Form -->
      <div class="form-group" *ngIf="toolSchema">
        <app-tool-args-form
          [schema]="toolSchema"
          [initialValues]="initialArguments"
          [showJsonPreview]="true"
          (formChange)="onArgumentsChange($event)"
          (formValid)="onArgumentsValid($event)">
        </app-tool-args-form>
      </div>

      <!-- Fallback JSON Editor (when no schema available) -->
      <div class="form-group" *ngIf="!toolSchema">
        <label for="arguments">Arguments (JSON)</label>
        <textarea
          id="arguments"
          formControlName="arguments"
          class="form-control"
          rows="6"
          placeholder='{"param1": "value1"}'>
        </textarea>
        <small class="form-text text-muted">
          No schema available for this tool. Please provide JSON arguments manually.
        </small>
      </div>

      <div class="form-group">
        <label class="checkbox-label">
          <input
            type="checkbox"
            formControlName="enabled"
            class="form-checkbox">
          <span class="checkmark"></span>
          Enabled
        </label>
      </div>
    </form>

    <div class="modal-footer">
      <button
        type="button"
        class="btn btn-secondary"
        (click)="onCancel()"
        [disabled]="isSubmitting">
        Cancel
      </button>
      <button
        type="button"
        class="btn btn-primary"
        (click)="onSubmit()"
        [disabled]="!isFormValid || isSubmitting"
        data-testid="schedule-save">
        <span *ngIf="isSubmitting" class="spinner"></span>
        <span *ngIf="isSubmitting">Saving...</span>
        <span *ngIf="!isSubmitting && isEditMode">Update</span>
        <span *ngIf="!isSubmitting && !isEditMode">Create</span>
      </button>
    </div>
  </div>
</div>
  `,
  styleUrls: ['./schedule-modal.component.scss']
})
export class ScheduleModalComponent implements OnInit {
  @Input() task?: ScheduledTask;
  @Input() tools: Tool[] = [];
  @Input() assets: Asset[] = [];
  @Output() saved = new EventEmitter<ScheduledTask>();
  @Output() closed = new EventEmitter<void>();

  scheduleForm: FormGroup;
  isSubmitting = false;
  jsonError: string | null = null;
  toolSchema: JsonSchema | null = null;
  initialArguments: any = {};
  argumentsValid = true;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private notifyService: NotifyService,
    private toolSchemaService: ToolSchemaService
  ) {
    this.scheduleForm = this.fb.group({
      name: ['', [Validators.required]],
      toolName: ['', [Validators.required]],
      assetId: [null],
      cronExpr: ['', [Validators.required]],
      enabled: [true],
      arguments: ['{}', [Validators.required]]
    });
  }

  ngOnInit(): void {
    if (this.task) {
      // Edit mode - populate form with existing task data
      this.scheduleForm.patchValue({
        name: this.task.name,
        toolName: this.task.toolName,
        assetId: this.task.assetId,
        cronExpr: this.task.cronExpr,
        enabled: this.task.enabled,
        arguments: JSON.stringify(this.task.arguments, null, 2)
      });
      
      // Load schema for existing tool
      if (this.task.toolName) {
        this.loadToolSchema(this.task.toolName);
        this.initialArguments = this.task.arguments;
      }
    }

    // Watch for tool name changes
    this.scheduleForm.get('toolName')?.valueChanges.subscribe(toolName => {
      if (toolName) {
        this.loadToolSchema(toolName);
      } else {
        this.toolSchema = null;
        this.initialArguments = {};
      }
    });
  }

  onSubmit(): void {
    if (this.scheduleForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    // Validate JSON arguments
    const argumentsValue = this.scheduleForm.get('arguments')?.value;
    let parsedArguments;
    
    try {
      parsedArguments = JSON.parse(argumentsValue);
      this.jsonError = null;
    } catch (error) {
      this.jsonError = 'JSON inválido';
      this.notifyService.error('Invalid JSON in arguments field');
      return;
    }

    this.isSubmitting = true;

    const formData = {
      ...this.scheduleForm.value,
      arguments: parsedArguments
    };

    const operation = this.task 
      ? this.apiService.updateSchedule(this.task.id, formData)
      : this.apiService.createSchedule(formData);

    operation.subscribe({
      next: (savedTask) => {
        this.isSubmitting = false;
        this.saved.emit(savedTask);
      },
      error: (error) => {
        this.isSubmitting = false;
        console.error('Error saving schedule:', error);
        this.notifyService.error('Error saving scheduled task: ' + (error.error?.message || error.message || 'Unknown error'));
      }
    });
  }

  onCancel(): void {
    this.closed.emit();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.scheduleForm.controls).forEach(key => {
      const control = this.scheduleForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string | null {
    const field = this.scheduleForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${fieldName} is required`;
      }
    }
    return null;
  }

  get isFormValid(): boolean {
    return this.scheduleForm.valid && !this.jsonError && this.argumentsValid;
  }

  get isEditMode(): boolean {
    return !!this.task;
  }

  get modalTitle(): string {
    return this.isEditMode ? 'Edit Scheduled Task' : 'Create Scheduled Task';
  }

  private loadToolSchema(toolName: string): void {
    this.toolSchemaService.getSchema(toolName).subscribe({
      next: (schema) => {
        this.toolSchema = schema;
        this.initialArguments = {};
      },
      error: (error) => {
        console.warn('Could not load schema for tool:', toolName, error);
        this.toolSchema = null;
        this.initialArguments = {};
      }
    });
  }

  onArgumentsChange(args: any): void {
    // Update the arguments field in the form
    this.scheduleForm.patchValue({
      arguments: JSON.stringify(args, null, 2)
    });
  }

  onArgumentsValid(valid: boolean): void {
    this.argumentsValid = valid;
  }
}
