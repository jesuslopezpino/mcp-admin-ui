import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ExecutionPollingService } from './execution-polling.service';
import { ApiService } from './api.service';
import { of, throwError } from 'rxjs';
import { ExecStatus } from '../models/api';

describe('ExecutionPollingService', () => {
  let service: ExecutionPollingService;
  let apiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['getExecution']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ExecutionPollingService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(ExecutionPollingService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should poll until SUCCESS status', (done) => {
    const executionId = 'test-exec-123';
    const responses = [
      { id: executionId, status: 'PENDING' as ExecStatus, toolName: 'test.tool' },
      { id: executionId, status: 'RUNNING' as ExecStatus, toolName: 'test.tool' },
      { id: executionId, status: 'SUCCESS' as ExecStatus, exitCode: 0, stdout: 'Done', toolName: 'test.tool' }
    ];

    let callCount = 0;
    apiService.getExecution.and.callFake(() => {
      return of(responses[callCount++]);
    });

    const emissions: any[] = [];
    service.poll(executionId).subscribe({
      next: (execution) => {
        emissions.push(execution);
      },
      complete: () => {
        expect(emissions.length).toBeGreaterThan(0);
        expect(emissions[emissions.length - 1].status).toBe('SUCCESS');
        done();
      }
    });
  });

  it('should handle ERROR status', (done) => {
    const executionId = 'test-exec-error';
    const errorExecution = {
      id: executionId,
      status: 'ERROR' as ExecStatus,
      exitCode: -1,
      stderr: 'Test error',
      toolName: 'test.tool'
    };

    apiService.getExecution.and.returnValue(of(errorExecution));

    service.poll(executionId).subscribe({
      next: (execution) => {
        expect(execution.status).toBe('ERROR');
        expect(execution.stderr).toBe('Test error');
      },
      complete: () => {
        done();
      }
    });
  });

  it('should retry on HTTP errors', (done) => {
    const executionId = 'test-exec-retry';
    let attemptCount = 0;

    apiService.getExecution.and.callFake(() => {
      attemptCount++;
      if (attemptCount < 3) {
        return throwError(() => new Error('HTTP error'));
      }
      return of({
        id: executionId,
        status: 'SUCCESS' as ExecStatus,
        exitCode: 0,
        toolName: 'test.tool'
      });
    });

    service.poll(executionId).subscribe({
      next: (execution) => {
        if (execution.status === 'SUCCESS') {
          expect(attemptCount).toBe(3);
        }
      },
      complete: () => {
        done();
      }
    });
  });
});

