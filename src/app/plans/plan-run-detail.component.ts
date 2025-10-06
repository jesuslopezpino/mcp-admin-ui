import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Subject, interval, takeUntil } from 'rxjs';
import { ApiService } from '../services/api.service';
import { PlanRunDetail, PlanRunStep, PlanStatus } from '../models/plans';

@Component({
  selector: 'app-plan-run-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './plan-run-detail.component.html',
  styleUrls: ['./plan-run-detail.component.scss']
})
export class PlanRunDetailComponent implements OnInit, OnDestroy {
  
  // Data
  run: PlanRunDetail | null = null;
  loading = false;
  error: string | null = null;
  
  // Auto-refresh
  private refreshInterval = 5000; // 5 seconds
  private destroy$ = new Subject<void>();
  private refreshSubscription$ = interval(this.refreshInterval);
  
  constructor(
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}
  
  ngOnInit(): void {
    this.loadRun();
    this.setupAutoRefresh();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  // ================================================
  // Data Loading
  // ================================================
  
  loadRun(): void {
    const runId = this.route.snapshot.paramMap.get('runId');
    if (!runId) {
      this.error = 'Run ID not provided';
      return;
    }
    
    this.loading = true;
    this.error = null;
    
    this.apiService.getPlanRun(runId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (run) => {
        this.run = run;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Error loading plan run: ' + (err.error?.message || err.message);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
  
  // ================================================
  // Auto-refresh
  // ================================================
  
  setupAutoRefresh(): void {
    this.refreshSubscription$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      if (this.shouldAutoRefresh()) {
        this.loadRun();
      }
    });
  }
  
  shouldAutoRefresh(): boolean {
    return this.run?.status === 'PENDING' || this.run?.status === 'RUNNING';
  }
  
  // ================================================
  // Actions
  // ================================================
  
  cancelRun(): void {
    if (!this.run) return;
    
    if (confirm(`Are you sure you want to cancel run "${this.run.id}"?`)) {
      this.apiService.cancelPlanRun(this.run.id).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.loadRun();
        },
        error: (err) => {
          this.error = 'Error cancelling run: ' + (err.error?.message || err.message);
          this.cdr.detectChanges();
        }
      });
    }
  }
  
  viewExecution(step: PlanRunStep): void {
    if (step.executionId) {
      // Navigate to execution detail or open modal
      this.router.navigate(['/executions', step.executionId]);
    }
  }
  
  viewPlan(): void {
    if (this.run?.planId) {
      this.router.navigate(['/plans', this.run.planId]);
    }
  }
  
  backToRuns(): void {
    this.router.navigate(['/plans/runs']);
  }
  
  // ================================================
  // Helper Methods
  // ================================================
  
  formatDate(dateString?: string): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  }
  
  formatDuration(startedAt?: string, finishedAt?: string): string {
    if (!startedAt) return '-';
    
    const start = new Date(startedAt);
    const end = finishedAt ? new Date(finishedAt) : new Date();
    const duration = end.getTime() - start.getTime();
    
    if (duration < 1000) return '< 1s';
    if (duration < 60000) return `${Math.floor(duration / 1000)}s`;
    if (duration < 3600000) return `${Math.floor(duration / 60000)}m`;
    return `${Math.floor(duration / 3600000)}h`;
  }
  
  getStatusBadgeClass(status: PlanStatus): string {
    switch (status) {
      case 'SUCCESS': return 'badge-success';
      case 'FAILED': return 'badge-danger';
      case 'RUNNING': return 'badge-warning';
      case 'PENDING': return 'badge-info';
      case 'CANCELLED': return 'badge-secondary';
      default: return 'badge-secondary';
    }
  }
  
  getStatusText(status: PlanStatus): string {
    return status.charAt(0) + status.slice(1).toLowerCase();
  }
  
  getStepStatusBadgeClass(status: string): string {
    switch (status) {
      case 'SUCCESS': return 'badge-success';
      case 'FAILED': return 'badge-danger';
      case 'RUNNING': return 'badge-warning';
      case 'PENDING': return 'badge-info';
      default: return 'badge-secondary';
    }
  }
  
  getStepStatusText(status: string): string {
    return status.charAt(0) + status.slice(1).toLowerCase();
  }
  
  formatJson(json: any): string {
    if (!json) return '';
    return JSON.stringify(json, null, 2);
  }
  
  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      // Could show a toast notification here
      console.log('Copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  }
  
  downloadJson(json: any, filename: string): void {
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
  
  isCompleted(): boolean {
    return this.run?.status === 'SUCCESS' || this.run?.status === 'FAILED' || this.run?.status === 'CANCELLED';
  }
  
  canCancel(): boolean {
    return this.run?.status === 'PENDING' || this.run?.status === 'RUNNING';
  }
}
