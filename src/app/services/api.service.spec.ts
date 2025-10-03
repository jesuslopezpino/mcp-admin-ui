import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService, Tool, ToolDetails, Asset, ExecuteResult, Suggestion, DiscoveryResult } from './api.service';
import { environment } from '../../environments/environment';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService]
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('plan', () => {
    it('should create a plan request with correct parameters', () => {
      const message = 'Test message';
      const assetId = 'test-asset-id';
      const mockResponse = {
        plan: {
          id: 'plan-123',
          toolName: 'test-tool',
          arguments: {},
          riskScore: 0.5,
          rationale: 'Test rationale',
          requiresConfirmation: false,
          userId: 'admin',
          assetId: assetId
        }
      };

      service.plan(message, assetId).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.baseUrl}/ai/plan`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        userId: 'admin',
        message: message,
        assetId: assetId
      });
      expect(req.request.headers.get('X-API-Key')).toBe(environment.apiKey);
      expect(req.request.headers.get('Content-Type')).toBe('application/json');

      req.flush(mockResponse);
    });

    it('should use default assetId when not provided', () => {
      const message = 'Test message';
      const mockResponse = {
        plan: {
          id: 'plan-123',
          toolName: 'test-tool',
          arguments: {},
          riskScore: 0.5,
          rationale: 'Test rationale',
          requiresConfirmation: false,
          userId: 'admin',
          assetId: 'admin-ui-asset'
        }
      };

      service.plan(message).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.baseUrl}/ai/plan`);
      expect(req.request.body).toEqual({
        userId: 'admin',
        message: message,
        assetId: 'admin-ui-asset'
      });

      req.flush(mockResponse);
    });
  });

  describe('execute', () => {
    it('should execute a plan with correct parameters', () => {
      const planId = 'plan-123';
      const userConfirmed = true;
      const mockResponse: ExecuteResult = {
        executionId: 'exec-123',
        exitCode: 0,
        stdout: 'Success',
        stderr: '',
        status: 'SUCCESS'
      };

      service.execute(planId, userConfirmed).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.baseUrl}/recipes/execute`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        planId: planId,
        userConfirmed: userConfirmed
      });

      req.flush(mockResponse);
    });

    it('should use default userConfirmed value', () => {
      const planId = 'plan-123';
      const mockResponse: ExecuteResult = {
        executionId: 'exec-123',
        exitCode: 0,
        stdout: 'Success',
        stderr: '',
        status: 'SUCCESS'
      };

      service.execute(planId).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.baseUrl}/recipes/execute`);
      expect(req.request.body).toEqual({
        planId: planId,
        userConfirmed: true
      });

      req.flush(mockResponse);
    });
  });

  describe('tools', () => {
    it('should fetch tools list', () => {
      const mockTools: Tool[] = [
        {
          name: 'system.list_services',
          description: 'List system services',
          requiresConfirmation: false,
          osSupport: ['windows']
        },
        {
          name: 'network.test_connectivity',
          description: 'Test network connectivity',
          requiresConfirmation: false,
          osSupport: ['windows']
        }
      ];

      service.tools().subscribe(tools => {
        expect(tools).toEqual(mockTools);
      });

      const req = httpMock.expectOne(`${environment.baseUrl}/tools`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('X-API-Key')).toBe(environment.apiKey);

      req.flush(mockTools);
    });
  });

  describe('getTool', () => {
    it('should fetch tool details by name', () => {
      const toolName = 'system.list_services';
      const mockToolDetails: ToolDetails = {
        name: toolName,
        description: 'List system services',
        requiresConfirmation: false,
        osSupport: ['windows'],
        jsonSchema: {
          type: 'object',
          properties: {
            searchTerm: { type: 'string' },
            status: { type: 'string', enum: ['all', 'Running', 'Stopped'] }
          }
        }
      };

      service.getTool(toolName).subscribe(tool => {
        expect(tool).toEqual(mockToolDetails);
      });

      const req = httpMock.expectOne(`${environment.baseUrl}/tools/${toolName}`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('X-API-Key')).toBe(environment.apiKey);

      req.flush(mockToolDetails);
    });
  });

  describe('executeDirect', () => {
    it('should execute tool directly with correct parameters', () => {
      const toolName = 'system.list_services';
      const toolArguments = { searchTerm: 'test', status: 'Running' };
      const userConfirmed = true;
      const assetId = 'test-asset';
      const mockResponse: ExecuteResult = {
        executionId: 'exec-123',
        exitCode: 0,
        stdout: 'Service list',
        stderr: '',
        status: 'SUCCESS'
      };

      service.executeDirect(toolName, toolArguments, userConfirmed, assetId).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.baseUrl}/recipes/executeDirect`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        toolName: toolName,
        arguments: toolArguments,
        userConfirmed: userConfirmed,
        userId: 'admin',
        assetId: assetId
      });

      req.flush(mockResponse);
    });

    it('should use default assetId when not provided', () => {
      const toolName = 'system.list_services';
      const toolArguments = { searchTerm: 'test' };
      const userConfirmed = true;
      const mockResponse: ExecuteResult = {
        executionId: 'exec-123',
        exitCode: 0,
        stdout: 'Service list',
        stderr: '',
        status: 'SUCCESS'
      };

      service.executeDirect(toolName, toolArguments, userConfirmed).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.baseUrl}/recipes/executeDirect`);
      expect(req.request.body).toEqual({
        toolName: toolName,
        arguments: toolArguments,
        userConfirmed: userConfirmed,
        userId: 'admin',
        assetId: 'admin-ui-asset'
      });

      req.flush(mockResponse);
    });
  });

  describe('suggestWinget', () => {
    it('should fetch winget suggestions', () => {
      const query = 'visual studio';
      const mockSuggestions: Suggestion[] = [
        {
          id: 'Microsoft.VisualStudio.2022.Community',
          name: 'Visual Studio 2022 Community',
          version: '17.8.0',
          source: 'winget'
        }
      ];

      service.suggestWinget(query).subscribe(suggestions => {
        expect(suggestions).toEqual(mockSuggestions);
      });

      const req = httpMock.expectOne(`${environment.baseUrl}/tools/apps.install/suggest?q=visual%20studio`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('X-API-Key')).toBe(environment.apiKey);

      req.flush(mockSuggestions);
    });
  });

  describe('getAssets', () => {
    it('should fetch assets list', () => {
      const mockAssets: Asset[] = [
        {
          id: 'asset-1',
          hostname: 'server1',
          ip: '192.168.1.100',
          os: 'Windows Server 2022',
          status: 'online',
          winrmEnabled: true,
          lastSeen: '2024-01-01T00:00:00Z'
        },
        {
          id: 'asset-2',
          hostname: 'server2',
          ip: '192.168.1.101',
          os: 'Windows 11',
          status: 'offline',
          winrmEnabled: false,
          lastSeen: '2024-01-01T00:00:00Z'
        }
      ];

      service.getAssets().subscribe(assets => {
        expect(assets).toEqual(mockAssets);
      });

      const req = httpMock.expectOne(`${environment.baseUrl}/assets`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('X-API-Key')).toBe(environment.apiKey);

      req.flush(mockAssets);
    });
  });

  describe('discoverAssets', () => {
    it('should trigger asset discovery', () => {
      const mockDiscoveryResult: DiscoveryResult = {
        started: true,
        cidrs: ['192.168.1.0/24'],
        countOnline: 5,
        countWinRm: 3,
        durationMs: 5000
      };

      service.discoverAssets().subscribe(result => {
        expect(result).toEqual(mockDiscoveryResult);
      });

      const req = httpMock.expectOne(`${environment.baseUrl}/assets/discover`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      expect(req.request.headers.get('X-API-Key')).toBe(environment.apiKey);

      req.flush(mockDiscoveryResult);
    });
  });

  describe('executeForAsset', () => {
    it('should execute tool for specific asset', () => {
      const assetId = 'asset-123';
      const toolName = 'system.list_services';
      const args = { searchTerm: 'test' };
      const userConfirmed = true;
      const mockResponse: ExecuteResult = {
        executionId: 'exec-123',
        exitCode: 0,
        stdout: 'Service list',
        stderr: '',
        status: 'SUCCESS'
      };

      service.executeForAsset(assetId, toolName, args, userConfirmed).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.baseUrl}/recipes/executeForAsset`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        assetId: assetId,
        toolName: toolName,
        arguments: args,
        userConfirmed: userConfirmed,
        userId: 'admin'
      });

      req.flush(mockResponse);
    });
  });

  describe('createExecution', () => {
    it('should create async execution with required parameters', () => {
      const toolName = 'system.flush_dns';
      const args = { verbose: true };
      const mockResponse = { executionId: 'exec-async-123' };

      service.createExecution(toolName, args).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.executionId).toBeTruthy();
      });

      const req = httpMock.expectOne(`${environment.baseUrl}/recipes/execute`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        toolName: toolName,
        arguments: args,
        assetId: undefined,
        userId: 'admin'
      });
      expect(req.request.headers.get('X-API-Key')).toBe(environment.apiKey);

      req.flush(mockResponse);
    });

    it('should create async execution with assetId and userId', () => {
      const toolName = 'apps.install';
      const args = { name: 'vscode', silent: true };
      const assetId = 'remote-asset-456';
      const userId = 'test-user';
      const mockResponse = { executionId: 'exec-async-456' };

      service.createExecution(toolName, args, assetId, userId).subscribe(response => {
        expect(response.executionId).toBe('exec-async-456');
      });

      const req = httpMock.expectOne(`${environment.baseUrl}/recipes/execute`);
      expect(req.request.body).toEqual({
        toolName: toolName,
        arguments: args,
        assetId: assetId,
        userId: userId
      });

      req.flush(mockResponse);
    });
  });

  describe('getExecution', () => {
    it('should fetch execution status by ID', () => {
      const executionId = 'exec-123';
      const mockExecution = {
        id: executionId,
        toolName: 'system.flush_dns',
        status: 'SUCCESS',
        exitCode: 0,
        stdout: 'DNS cache flushed successfully',
        stderr: '',
        startedAt: '2025-10-02T10:00:00Z',
        finishedAt: '2025-10-02T10:00:05Z',
        createdAt: '2025-10-02T09:59:50Z'
      };

      service.getExecution(executionId).subscribe(execution => {
        expect(execution).toEqual(mockExecution);
        expect(execution.status).toBe('SUCCESS');
      });

      const req = httpMock.expectOne(`${environment.baseUrl}/executions/${executionId}`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('X-API-Key')).toBe(environment.apiKey);

      req.flush(mockExecution);
    });

    it('should handle execution in PENDING state', () => {
      const executionId = 'exec-pending-789';
      const mockExecution = {
        id: executionId,
        toolName: 'apps.install',
        status: 'PENDING',
        exitCode: null,
        stdout: null,
        stderr: null,
        startedAt: null,
        finishedAt: null,
        createdAt: '2025-10-02T10:00:00Z'
      };

      service.getExecution(executionId).subscribe(execution => {
        expect(execution.status).toBe('PENDING');
        expect(execution.exitCode).toBeNull();
      });

      const req = httpMock.expectOne(`${environment.baseUrl}/executions/${executionId}`);
      req.flush(mockExecution);
    });
  });

  describe('getHeaders', () => {
    it('should return correct headers', () => {
      const headers = service['getHeaders']();
      expect(headers.get('X-API-Key')).toBe(environment.apiKey);
      expect(headers.get('Content-Type')).toBe('application/json');
    });
  });

  describe('scheduled tasks methods', () => {
    describe('getSchedules', () => {
      it('should fetch all scheduled tasks', () => {
        const mockSchedules = [
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

        service.getSchedules().subscribe(schedules => {
          expect(schedules).toEqual(mockSchedules);
        });

        const req = httpMock.expectOne(`${environment.baseUrl}/schedules`);
        expect(req.request.method).toBe('GET');
        expect(req.request.headers.get('X-API-Key')).toBe(environment.apiKey);

        req.flush(mockSchedules);
      });
    });

    describe('getSchedule', () => {
      it('should fetch specific scheduled task by ID', () => {
        const scheduleId = 'schedule-123';
        const mockSchedule = {
          id: scheduleId,
          name: 'Weekly Maintenance',
          toolName: 'system.cleanup_temp',
          assetId: null,
          arguments: { days: 7 },
          cronExpr: '0 3 * * 0',
          enabled: true,
          lastRunAt: '2025-10-01T03:00:00Z',
          nextRunAt: '2025-10-08T03:00:00Z'
        };

        service.getSchedule(scheduleId).subscribe(schedule => {
          expect(schedule).toEqual(mockSchedule);
        });

        const req = httpMock.expectOne(`${environment.baseUrl}/schedules/${scheduleId}`);
        expect(req.request.method).toBe('GET');
        expect(req.request.headers.get('X-API-Key')).toBe(environment.apiKey);

        req.flush(mockSchedule);
      });
    });

    describe('createSchedule', () => {
      it('should create new scheduled task', () => {
        const newTask = {
          name: 'DNS Flush Every 5 Minutes',
          toolName: 'network.flush_dns',
          assetId: null,
          arguments: {},
          cronExpr: '*/5 * * * *',
          enabled: true
        };
        const mockResponse = {
          id: 'schedule-new-123',
          ...newTask,
          lastRunAt: null,
          nextRunAt: '2025-10-02T10:05:00Z'
        };

        service.createSchedule(newTask).subscribe(schedule => {
          expect(schedule).toEqual(mockResponse);
        });

        const req = httpMock.expectOne(`${environment.baseUrl}/schedules`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(newTask);
        expect(req.request.headers.get('X-API-Key')).toBe(environment.apiKey);
        expect(req.request.headers.get('Content-Type')).toBe('application/json');

        req.flush(mockResponse);
      });
    });

    describe('updateSchedule', () => {
      it('should update existing scheduled task', () => {
        const scheduleId = 'schedule-456';
        const updateData = {
          name: 'Updated Task Name',
          enabled: false
        };
        const mockResponse = {
          id: scheduleId,
          name: 'Updated Task Name',
          toolName: 'system.get_disk_info',
          assetId: null,
          arguments: {},
          cronExpr: '0 */6 * * *',
          enabled: false,
          lastRunAt: '2025-10-02T06:00:00Z',
          nextRunAt: null
        };

        service.updateSchedule(scheduleId, updateData).subscribe(schedule => {
          expect(schedule).toEqual(mockResponse);
        });

        const req = httpMock.expectOne(`${environment.baseUrl}/schedules/${scheduleId}`);
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual(updateData);
        expect(req.request.headers.get('X-API-Key')).toBe(environment.apiKey);

        req.flush(mockResponse);
      });
    });

    describe('deleteSchedule', () => {
      it('should delete scheduled task', () => {
        const scheduleId = 'schedule-789';

        service.deleteSchedule(scheduleId).subscribe(() => {
          // No response body expected for delete
        });

        const req = httpMock.expectOne(`${environment.baseUrl}/schedules/${scheduleId}`);
        expect(req.request.method).toBe('DELETE');
        expect(req.request.headers.get('X-API-Key')).toBe(environment.apiKey);

        req.flush(null);
      });
    });
  });
});
