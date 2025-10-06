import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { ApiService } from '../services/api.service';
import { PlanRun, PlanStatus } from '../models/plans';
import { PageResponse } from '../models/api';

@Component({
    selector: 'app-plan-runs',
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './plan-runs.component.html',
    styleUrls: ['./plan-runs.component.scss']
})
export class PlanRunsComponent implements OnInit, OnDestroy {
  
  // Make Math available in template
  Math = Math;
  
  // Data
  runs: PlanRun[] = [];
  loading = false;
  error: string | null = null;
  
  // Pagination
  currentPage = 0;
  pageSize = 20;
  totalElements = 0;
  totalPages = 0;
  
  // Filters
  statusFilter: PlanStatus[] = [];
  planIdFilter = '';
  requestedByFilter = '';
  fromDate = '';
  toDate = '';
  sortField = 'startedAt';
  sortDirection = 'desc';
  
  // URL state
  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<void>();
  
  // Status options
  statusOptions: PlanStatus[] = ['PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'CANCELLED'];
  
  constructor(
    private apiService: ApiService,
    public router: Router,
    private cdr: ChangeDetectorRef
  ) {}
  
  ngOnInit(): void {
    this.loadRuns();
    this.setupSearchDebounce();
    this.loadFromUrl();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  // ================================================
  // Data Loading
  // ================================================
  
  loadRuns(): void {
    this.loading = true;
    this.error = null;
    
    const params = {
      page: this.currentPage,
      size: this.pageSize,
      sort: [`${this.sortField},${this.sortDirection}`],
      status: this.statusFilter.length > 0 ? this.statusFilter : undefined,
      planId: this.planIdFilter || undefined,
      requestedBy: this.requestedByFilter || undefined,
      from: this.fromDate || undefined,
      to: this.toDate || undefined
    };
    
    this.apiService.getPlanRuns(params).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: PageResponse<PlanRun>) => {
        this.runs = response.content;
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Error loading plan runs: ' + (err.error?.message || err.message);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
  
  // ================================================
  // Search and Filters
  // ================================================
  
  setupSearchDebounce(): void {
    this.searchSubject$.pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage = 0;
      this.loadRuns();
      this.updateUrl();
    });
  }
  
  onFilterChange(): void {
    this.searchSubject$.next();
  }
  
  onStatusChange(status: PlanStatus, event: Event): void {
    const target = event.target as HTMLInputElement;
    const checked = target.checked;
    if (checked) {
      this.statusFilter.push(status);
    } else {
      const index = this.statusFilter.indexOf(status);
      if (index > -1) {
        this.statusFilter.splice(index, 1);
      }
    }
    this.onFilterChange();
  }
  
  isStatusSelected(status: PlanStatus): boolean {
    return this.statusFilter.includes(status);
  }
  
  clearFilters(): void {
    this.statusFilter = [];
    this.planIdFilter = '';
    this.requestedByFilter = '';
    this.fromDate = '';
    this.toDate = '';
    this.currentPage = 0;
    this.loadRuns();
    this.updateUrl();
  }
  
  // ================================================
  // Sorting
  // ================================================
  
  sortBy(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.currentPage = 0;
    this.loadRuns();
    this.updateUrl();
  }
  
  getSortIcon(field: string): string {
    if (this.sortField !== field) return '↕';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }
  
  // ================================================
  // Pagination
  // ================================================
  
  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadRuns();
      this.updateUrl();
    }
  }
  
  changePageSize(size: number): void {
    this.pageSize = size;
    this.currentPage = 0;
    this.loadRuns();
    this.updateUrl();
  }
  
  // ================================================
  // Actions
  // ================================================
  
  viewRun(run: PlanRun): void {
    this.router.navigate(['/plans/runs', run.id]);
  }
  
  cancelRun(run: PlanRun): void {
    if (confirm(`Are you sure you want to cancel run "${run.id}"?`)) {
      this.apiService.cancelPlanRun(run.id).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.loadRuns();
        },
        error: (err) => {
          this.error = 'Error cancelling run: ' + (err.error?.message || err.message);
          this.cdr.detectChanges();
        }
      });
    }
  }
  
  canCancel(run: PlanRun): boolean {
    return run.status === 'PENDING' || run.status === 'RUNNING';
  }
  
  // ================================================
  // URL State Management
  // ================================================
  
  loadFromUrl(): void {
    const urlParams = new URLSearchParams(window.location.search);
    
    const page = urlParams.get('page');
    if (page) this.currentPage = parseInt(page, 10);
    
    const size = urlParams.get('size');
    if (size) this.pageSize = parseInt(size, 10);
    
    const status = urlParams.get('status');
    if (status) this.statusFilter = status.split(',') as PlanStatus[];
    
    const planId = urlParams.get('planId');
    if (planId) this.planIdFilter = planId;
    
    const requestedBy = urlParams.get('requestedBy');
    if (requestedBy) this.requestedByFilter = requestedBy;
    
    const from = urlParams.get('from');
    if (from) this.fromDate = from;
    
    const to = urlParams.get('to');
    if (to) this.toDate = to;
    
    const sort = urlParams.get('sort');
    if (sort) {
      const [field, direction] = sort.split(',');
      this.sortField = field;
      this.sortDirection = direction as 'asc' | 'desc';
    }
  }
  
  updateUrl(): void {
    const params = new URLSearchParams();
    
    if (this.currentPage > 0) params.set('page', this.currentPage.toString());
    if (this.pageSize !== 20) params.set('size', this.pageSize.toString());
    if (this.statusFilter.length > 0) params.set('status', this.statusFilter.join(','));
    if (this.planIdFilter) params.set('planId', this.planIdFilter);
    if (this.requestedByFilter) params.set('requestedBy', this.requestedByFilter);
    if (this.fromDate) params.set('from', this.fromDate);
    if (this.toDate) params.set('to', this.toDate);
    if (this.sortField !== 'startedAt' || this.sortDirection !== 'desc') {
      params.set('sort', `${this.sortField},${this.sortDirection}`);
    }
    
    const url = params.toString() ? `?${params.toString()}` : '';
    window.history.replaceState({}, '', `/plans/runs${url}`);
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
}
