import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { Execution, ExecutionListItem, PageResponse, ExecuteDirectRequest, ExecuteForAssetRequest, ExecuteResult } from '../models/api';

@Injectable({
  providedIn: 'root'
})
export class ExecutionApiService extends BaseApiService {
  
  /**
   * Create an async execution
   */
  createExecution(toolName: string, args: any, assetId?: string, userId?: string): Observable<{executionId: string}> {
    const request = {
      toolName: toolName,
      arguments: args,
      assetId: assetId || undefined,
      userId: userId || 'admin'
    };

    return this.http.post<{executionId: string}>(`${this.baseUrl}/recipes/execute`, request, {
      headers: this.getHeaders()
    });
  }

  /**
   * Get execution status and results
   */
  getExecution(executionId: string): Observable<Execution> {
    return this.http.get<Execution>(`${this.baseUrl}/executions/${executionId}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Execute tool directly
   */
  executeDirect(toolName: string, toolArguments: any, userConfirmed: boolean, assetId?: string): Observable<ExecuteResult> {
    const request: ExecuteDirectRequest = {
      toolName: toolName,
      arguments: toolArguments,
      userConfirmed: userConfirmed,
      userId: 'admin',
      assetId: assetId || 'admin-ui-asset'
    };

    return this.http.post<ExecuteResult>(`${this.baseUrl}/recipes/executeDirect`, request, {
      headers: this.getHeaders()
    });
  }

  /**
   * Execute tool for specific asset
   */
  executeForAsset(assetId: string, toolName: string, args: any, userConfirmed: boolean): Observable<ExecuteResult> {
    const request: ExecuteForAssetRequest = {
      assetId: assetId,
      toolName: toolName,
      arguments: args,
      userConfirmed: userConfirmed,
      userId: 'admin'
    };

    return this.http.post<ExecuteResult>(`${this.baseUrl}/recipes/executeForAsset`, request, {
      headers: this.getHeaders()
    });
  }

  /**
   * Get paginated executions with filtering and sorting
   */
  getExecutions(params: {
    page?: number; 
    size?: number; 
    sort?: string[];
    status?: string[]; 
    toolName?: string; 
    assetId?: string; 
    userId?: string;
    failureStage?: string[]; 
    errorCode?: string;
    exitCodeMin?: number; 
    exitCodeMax?: number;
    startedFrom?: string; 
    startedTo?: string;
    finishedFrom?: string; 
    finishedTo?: string;
    correlationId?: string; 
    hasResponseJson?: boolean;
    q?: string;
  }): Observable<PageResponse<ExecutionListItem>> {
    let httpParams = new URLSearchParams();
    
    // Pagination
    if (params.page !== undefined) httpParams.set('page', params.page.toString());
    if (params.size !== undefined) httpParams.set('size', params.size.toString());
    
    // Sorting (multiple sort fields)
    if (params.sort && params.sort.length > 0) {
      params.sort.forEach(sortField => {
        httpParams.append('sort', sortField);
      });
    }
    
    // Filters
    if (params.status && params.status.length > 0) {
      params.status.forEach(status => {
        httpParams.append('status', status);
      });
    }
    if (params.toolName) httpParams.set('toolName', params.toolName);
    if (params.assetId) httpParams.set('assetId', params.assetId);
    if (params.userId) httpParams.set('userId', params.userId);
    
    if (params.failureStage && params.failureStage.length > 0) {
      params.failureStage.forEach(stage => {
        httpParams.append('failureStage', stage);
      });
    }
    
    if (params.errorCode) httpParams.set('errorCode', params.errorCode);
    if (params.exitCodeMin !== undefined) httpParams.set('exitCodeMin', params.exitCodeMin.toString());
    if (params.exitCodeMax !== undefined) httpParams.set('exitCodeMax', params.exitCodeMax.toString());
    
    if (params.startedFrom) httpParams.set('startedFrom', params.startedFrom);
    if (params.startedTo) httpParams.set('startedTo', params.startedTo);
    if (params.finishedFrom) httpParams.set('finishedFrom', params.finishedFrom);
    if (params.finishedTo) httpParams.set('finishedTo', params.finishedTo);
    
    if (params.correlationId) httpParams.set('correlationId', params.correlationId);
    if (params.hasResponseJson !== undefined) httpParams.set('hasResponseJson', params.hasResponseJson.toString());
    if (params.q) httpParams.set('q', params.q);
    
    return this.http.get<PageResponse<ExecutionListItem>>(`${this.baseUrl}/executions?${httpParams.toString()}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Export executions to CSV
   */
  exportExecutionsCsv(params: {
    status?: string[]; 
    toolName?: string; 
    assetId?: string; 
    userId?: string;
    failureStage?: string[]; 
    errorCode?: string;
    exitCodeMin?: number; 
    exitCodeMax?: number;
    startedFrom?: string; 
    startedTo?: string;
    finishedFrom?: string; 
    finishedTo?: string;
    correlationId?: string; 
    hasResponseJson?: boolean;
    q?: string;
  }): Observable<Blob> {
    let httpParams = new URLSearchParams();
    
    // Apply same filters as getExecutions (excluding pagination)
    if (params.status && params.status.length > 0) {
      params.status.forEach(status => {
        httpParams.append('status', status);
      });
    }
    if (params.toolName) httpParams.set('toolName', params.toolName);
    if (params.assetId) httpParams.set('assetId', params.assetId);
    if (params.userId) httpParams.set('userId', params.userId);
    
    if (params.failureStage && params.failureStage.length > 0) {
      params.failureStage.forEach(stage => {
        httpParams.append('failureStage', stage);
      });
    }
    
    if (params.errorCode) httpParams.set('errorCode', params.errorCode);
    if (params.exitCodeMin !== undefined) httpParams.set('exitCodeMin', params.exitCodeMin.toString());
    if (params.exitCodeMax !== undefined) httpParams.set('exitCodeMax', params.exitCodeMax.toString());
    
    if (params.startedFrom) httpParams.set('startedFrom', params.startedFrom);
    if (params.startedTo) httpParams.set('startedTo', params.startedTo);
    if (params.finishedFrom) httpParams.set('finishedFrom', params.finishedFrom);
    if (params.finishedTo) httpParams.set('finishedTo', params.finishedTo);
    
    if (params.correlationId) httpParams.set('correlationId', params.correlationId);
    if (params.hasResponseJson !== undefined) httpParams.set('hasResponseJson', params.hasResponseJson.toString());
    if (params.q) httpParams.set('q', params.q);
    
    return this.http.get(`${this.baseUrl}/executions/export?${httpParams.toString()}`, {
      headers: this.getHeaders(),
      responseType: 'blob'
    });
  }
}
