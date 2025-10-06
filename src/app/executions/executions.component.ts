import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, debounceTime, takeUntil, distinctUntilChanged, timer, switchMap } from 'rxjs';
import { ApiService } from '../services/api.service';
import { NotificationService } from '../services/notification.service';
import { ExecutionListItem, ExecStatus, FailureStage, PageResponse } from '../models/api';
import { ExecutionDetailsModalComponent } from './execution-details-modal.component';

@Component({
    selector: 'app-executions',
    imports: [CommonModule, ReactiveFormsModule, FormsModule, ExecutionDetailsModalComponent],
    templateUrl: './executions.component.html',
    styleUrl: './executions.component.scss'
})
export class ExecutionsComponent implements OnInit, OnDestroy {
  // Form for filters
  filterForm: FormGroup;
  
  // Data
  executions: ExecutionListItem[] = [];
  pageResponse: PageResponse<ExecutionListItem> | null = null;
  isLoading = false;
  isExporting = false;
  
  // UI state
  filtersExpanded = false;
  selectedExecution: ExecutionListItem | null = null;
  showExecutionModal = false;
  
  // Polling
  pollingEnabled = false;
  pollingInterval = 30; // seconds
  pollingIntervalOptions = [10, 30, 60, 120, 300]; // 10s, 30s, 1m, 2m, 5m
  
  // Sorting
  sortFields: { [key: string]: 'asc' | 'desc' | null } = {};
  
  // Constants
  readonly statusOptions: ExecStatus[] = ['PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'ERROR', 'CANCELLED'];
  readonly failureStageOptions: FailureStage[] = ['VALIDATION', 'RENDER', 'ALLOWLIST', 'EXECUTOR', 'TIMEOUT', 'REMOTE', 'INTERNAL', 'NONZERO_EXIT'];
  readonly pageSizeOptions = [10, 20, 50, 100];
  
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.filterForm = this.fb.group({
      q: [''],
      toolName: [''],
      status: [[]],
      failureStage: [[]],
      errorCode: [''],
      userId: [''],
      assetId: [''],
      exitCodeMin: [null],
      exitCodeMax: [null],
      startedFrom: [''],
      startedTo: [''],
      finishedFrom: [''],
      finishedTo: [''],
      hasResponseJson: [false],
      correlationId: ['']
    });
  }

  ngOnInit(): void {
    // Load initial state from URL
    this.loadStateFromUrl();
    
    // Setup debounced search
    this.filterForm.get('q')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.applyFilters();
    });
    
    // Load data
    this.loadExecutions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load state from URL query parameters
   */
  private loadStateFromUrl(): void {
    const queryParams = this.route.snapshot.queryParams;
    
    // Load filters
    this.filterForm.patchValue({
      q: queryParams['q'] || '',
      toolName: queryParams['toolName'] || '',
      status: queryParams['status'] ? queryParams['status'].split(',') : [],
      failureStage: queryParams['failureStage'] ? queryParams['failureStage'].split(',') : [],
      errorCode: queryParams['errorCode'] || '',
      userId: queryParams['userId'] || '',
      assetId: queryParams['assetId'] || '',
      exitCodeMin: queryParams['exitCodeMin'] ? +queryParams['exitCodeMin'] : null,
      exitCodeMax: queryParams['exitCodeMax'] ? +queryParams['exitCodeMax'] : null,
      startedFrom: queryParams['startedFrom'] || '',
      startedTo: queryParams['startedTo'] || '',
      finishedFrom: queryParams['finishedFrom'] || '',
      finishedTo: queryParams['finishedTo'] || '',
      hasResponseJson: queryParams['hasResponseJson'] === 'true',
      correlationId: queryParams['correlationId'] || ''
    });
    
    // Load sorting
    if (queryParams['sort']) {
      const sortFields = queryParams['sort'].split(',');
      this.sortFields = {};
      sortFields.forEach((field: string) => {
        const [name, direction] = field.split(',');
        this.sortFields[name] = direction as 'asc' | 'desc';
      });
    }
  }

  /**
   * Save current state to URL
   */
  private saveStateToUrl(): void {
    const formValue = this.filterForm.value;
    const queryParams: any = {};
    
    // Add non-empty filters
    Object.keys(formValue).forEach(key => {
      const value = formValue[key];
      if (value !== null && value !== undefined && value !== '' && 
          !(Array.isArray(value) && value.length === 0)) {
        if (Array.isArray(value)) {
          queryParams[key] = value.join(',');
        } else {
          queryParams[key] = value.toString();
        }
      }
    });
    
    // Add pagination
    if (this.pageResponse) {
      queryParams.page = this.pageResponse.page;
      queryParams.size = this.pageResponse.size;
    }
    
    // Add sorting
    const sortArray = Object.keys(this.sortFields)
      .filter(key => this.sortFields[key] !== null)
      .map(key => `${key},${this.sortFields[key]}`);
    if (sortArray.length > 0) {
      queryParams.sort = sortArray.join(',');
    }
    
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      replaceUrl: true
    });
  }

  /**
   * Load executions from API
   */
  private loadExecutions(): void {
    this.isLoading = true;
    const formValue = this.filterForm.value;
    
    // Build API parameters
    const params: any = {
      page: this.pageResponse?.page || 0,
      size: this.pageResponse?.size || 20
    };
    
    // Add filters
    Object.keys(formValue).forEach(key => {
      const value = formValue[key];
      if (value !== null && value !== undefined && value !== '' && 
          !(Array.isArray(value) && value.length === 0)) {
        params[key] = value;
      }
    });
    
    // Add sorting
    const sortArray = Object.keys(this.sortFields)
      .filter(key => this.sortFields[key] !== null)
      .map(key => `${key},${this.sortFields[key]}`);
    if (sortArray.length > 0) {
      params.sort = sortArray;
    }
    
    this.apiService.getExecutions(params).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.pageResponse = response;
        this.executions = response.content;
        this.isLoading = false;
        this.saveStateToUrl();
      },
      error: (err) => {
        this.isLoading = false;
        this.notificationService.error('Error loading executions', err.message || 'Unknown error');
      }
    });
  }

  /**
   * Apply filters and reset to page 0
   */
  applyFilters(): void {
    if (this.pageResponse) {
      this.pageResponse.page = 0;
    }
    this.loadExecutions();
  }

  /**
   * Reset all filters
   */
  resetFilters(): void {
    this.filterForm.reset({
      q: '',
      toolName: '',
      status: [],
      failureStage: [],
      errorCode: '',
      userId: '',
      assetId: '',
      exitCodeMin: null,
      exitCodeMax: null,
      startedFrom: '',
      startedTo: '',
      finishedFrom: '',
      finishedTo: '',
      hasResponseJson: false,
      correlationId: ''
    });
    this.sortFields = {};
    this.applyFilters();
  }

  /**
   * Toggle sort for a field
   */
  toggleSort(field: string): void {
    const current = this.sortFields[field];
    if (current === null || current === undefined) {
      this.sortFields[field] = 'desc';
    } else if (current === 'desc') {
      this.sortFields[field] = 'asc';
    } else {
      this.sortFields[field] = null;
    }
    this.applyFilters();
  }

  /**
   * Get sort icon for a field
   */
  getSortIcon(field: string): string {
    const direction = this.sortFields[field];
    if (direction === 'asc') return '↑';
    if (direction === 'desc') return '↓';
    return '↕';
  }

  /**
   * Change page
   */
  goToPage(page: number): void {
    if (this.pageResponse) {
      this.pageResponse.page = page;
      this.loadExecutions();
    }
  }

  /**
   * Change page size
   */
  changePageSize(size: number): void {
    if (this.pageResponse) {
      this.pageResponse.size = size;
      this.pageResponse.page = 0; // Reset to first page
      this.loadExecutions();
    }
  }

  /**
   * Export CSV
   */
  exportCsv(): void {
    this.isExporting = true;
    const formValue = this.filterForm.value;
    
    // Build export parameters (same as loadExecutions but without pagination)
    const params: any = {};
    Object.keys(formValue).forEach(key => {
      const value = formValue[key];
      if (value !== null && value !== undefined && value !== '' && 
          !(Array.isArray(value) && value.length === 0)) {
        params[key] = value;
      }
    });
    
    this.apiService.exportExecutionsCsv(params).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `executions_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        this.isExporting = false;
        this.notificationService.success('Export completed', 'CSV file downloaded successfully');
      },
      error: (err) => {
        this.isExporting = false;
        this.notificationService.error('Export failed', err.message || 'Unknown error');
      }
    });
  }

  /**
   * Show execution details
   */
  showExecutionDetails(execution: ExecutionListItem): void {
    this.selectedExecution = execution;
    this.showExecutionModal = true;
  }

  /**
   * Close execution modal
   */
  closeExecutionModal(): void {
    this.showExecutionModal = false;
    this.selectedExecution = null;
  }

  /**
   * Format duration
   */
  formatDuration(ms: number | null): string {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }

  /**
   * Format date
   */
  formatDate(dateStr: string | null): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  }

  /**
   * Get status badge class
   */
  getStatusClass(status: ExecStatus): string {
    switch (status) {
      case 'SUCCESS': return 'status-success';
      case 'FAILED': return 'status-failed';
      case 'ERROR': return 'status-error';
      case 'RUNNING': return 'status-running';
      case 'PENDING': return 'status-pending';
      case 'CANCELLED': return 'status-cancelled';
      default: return 'status-unknown';
    }
  }

  /**
   * Validate date ranges
   */
  validateDateRanges(): boolean {
    const formValue = this.filterForm.value;
    
    // Check started date range
    if (formValue.startedFrom && formValue.startedTo) {
      const from = new Date(formValue.startedFrom);
      const to = new Date(formValue.startedTo);
      if (from > to) {
        this.notificationService.error('Invalid date range', 'Started "from" date must be before "to" date');
        return false;
      }
    }
    
    // Check finished date range
    if (formValue.finishedFrom && formValue.finishedTo) {
      const from = new Date(formValue.finishedFrom);
      const to = new Date(formValue.finishedTo);
      if (from > to) {
        this.notificationService.error('Invalid date range', 'Finished "from" date must be before "to" date');
        return false;
      }
    }
    
    // Check exit code range
    if (formValue.exitCodeMin !== null && formValue.exitCodeMax !== null) {
      if (formValue.exitCodeMin > formValue.exitCodeMax) {
        this.notificationService.error('Invalid exit code range', 'Minimum exit code must be less than or equal to maximum');
        return false;
      }
    }
    
    return true;
  }

  /**
   * Apply filters with validation
   */
  onApplyFilters(): void {
    if (this.validateDateRanges()) {
      this.applyFilters();
    }
  }

  /**
   * Handle status checkbox change
   */
  onStatusChange(event: any, status: string): void {
    const currentStatuses = this.filterForm.get('status')?.value || [];
    if (event.target.checked) {
      this.filterForm.get('status')?.setValue([...currentStatuses, status]);
    } else {
      this.filterForm.get('status')?.setValue(currentStatuses.filter((s: string) => s !== status));
    }
  }

  /**
   * Handle failure stage checkbox change
   */
  onFailureStageChange(event: any, stage: string): void {
    const currentStages = this.filterForm.get('failureStage')?.value || [];
    if (event.target.checked) {
      this.filterForm.get('failureStage')?.setValue([...currentStages, stage]);
    } else {
      this.filterForm.get('failureStage')?.setValue(currentStages.filter((s: string) => s !== stage));
    }
  }

  /**
   * Get maximum element number for current page
   */
  getMaxPageElement(): number {
    if (!this.pageResponse) return 0;
    return Math.min((this.pageResponse.page + 1) * this.pageResponse.size, this.pageResponse.totalElements);
  }

  /**
   * Handle page size change
   */
  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (target && this.pageResponse) {
      this.changePageSize(+target.value);
    }
  }

  /**
   * Toggle polling on/off
   */
  togglePolling(): void {
    this.pollingEnabled = !this.pollingEnabled;
    if (this.pollingEnabled) {
      this.startPolling();
    } else {
      this.stopPolling();
    }
  }

  /**
   * Start automatic polling
   */
  private startPolling(): void {
    console.log(`Starting polling every ${this.pollingInterval} seconds`);
    timer(0, this.pollingInterval * 1000)
      .pipe(
        switchMap(() => this.loadExecutionsObservable()),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => {
          this.pageResponse = response;
          this.executions = response.content;
          console.log('Polling refresh completed');
        },
        error: (err) => {
          console.error('Polling error:', err);
          this.notificationService.error('Polling error', err.message || 'Unknown error');
        }
      });
  }

  /**
   * Load executions and return Observable for polling
   */
  private loadExecutionsObservable() {
    const formValue = this.filterForm.value;
    
    // Build API parameters
    const params: any = {
      page: this.pageResponse?.page || 0,
      size: this.pageResponse?.size || 20
    };
    
    // Add filters
    Object.keys(formValue).forEach(key => {
      const value = formValue[key];
      if (value !== null && value !== undefined && value !== '' && 
          !(Array.isArray(value) && value.length === 0)) {
        params[key] = value;
      }
    });
    
    // Add sorting
    const sortArray = Object.keys(this.sortFields)
      .filter(key => this.sortFields[key] !== null)
      .map(key => `${key},${this.sortFields[key]}`);
    if (sortArray.length > 0) {
      params.sort = sortArray;
    }
    
    return this.apiService.getExecutions(params);
  }

  /**
   * Stop automatic polling
   */
  private stopPolling(): void {
    console.log('Stopping polling');
    this.destroy$.next();
  }

  /**
   * Handle polling interval change
   */
  onPollingIntervalChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (target) {
      this.pollingInterval = +target.value;
      if (this.pollingEnabled) {
        this.stopPolling();
        this.startPolling();
      }
    }
  }

  /**
   * Format polling interval for display
   */
  formatPollingInterval(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}m`;
    } else {
      return `${Math.floor(seconds / 3600)}h`;
    }
  }
}
