import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { NotificationService } from '../services/notification.service';
import { ExecutionPollingService } from '../services/execution-polling.service';
import { TerminalOutputComponent } from '../components/terminal-output/terminal-output.component';
import { TargetSelectorComponent } from '../components/target-selector/target-selector.component';
import { CommandPreviewService } from '../services/command-preview.service';
import { FormHandlerService } from '../services/form-handler.service';
import { Subject, takeUntil } from 'rxjs';
import { ToolDetails, Asset, Execution, ExecStatus } from '../models/api';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-run-tool-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TerminalOutputComponent, TargetSelectorComponent],
  templateUrl: './run-tool-modal.component.html',
  styleUrl: './run-tool-modal.component.scss'
})
export class RunToolModalComponent implements OnInit, OnDestroy {
  @Input() tool: ToolDetails | null = null;
  @Input() assetId: string | null = null;
  @Input() destinationLabel: string | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() result = new EventEmitter<Execution>();

  form: FormGroup;
  isExecuting = false;
  executionResult: Execution | null = null;
  executionId: string | null = null;
  currentStatus: ExecStatus | null = null;
  
  assets: Asset[] = [];
  selectedAssetId: string | null = null;
  isTargetRequired = false;
  
  // Preview properties
  showPreview = false;
  previewCommand: string = '';
  
  // Confirmation
  showConfirmationDialog = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private notificationService: NotificationService,
    private pollingService: ExecutionPollingService,
    private commandPreviewService: CommandPreviewService,
    private formHandlerService: FormHandlerService,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({});
  }

  ngOnInit() {
    this.loadAssets();
    this.setupForm();
    this.checkTargetRequirement();
    
    // Set assetId if provided
    if (this.assetId) {
      this.selectedAssetId = this.assetId;
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAssets() {
    this.apiService.getAssets().subscribe({
      next: (assets) => {
        this.assets = assets;
        
        // Load saved selection from localStorage if feature enabled
        if (environment.featureFlags.rememberArgs && typeof localStorage !== 'undefined') {
          const savedAssetId = localStorage.getItem('mcp.ui.selectedAsset');
          const isRemembered = localStorage.getItem('mcp.ui.rememberedAsset') === 'true';
          
          if (savedAssetId && savedAssetId !== 'null' && isRemembered) {
            const savedAsset = assets.find(asset => asset.id === savedAssetId);
            if (savedAsset && !this.assetId) {
              this.selectedAssetId = savedAssetId;
            }
          }
        }
      },
      error: (err) => {
        console.warn('Error loading assets:', err);
      }
    });
  }

  setupForm() {
    if (!this.tool?.jsonSchema?.properties) {
      this.form = this.fb.group({});
      return;
    }

    const formControls: any = {};
    const properties = this.tool.jsonSchema.properties;
    const required = this.tool.jsonSchema.required || [];

    Object.keys(properties).forEach(key => {
      const prop = properties[key];
      const validators = [];
      
      if (required.includes(key)) {
        validators.push(Validators.required);
      }
      
      if (prop.type === 'string' && prop.minLength) {
        validators.push(Validators.minLength(prop.minLength));
      }
      
      if (prop.type === 'string' && prop.maxLength) {
        validators.push(Validators.maxLength(prop.maxLength));
      }

      formControls[key] = [prop.default || '', validators];
    });

    this.form = this.fb.group(formControls);
  }

  checkTargetRequirement() {
    if (!this.tool) return;
    
    const properties = this.tool.jsonSchema?.properties || {};
    this.isTargetRequired = 'targetHostname' in properties || 'targetIp' in properties;
  }

  onClose() {
    if (this.isExecuting) {
      const confirmClose = confirm('Hay una ejecución en progreso. ¿Seguro que quieres cerrar?');
      if (!confirmClose) return;
    }
    this.close.emit();
  }

  onSubmit() {
    if (this.form.invalid) {
      this.notificationService.error('Formulario inválido', 'Por favor, completa todos los campos requeridos');
      Object.keys(this.form.controls).forEach(key => {
        const control = this.form.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
      return;
    }

    if (this.isTargetRequired && !this.isTargetValid()) {
      this.notificationService.error('Destino requerido', 'Debes seleccionar un destino antes de ejecutar la herramienta');
      return;
    }

    // Show confirmation dialog if required
    if (this.tool?.requiresConfirmation) {
      this.showConfirmationDialog = true;
      return;
    }

    this.executeTool();
  }

  onConfirm() {
    this.showConfirmationDialog = false;
    this.executeTool();
  }

  onCancelConfirmation() {
    this.showConfirmationDialog = false;
  }

  executeTool() {
    if (!this.tool) return;

    this.isExecuting = true;
    this.executionResult = null;
    this.executionId = null;
    this.currentStatus = 'PENDING';
    
    // Disable form inputs
    this.form.disable();

    const formValue = this.form.value;
    const selectedAsset = this.getSelectedAsset();
    
    // Add target information if required
    if (this.isTargetRequired && selectedAsset) {
      if ('targetHostname' in this.tool.jsonSchema?.properties || {}) {
        formValue.targetHostname = selectedAsset.hostname || selectedAsset.ip;
      }
      if ('targetIp' in this.tool.jsonSchema?.properties || {}) {
        formValue.targetIp = selectedAsset.ip;
      }
    }

    // Create async execution
    this.apiService.createExecution(
      this.tool.name, 
      formValue, 
      this.selectedAssetId || undefined
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.executionId = response.executionId;
        this.notificationService.info('Ejecución iniciada', `Ejecución ${this.executionId.substring(0, 8)}... en progreso`);
        
        // Start polling for results
        this.pollExecution(this.executionId);
      },
      error: (err) => {
        this.isExecuting = false;
        this.form.enable();
        this.currentStatus = 'ERROR';
        
        const errorMsg = err.error?.message || err.message || 'Error desconocido';
        this.executionResult = {
          id: '',
          status: 'ERROR',
          exitCode: -1,
          stdout: '',
          stderr: errorMsg
        };
        
        this.notificationService.error('Error al crear ejecución', errorMsg);
        this.cdr.detectChanges();
      }
    });
  }

  pollExecution(executionId: string) {
    this.pollingService.poll(executionId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (execution) => {
        this.currentStatus = execution.status;
        this.executionResult = execution;
        this.cdr.detectChanges();
        
        // Check if final state
        if (this.isFinalState(execution.status)) {
          this.isExecuting = false;
          this.form.enable();
          
          if (execution.status === 'SUCCESS') {
            this.notificationService.success(
              'Ejecución completada', 
              `La herramienta ${this.tool?.name} se ejecutó correctamente`
            );
          } else {
            this.notificationService.error(
              'Ejecución fallida', 
              `Error ejecutando ${this.tool?.name}: ${execution.stderr || 'Error desconocido'}`
            );
          }
          
          this.result.emit(execution);
        }
      },
      error: (err) => {
        this.isExecuting = false;
        this.form.enable();
        this.currentStatus = 'ERROR';
        
        this.executionResult = {
          id: executionId,
          status: 'ERROR',
          exitCode: -1,
          stdout: '',
          stderr: err.message || 'Error durante el polling'
        };
        
        this.notificationService.error('Error de polling', err.message || 'Error desconocido');
        this.cdr.detectChanges();
      }
    });
  }

  isFinalState(status: ExecStatus): boolean {
    return status === 'SUCCESS' || status === 'FAILED' || status === 'ERROR' || status === 'CANCELLED';
  }

  isTargetValid(): boolean {
    if (!this.isTargetRequired) return true;
    return this.selectedAssetId !== null && this.selectedAssetId !== '';
  }

  getSelectedAsset(): Asset | null {
    if (!this.selectedAssetId) return null;
    return this.assets.find(asset => asset.id === this.selectedAssetId) || null;
  }

  onTargetSelected(assetId: string | null) {
    this.selectedAssetId = assetId;
    
    if (environment.featureFlags.rememberArgs && typeof localStorage !== 'undefined') {
      if (assetId) {
        localStorage.setItem('mcp.ui.selectedAsset', assetId);
        localStorage.setItem('mcp.ui.rememberedAsset', 'true');
      } else {
        localStorage.removeItem('mcp.ui.selectedAsset');
        localStorage.removeItem('mcp.ui.rememberedAsset');
      }
    }
    
    this.cdr.detectChanges();
  }

  onPreview() {
    if (!this.tool || this.form.invalid) return;
    if (this.isTargetRequired && !this.isTargetValid()) {
      this.notificationService.error(
        'Destino requerido',
        'Debes seleccionar un destino antes de previsualizar la herramienta'
      );
      return;
    }
    this.generatePreviewCommand();
    this.showPreview = true;
  }

  onClosePreview() {
    this.showPreview = false;
    this.previewCommand = '';
  }

  private generatePreviewCommand() {
    if (!this.tool) return;
    
    const selectedAsset = this.getSelectedAsset();
    const formValue = this.form.value;
    
    this.previewCommand = this.commandPreviewService.generatePreview(this.tool, formValue, selectedAsset || undefined);
  }

  getFieldRequired(prop: any): boolean {
    return this.formHandlerService.getFieldRequired(this.tool, prop);
  }

  getFieldNames(): string[] {
    return this.formHandlerService.getFieldNames(this.tool);
  }

  getFieldLabel(fieldName: string): string {
    return this.formHandlerService.getFieldLabel(this.tool, fieldName);
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'SUCCESS': return '✅';
      case 'PENDING': return '⏳';
      case 'RUNNING': return '▶️';
      case 'FAILED': return '❌';
      case 'ERROR': return '⚠️';
      case 'CANCELLED': return '🚫';
      default: return '❓';
    }
  }

  getDestinationDisplay(): string {
    if (this.destinationLabel) {
      return this.destinationLabel;
    }
    
    if (this.selectedAssetId) {
      const asset = this.getSelectedAsset();
      return asset ? `${asset.hostname || asset.ip} (${asset.ip})` : `Asset: ${this.selectedAssetId}`;
    }
    
    return this.assetId ? `Asset: ${this.assetId}` : 'Servidor (local)';
  }

  getFieldPlaceholder(prop: any): string {
    return this.formHandlerService.getFieldPlaceholder(prop);
  }

  getFieldType(prop: any): string {
    return this.formHandlerService.getFieldType(prop);
  }

  getFieldMin(prop: any): number | null {
    return this.formHandlerService.getFieldMin(prop);
  }

  getFieldMax(prop: any): number | null {
    return this.formHandlerService.getFieldMax(prop);
  }

  getFieldOptions(prop: any): string[] {
    return this.formHandlerService.getFieldOptions(prop);
  }
}