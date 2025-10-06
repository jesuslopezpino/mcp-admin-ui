import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api.service';
import { NotificationService } from '../services/notification.service';
import { TerminalOutputComponent } from '../components/terminal-output/terminal-output.component';
import { Subject, takeUntil } from 'rxjs';
import { Execution } from '../models/api';

@Component({
    selector: 'app-execution-details-modal',
    imports: [CommonModule, TerminalOutputComponent],
    templateUrl: './execution-details-modal.component.html',
    styleUrl: './execution-details-modal.component.scss'
})
export class ExecutionDetailsModalComponent implements OnInit, OnDestroy {
  @Input() executionId: string | null = null;
  @Output() close = new EventEmitter<void>();

  execution: Execution | null = null;
  loading = false;
  error: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    if (this.executionId) {
      this.loadExecution();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadExecution() {
    if (!this.executionId) return;

    this.loading = true;
    this.error = null;
    this.execution = null;

    this.apiService.getExecution(this.executionId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (execution) => {
        this.execution = execution;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err.message || 'Error al cargar los detalles de la ejecución';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onClose() {
    this.close.emit();
  }

  onReload() {
    if (this.executionId) {
      this.loadExecution();
    }
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

  formatDuration(startedAt?: string, finishedAt?: string): string | null {
    if (!startedAt || !finishedAt) return null;

    const start = new Date(startedAt);
    const end = new Date(finishedAt);
    const durationMs = end.getTime() - start.getTime();

    if (durationMs < 1000) {
      return `${durationMs}ms`;
    } else if (durationMs < 60000) {
      return `${(durationMs / 1000).toFixed(1)}s`;
    } else {
      const minutes = Math.floor(durationMs / 60000);
      const seconds = Math.floor((durationMs % 60000) / 1000);
      return `${minutes}m ${seconds}s`;
    }
  }

  getPrettyJson(json: any): string {
    try {
      return JSON.stringify(json, null, 2);
    } catch (error) {
      return String(json);
    }
  }

  async copyJson(json: any): Promise<void> {
    try {
      const jsonString = JSON.stringify(json, null, 2);
      await navigator.clipboard.writeText(jsonString);
      this.notificationService.success('JSON copiado', 'El contenido JSON se ha copiado al portapapeles');
    } catch (error) {
      console.error('Error copying JSON:', error);
      this.notificationService.error('Error al copiar', 'No se pudo copiar el JSON al portapapeles');
    }
  }

  downloadJson(json: any): void {
    try {
      const jsonString = JSON.stringify(json, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const filename = this.execution?.id ? `execution_${this.execution.id}.json` : 'execution_response.json';
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      this.notificationService.success('JSON descargado', `Archivo ${filename} descargado correctamente`);
    } catch (error) {
      console.error('Error downloading JSON:', error);
      this.notificationService.error('Error al descargar', 'No se pudo descargar el archivo JSON');
    }
  }

  async copyOutput(type: 'stdout' | 'stderr'): Promise<void> {
    if (!this.execution) return;

    const content = type === 'stdout' ? this.execution.stdout : this.execution.stderr;
    if (!content) return;

    try {
      await navigator.clipboard.writeText(content);
      this.notificationService.success('Contenido copiado', `El ${type} se ha copiado al portapapeles`);
    } catch (error) {
      console.error(`Error copying ${type}:`, error);
      this.notificationService.error('Error al copiar', `No se pudo copiar el ${type} al portapapeles`);
    }
  }

  downloadOutput(type: 'stdout' | 'stderr'): void {
    if (!this.execution) return;

    const content = type === 'stdout' ? this.execution.stdout : this.execution.stderr;
    if (!content) return;

    try {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const filename = this.execution.id ? `execution_${this.execution.id}_${type}.txt` : `execution_${type}.txt`;
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      this.notificationService.success('Archivo descargado', `Archivo ${filename} descargado correctamente`);
    } catch (error) {
      console.error(`Error downloading ${type}:`, error);
      this.notificationService.error('Error al descargar', `No se pudo descargar el archivo ${type}`);
    }
  }

  getSelectedAsset(): any {
    // For now, return null since we don't have asset information in the execution details
    // This could be enhanced later to fetch asset details if needed
    return null;
  }
}
