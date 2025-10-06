import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { PlanRequest, PlanResponse, ExecuteResult } from '../models/api';

export interface ExecuteRequest {
  planId: string;
  userConfirmed: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AiApiService extends BaseApiService {
  
  /**
   * Create a plan from natural language
   */
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

  /**
   * Execute a plan
   */
  execute(planId: string, userConfirmed: boolean = true): Observable<ExecuteResult> {
    const request: ExecuteRequest = {
      planId: planId,
      userConfirmed: userConfirmed
    };

    return this.http.post<ExecuteResult>(`${this.baseUrl}/recipes/execute`, request, {
      headers: this.getHeaders()
    });
  }
}
