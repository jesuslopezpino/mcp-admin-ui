import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { PlanTemplate, PlanRun, PlanRunDetail, PlanRunStats, RunPlanRequest } from '../models/plans';
import { PageResponse } from '../models/api';

@Injectable({
  providedIn: 'root'
})
export class PlanApiService extends BaseApiService {
  
  /**
   * Get plan templates with pagination and filtering
   */
  getPlans(params?: { 
    page?: number; 
    size?: number; 
    q?: string; 
    enabled?: boolean 
  }): Observable<PageResponse<PlanTemplate>> {
    let httpParams = new URLSearchParams();
    
    if (params?.page !== undefined) httpParams.set('page', params.page.toString());
    if (params?.size !== undefined) httpParams.set('size', params.size.toString());
    if (params?.q) httpParams.set('q', params.q);
    if (params?.enabled !== undefined) httpParams.set('enabled', params.enabled.toString());
    
    return this.http.get<PageResponse<PlanTemplate>>(`${this.baseUrl}/plans?${httpParams.toString()}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Get a specific plan template
   */
  getPlan(id: string): Observable<PlanTemplate> {
    return this.http.get<PlanTemplate>(`${this.baseUrl}/plans/${id}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Create a new plan template
   */
  createPlan(body: Partial<PlanTemplate>): Observable<PlanTemplate> {
    return this.http.post<PlanTemplate>(`${this.baseUrl}/plans`, body, {
      headers: this.getHeaders()
    });
  }

  /**
   * Update an existing plan template
   */
  updatePlan(id: string, body: Partial<PlanTemplate>): Observable<PlanTemplate> {
    return this.http.put<PlanTemplate>(`${this.baseUrl}/plans/${id}`, body, {
      headers: this.getHeaders()
    });
  }

  /**
   * Delete a plan template
   */
  deletePlan(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/plans/${id}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Run a plan
   */
  runPlan(id: string, body: RunPlanRequest): Observable<PlanRun> {
    return this.http.post<PlanRun>(`${this.baseUrl}/plans/${id}/run`, body, {
      headers: this.getHeaders()
    });
  }

  /**
   * Get plan runs with filtering and pagination
   */
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
    let httpParams = new URLSearchParams();
    
    if (params?.page !== undefined) httpParams.set('page', params.page.toString());
    if (params?.size !== undefined) httpParams.set('size', params.size.toString());
    if (params?.sort) {
      params.sort.forEach(sort => {
        httpParams.append('sort', sort);
      });
    }
    if (params?.status) {
      params.status.forEach(status => {
        httpParams.append('status', status);
      });
    }
    if (params?.planId) httpParams.set('planId', params.planId);
    if (params?.requestedBy) httpParams.set('requestedBy', params.requestedBy);
    if (params?.from) httpParams.set('from', params.from);
    if (params?.to) httpParams.set('to', params.to);
    
    return this.http.get<PageResponse<PlanRun>>(`${this.baseUrl}/plans/runs?${httpParams.toString()}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Get a specific plan run
   */
  getPlanRun(runId: string): Observable<PlanRunDetail> {
    return this.http.get<PlanRunDetail>(`${this.baseUrl}/plans/runs/${runId}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Cancel a plan run
   */
  cancelPlanRun(runId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/plans/runs/${runId}/cancel`, {}, {
      headers: this.getHeaders()
    });
  }

  /**
   * Get plan runs statistics
   */
  getPlanRunsStats(): Observable<PlanRunStats> {
    return this.http.get<PlanRunStats>(`${this.baseUrl}/plans/runs/stats`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Get running plan runs
   */
  getRunningPlanRuns(): Observable<PlanRun[]> {
    return this.http.get<PlanRun[]>(`${this.baseUrl}/plans/runs/running`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Get completed plan runs
   */
  getCompletedPlanRuns(params?: { size?: number }): Observable<PlanRun[]> {
    let httpParams = new URLSearchParams();
    if (params?.size !== undefined) httpParams.set('size', params.size.toString());
    
    return this.http.get<PlanRun[]>(`${this.baseUrl}/plans/runs/completed?${httpParams.toString()}`, {
      headers: this.getHeaders()
    });
  }
}
