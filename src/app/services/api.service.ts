import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ScheduledTask, Tool, Asset, Execution, ExecutionListItem, PageResponse } from '../models/api';
import { PlanTemplate, PlanStep, PlanRun, PlanRunDetail, PlanRunStats, RunPlanRequest } from '../models/plans';

export interface PlanRequest {
  userId: string;
  message: string;
  assetId?: string;
}

export interface Plan {
  id: string;
  toolName: string;
  arguments: any;
  riskScore: number;
  rationale: string;
  requiresConfirmation: boolean;
  userId: string;
  assetId: string;
}

export interface PlanResponse {
  plan: Plan;
}

export interface ExecuteRequest {
  planId: string;
  userConfirmed: boolean;
}

export interface ExecuteResult {
  executionId: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  status: string;
  targetHostname?: string;
  targetIp?: string;
}

export interface ToolDetails {
  name: string;
  description: string;
  requiresConfirmation: boolean;
  osSupport: string[];
  jsonSchema: any;
  command?: string; // PowerShell command
}

export interface Suggestion {
  id: string;
  name: string;
  version?: string;
  source?: string;
}

export interface ExecuteDirectRequest {
  toolName: string;
  arguments: any;
  userConfirmed: boolean;
  userId?: string;
  assetId?: string;
}


export interface DiscoveryResult {
  started: boolean;
  cidrs: string[];
  countOnline: number;
  countWinRm: number;
  durationMs: number;
}

export interface ExecuteForAssetRequest {
  assetId: string;
  toolName: string;
  arguments: any;
  userConfirmed: boolean;
  userId: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.baseUrl;
  private apiKey = environment.apiKey;

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'X-API-Key': this.apiKey,
      'Content-Type': 'application/json'
    });
  }

  constructor(private http: HttpClient) { }

  plan(message: string, assetId?: string): Observable<PlanResponse> {
    const request: PlanRequest = {
      userId: 'admin', // Default user for admin UI
      message: message,
      assetId: assetId || 'admin-ui-asset'
    };

    return this.http.post<PlanResponse>(`${this.baseUrl}/ai/plan`, request, {
      headers: this.getHeaders()
    });
  }

  execute(planId: string, userConfirmed: boolean = true): Observable<ExecuteResult> {
    const request: ExecuteRequest = {
      planId: planId,
      userConfirmed: userConfirmed
    };

    return this.http.post<ExecuteResult>(`${this.baseUrl}/recipes/execute`, request, {
      headers: this.getHeaders()
    });
  }

  tools(): Observable<Tool[]> {
    return this.http.get<Tool[]>(`${this.baseUrl}/tools`, {
      headers: this.getHeaders()
    });
  }

  getTool(name: string): Observable<ToolDetails> {
    return this.http.get<ToolDetails>(`${this.baseUrl}/tools/${name}`, {
      headers: this.getHeaders()
    });
  }

  getTools(): Observable<Tool[]> {
    return this.http.get<Tool[]>(`${this.baseUrl}/tools`, {
      headers: this.getHeaders()
    });
  }

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

  suggestWinget(query: string): Observable<Suggestion[]> {
    return this.http.get<Suggestion[]>(`${this.baseUrl}/tools/apps.install/suggest`, {
      headers: this.getHeaders(),
      params: { q: query }
    });
  }

  getAssets(): Observable<Asset[]> {
    return this.http.get<Asset[]>(`${this.baseUrl}/assets`, {
      headers: this.getHeaders()
    });
  }

  discoverAssets(): Observable<DiscoveryResult> {
    return this.http.post<DiscoveryResult>(`${this.baseUrl}/assets/discover`, {}, {
      headers: this.getHeaders()
    });
  }

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
   * Create an async execution (new async endpoint)
   * @param toolName Tool name to execute
   * @param args Tool arguments
   * @param assetId Optional asset ID for remote execution
   * @param userId Optional user ID (defaults to 'admin')
   * @returns Observable with executionId
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
   * @param executionId Execution UUID
   * @returns Observable with execution details
   */
  getExecution(executionId: string): Observable<Execution> {
    return this.http.get<Execution>(`${this.baseUrl}/executions/${executionId}`, {
      headers: this.getHeaders()
    });
  }

  // Scheduled tasks methods
  /**
   * Get all scheduled tasks
   * @returns Observable with array of scheduled tasks
   */
  getSchedules(): Observable<ScheduledTask[]> {
    return this.http.get<ScheduledTask[]>(`${this.baseUrl}/schedules`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Get a specific scheduled task by ID
   * @param id Task ID
   * @returns Observable with scheduled task details
   */
  getSchedule(id: string): Observable<ScheduledTask> {
    return this.http.get<ScheduledTask>(`${this.baseUrl}/schedules/${id}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Create a new scheduled task
   * @param task Task data
   * @returns Observable with created task
   */
  createSchedule(task: Partial<ScheduledTask>): Observable<ScheduledTask> {
    return this.http.post<ScheduledTask>(`${this.baseUrl}/schedules`, task, {
      headers: this.getHeaders()
    });
  }

  /**
   * Update an existing scheduled task
   * @param id Task ID
   * @param task Updated task data
   * @returns Observable with updated task
   */
  updateSchedule(id: string, task: Partial<ScheduledTask>): Observable<ScheduledTask> {
    return this.http.put<ScheduledTask>(`${this.baseUrl}/schedules/${id}`, task, {
      headers: this.getHeaders()
    });
  }

  /**
   * Delete a scheduled task
   * @param id Task ID
   * @returns Observable with void
   */
  deleteSchedule(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/schedules/${id}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Run a scheduled task immediately
   * @param id Task ID
   * @param userId Optional user ID
   * @returns Observable with execution ID
   */
  runNowSchedule(id: string, userId?: string): Observable<{ executionId: string }> {
    const body = userId ? { userId } : {};
    return this.http.post<{ executionId: string }>(
      `${this.baseUrl}/schedules/${id}/run-now`,
      body,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Pause a scheduled task
   * @param id Task ID
   * @returns Observable with void
   */
  pauseSchedule(id: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/schedules/${id}/pause`,
      {},
      { headers: this.getHeaders() }
    );
  }

  /**
   * Resume a scheduled task
   * @param id Task ID
   * @returns Observable with void
   */
  resumeSchedule(id: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/schedules/${id}/resume`,
      {},
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get paginated executions with filtering and sorting
   * @param params Filter and pagination parameters
   * @returns Observable with paginated execution list
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
    let httpParams = new HttpParams();
    
    // Pagination
    if (params.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
    if (params.size !== undefined) httpParams = httpParams.set('size', params.size.toString());
    
    // Sorting (multiple sort fields)
    if (params.sort && params.sort.length > 0) {
      params.sort.forEach(sortField => {
        httpParams = httpParams.append('sort', sortField);
      });
    }
    
    // Filters
    if (params.status && params.status.length > 0) {
      params.status.forEach(status => {
        httpParams = httpParams.append('status', status);
      });
    }
    if (params.toolName) httpParams = httpParams.set('toolName', params.toolName);
    if (params.assetId) httpParams = httpParams.set('assetId', params.assetId);
    if (params.userId) httpParams = httpParams.set('userId', params.userId);
    
    if (params.failureStage && params.failureStage.length > 0) {
      params.failureStage.forEach(stage => {
        httpParams = httpParams.append('failureStage', stage);
      });
    }
    
    if (params.errorCode) httpParams = httpParams.set('errorCode', params.errorCode);
    if (params.exitCodeMin !== undefined) httpParams = httpParams.set('exitCodeMin', params.exitCodeMin.toString());
    if (params.exitCodeMax !== undefined) httpParams = httpParams.set('exitCodeMax', params.exitCodeMax.toString());
    
    if (params.startedFrom) httpParams = httpParams.set('startedFrom', params.startedFrom);
    if (params.startedTo) httpParams = httpParams.set('startedTo', params.startedTo);
    if (params.finishedFrom) httpParams = httpParams.set('finishedFrom', params.finishedFrom);
    if (params.finishedTo) httpParams = httpParams.set('finishedTo', params.finishedTo);
    
    if (params.correlationId) httpParams = httpParams.set('correlationId', params.correlationId);
    if (params.hasResponseJson !== undefined) httpParams = httpParams.set('hasResponseJson', params.hasResponseJson.toString());
    if (params.q) httpParams = httpParams.set('q', params.q);
    
    return this.http.get<PageResponse<ExecutionListItem>>(`${this.baseUrl}/executions`, {
      headers: this.getHeaders(),
      params: httpParams
    });
  }

  /**
   * Export executions to CSV with same filtering options
   * @param params Same filter parameters as getExecutions
   * @returns Observable with CSV blob
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
    let httpParams = new HttpParams();
    
    // Apply same filters as getExecutions (excluding pagination)
    if (params.status && params.status.length > 0) {
      params.status.forEach(status => {
        httpParams = httpParams.append('status', status);
      });
    }
    if (params.toolName) httpParams = httpParams.set('toolName', params.toolName);
    if (params.assetId) httpParams = httpParams.set('assetId', params.assetId);
    if (params.userId) httpParams = httpParams.set('userId', params.userId);
    
    if (params.failureStage && params.failureStage.length > 0) {
      params.failureStage.forEach(stage => {
        httpParams = httpParams.append('failureStage', stage);
      });
    }
    
    if (params.errorCode) httpParams = httpParams.set('errorCode', params.errorCode);
    if (params.exitCodeMin !== undefined) httpParams = httpParams.set('exitCodeMin', params.exitCodeMin.toString());
    if (params.exitCodeMax !== undefined) httpParams = httpParams.set('exitCodeMax', params.exitCodeMax.toString());
    
    if (params.startedFrom) httpParams = httpParams.set('startedFrom', params.startedFrom);
    if (params.startedTo) httpParams = httpParams.set('startedTo', params.startedTo);
    if (params.finishedFrom) httpParams = httpParams.set('finishedFrom', params.finishedFrom);
    if (params.finishedTo) httpParams = httpParams.set('finishedTo', params.finishedTo);
    
    if (params.correlationId) httpParams = httpParams.set('correlationId', params.correlationId);
    if (params.hasResponseJson !== undefined) httpParams = httpParams.set('hasResponseJson', params.hasResponseJson.toString());
    if (params.q) httpParams = httpParams.set('q', params.q);
    
    return this.http.get(`${this.baseUrl}/executions/export`, {
      headers: this.getHeaders(),
      params: httpParams,
      responseType: 'blob'
    });
  }

  // ================================================
  // Plan Templates API
  // ================================================

  getPlans(params?: { 
    page?: number; 
    size?: number; 
    q?: string; 
    enabled?: boolean 
  }): Observable<PageResponse<PlanTemplate>> {
    let httpParams = new HttpParams();
    
    if (params?.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
    if (params?.size !== undefined) httpParams = httpParams.set('size', params.size.toString());
    if (params?.q) httpParams = httpParams.set('q', params.q);
    if (params?.enabled !== undefined) httpParams = httpParams.set('enabled', params.enabled.toString());
    
    return this.http.get<PageResponse<PlanTemplate>>(`${this.baseUrl}/plans`, {
      headers: this.getHeaders(),
      params: httpParams
    });
  }

  getPlan(id: string): Observable<PlanTemplate> {
    return this.http.get<PlanTemplate>(`${this.baseUrl}/plans/${id}`, {
      headers: this.getHeaders()
    });
  }

  createPlan(body: Partial<PlanTemplate>): Observable<PlanTemplate> {
    return this.http.post<PlanTemplate>(`${this.baseUrl}/plans`, body, {
      headers: this.getHeaders()
    });
  }

  updatePlan(id: string, body: Partial<PlanTemplate>): Observable<PlanTemplate> {
    return this.http.put<PlanTemplate>(`${this.baseUrl}/plans/${id}`, body, {
      headers: this.getHeaders()
    });
  }

  deletePlan(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/plans/${id}`, {
      headers: this.getHeaders()
    });
  }

  // ================================================
  // Plan Runs API
  // ================================================

  runPlan(id: string, body: RunPlanRequest): Observable<PlanRun> {
    return this.http.post<PlanRun>(`${this.baseUrl}/plans/${id}/run`, body, {
      headers: this.getHeaders()
    });
  }

  getPlanRuns(params?: {
    page?: number; 
    size?: number; 
    sort?: string[];
    status?: string[]; 
    planId?: string; 
    requestedBy?: string;
    from?: string; 
    to?: string;
  }): Observable<PageResponse<PlanRun>> {
    let httpParams = new HttpParams();
    
    if (params?.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
    if (params?.size !== undefined) httpParams = httpParams.set('size', params.size.toString());
    if (params?.sort) {
      params.sort.forEach(sort => {
        httpParams = httpParams.append('sort', sort);
      });
    }
    if (params?.status) {
      params.status.forEach(status => {
        httpParams = httpParams.append('status', status);
      });
    }
    if (params?.planId) httpParams = httpParams.set('planId', params.planId);
    if (params?.requestedBy) httpParams = httpParams.set('requestedBy', params.requestedBy);
    if (params?.from) httpParams = httpParams.set('from', params.from);
    if (params?.to) httpParams = httpParams.set('to', params.to);
    
    return this.http.get<PageResponse<PlanRun>>(`${this.baseUrl}/plans/runs`, {
      headers: this.getHeaders(),
      params: httpParams
    });
  }

  getPlanRun(runId: string): Observable<PlanRunDetail> {
    return this.http.get<PlanRunDetail>(`${this.baseUrl}/plans/runs/${runId}`, {
      headers: this.getHeaders()
    });
  }

  cancelPlanRun(runId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/plans/runs/${runId}/cancel`, {}, {
      headers: this.getHeaders()
    });
  }

  // ================================================
  // Plan Runs Statistics
  // ================================================

  getPlanRunsStats(): Observable<PlanRunStats> {
    return this.http.get<PlanRunStats>(`${this.baseUrl}/plans/runs/stats`, {
      headers: this.getHeaders()
    });
  }

  getRunningPlanRuns(): Observable<PlanRun[]> {
    return this.http.get<PlanRun[]>(`${this.baseUrl}/plans/runs/running`, {
      headers: this.getHeaders()
    });
  }

  getCompletedPlanRuns(params?: { size?: number }): Observable<PlanRun[]> {
    let httpParams = new HttpParams();
    if (params?.size !== undefined) httpParams = httpParams.set('size', params.size.toString());
    
    return this.http.get<PlanRun[]>(`${this.baseUrl}/plans/runs/completed`, {
      headers: this.getHeaders(),
      params: httpParams
    });
  }
}