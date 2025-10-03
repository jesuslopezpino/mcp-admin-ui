import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class FormHandlerService {

  getFieldRequired(tool: any, prop: string): boolean {
    return tool?.jsonSchema?.required?.includes(prop) || false;
  }

  getFieldNames(tool: any): string[] {
    return tool?.jsonSchema?.properties ? Object.keys(tool.jsonSchema.properties) : [];
  }

  getFieldLabel(tool: any, fieldName: string): string {
    const prop = tool?.jsonSchema?.properties?.[fieldName];
    return prop?.description || fieldName;
  }

  getFieldPlaceholder(prop: any): string {
    return prop?.placeholder || prop?.description || '';
  }

  getFieldType(prop: any): string {
    if (prop?.type === 'boolean') return 'checkbox';
    if (prop?.enum) return 'select';
    if (prop?.type === 'number') return 'number';
    return 'text';
  }

  getFieldMin(prop: any): number | null {
    return prop?.minimum ?? null;
  }

  getFieldMax(prop: any): number | null {
    return prop?.maximum ?? null;
  }

  getFieldOptions(prop: any): string[] {
    return prop?.enum || [];
  }

  hasParameters(formValue: any): boolean {
    return Object.keys(formValue).some(key => {
      const value = formValue[key];
      return value !== null && value !== undefined && value !== '';
    });
  }

  getParameterCount(formValue: any): number {
    return Object.keys(formValue).filter(key => {
      const value = formValue[key];
      return value !== null && value !== undefined && value !== '';
    }).length;
  }
}
