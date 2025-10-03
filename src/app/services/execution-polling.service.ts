import { Injectable } from '@angular/core';
import { Observable, timer, throwError, of } from 'rxjs';
import { switchMap, takeWhile, map, retry, catchError, tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { Execution, ExecStatus } from '../models/api';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExecutionPollingService {
  private pollingInterval = environment.pollingIntervalMs;

  constructor(private apiService: ApiService) { }

  /**
   * Poll execution status until it reaches a final state
   * @param executionId Execution UUID
   * @returns Observable that emits execution updates until completion
   */
  poll(executionId: string): Observable<Execution> {
    return timer(0, this.pollingInterval).pipe(
      switchMap(() => 
        this.apiService.getExecution(executionId).pipe(
          retry({
            count: 3,
            delay: 1000
          }),
          catchError(err => {
            console.error('Error polling execution:', err);
            return of({
              id: executionId,
              status: 'ERROR' as ExecStatus,
              stderr: err.error?.message || err.message || 'Error retrieving execution status',
              exitCode: -1
            } as Execution);
          })
        )
      ),
      tap(execution => {
        console.log('Polling execution:', execution.id, 'Status:', execution.status);
      }),
      takeWhile(execution => this.isNotFinalState(execution.status), true),
      map(execution => this.mapExecution(execution))
    );
  }

  /**
   * Check if status is not final (still running)
   */
  private isNotFinalState(status: ExecStatus): boolean {
    return status === 'PENDING' || status === 'RUNNING';
  }

  /**
   * Map API response to Execution type
   */
  private mapExecution(data: any): Execution {
    return {
      id: data.id,
      toolName: data.toolName,
      status: data.status as ExecStatus,
      exitCode: data.exitCode,
      stdout: data.stdout,
      stderr: data.stderr,
      startedAt: data.startedAt,
      finishedAt: data.finishedAt,
      createdAt: data.createdAt
    };
  }
}

