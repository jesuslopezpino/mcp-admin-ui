import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { SchedulesComponent } from './schedules.component';
import { ApiService } from '../services/api.service';
import { NotifyService } from '../services/notify.service';
import { ScheduledTask, Tool, Asset } from '../models/api';

describe('SchedulesComponent', () => {
  let component: SchedulesComponent;
  let fixture: ComponentFixture<SchedulesComponent>;
  let apiService: jasmine.SpyObj<ApiService>;
  let notifyService: jasmine.SpyObj<NotifyService>;

  const mockSchedules: ScheduledTask[] = [
    {
      id: 'schedule-1',
      name: 'Daily Backup',
      toolName: 'files.backup_user_docs',
      assetId: null,
      arguments: { destination: '/backup' },
      cronExpr: '0 2 * * *',
      enabled: true,
      lastRunAt: '2025-10-02T02:00:00Z',
      nextRunAt: '2025-10-03T02:00:00Z'
    },
    {
      id: 'schedule-2',
      name: 'System Health Check',
      toolName: 'system.get_disk_info',
      assetId: 'asset-123',
      arguments: {},
      cronExpr: '*/30 * * * *',
      enabled: false,
      lastRunAt: null,
      nextRunAt: null
    }
  ];

  const mockTools: Tool[] = [
    { name: 'files.backup_user_docs', description: 'Backup user documents', requiresConfirmation: false, osSupport: ['windows'] },
    { name: 'system.get_disk_info', description: 'Get disk information', requiresConfirmation: false, osSupport: ['windows'] }
  ];

  const mockAssets: Asset[] = [
    { id: 'asset-123', hostname: 'server1', ip: '192.168.1.100', os: 'Windows', status: 'online', winrmEnabled: true, lastSeen: '2025-10-02T10:00:00Z' },
    { id: 'asset-456', hostname: 'server2', ip: '192.168.1.101', os: 'Windows', status: 'online', winrmEnabled: false, lastSeen: '2025-10-02T10:00:00Z' }
  ];

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['getSchedules', 'tools', 'getAssets', 'deleteSchedule']);
    const notifySpy = jasmine.createSpyObj('NotifyService', ['success', 'error']);

    await TestBed.configureTestingModule({
      imports: [SchedulesComponent],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: NotifyService, useValue: notifySpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SchedulesComponent);
    component = fixture.componentInstance;
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    notifyService = TestBed.inject(NotifyService) as jasmine.SpyObj<NotifyService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component initialization', () => {
    it('should load data on init', () => {
      apiService.getSchedules.and.returnValue(of(mockSchedules));
      apiService.tools.and.returnValue(of(mockTools));
      apiService.getAssets.and.returnValue(of(mockAssets));

      component.ngOnInit();

      expect(apiService.getSchedules).toHaveBeenCalled();
      expect(apiService.tools).toHaveBeenCalled();
      expect(apiService.getAssets).toHaveBeenCalled();
    });

    it('should handle schedules loading error', () => {
      apiService.getSchedules.and.returnValue(throwError(() => 'Network error'));
      apiService.tools.and.returnValue(of(mockTools));
      apiService.getAssets.and.returnValue(of(mockAssets));

      component.ngOnInit();

      expect(notifyService.error).toHaveBeenCalledWith('Error loading scheduled tasks');
      expect(component.loading).toBe(false);
    });

    it('should handle tools loading error', () => {
      apiService.getSchedules.and.returnValue(of(mockSchedules));
      apiService.tools.and.returnValue(throwError(() => 'Network error'));
      apiService.getAssets.and.returnValue(of(mockAssets));

      component.ngOnInit();

      expect(notifyService.error).toHaveBeenCalledWith('Error loading tools');
    });

    it('should handle assets loading error', () => {
      apiService.getSchedules.and.returnValue(of(mockSchedules));
      apiService.tools.and.returnValue(of(mockTools));
      apiService.getAssets.and.returnValue(throwError(() => 'Network error'));

      component.ngOnInit();

      expect(notifyService.error).toHaveBeenCalledWith('Error loading assets');
    });
  });

  describe('Modal operations', () => {
    it('should open new modal', () => {
      component.openNewModal();
      
      expect(component.showModal).toBe(true);
      expect(component.editingTask).toBeNull();
    });

    it('should open edit modal with task', () => {
      const task = mockSchedules[0];
      component.openEditModal(task);
      
      expect(component.showModal).toBe(true);
      expect(component.editingTask).toBe(task);
    });

    it('should close modal', () => {
      component.showModal = true;
      component.editingTask = mockSchedules[0];
      
      component.closeModal();
      
      expect(component.showModal).toBe(false);
      expect(component.editingTask).toBeNull();
    });
  });

  describe('Task operations', () => {
    beforeEach(() => {
      component.schedules = [...mockSchedules];
      component.tools = [...mockTools];
      component.assets = [...mockAssets];
    });

    it('should handle task saved for new task', () => {
      spyOn(component, 'closeModal');
      const newTask = { ...mockSchedules[0], id: 'new-task-123' };
      
      component.onTaskSaved(newTask);
      
      expect(component.schedules).toContain(newTask);
      expect(notifyService.success).toHaveBeenCalledWith('Scheduled task created successfully');
      expect(component.closeModal).toHaveBeenCalled();
    });

    it('should handle task saved for existing task', () => {
      spyOn(component, 'closeModal');
      component.editingTask = mockSchedules[0];
      const updatedTask = { ...mockSchedules[0], name: 'Updated Task' };
      
      component.onTaskSaved(updatedTask);
      
      const index = component.schedules.findIndex(t => t.id === updatedTask.id);
      expect(component.schedules[index]).toEqual(updatedTask);
      expect(notifyService.success).toHaveBeenCalledWith('Scheduled task updated successfully');
      expect(component.closeModal).toHaveBeenCalled();
    });

    it('should delete task on confirmation', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      apiService.deleteSchedule.and.returnValue(of(undefined));
      const task = mockSchedules[0];
      
      component.deleteTask(task);
      
      expect(apiService.deleteSchedule).toHaveBeenCalledWith(task.id);
      expect(component.schedules).not.toContain(task);
      expect(notifyService.success).toHaveBeenCalledWith('Scheduled task deleted successfully');
    });

    it('should not delete task on cancel', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      const task = mockSchedules[0];
      
      component.deleteTask(task);
      
      expect(apiService.deleteSchedule).not.toHaveBeenCalled();
      expect(component.schedules).toContain(task);
    });

    it('should handle delete error', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      apiService.deleteSchedule.and.returnValue(throwError(() => 'Delete failed'));
      const task = mockSchedules[0];
      
      component.deleteTask(task);
      
      expect(notifyService.error).toHaveBeenCalledWith('Error deleting scheduled task');
    });
  });

  describe('Helper methods', () => {
    beforeEach(() => {
      component.tools = [...mockTools];
      component.assets = [...mockAssets];
    });

    it('should return destination label for local task', () => {
      const task = { ...mockSchedules[0], assetId: null };
      const result = component.getDestinationLabel(task);
      
      expect(result).toBe('Servidor (local)');
    });

    it('should return destination label for remote task', () => {
      const task = { ...mockSchedules[0], assetId: 'asset-123' };
      const result = component.getDestinationLabel(task);
      
      expect(result).toBe('server1');
    });

    it('should return unknown asset for non-existent asset', () => {
      const task = { ...mockSchedules[0], assetId: 'non-existent' };
      const result = component.getDestinationLabel(task);
      
      expect(result).toBe('Unknown asset');
    });

    it('should return tool name from tools list', () => {
      const task = mockSchedules[0];
      const result = component.getToolName(task);
      
      expect(result).toBe('files.backup_user_docs');
    });

    it('should return tool name directly if not found in tools list', () => {
      const task = { ...mockSchedules[0], toolName: 'unknown.tool' };
      const result = component.getToolName(task);
      
      expect(result).toBe('unknown.tool');
    });

    it('should format date correctly', () => {
      const dateString = '2025-10-02T10:00:00Z';
      const result = component.formatDate(dateString);
      
      expect(result).toContain('10/2/2025');
    });

    it('should return dash for null date', () => {
      const result = component.formatDate(null);
      
      expect(result).toBe('-');
    });

    it('should return dash for undefined date', () => {
      const result = component.formatDate(undefined);
      
      expect(result).toBe('-');
    });

    it('should return original string for invalid date', () => {
      const invalidDate = 'invalid-date';
      const result = component.formatDate(invalidDate);
      
      expect(result).toBe(invalidDate);
    });

    it('should track by task ID', () => {
      const task = mockSchedules[0];
      const result = component.trackByTaskId(0, task);
      
      expect(result).toBe(task.id);
    });
  });
});

