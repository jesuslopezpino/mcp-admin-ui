import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { CardModule } from 'primeng/card';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { ApiService } from '../services/api.service';
import { PlanTemplate } from '../models/plans';
import { PageResponse } from '../models/api';

@Component({
    selector: 'app-plans-list',
    imports: [
      CommonModule, 
      FormsModule, 
      RouterModule,
      TableModule,
      ButtonModule,
      InputTextModule,
      CheckboxModule,
      CardModule,
      BadgeModule,
      TooltipModule
    ],
    templateUrl: './plans-list.component.html',
    styleUrls: ['./plans-list.component.scss']
})
export class PlansListComponent implements OnInit, OnDestroy {
  
  // Make Math available in template
  Math = Math;
  
  // Data
  plans: PlanTemplate[] = [];
  loading = false;
  error: string | null = null;
  
  // Pagination
  currentPage = 0;
  pageSize = 20;
  totalElements = 0;
  totalPages = 0;
  
  // Filters
  searchQuery = '';
  enabledFilter: boolean | null = null;
  
  // URL state
  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();
  
  // Table state
  totalRecords = 0;
  
  constructor(
    private apiService: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}
  
  ngOnInit(): void {
    this.loadPlans();
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
  
  loadPlans(): void {
    this.loading = true;
    this.error = null;
    
    const params = {
      page: this.currentPage,
      size: this.pageSize,
      q: this.searchQuery || undefined,
      enabled: this.enabledFilter !== null ? this.enabledFilter : undefined
    };
    
    this.apiService.getPlans(params).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: PageResponse<PlanTemplate>) => {
        this.plans = response.content;
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Error loading plans: ' + (err.error?.message || err.message);
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
      this.loadPlans();
      this.updateUrl();
    });
  }
  
  onSearchChange(): void {
    this.searchSubject$.next(this.searchQuery);
  }
  
  onEnabledFilterChange(): void {
    this.currentPage = 0;
    this.loadPlans();
    this.updateUrl();
  }
  
  clearFilters(): void {
    this.searchQuery = '';
    this.enabledFilter = null;
    this.currentPage = 0;
    this.loadPlans();
    this.updateUrl();
  }
  
  // ================================================
  // Pagination
  // ================================================
  
  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadPlans();
      this.updateUrl();
    }
  }
  
  changePageSize(size: number): void {
    this.pageSize = size;
    this.currentPage = 0;
    this.loadPlans();
    this.updateUrl();
  }
  
  // ================================================
  // Actions
  // ================================================
  
  createPlan(): void {
    this.router.navigate(['/plans/new']);
  }
  
  editPlan(plan: PlanTemplate): void {
    this.router.navigate(['/plans', plan.id]);
  }
  
  viewPlan(plan: PlanTemplate): void {
    this.router.navigate(['/plans', plan.id]);
  }
  
  deletePlan(plan: PlanTemplate): void {
    if (confirm(`Are you sure you want to delete plan "${plan.name}"?`)) {
      this.apiService.deletePlan(plan.id).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.loadPlans();
        },
        error: (err) => {
          this.error = 'Error deleting plan: ' + (err.error?.message || err.message);
          this.cdr.detectChanges();
        }
      });
    }
  }
  
  viewRuns(): void {
    this.router.navigate(['/plans/runs']);
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
    
    const q = urlParams.get('q');
    if (q) this.searchQuery = q;
    
    const enabled = urlParams.get('enabled');
    if (enabled !== null) this.enabledFilter = enabled === 'true';
  }
  
  updateUrl(): void {
    const params = new URLSearchParams();
    
    if (this.currentPage > 0) params.set('page', this.currentPage.toString());
    if (this.pageSize !== 20) params.set('size', this.pageSize.toString());
    if (this.searchQuery) params.set('q', this.searchQuery);
    if (this.enabledFilter !== null) params.set('enabled', this.enabledFilter.toString());
    
    const url = params.toString() ? `?${params.toString()}` : '';
    window.history.replaceState({}, '', `/plans${url}`);
  }
  
  // ================================================
  // Helper Methods
  // ================================================
  
  formatDate(dateString?: string): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  }
  
  getStatusBadgeClass(enabled: boolean): string {
    return enabled ? 'badge-success' : 'badge-danger';
  }
  
  getStatusText(enabled: boolean): string {
    return enabled ? 'Enabled' : 'Disabled';
  }
  
  /**
   * Handle lazy loading from p-table
   */
  onLazyLoad(event: TableLazyLoadEvent): void {
    this.loading = true;
    
    const params: any = {
      page: Math.floor((event.first || 0) / (event.rows || 20)),
      size: event.rows || 20
    };
    
    // Add filters
    if (this.searchQuery) params.q = this.searchQuery;
    if (this.enabledFilter !== null) params.enabled = this.enabledFilter;
    
    // Add sorting
    if (event.sortField && typeof event.sortField === 'string') {
      const sortDirection = event.sortOrder === 1 ? 'asc' : 'desc';
      params.sort = [`${event.sortField},${sortDirection}`];
    }
    
    this.apiService.getPlans(params).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: PageResponse<PlanTemplate>) => {
        this.plans = response.content;
        this.totalRecords = response.totalElements;
        this.loading = false;
        this.updateUrl();
      },
      error: (err) => {
        this.loading = false;
        this.error = err.message || 'Error loading plans';
      }
    });
  }
}
