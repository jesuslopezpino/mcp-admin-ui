import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiFacadeService } from './api-facade.service';
import { ScheduledTask, Tool, Asset, Execution, ExecutionListItem, PageResponse, ToolDetails, Suggestion, ExecuteResult, DiscoveryResult, ExecutePlanRequest } from '../models/api';
import { PlanTemplate, PlanRun, PlanRunDetail, PlanRunStats, RunPlanRequest } from '../models/plans';

export interface PlanRequest {
  userId: string;
  message: string;
  assetId?: string;
}

export interface PlanResponse {
  plan: Plan;
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

export interface ExecuteRequest {
  planId: string;
  userConfirmed: boolean;
}

export interface ExecuteDirectRequest {
  toolName: string;
  arguments: any;
  userConfirmed: boolean;
  userId?: string;
  assetId?: string;
}

export interface ExecuteForAssetRequest {
  assetId: string;
  toolName: string;
  arguments: any;
  userConfirmed: boolean;
  userId: string;
}

// Re-export types for backward compatibility
export { ToolDetails, ExecuteResult, DiscoveryResult } from '../models/api';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private apiFacade: ApiFacadeService) { }

  // ================================================
  // AI/Planning Methods
  // ================================================

  plan(message: string, assetId?: string): Observable<PlanResponse> {
    return this.apiFacade.plan(message, assetId);
  }

  execute(planId: string, userConfirmed: boolean = true): Observable<ExecuteResult> {
    return this.apiFacade.execute(planId, userConfirmed);
  }

  // ================================================
  // Tool Methods
  // ================================================

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

  // ================================================
  // Asset Methods
  // ================================================

  getAssets(): Observable<Asset[]> {
    return this.apiFacade.getAssets();
  }

  discoverAssets(): Observable<DiscoveryResult> {
    return this.apiFacade.discoverAssets();
  }

  executeForAsset(assetId: string, toolName: string, args: any, userConfirmed: boolean): Observable<ExecuteResult> {
    return this.apiFacade.executeForAsset(assetId, toolName, args, userConfirmed);
  }

  // ================================================
  // Execution Methods
  // ================================================

  createExecution(toolName: string, args: any, assetId?: string, userId?: string): Observable<{executionId: string}> {
    return this.apiFacade.createExecution(toolName, args, assetId, userId);
  }

  getExecution(executionId: string): Observable<Execution> {
    return this.apiFacade.getExecution(executionId);
  }

  getExecutions(params: any): Observable<PageResponse<ExecutionListItem>> {
    return this.apiFacade.getExecutions(params);
  }

  exportExecutionsCsv(params: any): Observable<Blob> {
    return this.apiFacade.exportExecutionsCsv(params);
  }

  // ================================================
  // Schedule Methods
  // ================================================

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

  // ================================================
  // Plan Methods
  // ================================================

  getPlans(params?: any): Observable<PageResponse<PlanTemplate>> {
    return this.apiFacade.getPlans(params);
  }

  getPlan(id: string): Observable<PlanTemplate> {
    return this.apiFacade.getPlan(id);
  }

  createPlan(body: Partial<PlanTemplate>): Observable<PlanTemplate> {
    return this.apiFacade.createPlan(body);
  }

  updatePlan(id: string, body: Partial<PlanTemplate>): Observable<PlanTemplate> {
    return this.apiFacade.updatePlan(id, body);
  }

  deletePlan(id: string): Observable<void> {
    return this.apiFacade.deletePlan(id);
  }

  runPlan(id: string, body: RunPlanRequest): Observable<PlanRun> {
    return this.apiFacade.runPlan(id, body);
  }

  getPlanRuns(params?: any): Observable<PageResponse<PlanRun>> {
    return this.apiFacade.getPlanRuns(params);
  }

  getPlanRun(runId: string): Observable<PlanRunDetail> {
    return this.apiFacade.getPlanRun(runId);
  }

  cancelPlanRun(runId: string): Observable<void> {
    return this.apiFacade.cancelPlanRun(runId);
  }

  getPlanRunsStats(): Observable<PlanRunStats> {
    return this.apiFacade.getPlanRunsStats();
  }

  getRunningPlanRuns(): Observable<PlanRun[]> {
    return this.apiFacade.getRunningPlanRuns();
  }

  getCompletedPlanRuns(params?: { size?: number }): Observable<PlanRun[]> {
    return this.apiFacade.getCompletedPlanRuns(params);
  }

  // Asset methods
  createAsset(asset: Asset): Observable<Asset> {
    return this.apiFacade.createAsset(asset);
  }

  updateAsset(id: string, asset: Asset): Observable<Asset> {
    return this.apiFacade.updateAsset(id, asset);
  }
}
