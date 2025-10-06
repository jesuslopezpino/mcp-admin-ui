import { Injectable } from '@angular/core';
import { FormGroup, FormControl, FormArray, Validators, AbstractControl } from '@angular/forms';
import { JsonSchema } from '../../models/json-schema';
import { JSType } from './json-schema.types';

@Injectable({
  providedIn: 'root'
})
export class JsonSchemaFormService {

  /**
   * Builds a reactive form from a JSON Schema
   */
  buildForm(schema: JsonSchema, initial?: any): FormGroup {
    if (!schema) {
      return new FormGroup({});
    }

    const formGroup = new FormGroup({});
    
    if (schema.type === 'object' && schema.properties) {
      // Handle object type
      Object.entries(schema.properties).forEach(([key, propSchema]) => {
        const isRequired = schema.required?.includes(key) || false;
        const control = this.createFormControl(propSchema, initial?.[key], isRequired);
        formGroup.addControl(key, control);
      });
    } else {
      // Handle primitive types at root level
      const control = this.createFormControl(schema, initial, false);
      formGroup.addControl('value', control);
    }

    return formGroup;
  }

  /**
   * Converts form values back to JSON according to schema
   */
  toJson(form: FormGroup, schema: JsonSchema): any {
    if (!form || !schema) {
      return {};
    }

    const formValue = form.value;

    if (schema.type === 'object' && schema.properties) {
      const result: any = {};
      
      Object.entries(schema.properties).forEach(([key, propSchema]) => {
        const value = formValue[key];
        if (value !== undefined && value !== null) {
          result[key] = this.coerceValue(value, propSchema);
        }
      });
      
      return result;
    } else {
      // Single value at root
      const value = formValue.value || formValue;
      return this.coerceValue(value, schema);
    }
  }

  /**
   * Creates a FormControl based on schema type and constraints
   */
  private createFormControl(schema: JsonSchema, initial?: any, isRequired: boolean = false): FormControl {
    const validators: any[] = [];
    
    if (isRequired) {
      validators.push(Validators.required);
    }

    // Add type-specific validators
    this.addTypeValidators(validators, schema);

    // Determine initial value
    let initialValue = initial;
    if (initialValue === undefined || initialValue === null) {
      initialValue = this.getDefaultValue(schema);
    }

    return new FormControl(initialValue, validators);
  }

  /**
   * Adds validators based on schema constraints
   */
  private addTypeValidators(validators: any[], schema: JsonSchema): void {
    if (schema.type === 'string') {
      if (schema.minLength !== undefined) {
        validators.push(Validators.minLength(schema.minLength));
      }
      if (schema.maxLength !== undefined) {
        validators.push(Validators.maxLength(schema.maxLength));
      }
      if (schema.pattern) {
        validators.push(Validators.pattern(schema.pattern));
      }
    } else if (schema.type === 'number' || schema.type === 'integer') {
      if (schema.minimum !== undefined) {
        validators.push(Validators.min(schema.minimum));
      }
      if (schema.maximum !== undefined) {
        validators.push(Validators.max(schema.maximum));
      }
    } else if (schema.type === 'array') {
      if (schema.minLength !== undefined) {
        validators.push(Validators.minLength(schema.minLength));
      }
      if (schema.maxLength !== undefined) {
        validators.push(Validators.maxLength(schema.maxLength));
      }
    }
  }

  /**
   * Gets default value for a schema
   */
  private getDefaultValue(schema: JsonSchema): any {
    if (schema.default !== undefined) {
      return schema.default;
    }

    switch (schema.type) {
      case 'string':
        return '';
      case 'number':
      case 'integer':
        return 0;
      case 'boolean':
        return false;
      case 'array':
        return [];
      case 'object':
        return {};
      default:
        return null;
    }
  }

  /**
   * Coerces form value to appropriate type based on schema
   */
  private coerceValue(value: any, schema: JsonSchema): any {
    if (value === null || value === undefined) {
      return value;
    }

    switch (schema.type) {
      case 'string':
        return String(value);
      case 'number':
        return Number(value);
      case 'integer':
        return Math.round(Number(value));
      case 'boolean':
        return Boolean(value);
      case 'array':
        if (Array.isArray(value)) {
          return value.map(item => this.coerceValue(item, schema.items || { type: 'string' }));
        }
        return [];
      case 'object':
        if (typeof value === 'object' && value !== null) {
          return value;
        }
        return {};
      default:
        return value;
    }
  }

  /**
   * Gets field type for UI rendering
   */
  getFieldType(schema: JsonSchema): string {
    if (schema.enum || schema.oneOf) {
      return 'enum';
    }
    if (schema.type === 'array') {
      return 'array';
    }
    if (schema.format === 'date' || schema.format === 'time' || schema.format === 'date-time') {
      return 'date';
    }
    return schema.type || 'string';
  }

  /**
   * Gets enum options for dropdown
   */
  getEnumOptions(schema: JsonSchema): Array<{label: string, value: any}> {
    if (schema.enum) {
      return schema.enum.map(value => ({
        label: String(value),
        value: value
      }));
    }
    
    if (schema.oneOf) {
      return schema.oneOf.map(option => ({
        label: option.title || String((option as any).const),
        value: (option as any).const
      }));
    }
    
    return [];
  }

  /**
   * Checks if field is required
   */
  isFieldRequired(key: string, schema: JsonSchema): boolean {
    return schema.required?.includes(key) || false;
  }

  /**
   * Gets field label
   */
  getFieldLabel(key: string, schema: JsonSchema): string {
    return schema.title || key;
  }

  /**
   * Gets field description
   */
  getFieldDescription(schema: JsonSchema): string | undefined {
    return schema.description;
  }
}

