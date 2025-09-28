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

  describe('getHeaders', () => {
    it('should return correct headers', () => {
      const headers = service['getHeaders']();
      expect(headers.get('X-API-Key')).toBe(environment.apiKey);
      expect(headers.get('Content-Type')).toBe('application/json');
    });
  });
});
