import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { JsonSchema, JsonSchemaFormField } from '../../models/json-schema';

@Component({
    selector: 'app-tool-args-form',
    imports: [CommonModule, ReactiveFormsModule],
    template: `
    @if (argsForm && schema) {
      <div class="tool-args-form">
        <div class="form-header">
          <h4>Tool Arguments</h4>
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary"
            (click)="resetToDefaults()"
            [disabled]="!hasDefaults"
            data-testid="reset-defaults">
            Reset to Defaults
          </button>
        </div>
        <form [formGroup]="argsForm" class="args-form">
          @for (field of formFields; track field) {
            <div
              class="form-group"
              [attr.data-testid]="'arg-field-' + field.key">
              <label [for]="field.key" class="form-label">
                {{ field.label }}
                @if (field.required) {
                  <span class="required">*</span>
                }
                @if (field.description) {
                  <span
                    class="field-description"
                    [title]="field.description">
                    ℹ️
                  </span>
                }
              </label>
              <!-- Text Input -->
              @if (field.type === 'text') {
                <input
                  [id]="field.key"
                  type="text"
                  [formControlName]="field.key"
                  [placeholder]="field.placeholder"
                  class="form-control"
                  [class.is-invalid]="argsForm.get(field.key)?.invalid && argsForm.get(field.key)?.touched">
              }
              <!-- Email Input -->
              @if (field.type === 'email') {
                <input
                  [id]="field.key"
                  type="email"
                  [formControlName]="field.key"
                  [placeholder]="field.placeholder"
                  class="form-control"
                  [class.is-invalid]="argsForm.get(field.key)?.invalid && argsForm.get(field.key)?.touched">
              }
              <!-- Date Input -->
              @if (field.type === 'date') {
                <input
                  [id]="field.key"
                  type="date"
                  [formControlName]="field.key"
                  class="form-control"
                  [class.is-invalid]="argsForm.get(field.key)?.invalid && argsForm.get(field.key)?.touched">
              }
              <!-- Number Input -->
              @if (field.type === 'number') {
                <input
                  [id]="field.key"
                  type="number"
                  [formControlName]="field.key"
                  [placeholder]="field.placeholder"
                  [attr.min]="field.min"
                  [attr.max]="field.max"
                  class="form-control"
                  [class.is-invalid]="argsForm.get(field.key)?.invalid && argsForm.get(field.key)?.touched">
              }
              <!-- Checkbox -->
              @if (field.type === 'checkbox') {
                <div
                  class="form-check">
                  <input
                    [id]="field.key"
                    type="checkbox"
                    [formControlName]="field.key"
                    class="form-check-input">
                    <label [for]="field.key" class="form-check-label">
                      {{ field.label }}
                    </label>
                  </div>
                }
                <!-- Select -->
                @if (field.type === 'select') {
                  <select
                    [id]="field.key"
                    [formControlName]="field.key"
                    class="form-control"
                    [class.is-invalid]="argsForm.get(field.key)?.invalid && argsForm.get(field.key)?.touched">
                    <option value="">{{ field.placeholder || 'Select an option' }}</option>
                    @for (option of field.options; track option) {
                      <option
                        [value]="option.value">
                        {{ option.label }}
                      </option>
                    }
                  </select>
                }
                <!-- Textarea for JSON -->
                @if (field.type === 'textarea' || field.type === 'json') {
                  <textarea
                    [id]="field.key"
                    [formControlName]="field.key"
                    [placeholder]="field.placeholder"
                    [rows]="field.type === 'json' ? 4 : 3"
                    class="form-control"
                    [class.is-invalid]="argsForm.get(field.key)?.invalid && argsForm.get(field.key)?.touched">
                  </textarea>
                }
                <!-- Validation Messages -->
                @if (argsForm.get(field.key)?.invalid && argsForm.get(field.key)?.touched) {
                  <div
                    class="invalid-feedback">
                    @if (argsForm.get(field.key)?.errors?.['required']) {
                      <div>
                        {{ field.label }} is required
                      </div>
                    }
                    @if (argsForm.get(field.key)?.errors?.['minlength']) {
                      <div>
                        {{ field.label }} must be at least {{ field.minLength }} characters
                      </div>
                    }
                    @if (argsForm.get(field.key)?.errors?.['maxlength']) {
                      <div>
                        {{ field.label }} must be no more than {{ field.maxLength }} characters
                      </div>
                    }
                    @if (argsForm.get(field.key)?.errors?.['min']) {
                      <div>
                        {{ field.label }} must be at least {{ field.min }}
                      </div>
                    }
                    @if (argsForm.get(field.key)?.errors?.['max']) {
                      <div>
                        {{ field.label }} must be no more than {{ field.max }}
                      </div>
                    }
                    @if (argsForm.get(field.key)?.errors?.['pattern']) {
                      <div>
                        {{ field.label }} format is invalid
                      </div>
                    }
                    @if (argsForm.get(field.key)?.errors?.['email']) {
                      <div>
                        {{ field.label }} must be a valid email
                      </div>
                    }
                    @if (argsForm.get(field.key)?.errors?.['json']) {
                      <div>
                        {{ field.label }} must be valid JSON
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </form>
          <!-- JSON Output Preview -->
          @if (showJsonPreview) {
            <div class="json-preview">
              <h5>Generated JSON:</h5>
              <pre class="json-output">{{ getFormValueAsJson() | json }}</pre>
            </div>
          }
        </div>
      }
    `,
    styleUrls: ['./tool-args-form.component.scss']
})
export class ToolArgsFormComponent implements OnInit, OnChanges {
  @Input() schema: JsonSchema | null = null;
  @Input() initialValues: any = {};
  @Input() showJsonPreview = false;
  @Output() formChange = new EventEmitter<any>();
  @Output() formValid = new EventEmitter<boolean>();

  argsForm: FormGroup = this.fb.group({});
  formFields: JsonSchemaFormField[] = [];
  hasDefaults = false;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    if (this.schema) {
      this.buildForm();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['schema'] && this.schema) {
      this.buildForm();
    }
    if (changes['initialValues'] && this.argsForm) {
      this.updateFormValues();
    }
  }

  private buildForm(): void {
    if (!this.schema || !this.schema.properties) {
      this.argsForm = this.fb.group({});
      this.formFields = [];
      return;
    }

    const formControls: { [key: string]: FormControl } = {};
    this.formFields = [];

    Object.keys(this.schema.properties).forEach(key => {
      const property = this.schema!.properties![key];
      const field = this.createFormField(key, property);
      this.formFields.push(field);
      
      formControls[key] = new FormControl(
        this.getInitialValue(key, property),
        field.validators
      );
    });

    this.argsForm = this.fb.group(formControls);
    this.hasDefaults = this.formFields.some(field => field.defaultValue !== undefined);

    // Subscribe to form changes
    this.argsForm.valueChanges.subscribe(value => {
      this.formChange.emit(value);
      this.formValid.emit(this.argsForm.valid);
    });

    // Emit initial values
    this.formChange.emit(this.argsForm.value);
    this.formValid.emit(this.argsForm.valid);
  }

  private createFormField(key: string, property: JsonSchema): JsonSchemaFormField {
    const field: JsonSchemaFormField = {
      key,
      label: property.title || key,
      type: this.determineInputType(property),
      required: this.schema?.required?.includes(key) || false,
      description: property.description,
      defaultValue: property.default,
      validators: this.createValidators(property),
      placeholder: this.getPlaceholder(property)
    };

    // Add specific validators based on type
    if (property.minimum !== undefined) field.min = property.minimum;
    if (property.maximum !== undefined) field.max = property.maximum;
    if (property.minLength !== undefined) field.minLength = property.minLength;
    if (property.maxLength !== undefined) field.maxLength = property.maxLength;
    if (property.pattern) field.pattern = property.pattern;

    // Handle enum/oneOf options
    if (property.enum) {
      field.options = property.enum.map(value => ({
        value,
        label: String(value)
      }));
    } else if (property.oneOf) {
      field.options = property.oneOf.map(option => ({
        value: (option as any).const,
        label: (option as any).title || String((option as any).const)
      }));
    }

    return field;
  }

  private determineInputType(property: JsonSchema): 'text' | 'number' | 'email' | 'date' | 'checkbox' | 'select' | 'textarea' | 'json' {
    if (property.type === 'boolean') return 'checkbox';
    if (property.type === 'number' || property.type === 'integer') return 'number';
    if (property.format === 'email') return 'email';
    if (property.format === 'date') return 'date';
    if (property.enum || property.oneOf) return 'select';
    if (property.type === 'array' || property.type === 'object') return 'json';
    return 'text';
  }

  private createValidators(property: JsonSchema): any[] {
    const validators = [];

    if (this.schema?.required?.includes(property.title || '')) {
      validators.push(Validators.required);
    }

    if (property.minLength !== undefined) {
      validators.push(Validators.minLength(property.minLength));
    }

    if (property.maxLength !== undefined) {
      validators.push(Validators.maxLength(property.maxLength));
    }

    if (property.minimum !== undefined) {
      validators.push(Validators.min(property.minimum));
    }

    if (property.maximum !== undefined) {
      validators.push(Validators.max(property.maximum));
    }

    if (property.pattern) {
      validators.push(Validators.pattern(property.pattern));
    }

    if (property.format === 'email') {
      validators.push(Validators.email);
    }

    return validators;
  }

  private getInitialValue(key: string, property: JsonSchema): any {
    // Use initial values if provided
    if (this.initialValues && this.initialValues[key] !== undefined) {
      return this.initialValues[key];
    }

    // Use default value from schema
    if (property.default !== undefined) {
      return property.default;
    }

    // Use appropriate default based on type
    switch (this.determineInputType(property)) {
      case 'checkbox': return false;
      case 'number': return null;
      case 'select': return '';
      case 'json': return '{}';
      default: return '';
    }
  }

  private getPlaceholder(property: JsonSchema): string {
    if (property.description) {
      return property.description;
    }
    
    switch (this.determineInputType(property)) {
      case 'email': return 'Enter email address';
      case 'date': return 'Select date';
      case 'number': return 'Enter number';
      case 'json': return 'Enter JSON object';
      default: return 'Enter value';
    }
  }

  private updateFormValues(): void {
    if (this.argsForm && this.initialValues) {
      this.argsForm.patchValue(this.initialValues);
    }
  }

  resetToDefaults(): void {
    if (!this.schema || !this.schema.properties) return;

    const defaultValues: any = {};
    Object.keys(this.schema.properties).forEach(key => {
      const property = this.schema!.properties![key];
      if (property.default !== undefined) {
        defaultValues[key] = property.default;
      } else {
        // Reset to appropriate default based on type
        const field = this.formFields.find(f => f.key === key);
        if (field) {
          switch (field.type) {
            case 'checkbox': defaultValues[key] = false; break;
            case 'number': defaultValues[key] = null; break;
            case 'select': defaultValues[key] = ''; break;
            case 'json': defaultValues[key] = '{}'; break;
            default: defaultValues[key] = ''; break;
          }
        }
      }
    });

    this.argsForm.patchValue(defaultValues);
  }

  getFormValueAsJson(): any {
    if (!this.argsForm) return {};
    
    const value = this.argsForm.value;
    const result: any = {};

    Object.keys(value).forEach(key => {
      const field = this.formFields.find(f => f.key === key);
      if (field && value[key] !== null && value[key] !== '') {
        if (field.type === 'json') {
          try {
            result[key] = JSON.parse(value[key]);
          } catch {
            result[key] = value[key];
          }
        } else if (field.type === 'number') {
          result[key] = Number(value[key]);
        } else {
          result[key] = value[key];
        }
      }
    });

    return result;
  }
}
