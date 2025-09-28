import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TerminalOutputComponent } from './terminal-output.component';

describe('TerminalOutputComponent', () => {
  let component: TerminalOutputComponent;
  let fixture: ComponentFixture<TerminalOutputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TerminalOutputComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TerminalOutputComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should initialize with default values', () => {
      expect(component.stdout).toBe('');
      expect(component.stderr).toBe('');
      expect(component.exitCode).toBe(0);
      expect(component.status).toBe('');
      expect(component.targetHostname).toBe('');
      expect(component.targetIp).toBe('');
      expect(component.commandName).toBe('');
      expect(component.isFullscreen).toBe(false);
    });

    it('should format output on initialization', () => {
      component.stdout = 'Test output\nLine 2';
      component.stderr = 'Error output';
      component.exitCode = 0;
      component.status = 'SUCCESS';
      
      component.ngOnInit();
      
      expect(component.formattedOutput).toContain('Test output');
      expect(component.formattedOutput).toContain('Line 2');
      expect(component.formattedOutput).toContain('Error output');
    });
  });

  describe('ngOnChanges', () => {
    it('should format output when inputs change', () => {
      component.stdout = 'New output';
      component.stderr = 'New error';
      component.exitCode = 1;
      component.status = 'ERROR';
      
      component.ngOnChanges();
      
      expect(component.formattedOutput).toContain('New output');
      expect(component.formattedOutput).toContain('New error');
    });

    it('should auto-fullscreen on successful execution', (done) => {
      component.stdout = 'Success output';
      component.exitCode = 0;
      component.status = 'SUCCESS';
      
      component.ngOnChanges();
      
      setTimeout(() => {
        expect(component.isFullscreen).toBe(true);
        done();
      }, 150);
    });

    it('should not auto-fullscreen on failed execution', () => {
      component.stdout = 'Error output';
      component.exitCode = 1;
      component.status = 'ERROR';
      
      component.ngOnChanges();
      
      expect(component.isFullscreen).toBe(false);
    });

    it('should not auto-fullscreen when no output', () => {
      component.stdout = '';
      component.exitCode = 0;
      component.status = 'SUCCESS';
      
      component.ngOnChanges();
      
      expect(component.isFullscreen).toBe(false);
    });
  });

  describe('formatOutput', () => {
    it('should combine stdout and stderr', () => {
      component.stdout = 'Standard output';
      component.stderr = 'Error output';
      
      component['formatOutput']();
      
      expect(component.formattedOutput).toContain('Standard output');
      expect(component.formattedOutput).toContain('Error output');
    });

    it('should handle only stdout', () => {
      component.stdout = 'Only stdout';
      component.stderr = '';
      
      component['formatOutput']();
      
      expect(component.formattedOutput).toBe('Only stdout');
    });

    it('should handle only stderr', () => {
      component.stdout = '';
      component.stderr = 'Only stderr';
      
      component['formatOutput']();
      
      expect(component.formattedOutput).toBe('\nOnly stderr');
    });

    it('should handle empty output', () => {
      component.stdout = '';
      component.stderr = '';
      
      component['formatOutput']();
      
      expect(component.formattedOutput).toBe('');
    });

    it('should normalize line endings', () => {
      component.stdout = 'Line 1\r\nLine 2\rLine 3';
      
      component['formatOutput']();
      
      expect(component.formattedOutput).toBe('Line 1\nLine 2\nLine 3');
    });

    it('should add terminal prompts for certain lines', () => {
      component.stdout = '=== TESTING ===\nwinget install\nWrite-Host "Hello"';
      
      component['formatOutput']();
      
      expect(component.formattedOutput).toContain('$ === TESTING ===');
      expect(component.formattedOutput).toContain('$ winget install');
      expect(component.formattedOutput).toContain('$ Write-Host "Hello"');
    });

    it('should set isSuccess correctly', () => {
      component.exitCode = 0;
      component.status = 'SUCCESS';
      
      component['formatOutput']();
      
      expect(component.isSuccess).toBe(true);
    });

    it('should set isSuccess to false for errors', () => {
      component.exitCode = 1;
      component.status = 'ERROR';
      
      component['formatOutput']();
      
      expect(component.isSuccess).toBe(false);
    });

    it('should set isSuccess to false for non-zero exit code', () => {
      component.exitCode = 1;
      component.status = 'SUCCESS';
      
      component['formatOutput']();
      
      expect(component.isSuccess).toBe(false);
    });
  });

  describe('getStatusColor', () => {
    it('should return green for success', () => {
      component.isSuccess = true;
      
      expect(component.getStatusColor()).toBe('#4CAF50');
    });

    it('should return red for failure', () => {
      component.isSuccess = false;
      
      expect(component.getStatusColor()).toBe('#F44336');
    });
  });

  describe('getStatusIcon', () => {
    it('should return checkmark for success', () => {
      component.isSuccess = true;
      
      expect(component.getStatusIcon()).toBe('✓');
    });

    it('should return X for failure', () => {
      component.isSuccess = false;
      
      expect(component.getStatusIcon()).toBe('✗');
    });
  });

  describe('copyToClipboard', () => {
    it('should copy formatted output to clipboard', async () => {
      component.formattedOutput = 'Test output';
      spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());
      spyOn(console, 'log');
      
      await component.copyToClipboard();
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Test output');
      expect(console.log).toHaveBeenCalledWith('Output copied to clipboard');
    });

    it('should handle clipboard error', async () => {
      component.formattedOutput = 'Test output';
      spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.reject('Clipboard error'));
      spyOn(console, 'error');
      
      await component.copyToClipboard();
      
      // Wait for the promise to resolve/reject
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // The component should handle the error gracefully
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('downloadOutput', () => {
    it('should download formatted output as file', () => {
      component.formattedOutput = 'Test output for download';
      spyOn(window.URL, 'createObjectURL').and.returnValue('blob:test-url');
      spyOn(window.URL, 'revokeObjectURL');
      
      const mockLink = {
        href: '',
        download: '',
        click: jasmine.createSpy('click'),
        remove: jasmine.createSpy('remove')
      };
      spyOn(document, 'createElement').and.returnValue(mockLink as any);
      spyOn(document.body, 'appendChild');
      spyOn(document.body, 'removeChild');
      
      component.downloadOutput();
      
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockLink.href).toBe('blob:test-url');
      expect(mockLink.download).toMatch(/terminal-output-.*\.txt/);
      expect(mockLink.click).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalled();
      expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-url');
    });
  });

  describe('toggleFullscreen', () => {
    it('should toggle fullscreen state', () => {
      expect(component.isFullscreen).toBe(false);
      
      component.toggleFullscreen();
      expect(component.isFullscreen).toBe(true);
      
      component.toggleFullscreen();
      expect(component.isFullscreen).toBe(false);
    });
  });

  describe('closeFullscreen', () => {
    it('should close fullscreen', () => {
      component.isFullscreen = true;
      
      component.closeFullscreen();
      
      expect(component.isFullscreen).toBe(false);
    });
  });

  describe('getTargetDisplayName', () => {
    it('should return hostname and IP when both available', () => {
      component.targetHostname = 'server1';
      component.targetIp = '192.168.1.100';
      
      expect(component.getTargetDisplayName()).toBe('server1 (192.168.1.100)');
    });

    it('should return only IP when hostname not available', () => {
      component.targetHostname = '';
      component.targetIp = '192.168.1.100';
      
      expect(component.getTargetDisplayName()).toBe('192.168.1.100');
    });

    it('should return only hostname when IP not available', () => {
      component.targetHostname = 'server1';
      component.targetIp = '';
      
      expect(component.getTargetDisplayName()).toBe('server1 ()');
    });

    it('should return local server when neither available', () => {
      component.targetHostname = '';
      component.targetIp = '';
      
      expect(component.getTargetDisplayName()).toBe('Servidor local');
    });
  });

  describe('getCommandDisplayName', () => {
    it('should return command name when available', () => {
      component.commandName = 'system.list_services';
      
      expect(component.getCommandDisplayName()).toBe('system.list_services');
    });

    it('should return default text when command name not available', () => {
      component.commandName = '';
      
      expect(component.getCommandDisplayName()).toBe('Comando ejecutado');
    });
  });

  describe('component state', () => {
    it('should initialize with correct default values', () => {
      expect(component.stdout).toBe('');
      expect(component.stderr).toBe('');
      expect(component.exitCode).toBe(0);
      expect(component.status).toBe('');
      expect(component.targetHostname).toBe('');
      expect(component.targetIp).toBe('');
      expect(component.commandName).toBe('');
      expect(component.formattedOutput).toBe('');
      expect(component.isSuccess).toBe(false);
      expect(component.isFullscreen).toBe(false);
    });

    it('should handle complex output formatting', () => {
      component.stdout = 'Line 1\nLine 2\n=== SECTION ===\nwinget install package\nWrite-Host "Message"';
      component.stderr = 'Error line 1\nError line 2';
      component.exitCode = 0;
      component.status = 'SUCCESS';
      
      component['formatOutput']();
      
      expect(component.formattedOutput).toContain('Line 1');
      expect(component.formattedOutput).toContain('Line 2');
      expect(component.formattedOutput).toContain('$ === SECTION ===');
      expect(component.formattedOutput).toContain('$ winget install package');
      expect(component.formattedOutput).toContain('$ Write-Host "Message"');
      expect(component.formattedOutput).toContain('Error line 1');
      expect(component.formattedOutput).toContain('Error line 2');
    });

    it('should handle various status types', () => {
      const statuses = ['SUCCESS', 'FAILURE', 'ERROR', 'WARNING', 'UNKNOWN'];
      
      statuses.forEach(status => {
        component.status = status;
        component.exitCode = status === 'SUCCESS' ? 0 : 1;
        
        component['formatOutput']();
        
        if (status === 'SUCCESS' && component.exitCode === 0) {
          expect(component.isSuccess).toBe(true);
        } else {
          expect(component.isSuccess).toBe(false);
        }
      });
    });
  });
});
