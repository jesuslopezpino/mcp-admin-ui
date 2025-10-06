import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiFacadeService } from './api-facade.service';
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
  constructor(private apiFacade: ApiFacadeService) { }

  plan(message: string, assetId?: string): Observable<PlanResponse> {
    return this.apiFacade.plan(message, assetId);
  }

  execute(planId: string, userConfirmed: boolean = true): Observable<ExecuteResult> {
    return this.apiFacade.execute(planId, userConfirmed);
  }

  tools(): Observable<Tool[]> {
    return this.apiFacade.tools();
  }

  getTool(name: string): Observable<ToolDetails> {
    return this.apiFacade.getTool(name);
  }

  getToolSchema(toolName: string): Observable<any> {
    return this.apiFacade.getToolSchema(toolName);
  }

  getTools(): Observable<Tool[]> {
    return this.apiFacade.getTools();
  }

  executeDirect(toolName: string, toolArguments: any, userConfirmed: boolean, assetId?: string): Observable<ExecuteResult> {
    return this.apiFacade.executeDirect(toolName, toolArguments, userConfirmed, assetId);
  }

  suggestWinget(query: string): Observable<Suggestion[]> {
    return this.apiFacade.suggestWinget(query);
  }

  getAssets(): Observable<Asset[]> {
    return this.apiFacade.getAssets();
  }

  discoverAssets(): Observable<DiscoveryResult> {
    return this.apiFacade.discoverAssets();
  }

  executeForAsset(assetId: string, toolName: string, args: any, userConfirmed: boolean): Observable<ExecuteResult> {
    return this.apiFacade.executeForAsset(assetId, toolName, args, userConfirmed);
  }

  createExecution(toolName: string, args: any, assetId?: string, userId?: string): Observable<{executionId: string}> {
    return this.apiFacade.createExecution(toolName, args, assetId, userId);
  }

  getExecution(executionId: string): Observable<Execution> {
    return this.apiFacade.getExecution(executionId);
  }

  // Scheduled tasks methods
  getSchedules(): Observable<ScheduledTask[]> {
    return this.apiFacade.getSchedules();
  }

  getSchedule(id: string): Observable<ScheduledTask> {
    return this.apiFacade.getSchedule(id);
  }

  createSchedule(task: Partial<ScheduledTask>): Observable<ScheduledTask> {
    return this.apiFacade.createSchedule(task);
  }

  updateSchedule(id: string, task: Partial<ScheduledTask>): Observable<ScheduledTask> {
    return this.apiFacade.updateSchedule(id, task);
  }

  deleteSchedule(id: string): Observable<void> {
    return this.apiFacade.deleteSchedule(id);
  }

  runNowSchedule(id: string, userId?: string): Observable<{ executionId: string }> {
    return this.apiFacade.runNowSchedule(id, userId);
  }

  pauseSchedule(id: string): Observable<void> {
    return this.apiFacade.pauseSchedule(id);
  }

  resumeSchedule(id: string): Observable<void> {
    return this.apiFacade.resumeSchedule(id);
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