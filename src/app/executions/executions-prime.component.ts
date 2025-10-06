import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, debounceTime, takeUntil, distinctUntilChanged } from 'rxjs';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ApiService } from '../services/api.service';
import { NotificationService } from '../services/notification.service';
import { ExecutionListItem, ExecStatus, FailureStage, PageResponse } from '../models/api';
import { StatusBadgeComponent, ToolbarActionsComponent } from '../ui-kit';
import { ExecutionDetailsModalComponent } from './execution-details-modal.component';

@Component({
  selector: 'app-executions-prime',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    SelectModule,
    DatePickerModule,
    InputTextModule,
    MultiSelectModule,
    CheckboxModule,
    ButtonModule,
    ProgressSpinnerModule,
    StatusBadgeComponent,
    ToolbarActionsComponent,
    ExecutionDetailsModalComponent
  ],
  templateUrl: './executions-prime.component.html',
  styleUrls: ['./executions-prime.component.scss']
})
export class ExecutionsPrimeComponent implements OnInit, OnDestroy {
  // Form for filters
  filterForm: FormGroup;
  
  // Data
  executions: ExecutionListItem[] = [];
  totalRecords = 0;
  loading = false;
  isExporting = false;
  
  // UI state
  selectedExecution: ExecutionListItem | null = null;
  showExecutionModal = false;
  
  // Filter options
  statusOptions = [
    { label: 'Success', value: 'SUCCESS' },
    { label: 'Failed', value: 'FAILED' },
    { label: 'Error', value: 'ERROR' },
    { label: 'Running', value: 'RUNNING' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Cancelled', value: 'CANCELLED' }
  ];
  
  failureStageOptions = [
    { label: 'Validation', value: 'VALIDATION' },
    { label: 'Render', value: 'RENDER' },
    { label: 'Allowlist', value: 'ALLOWLIST' },
    { label: 'Executor', value: 'EXECUTOR' },
    { label: 'Timeout', value: 'TIMEOUT' },
    { label: 'Remote', value: 'REMOTE' },
    { label: 'Internal', value: 'INTERNAL' },
    { label: 'Non-zero Exit', value: 'NONZERO_EXIT' }
  ];
  
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
      startedFrom: [null],
      startedTo: [null],
      finishedFrom: [null],
      finishedTo: [null],
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
      startedFrom: queryParams['startedFrom'] ? new Date(queryParams['startedFrom']) : null,
      startedTo: queryParams['startedTo'] ? new Date(queryParams['startedTo']) : null,
      finishedFrom: queryParams['finishedFrom'] ? new Date(queryParams['finishedFrom']) : null,
      finishedTo: queryParams['finishedTo'] ? new Date(queryParams['finishedTo']) : null,
      hasResponseJson: queryParams['hasResponseJson'] === 'true',
      correlationId: queryParams['correlationId'] || ''
    });
  }

  /**
   * Save current state to URL
   */
  private saveStateToUrl(params: any): void {
    const queryParams: any = {};
    
    // Add non-empty filters
    Object.keys(params).forEach(key => {
      const value = params[key];
      if (value !== null && value !== undefined && value !== '' && 
          !(Array.isArray(value) && value.length === 0)) {
        if (Array.isArray(value)) {
          queryParams[key] = value.join(',');
        } else if (value instanceof Date) {
          queryParams[key] = value.toISOString();
        } else {
          queryParams[key] = value.toString();
        }
      }
    });
    
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      replaceUrl: true
    });
  }

  /**
   * Handle lazy loading from p-table
   */
  onLazyLoad(event: TableLazyLoadEvent): void {
    this.loading = true;
    
    const formValue = this.filterForm.value;
    const params: any = {
      page: Math.floor((event.first || 0) / (event.rows || 20)),
      size: event.rows || 20
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
    if (event.sortField && typeof event.sortField === 'string') {
      const sortDirection = event.sortOrder === 1 ? 'asc' : 'desc';
      params.sort = [`${event.sortField},${sortDirection}`];
    }
    
    this.apiService.getExecutions(params).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.executions = response.content;
        this.totalRecords = response.totalElements;
        this.loading = false;
        this.saveStateToUrl(params);
      },
      error: (err) => {
        this.loading = false;
        this.notificationService.error('Error loading executions', err.message || 'Unknown error');
      }
    });
  }

  /**
   * Apply filters and reset to page 0
   */
  applyFilters(): void {
    // Trigger lazy load with first page
    this.onLazyLoad({
      first: 0,
      rows: 20,
      sortField: undefined,
      sortOrder: undefined
    });
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
      startedFrom: null,
      startedTo: null,
      finishedFrom: null,
      finishedTo: null,
      hasResponseJson: false,
      correlationId: ''
    });
    this.applyFilters();
  }

  /**
   * Export CSV
   */
  exportCsv(): void {
    this.isExporting = true;
    const formValue = this.filterForm.value;
    
    // Build export parameters
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
}
