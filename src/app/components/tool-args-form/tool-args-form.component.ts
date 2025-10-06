import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { JsonSchema, JsonSchemaFormField } from '../../models/json-schema';
import { 
  InputText, 
  InputNumber, 
  ToggleSwitch, 
  Select, 
  Button, 
  Card, 
  Message,
  Badge,
  Tooltip
} from '../../ui/ui-prime';

@Component({
    selector: 'app-tool-args-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, InputText, InputNumber, ToggleSwitch, Select, Button, Card, Message, Badge, Tooltip],
    templateUrl: './tool-args-form.component.html',
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
