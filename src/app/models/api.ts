/**
 * Centralized API types for MCP Admin UI
 */

export interface Tool {
  name: string;
  description: string;
  requiresConfirmation: boolean;
  osSupport: string[];
  parameters?: any; // JSON Schema
  command?: string;
}

export interface ToolDetails {
  name: string;
  description: string;
  requiresConfirmation: boolean;
  osSupport: string[];
  jsonSchema: any;
  command?: string;
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

// Async execution types
export interface ExecuteCreateRequest {
  toolName: string;
  arguments: any;
  assetId?: string;
  userId?: string;
}

export interface ExecuteCreateResponse {
  executionId: string;
}

export type ExecStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'ERROR' | 'CANCELLED';

export interface Execution {
  id: string;
  toolName?: string;
  status: ExecStatus;
  exitCode?: number;
  stdout?: string;
  stderr?: string;
  startedAt?: string;
  finishedAt?: string;
  createdAt?: string;
}

// Legacy sync execution types
export interface ExecuteDirectRequest {
  toolName: string;
  arguments: any;
  userConfirmed: boolean;
  userId?: string;
  assetId?: string;
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

export interface ExecuteForAssetRequest {
  assetId: string;
  toolName: string;
  arguments: any;
  userConfirmed: boolean;
  userId: string;
}

// Discovery types
export interface DiscoveryResult {
  started: boolean;
  cidrs: string[];
  countOnline: number;
  countWinRm: number;
  durationMs: number;
}

// Winget suggestions
export interface Suggestion {
  id: string;
  name: string;
  version?: string;
  source?: string;
}

// Plan types (AI Assistant)
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

export interface ExecutePlanRequest {
  planId: string;
  userConfirmed: boolean;
}

