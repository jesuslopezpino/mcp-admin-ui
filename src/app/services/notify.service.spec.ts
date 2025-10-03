import { TestBed } from '@angular/core/testing';
import { NotifyService } from './notify.service';

describe('NotifyService', () => {
  let service: NotifyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotifyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('success', () => {
    it('should log success message to console', () => {
      spyOn(console, 'log');
      const message = 'Task completed successfully';
      
      service.success(message);
      
      expect(console.log).toHaveBeenCalledWith('✅ Success:', message);
    });

    it('should show success alert', () => {
      spyOn(window, 'alert');
      const message = 'Task completed successfully';
      
      service.success(message);
      
      expect(window.alert).toHaveBeenCalledWith('✅ Task completed successfully');
    });
  });

  describe('error', () => {
    it('should log error message to console', () => {
      spyOn(console, 'error');
      const message = 'Task failed';
      
      service.error(message);
      
      expect(console.error).toHaveBeenCalledWith('❌ Error:', message);
    });

    it('should show error alert', () => {
      spyOn(window, 'alert');
      const message = 'Task failed';
      
      service.error(message);
      
      expect(window.alert).toHaveBeenCalledWith('❌ Task failed');
    });
  });

  describe('info', () => {
    it('should log info message to console', () => {
      spyOn(console, 'info');
      const message = 'Task started';
      
      service.info(message);
      
      expect(console.info).toHaveBeenCalledWith('ℹ️ Info:', message);
    });

    it('should show info alert', () => {
      spyOn(window, 'alert');
      const message = 'Task started';
      
      service.info(message);
      
      expect(window.alert).toHaveBeenCalledWith('ℹ️ Task started');
    });
  });

  describe('warning', () => {
    it('should log warning message to console', () => {
      spyOn(console, 'warn');
      const message = 'Task may take longer than expected';
      
      service.warning(message);
      
      expect(console.warn).toHaveBeenCalledWith('⚠️ Warning:', message);
    });

    it('should show warning alert', () => {
      spyOn(window, 'alert');
      const message = 'Task may take longer than expected';
      
      service.warning(message);
      
      expect(window.alert).toHaveBeenCalledWith('⚠️ Task may take longer than expected');
    });
  });
});

