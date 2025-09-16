import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

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
}

export interface Tool {
  name: string;
  description: string;
  requiresConfirmation: boolean;
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
      assetId: assetId || ''
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
}