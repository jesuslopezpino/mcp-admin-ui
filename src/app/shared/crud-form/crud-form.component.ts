import { Component, input, output, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { PanelModule } from 'primeng/panel';

export interface CrudFormField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'email' | 'password' | 'dropdown' | 'checkbox' | 'date' | 'tags' | 'json';
  required?: boolean;
  placeholder?: string;
  options?: { label: string; value: any }[];
  validation?: any[];
  disabled?: boolean;
  readonly?: boolean;
  rows?: number;
  min?: number;
  max?: number;
  step?: number;
  dateFormat?: string;
  showTime?: boolean;
  helpText?: string;
  section?: string;
  order?: number;
}

export interface CrudFormConfig {
  title: string;
  fields: CrudFormField[];
  sections?: { name: string; title: string; description?: string }[];
  submitLabel?: string;
  cancelLabel?: string;
  showPreview?: boolean;
  previewTitle?: string;
}

export type CrudFormMode = 'create' | 'edit' | 'view';

@Component({
  selector: 'app-crud-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    CheckboxModule,
    InputNumberModule,
    DatePickerModule,
    TagModule,
    CardModule,
    PanelModule
  ],
  templateUrl: './crud-form.component.html',
  styleUrls: ['./crud-form.component.scss']
})
export class CrudFormComponent {
  // Input signals
  visible = input<boolean>(false);
  mode = input<CrudFormMode>('create');
  config = input.required<CrudFormConfig>();
  data = input<any>(null);
  loading = input<boolean>(false);

  // Output signals
  onSave = output<any>();
  onCancel = output<void>();
  onClose = output<void>();

  // Internal signals
  private _form = signal<FormGroup | null>(null);
  private _formData = signal<any>({});
  private _previewData = signal<any>({});

  // Computed signals
  form = computed(() => this._form());
  formData = computed(() => this._formData());
  previewData = computed(() => this._previewData());
  
  isCreate = computed(() => this.mode() === 'create');
  isEdit = computed(() => this.mode() === 'edit');
  isView = computed(() => this.mode() === 'view');
  
  dialogTitle = computed(() => {
    const config = this.config();
    const mode = this.mode();
    switch (mode) {
      case 'create': return `Create ${config.title}`;
      case 'edit': return `Edit ${config.title}`;
      case 'view': return `View ${config.title}`;
      default: return config.title;
    }
  });
  
  submitLabel = computed(() => {
    const config = this.config();
    if (config.submitLabel) return config.submitLabel;
    return this.isCreate() ? 'Create' : 'Save';
  });
  
  showSubmitButton = computed(() => !this.isView());
  
  fieldsBySection = computed(() => {
    const config = this.config();
    const fields = config.fields.sort((a, b) => (a.order || 0) - (b.order || 0));
    
    if (!config.sections || config.sections.length === 0) {
      return { 'default': fields };
    }
    
    const grouped: { [key: string]: CrudFormField[] } = {};
    config.sections.forEach(section => {
      grouped[section.name] = fields.filter(field => field.section === section.name);
    });
    
    // Add fields without section to default
    const fieldsWithoutSection = fields.filter(field => !field.section);
    if (fieldsWithoutSection.length > 0) {
      grouped['default'] = fieldsWithoutSection;
    }
    
    return grouped;
  });

  constructor(private fb: FormBuilder) {
    // Initialize form when config or data changes
    effect(() => {
      const config = this.config();
      const data = this.data();
      const mode = this.mode();
      
      if (config) {
        this.initializeForm(config, data, mode);
      }
    });
  }

  private initializeForm(config: CrudFormConfig, data: any, mode: CrudFormMode): void {
    const formControls: { [key: string]: any } = {};
    
    config.fields.forEach(field => {
      const validators = [];
      
      if (field.required) {
        validators.push(Validators.required);
      }
      
      if (field.validation) {
        validators.push(...field.validation);
      }
      
      const value = data?.[field.key] || this.getDefaultValue(field);
      const disabled = mode === 'view' || field.disabled || field.readonly;
      
      formControls[field.key] = this.fb.control(
        { value, disabled },
        validators
      );
    });
    
    const form = this.fb.group(formControls);
    this._form.set(form);
    this._formData.set(data || {});
    
    // Update preview data
    this.updatePreviewData();
  }

  private getDefaultValue(field: CrudFormField): any {
    switch (field.type) {
      case 'checkbox': return false;
      case 'number': return 0;
      case 'tags': return [];
      case 'json': return {};
      default: return '';
    }
  }

  private updatePreviewData(): void {
    const form = this.form();
    if (!form) return;
    
    const data: any = {};
    Object.keys(form.controls).forEach(key => {
      data[key] = form.get(key)?.value;
    });
    
    this._previewData.set(data);
  }

  onFormChange(): void {
    this.updatePreviewData();
  }

  onSaveClick(): void {
    const form = this.form();
    if (!form || form.invalid) return;
    
    const formData = form.getRawValue();
    this.onSave.emit(formData);
  }

  onCancelClick(): void {
    this.onCancel.emit();
  }

  onCloseClick(): void {
    this.onClose.emit();
  }

  getFieldValue(field: CrudFormField): any {
    const form = this.form();
    if (!form) return null;
    
    return form.get(field.key)?.value;
  }

  isFieldInvalid(field: CrudFormField): boolean {
    const form = this.form();
    if (!form) return false;
    
    const control = form.get(field.key);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getFieldError(field: CrudFormField): string {
    const form = this.form();
    if (!form) return '';
    
    const control = form.get(field.key);
    if (!control || !control.errors) return '';
    
    const errors = control.errors;
    if (errors['required']) return `${field.label} is required`;
    if (errors['email']) return 'Invalid email format';
    if (errors['min']) return `Minimum value is ${errors['min'].min}`;
    if (errors['max']) return `Maximum value is ${errors['max'].max}`;
    if (errors['minlength']) return `Minimum length is ${errors['minlength'].requiredLength}`;
    if (errors['maxlength']) return `Maximum length is ${errors['maxlength'].requiredLength}`;
    
    return 'Invalid value';
  }

  formatJsonValue(value: any): string {
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  }

  parseJsonValue(value: string): any {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  onJsonChange(field: CrudFormField, value: string): void {
    const form = this.form();
    if (!form) return;
    
    const parsed = this.parseJsonValue(value);
    form.get(field.key)?.setValue(parsed);
    this.updatePreviewData();
  }

  addTag(field: CrudFormField, tag: string): void {
    const form = this.form();
    if (!form) return;
    
    const currentTags = form.get(field.key)?.value || [];
    if (tag && !currentTags.includes(tag)) {
      const newTags = [...currentTags, tag];
      form.get(field.key)?.setValue(newTags);
      this.updatePreviewData();
    }
  }

  removeTag(field: CrudFormField, index: number): void {
    const form = this.form();
    if (!form) return;
    
    const currentTags = form.get(field.key)?.value || [];
    const newTags = currentTags.filter((_: any, i: number) => i !== index);
    form.get(field.key)?.setValue(newTags);
    this.updatePreviewData();
  }

  getSectionGridClass(sectionName: string): string {
    // Return appropriate grid classes based on section
    return 'grid gap-3 md:grid-cols-2';
  }

  getFieldClass(field: CrudFormField): string {
    // Return field-specific classes
    return 'flex flex-col gap-1';
  }
}
