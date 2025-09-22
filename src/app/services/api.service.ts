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
  osSupport?: string[];
  parameters?: any; // JSON Schema
}

export interface ToolDetails {
  name: string;
  description: string;
  requiresConfirmation: boolean;
  osSupport: string[];
  jsonSchema: any;
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

export interface Asset {
  id: string;
  hostname: string;
  ip: string;
  os: string;
  status: string;
  winrmEnabled: boolean;
  lastSeen: string;
  pingResult?: {
    status: string;
    message: string;
    timestamp: Date;
    details: {
      exitCode: number;
      stdout: string;
      stderr: string;
    };
  };
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
}