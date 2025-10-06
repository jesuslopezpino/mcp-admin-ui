import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ToolArgsFormComponent } from './tool-args-form.component';
import { JsonSchema } from '../../models/json-schema';

describe('ToolArgsFormComponent', () => {
  let component: ToolArgsFormComponent;
  let fixture: ComponentFixture<ToolArgsFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToolArgsFormComponent, ReactiveFormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ToolArgsFormComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should build form from schema', () => {
    const schema: JsonSchema = {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          title: 'Name',
          description: 'Enter your name'
        },
        age: {
          type: 'number',
          title: 'Age',
          minimum: 0,
          maximum: 120
        },
        email: {
          type: 'string',
          format: 'email',
          title: 'Email'
        },
        active: {
          type: 'boolean',
          title: 'Active',
          default: true
        }
      },
      required: ['name', 'email']
    };

    component.schema = schema;
    component.ngOnInit();

    expect(component.argsForm).toBeDefined();
    expect(component.formFields.length).toBe(4);
    expect(component.formFields[0].key).toBe('name');
    expect(component.formFields[0].type).toBe('text');
    expect(component.formFields[0].required).toBe(true);
  });

  it('should create correct input types', () => {
    const schema: JsonSchema = {
      type: 'object',
      properties: {
        textField: { type: 'string' },
        numberField: { type: 'number' },
        emailField: { type: 'string', format: 'email' },
        dateField: { type: 'string', format: 'date' },
        booleanField: { type: 'boolean' },
        enumField: { type: 'string', enum: ['option1', 'option2'] },
        jsonField: { type: 'object' }
      }
    };

    component.schema = schema;
    component.ngOnInit();

    const fields = component.formFields;
    expect(fields.find(f => f.key === 'textField')?.type).toBe('text');
    expect(fields.find(f => f.key === 'numberField')?.type).toBe('number');
    expect(fields.find(f => f.key === 'emailField')?.type).toBe('email');
    expect(fields.find(f => f.key === 'dateField')?.type).toBe('date');
    expect(fields.find(f => f.key === 'booleanField')?.type).toBe('checkbox');
    expect(fields.find(f => f.key === 'enumField')?.type).toBe('select');
    expect(fields.find(f => f.key === 'jsonField')?.type).toBe('json');
  });

  it('should apply validators correctly', () => {
    const schema: JsonSchema = {
      type: 'object',
      properties: {
        requiredField: {
          type: 'string',
          minLength: 3,
          maxLength: 10,
          pattern: '^[a-zA-Z]+$'
        },
        numberField: {
          type: 'number',
          minimum: 0,
          maximum: 100
        }
      },
      required: ['requiredField']
    };

    component.schema = schema;
    component.ngOnInit();

    const requiredField = component.argsForm.get('requiredField');
    const numberField = component.argsForm.get('numberField');

    expect(requiredField?.hasError('required')).toBe(true);
    expect(numberField?.hasError('required')).toBe(false);

    // Test minLength
    requiredField?.setValue('ab');
    expect(requiredField?.hasError('minlength')).toBe(true);

    // Test maxLength
    requiredField?.setValue('abcdefghijk');
    expect(requiredField?.hasError('maxlength')).toBe(true);

    // Test pattern
    requiredField?.setValue('abc123');
    expect(requiredField?.hasError('pattern')).toBe(true);

    // Test number min/max
    numberField?.setValue(-1);
    expect(numberField?.hasError('min')).toBe(true);

    numberField?.setValue(101);
    expect(numberField?.hasError('max')).toBe(true);
  });

  it('should handle initial values', () => {
    const schema: JsonSchema = {
      type: 'object',
      properties: {
        name: { type: 'string', default: 'Default Name' },
        age: { type: 'number' }
      }
    };

    component.schema = schema;
    component.initialValues = { name: 'Initial Name', age: 25 };
    component.ngOnInit();

    expect(component.argsForm.get('name')?.value).toBe('Initial Name');
    expect(component.argsForm.get('age')?.value).toBe(25);
  });

  it('should emit form changes', () => {
    const schema: JsonSchema = {
      type: 'object',
      properties: {
        name: { type: 'string' }
      }
    };

    component.schema = schema;
    component.ngOnInit();

    spyOn(component.formChange, 'emit');
    spyOn(component.formValid, 'emit');

    component.argsForm.get('name')?.setValue('Test Name');

    expect(component.formChange.emit).toHaveBeenCalledWith({ name: 'Test Name' });
    expect(component.formValid.emit).toHaveBeenCalledWith(true);
  });

  it('should reset to defaults', () => {
    const schema: JsonSchema = {
      type: 'object',
      properties: {
        name: { type: 'string', default: 'Default Name' },
        age: { type: 'number', default: 30 },
        active: { type: 'boolean', default: true }
      }
    };

    component.schema = schema;
    component.ngOnInit();

    // Set some values
    component.argsForm.patchValue({
      name: 'Custom Name',
      age: 25,
      active: false
    });

    // Reset to defaults
    component.resetToDefaults();

    expect(component.argsForm.get('name')?.value).toBe('Default Name');
    expect(component.argsForm.get('age')?.value).toBe(30);
    expect(component.argsForm.get('active')?.value).toBe(true);
  });

  it('should generate correct JSON output', () => {
    const schema: JsonSchema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
        config: { type: 'object' }
      }
    };

    component.schema = schema;
    component.ngOnInit();

    component.argsForm.patchValue({
      name: 'John Doe',
      age: '30',
      config: '{"setting": "value"}'
    });

    const jsonOutput = component.getFormValueAsJson();
    expect(jsonOutput.name).toBe('John Doe');
    expect(jsonOutput.age).toBe(30);
    expect(jsonOutput.config).toEqual({ setting: 'value' });
  });

  it('should handle empty schema', () => {
    component.schema = null;
    component.ngOnInit();

    expect(component.argsForm.value).toEqual({});
    expect(component.formFields.length).toBe(0);
  });

  it('should detect hasDefaults correctly', () => {
    const schemaWithDefaults: JsonSchema = {
      type: 'object',
      properties: {
        name: { type: 'string', default: 'Default' },
        age: { type: 'number' }
      }
    };

    const schemaWithoutDefaults: JsonSchema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' }
      }
    };

    component.schema = schemaWithDefaults;
    component.ngOnInit();
    expect(component.hasDefaults).toBe(true);

    component.schema = schemaWithoutDefaults;
    component.ngOnInit();
    expect(component.hasDefaults).toBe(false);
  });
});
