import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { JsonSchema } from '../../models/json-schema';
import { JsonSchemaFormService } from '../json-schema-form/json-schema-form.service';

@Component({
  selector: 'app-tool-args-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './tool-args-form.component.html',
  styleUrls: ['./tool-args-form.component.scss']
})
export class ToolArgsFormComponent implements OnInit, OnChanges {
  @Input() schema!: JsonSchema;
  @Input() value?: any;
  @Input() showJsonPreview: boolean = true;
  @Output() valueChange = new EventEmitter<any>();
  @Output() formValid = new EventEmitter<boolean>();

  form: FormGroup = new FormGroup({});
  showPreview = false;
  jsonPreview = '';

  constructor(
    private jsonSchemaService: JsonSchemaFormService
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.setupFormSubscription();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['schema'] || changes['value']) {
      this.buildForm();
    }
  }

  private buildForm(): void {
    if (!this.schema) {
      this.form = new FormGroup({});
      return;
    }

    this.form = this.jsonSchemaService.buildForm(this.schema, this.value);
    this.setupFormSubscription();
  }

  private setupFormSubscription(): void {
    this.form.valueChanges
      .pipe(
        debounceTime(150),
        distinctUntilChanged()
      )
      .subscribe(() => {
        const jsonValue = this.getValue();
        this.valueChange.emit(jsonValue);
        this.formValid.emit(this.form.valid);
        this.updateJsonPreview(jsonValue);
      });
  }

  getValue(): any {
    return this.jsonSchemaService.toJson(this.form, this.schema);
  }

  resetToDefaults(): void {
    if (!this.schema) return;
    const defaultValues = this.getDefaultValues(this.schema);
    this.form.patchValue(defaultValues);
  }

  private getDefaultValues(schema: JsonSchema): any {
    if (schema.type === 'object' && schema.properties) {
      const defaults: any = {};
      Object.entries(schema.properties).forEach(([key, propSchema]) => {
        defaults[key] = propSchema.default !== undefined ? propSchema.default : this.getDefaultValueForType(propSchema.type);
      });
      return defaults;
    }
    return schema.default !== undefined ? schema.default : this.getDefaultValueForType(schema.type);
  }

  private getDefaultValueForType(type?: string): any {
    switch (type) {
      case 'string': return '';
      case 'number':
      case 'integer': return 0;
      case 'boolean': return false;
      case 'array': return [];
      case 'object': return {};
      default: return null;
    }
  }

  private updateJsonPreview(value: any): void {
    this.jsonPreview = JSON.stringify(value, null, 2);
  }

  togglePreview(): void {
    this.showPreview = !this.showPreview;
  }

  getFieldType(key: string): string {
    if (!this.schema?.properties?.[key]) return 'string';
    return this.jsonSchemaService.getFieldType(this.schema.properties![key]);
  }

  getFieldLabel(key: string): string {
    if (!this.schema?.properties?.[key]) return key;
    return this.jsonSchemaService.getFieldLabel(key, this.schema.properties![key]);
  }

  getFieldDescription(key: string): string | undefined {
    if (!this.schema?.properties?.[key]) return undefined;
    return this.jsonSchemaService.getFieldDescription(this.schema.properties![key]);
  }

  isFieldRequired(key: string): boolean {
    if (!this.schema?.properties?.[key]) return false;
    return this.jsonSchemaService.isFieldRequired(key, this.schema);
  }

  getEnumOptions(key: string): Array<{label: string, value: any}> {
    if (!this.schema?.properties?.[key]) return [];
    return this.jsonSchemaService.getEnumOptions(this.schema.properties![key]);
  }

  getFieldError(key: string): string | null {
    const control = this.form.get(key);
    if (!control || !control.errors || !control.touched) return null;

    const errors = control.errors;
    if (errors['required']) return `${this.getFieldLabel(key)} is required`;
    if (errors['minlength']) return `Minimum length is ${errors['minlength'].requiredLength}`;
    if (errors['maxlength']) return `Maximum length is ${errors['maxlength'].requiredLength}`;
    if (errors['min']) return `Minimum value is ${errors['min'].min}`;
    if (errors['max']) return `Maximum value is ${errors['max'].max}`;
    if (errors['pattern']) return 'Invalid format';
    
    return 'Invalid value';
  }

  getObjectKeys(): string[] {
    if (!this.schema?.properties) return [];
    return Object.keys(this.schema.properties);
  }

  trackByKey(index: number, key: string): string {
    return key;
  }
}
