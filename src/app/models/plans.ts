export type PlanStatus = 'PENDING'|'RUNNING'|'SUCCESS'|'FAILED'|'CANCELLED';
export type OnFail = 'ABORT'|'CONTINUE'|'RETRY';

export interface PlanStep {
  id?: string;
  orderIndex: number;
  toolName: string;
  argumentsJson: any;
  onFail: OnFail;
  retryCount: number;
  retryDelayMs: number;
  requiresConfirm: boolean;
}

export interface PlanTemplate {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
  steps: PlanStep[];
}

export interface RunPlanRequest {
  assetId?: string;
  requestedBy: string;
  correlationId?: string;
}

export interface PlanRun {
  id: string;
  planId: string;
  planName?: string;
  assetId?: string;
  requestedBy: string;
  status: PlanStatus;
  startedAt?: string;
  finishedAt?: string;
  currentStep?: number;
  correlationId?: string;
  summaryJson?: any;
}

export interface PlanRunStep {
  id: string;
  stepId: string;
  orderIndex: number;
  toolName: string;
  status: 'PENDING'|'RUNNING'|'SUCCESS'|'FAILED';
  executionId?: string;
  attempt: number;
  startedAt?: string;
  finishedAt?: string;
  errorCode?: string;
  errorReason?: string;
  responseJson?: any;
}

export interface PlanRunStats {
  pending: number;
  running: number;
  success: number;
  failed: number;
  cancelled: number;
}

export interface PlanRunDetail extends PlanRun {
  steps?: PlanRunStep[];
}
