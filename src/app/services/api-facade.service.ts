import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ToolApiService } from './tool-api.service';
import { AssetApiService } from './asset-api.service';
import { ExecutionApiService } from './execution-api.service';
import { ScheduleApiService } from './schedule-api.service';
import { PlanApiService } from './plan-api.service';
import { AiApiService } from './ai-api.service';
import { Tool, Asset, Execution, ExecutionListItem, PageResponse, ScheduledTask, ToolDetails, Suggestion, ExecuteResult, DiscoveryResult } from '../models/api';
import { PlanTemplate, PlanRun, PlanRunDetail, PlanRunStats, RunPlanRequest } from '../models/plans';

/**
 * Facade service that provides a unified interface to all API services
 * This maintains backward compatibility while using the new modular services
 */
@Injectable({
  providedIn: 'root'
})
export class ApiFacadeService {
  
  constructor(
    private toolApi: ToolApiService,
    private assetApi: AssetApiService,
    private executionApi: ExecutionApiService,
    private scheduleApi: ScheduleApiService,
    private planApi: PlanApiService,
    private aiApi: AiApiService
  ) {}

  // ================================================
  // Tool API Methods
  // ================================================
  
  tools(): Observable<Tool[]> {
    return this.toolApi.getTools();
  }

  getTool(name: string): Observable<ToolDetails> {
    return this.toolApi.getTool(name);
  }

  getTools(): Observable<Tool[]> {
    return this.toolApi.getTools();
  }

  getToolSchema(toolName: string): Observable<any> {
    return this.toolApi.getToolSchema(toolName);
  }

  suggestWinget(query: string): Observable<Suggestion[]> {
    return this.toolApi.suggestWinget(query);
  }

  // ================================================
  // Asset API Methods
  // ================================================

  getAssets(): Observable<Asset[]> {
    return this.assetApi.getAssets();
  }

  discoverAssets(): Observable<DiscoveryResult> {
    return this.assetApi.discoverAssets();
  }

  // ================================================
  // Execution API Methods
  // ================================================

  createExecution(toolName: string, args: any, assetId?: string, userId?: string): Observable<{executionId: string}> {
    return this.executionApi.createExecution(toolName, args, assetId, userId);
  }

  getExecution(executionId: string): Observable<Execution> {
    return this.executionApi.getExecution(executionId);
  }

  executeDirect(toolName: string, toolArguments: any, userConfirmed: boolean, assetId?: string): Observable<ExecuteResult> {
    return this.executionApi.executeDirect(toolName, toolArguments, userConfirmed, assetId);
  }

  executeForAsset(assetId: string, toolName: string, args: any, userConfirmed: boolean): Observable<ExecuteResult> {
    return this.executionApi.executeForAsset(assetId, toolName, args, userConfirmed);
  }

  getExecutions(params: any): Observable<PageResponse<ExecutionListItem>> {
    return this.executionApi.getExecutions(params);
  }

  exportExecutionsCsv(params: any): Observable<Blob> {
    return this.executionApi.exportExecutionsCsv(params);
  }

  // ================================================
  // Schedule API Methods
  // ================================================

  getSchedules(): Observable<ScheduledTask[]> {
    return this.scheduleApi.getSchedules();
  }

  getSchedule(id: string): Observable<ScheduledTask> {
    return this.scheduleApi.getSchedule(id);
  }

  createSchedule(task: Partial<ScheduledTask>): Observable<ScheduledTask> {
    return this.scheduleApi.createSchedule(task);
  }

  updateSchedule(id: string, task: Partial<ScheduledTask>): Observable<ScheduledTask> {
    return this.scheduleApi.updateSchedule(id, task);
  }

  deleteSchedule(id: string): Observable<void> {
    return this.scheduleApi.deleteSchedule(id);
  }

  runNowSchedule(id: string, userId?: string): Observable<{ executionId: string }> {
    return this.scheduleApi.runNowSchedule(id, userId);
  }

  pauseSchedule(id: string): Observable<void> {
    return this.scheduleApi.pauseSchedule(id);
  }

  resumeSchedule(id: string): Observable<void> {
    return this.scheduleApi.resumeSchedule(id);
  }

  // ================================================
  // Plan API Methods
  // ================================================

  getPlans(params?: any): Observable<PageResponse<PlanTemplate>> {
    return this.planApi.getPlans(params);
  }

  getPlan(id: string): Observable<PlanTemplate> {
    return this.planApi.getPlan(id);
  }

  createPlan(body: Partial<PlanTemplate>): Observable<PlanTemplate> {
    return this.planApi.createPlan(body);
  }

  updatePlan(id: string, body: Partial<PlanTemplate>): Observable<PlanTemplate> {
    return this.planApi.updatePlan(id, body);
  }

  deletePlan(id: string): Observable<void> {
    return this.planApi.deletePlan(id);
  }

  runPlan(id: string, body: RunPlanRequest): Observable<PlanRun> {
    return this.planApi.runPlan(id, body);
  }

  getPlanRuns(params?: any): Observable<PageResponse<PlanRun>> {
    return this.planApi.getPlanRuns(params);
  }

  getPlanRun(runId: string): Observable<PlanRunDetail> {
    return this.planApi.getPlanRun(runId);
  }

  cancelPlanRun(runId: string): Observable<void> {
    return this.planApi.cancelPlanRun(runId);
  }

  getPlanRunsStats(): Observable<PlanRunStats> {
    return this.planApi.getPlanRunsStats();
  }

  getRunningPlanRuns(): Observable<PlanRun[]> {
    return this.planApi.getRunningPlanRuns();
  }

  getCompletedPlanRuns(params?: { size?: number }): Observable<PlanRun[]> {
    return this.planApi.getCompletedPlanRuns(params);
  }

  // ================================================
  // AI API Methods
  // ================================================

  plan(message: string, assetId?: string): Observable<any> {
    return this.aiApi.plan(message, assetId);
  }

  execute(planId: string, userConfirmed: boolean = true): Observable<ExecuteResult> {
    return this.aiApi.execute(planId, userConfirmed);
  }
}
