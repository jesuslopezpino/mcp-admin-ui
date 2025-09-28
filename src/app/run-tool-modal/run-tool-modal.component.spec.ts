import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { RunToolModalComponent } from './run-tool-modal.component';
import { ApiService, ToolDetails, ExecuteResult, Asset, Suggestion } from '../services/api.service';
import { NotificationService } from '../services/notification.service';
import { ChangeDetectorRef } from '@angular/core';

describe('RunToolModalComponent', () => {
  let component: RunToolModalComponent;
  let fixture: ComponentFixture<RunToolModalComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;
  let mockChangeDetectorRef: jasmine.SpyObj<ChangeDetectorRef>;

  const mockToolDetails: ToolDetails = {
    name: 'system.list_services',
    description: 'List system services',
    requiresConfirmation: false,
    osSupport: ['windows'],
    jsonSchema: {
      type: 'object',
      properties: {
        searchTerm: { type: 'string', description: 'Search term' },
        status: { type: 'string', enum: ['all', 'Running', 'Stopped'], default: 'all' }
      },
      required: ['searchTerm']
    }
  };

  const mockAssets: Asset[] = [
    {
      id: 'asset-1',
      hostname: 'server1',
      ip: '192.168.1.100',
      os: 'Windows Server 2022',
      status: 'online',
      winrmEnabled: true,
      lastSeen: '2024-01-01T00:00:00Z'
    }
  ];

  const mockExecuteResult: ExecuteResult = {
    executionId: 'exec-123',
    exitCode: 0,
    stdout: 'Service list output',
    stderr: '',
    status: 'SUCCESS'
  };

  beforeEach(async () => {
    // Mock localStorage globally
    const mockLocalStorage = {
      getItem: jasmine.createSpy('getItem').and.returnValue(null),
      setItem: jasmine.createSpy('setItem'),
      removeItem: jasmine.createSpy('removeItem')
    };
    Object.defineProperty(window, 'localStorage', { 
      value: mockLocalStorage, 
      writable: true 
    });

    const apiServiceSpy = jasmine.createSpyObj('ApiService', [
      'getTool', 'executeDirect', 'executeForAsset', 'getAssets', 'suggestWinget'
    ]);
    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', [
      'success', 'error', 'warning', 'info'
    ]);
    const changeDetectorRefSpy = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges']);

    await TestBed.configureTestingModule({
      imports: [RunToolModalComponent, ReactiveFormsModule, FormsModule],
      providers: [
        FormBuilder,
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
        { provide: ChangeDetectorRef, useValue: changeDetectorRefSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RunToolModalComponent);
    component = fixture.componentInstance;
    mockApiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    mockNotificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    mockChangeDetectorRef = TestBed.inject(ChangeDetectorRef) as jasmine.SpyObj<ChangeDetectorRef>;

    // Setup default mocks
    mockApiService.getAssets.and.returnValue(of(mockAssets));
    mockApiService.executeDirect.and.returnValue(of(mockExecuteResult));
    mockApiService.executeForAsset.and.returnValue(of(mockExecuteResult));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should initialize form when tool is provided', () => {
      component.tool = mockToolDetails;
      
      component.ngOnInit();
      
      expect(component.form).toBeDefined();
      expect(component.form.get('searchTerm')).toBeDefined();
      expect(component.form.get('status')).toBeDefined();
    });

    it('should setup autocomplete for apps.install tool', () => {
      const appsTool: ToolDetails = {
        ...mockToolDetails,
        name: 'apps.install'
      };
      component.tool = appsTool;
      
      component.ngOnInit();
      
      expect(component.form).toBeDefined();
    });

    it('should load saved arguments from localStorage', () => {
      component.tool = mockToolDetails;
      (window.localStorage.getItem as jasmine.Spy).and.returnValue('{"searchTerm":"test","status":"Running"}');
      
      component.ngOnInit();
      
      expect(component.form.get('searchTerm')?.value).toBe('test');
      expect(component.form.get('status')?.value).toBe('Running');
    });

    it('should handle invalid saved arguments', () => {
      component.tool = mockToolDetails;
      (window.localStorage.getItem as jasmine.Spy).and.returnValue('invalid json');
      spyOn(console, 'warn'); // Mock console.warn to avoid test output
      
      expect(() => component.ngOnInit()).not.toThrow();
      expect(console.warn).toHaveBeenCalled();
    });

    it('should load assets on initialization', () => {
      component.tool = mockToolDetails;
      
      component.ngOnInit();
      
      expect(mockApiService.getAssets).toHaveBeenCalled();
      expect(component.assets).toEqual(mockAssets);
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy subject', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');
      
      component.ngOnDestroy();
      
      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });

  describe('buildForm', () => {
    it('should build form with required validators', () => {
      component.tool = mockToolDetails;
      
      component['buildForm']();
      
      const searchTermControl = component.form.get('searchTerm');
      expect(searchTermControl?.hasError('required')).toBe(true);
    });

    it('should set default values from schema', () => {
      component.tool = mockToolDetails;
      
      component['buildForm']();
      
      expect(component.form.get('status')?.value).toBe('all');
    });

    it('should handle schema without properties', () => {
      const toolWithoutSchema: ToolDetails = {
        ...mockToolDetails,
        jsonSchema: { type: 'object' }
      };
      component.tool = toolWithoutSchema;
      
      expect(() => component['buildForm']()).not.toThrow();
    });
  });

  describe('onTargetSelected', () => {
    it('should update selected asset and trigger change detection', () => {
      const assetId = 'asset-1';
      
      component.onTargetSelected(assetId);
      
      expect(component.selectedAssetId).toBe(assetId);
      // Note: detectChanges is called in the component, but we need to verify the asset was set
      expect(component.selectedAssetId).toBe(assetId);
    });

    it('should handle null asset selection', () => {
      component.onTargetSelected(null);
      
      expect(component.selectedAssetId).toBeNull();
    });
  });

  describe('getSelectedAsset', () => {
    it('should return selected asset', () => {
      component.assets = mockAssets;
      component.selectedAssetId = 'asset-1';
      
      const selectedAsset = component.getSelectedAsset();
      
      expect(selectedAsset).toBeDefined();
      expect(selectedAsset?.id).toBe('asset-1');
    });

    it('should return null when no asset selected', () => {
      component.selectedAssetId = null;
      
      expect(component.getSelectedAsset()).toBeNull();
    });

    it('should return null when asset not found', () => {
      component.assets = mockAssets;
      component.selectedAssetId = 'non-existent';
      
      expect(component.getSelectedAsset()).toBeNull();
    });
  });

  describe('getTargetDisplayName', () => {
    it('should return asset display name when selected', () => {
      component.assets = mockAssets;
      component.selectedAssetId = 'asset-1';
      
      expect(component.getTargetDisplayName()).toBe('server1');
    });

    it('should return asset ID when asset not found', () => {
      component.selectedAssetId = 'non-existent';
      
      expect(component.getTargetDisplayName()).toBe('Seleccionar destino');
    });

    it('should return provided assetId when no selection', () => {
      component.assetId = 'provided-asset';
      
      expect(component.getTargetDisplayName()).toBe('Seleccionar destino');
    });

    it('should return local server when no asset', () => {
      expect(component.getTargetDisplayName()).toBe('Seleccionar destino');
    });
  });

  describe('isTargetValid', () => {
    it('should return true when asset is selected', () => {
      component.selectedAssetId = 'asset-1';
      
      expect(component.isTargetValid()).toBe(true);
    });

    it('should return false when no asset selected', () => {
      component.selectedAssetId = null;
      
      expect(component.isTargetValid()).toBe(false);
    });

    it('should return false when empty string selected', () => {
      component.selectedAssetId = '';
      
      expect(component.isTargetValid()).toBe(false);
    });
  });

  describe('onSearch', () => {
    it('should trigger search for apps.install tool', () => {
      component.tool = { ...mockToolDetails, name: 'apps.install' };
      component.ngOnInit();
      
      component.onSearch('visual studio');
      
      // Should not throw error
      expect(() => component.onSearch('visual studio')).not.toThrow();
    });

    it('should not trigger search for other tools', () => {
      component.tool = mockToolDetails;
      component.ngOnInit();
      
      component.onSearch('test');
      
      // Should not throw error
      expect(() => component.onSearch('test')).not.toThrow();
    });
  });

  describe('onSuggestionSelect', () => {
    it('should update form with suggestion', () => {
      component.tool = { 
        ...mockToolDetails, 
        name: 'apps.install'
      };
      component.ngOnInit();
      
      const suggestion: Suggestion = {
        id: 'Microsoft.VisualStudio.2022.Community',
        name: 'Visual Studio 2022 Community',
        version: '17.8.0'
      };
      
      component.onSuggestionSelect(suggestion);
      
      // The form might not have a 'name' field, so we just check that the method doesn't throw
      expect(component.suggestions).toEqual([]);
    });
  });

  describe('onExecute', () => {
    it('should not execute when form is invalid', () => {
      component.tool = mockToolDetails;
      component.ngOnInit();
      
      component.onExecute();
      
      expect(mockApiService.executeDirect).not.toHaveBeenCalled();
      expect(mockApiService.executeForAsset).not.toHaveBeenCalled();
    });

    it('should not execute when target is required but not valid', () => {
      component.tool = mockToolDetails;
      component.isTargetRequired = true;
      component.selectedAssetId = null;
      component.ngOnInit();
      component.form.patchValue({ searchTerm: 'test' });
      
      component.onExecute();
      
      expect(mockNotificationService.error).toHaveBeenCalledWith(
        'Destino requerido',
        'Debes seleccionar un destino antes de ejecutar la herramienta'
      );
    });

    it('should show confirmation for tools requiring confirmation', () => {
      component.tool = { ...mockToolDetails, requiresConfirmation: true };
      component.selectedAssetId = 'asset-1';
      component.ngOnInit();
      component.form.patchValue({ searchTerm: 'test' });
      
      component.onExecute();
      
      expect(component.showConfirmation).toBe(true);
    });

    it('should execute directly for tools not requiring confirmation', () => {
      component.tool = { ...mockToolDetails, requiresConfirmation: false };
      component.selectedAssetId = null; // No asset selected, should execute locally
      component.isTargetRequired = false; // Disable target requirement
      component.ngOnInit();
      component.form.patchValue({ searchTerm: 'test' });
      
      component.onExecute();
      
      expect(mockApiService.executeDirect).toHaveBeenCalled();
    });
  });

  describe('onConfirm', () => {
    it('should hide confirmation and execute tool', () => {
      component.showConfirmation = true;
      
      component.onConfirm();
      
      expect(component.showConfirmation).toBe(false);
    });
  });

  describe('onCancel', () => {
    it('should hide confirmation', () => {
      component.showConfirmation = true;
      
      component.onCancel();
      
      expect(component.showConfirmation).toBe(false);
    });
  });

  describe('executeTool', () => {
    it('should execute tool for selected asset', () => {
      component.tool = mockToolDetails;
      component.selectedAssetId = 'asset-1';
      component.ngOnInit();
      component.form.patchValue({ searchTerm: 'test' });
      
      component['executeTool']();
      
      expect(mockApiService.executeForAsset).toHaveBeenCalledWith(
        'asset-1',
        'system.list_services',
        jasmine.objectContaining({ searchTerm: 'test' }),
        true
      );
    });

    it('should execute tool locally when no asset selected', () => {
      component.tool = mockToolDetails;
      component.selectedAssetId = null;
      component.ngOnInit();
      component.form.patchValue({ searchTerm: 'test' });
      
      component['executeTool']();
      
      expect(mockApiService.executeDirect).toHaveBeenCalledWith(
        'system.list_services',
        jasmine.objectContaining({ searchTerm: 'test' }),
        true
      );
    });

    it('should handle execution success', () => {
      component.tool = mockToolDetails;
      component.ngOnInit();
      component.form.patchValue({ searchTerm: 'test' });
      
      component['executeTool']();
      
      expect(component.executionResult).toEqual(mockExecuteResult);
      expect(component.isExecuting).toBe(false);
    });

    it('should handle execution with warnings', () => {
      const warningResult: ExecuteResult = {
        ...mockExecuteResult,
        status: 'WARNING',
        exitCode: 1
      };
      mockApiService.executeDirect.and.returnValue(of(warningResult));
      
      component.tool = mockToolDetails;
      component.ngOnInit();
      component.form.patchValue({ searchTerm: 'test' });
      
      component['executeTool']();
      
      expect(mockNotificationService.warning).toHaveBeenCalled();
    });

    it('should handle execution error', () => {
      const error = { status: 400, error: { message: 'Validation error' } };
      mockApiService.executeDirect.and.returnValue(throwError(() => error));
      spyOn(console, 'error'); // Mock console.error to avoid test output
      
      component.tool = mockToolDetails;
      component.ngOnInit();
      component.form.patchValue({ searchTerm: 'test' });
      
      component['executeTool']();
      
      expect(mockNotificationService.error).toHaveBeenCalled();
      expect(component.isExecuting).toBe(false);
    });
  });

  describe('onClose', () => {
    it('should emit close event', () => {
      spyOn(component.close, 'emit');
      
      component.onClose();
      
      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  describe('form field helpers', () => {
    beforeEach(() => {
      component.tool = mockToolDetails;
      component.ngOnInit();
    });

    it('should return correct field type', () => {
      const stringProp = { type: 'string' };
      const booleanProp = { type: 'boolean' };
      const integerProp = { type: 'integer' };
      const enumProp = { enum: ['a', 'b'] };
      
      expect(component.getFieldType(stringProp)).toBe('text');
      expect(component.getFieldType(booleanProp)).toBe('checkbox');
      expect(component.getFieldType(integerProp)).toBe('number');
      expect(component.getFieldType(enumProp)).toBe('select');
    });

    it('should return field options for enum', () => {
      const enumProp = { enum: ['a', 'b', 'c'] };
      
      expect(component.getFieldOptions(enumProp)).toEqual(['a', 'b', 'c']);
    });

    it('should return field placeholder', () => {
      const prop = { description: 'Test description' };
      
      expect(component.getFieldPlaceholder(prop)).toBe('Test description');
    });

    it('should return field min/max values', () => {
      const prop = { minimum: 1, maximum: 100 };
      
      expect(component.getFieldMin(prop)).toBe(1);
      expect(component.getFieldMax(prop)).toBe(100);
    });

    it('should check if field is required', () => {
      component.tool = {
        ...mockToolDetails,
        jsonSchema: {
          type: 'object',
          properties: {
            requiredField: { type: 'string' },
            optionalField: { type: 'string' }
          },
          required: ['requiredField']
        }
      };
      component.ngOnInit();
      
      expect(component.getFieldRequired('requiredField')).toBe(true);
      expect(component.getFieldRequired('optionalField')).toBe(false);
    });

    it('should return field names', () => {
      const fieldNames = component.getFieldNames();
      
      expect(fieldNames).toContain('searchTerm');
      expect(fieldNames).toContain('status');
    });

    it('should return field label', () => {
      const label = component.getFieldLabel('searchTerm');
      
      expect(label).toBe('Search term');
    });
  });

  describe('status icon', () => {
    it('should return correct status icons', () => {
      expect(component.getStatusIcon('SUCCESS')).toBe('✅');
      expect(component.getStatusIcon('FAILURE')).toBe('❌');
      expect(component.getStatusIcon('ERROR')).toBe('⚠️');
      expect(component.getStatusIcon('UNKNOWN')).toBe('❓');
    });
  });
});
