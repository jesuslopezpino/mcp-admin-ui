export interface JsonSchema {
  type?: string;
  properties?: { [key: string]: JsonSchemaProperty };
  required?: string[];
  description?: string;
  title?: string;
  default?: any;
  enum?: any[];
  oneOf?: JsonSchema[];
  format?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  items?: JsonSchema;
  additionalProperties?: boolean | JsonSchema;
}

export interface JsonSchemaProperty extends JsonSchema {
  // Inherits all properties from JsonSchema
}

export interface JsonSchemaFormField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'date' | 'checkbox' | 'select' | 'textarea' | 'json';
  required: boolean;
  description?: string;
  defaultValue?: any;
  options?: { value: any; label: string }[];
  validators: any[];
  placeholder?: string;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}
