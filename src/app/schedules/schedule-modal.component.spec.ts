import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { ScheduleModalComponent } from './schedule-modal.component';
import { ApiService } from '../services/api.service';
import { NotifyService } from '../services/notify.service';
import { ScheduledTask, Tool, Asset } from '../models/api';

describe('ScheduleModalComponent', () => {
  let component: ScheduleModalComponent;
  let fixture: ComponentFixture<ScheduleModalComponent>;
  let apiService: jasmine.SpyObj<ApiService>;
  let notifyService: jasmine.SpyObj<NotifyService>;

  const mockTools: Tool[] = [
    { name: 'system.flush_dns', description: 'Flush DNS cache', requiresConfirmation: false, osSupport: ['windows'] },
    { name: 'apps.install', description: 'Install application', requiresConfirmation: true, osSupport: ['windows'] }
  ];

  const mockAssets: Asset[] = [
    { id: 'asset-1', hostname: 'server1', ip: '192.168.1.100', os: 'Windows', status: 'online', winrmEnabled: true, lastSeen: '2025-10-02T10:00:00Z' },
    { id: 'asset-2', hostname: 'server2', ip: '192.168.1.101', os: 'Windows', status: 'online', winrmEnabled: false, lastSeen: '2025-10-02T10:00:00Z' }
  ];

  const mockTask: ScheduledTask = {
    id: 'task-123',
    name: 'Test Task',
    toolName: 'system.flush_dns',
    assetId: 'asset-1',
    arguments: { verbose: true },
    cronExpr: '*/5 * * * *',
    enabled: true,
    lastRunAt: '2025-10-02T10:00:00Z',
    nextRunAt: '2025-10-02T10:05:00Z'
  };

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['createSchedule', 'updateSchedule']);
    const notifySpy = jasmine.createSpyObj('NotifyService', ['success', 'error']);

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, ScheduleModalComponent],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: NotifyService, useValue: notifySpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ScheduleModalComponent);
    component = fixture.componentInstance;
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    notifyService = TestBed.inject(NotifyService) as jasmine.SpyObj<NotifyService>;

    component.tools = mockTools;
    component.assets = mockAssets;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form initialization', () => {
    it('should initialize form with default values for new task', () => {
      component.ngOnInit();
      
      expect(component.scheduleForm.get('name')?.value).toBe('');
      expect(component.scheduleForm.get('toolName')?.value).toBe('');
      expect(component.scheduleForm.get('assetId')?.value).toBe(null);
      expect(component.scheduleForm.get('cronExpr')?.value).toBe('');
      expect(component.scheduleForm.get('enabled')?.value).toBe(true);
      expect(component.scheduleForm.get('arguments')?.value).toBe('{}');
    });

    it('should populate form with existing task data for edit mode', () => {
      component.task = mockTask;
      component.ngOnInit();
      
      expect(component.scheduleForm.get('name')?.value).toBe(mockTask.name);
      expect(component.scheduleForm.get('toolName')?.value).toBe(mockTask.toolName);
      expect(component.scheduleForm.get('assetId')?.value).toBe(mockTask.assetId);
      expect(component.scheduleForm.get('cronExpr')?.value).toBe(mockTask.cronExpr);
      expect(component.scheduleForm.get('enabled')?.value).toBe(mockTask.enabled);
      expect(component.scheduleForm.get('arguments')?.value).toBe(JSON.stringify(mockTask.arguments, null, 2));
    });
  });

  describe('Form validation', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should require name field', () => {
      const nameControl = component.scheduleForm.get('name');
      nameControl?.setValue('');
      nameControl?.markAsTouched();
      
      expect(nameControl?.invalid).toBeTruthy();
      expect(component.getFieldError('name')).toBe('name is required');
    });

    it('should require toolName field', () => {
      const toolNameControl = component.scheduleForm.get('toolName');
      toolNameControl?.setValue('');
      toolNameControl?.markAsTouched();
      
      expect(toolNameControl?.invalid).toBeTruthy();
      expect(component.getFieldError('toolName')).toBe('toolName is required');
    });

    it('should require cronExpr field', () => {
      const cronControl = component.scheduleForm.get('cronExpr');
      cronControl?.setValue('');
      cronControl?.markAsTouched();
      
      expect(cronControl?.invalid).toBeTruthy();
      expect(component.getFieldError('cronExpr')).toBe('cronExpr is required');
    });

    it('should validate JSON arguments', () => {
      const argsControl = component.scheduleForm.get('arguments');
      argsControl?.setValue('invalid json');
      
      component.onSubmit();
      
      expect(component.jsonError).toBe('JSON inválido');
      expect(notifyService.error).toHaveBeenCalledWith('Invalid JSON in arguments field');
    });

    it('should accept valid JSON arguments', () => {
      const argsControl = component.scheduleForm.get('arguments');
      argsControl?.setValue('{"param1": "value1"}');
      
      component.onSubmit();
      
      expect(component.jsonError).toBeNull();
    });
  });

  describe('Form submission', () => {
    beforeEach(() => {
      component.ngOnInit();
      component.scheduleForm.patchValue({
        name: 'Test Task',
        toolName: 'system.flush_dns',
        assetId: null,
        cronExpr: '*/5 * * * *',
        enabled: true,
        arguments: '{"verbose": true}'
      });
    });

    it('should create new task when no existing task', () => {
      const createdTask = { ...mockTask, id: 'new-task-123' };
      apiService.createSchedule.and.returnValue(of(createdTask));

      component.onSubmit();

      expect(apiService.createSchedule).toHaveBeenCalledWith({
        name: 'Test Task',
        toolName: 'system.flush_dns',
        assetId: null,
        cronExpr: '*/5 * * * *',
        enabled: true,
        arguments: { verbose: true }
      });
    });

    it('should update existing task when task is provided', () => {
      component.task = mockTask;
      const updatedTask = { ...mockTask, name: 'Updated Task' };
      apiService.updateSchedule.and.returnValue(of(updatedTask));

      component.onSubmit();

      expect(apiService.updateSchedule).toHaveBeenCalledWith(mockTask.id, {
        name: 'Test Task',
        toolName: 'system.flush_dns',
        assetId: null,
        cronExpr: '*/5 * * * *',
        enabled: true,
        arguments: { verbose: true }
      });
    });

    it('should emit saved event on successful creation', () => {
      spyOn(component.saved, 'emit');
      const createdTask = { ...mockTask, id: 'new-task-123' };
      apiService.createSchedule.and.returnValue(of(createdTask));

      component.onSubmit();

      expect(component.saved.emit).toHaveBeenCalledWith(createdTask);
    });

    it('should emit saved event on successful update', () => {
      component.task = mockTask;
      spyOn(component.saved, 'emit');
      const updatedTask = { ...mockTask, name: 'Updated Task' };
      apiService.updateSchedule.and.returnValue(of(updatedTask));

      component.onSubmit();

      expect(component.saved.emit).toHaveBeenCalledWith(updatedTask);
    });

    it('should handle API errors', () => {
      const error = { error: { message: 'Validation failed' } };
      apiService.createSchedule.and.returnValue(throwError(() => error));

      component.onSubmit();

      expect(notifyService.error).toHaveBeenCalledWith('Error saving scheduled task: Validation failed');
    });

    it('should handle API errors without message', () => {
      const error = { message: 'Network error' };
      apiService.createSchedule.and.returnValue(throwError(() => error));

      component.onSubmit();

      expect(notifyService.error).toHaveBeenCalledWith('Error saving scheduled task: Network error');
    });

    it('should handle unknown errors', () => {
      apiService.createSchedule.and.returnValue(throwError(() => 'Unknown error'));

      component.onSubmit();

      expect(notifyService.error).toHaveBeenCalledWith('Error saving scheduled task: Unknown error');
    });
  });

  describe('Helper methods', () => {
    it('should return correct modal title for new task', () => {
      expect(component.modalTitle).toBe('Create Scheduled Task');
    });

    it('should return correct modal title for edit task', () => {
      component.task = mockTask;
      expect(component.modalTitle).toBe('Edit Scheduled Task');
    });

    it('should return true for edit mode when task is provided', () => {
      component.task = mockTask;
      expect(component.isEditMode).toBe(true);
    });

    it('should return false for edit mode when no task is provided', () => {
      expect(component.isEditMode).toBe(false);
    });

    it('should return true for valid form when no JSON error', () => {
      component.ngOnInit();
      component.scheduleForm.patchValue({
        name: 'Test',
        toolName: 'system.flush_dns',
        cronExpr: '*/5 * * * *'
      });
      component.jsonError = null;

      expect(component.isFormValid).toBe(true);
    });

    it('should return false for invalid form', () => {
      component.ngOnInit();
      component.scheduleForm.patchValue({
        name: '',
        toolName: 'system.flush_dns',
        cronExpr: '*/5 * * * *'
      });

      expect(component.isFormValid).toBe(false);
    });

    it('should return false when JSON error exists', () => {
      component.ngOnInit();
      component.scheduleForm.patchValue({
        name: 'Test',
        toolName: 'system.flush_dns',
        cronExpr: '*/5 * * * *'
      });
      component.jsonError = 'JSON inválido';

      expect(component.isFormValid).toBe(false);
    });
  });

  describe('Event handlers', () => {
    it('should emit closed event on cancel', () => {
      spyOn(component.closed, 'emit');
      component.onCancel();
      expect(component.closed.emit).toHaveBeenCalled();
    });
  });
});

