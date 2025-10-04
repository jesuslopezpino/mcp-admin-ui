import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { NotificationService } from '../services/notification.service';
import { Execution } from '../models/api';

@Component({
  selector: 'app-executions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './executions.component.html',
  styleUrl: './executions.component.scss'
})
export class ExecutionsComponent implements OnInit {
  lookupForm: FormGroup;
  execution: Execution | null = null;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private notificationService: NotificationService
  ) {
    this.lookupForm = this.fb.group({
      executionId: ['', [Validators.required, Validators.pattern(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)]]
    });
  }

  ngOnInit() {
    // Component initialization
  }

  onLookup() {
    if (this.lookupForm.invalid) {
      this.notificationService.error('ID inválido', 'Por favor, introduce un ID de ejecución válido (UUID)');
      return;
    }

    const executionId = this.lookupForm.get('executionId')?.value;
    this.isLoading = true;
    this.execution = null;

    this.apiService.getExecution(executionId).subscribe({
      next: (execution) => {
        this.execution = execution;
        this.isLoading = false;
        this.notificationService.success('Ejecución encontrada', `Ejecución ${executionId.substring(0, 8)}... cargada`);
      },
      error: (err) => {
        this.isLoading = false;
        this.execution = null;
        
        const errorMsg = err.error?.message || err.message || 'Error desconocido';
        this.notificationService.error('Error al buscar ejecución', errorMsg);
      }
    });
  }

  /**
   * Calculate execution duration in a human-readable format
   */
  getExecutionDuration(): string | null {
    if (!this.execution?.startedAt || !this.execution?.finishedAt) {
      return null;
    }

    const start = new Date(this.execution.startedAt);
    const end = new Date(this.execution.finishedAt);
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

  /**
   * Format JSON for pretty printing
   */
  getPrettyJson(json: any): string {
    try {
      return JSON.stringify(json, null, 2);
    } catch (error) {
      return String(json);
    }
  }

  /**
   * Copy JSON to clipboard
   */
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

  /**
   * Download JSON as file
   */
  downloadJson(json: any, executionId: string): void {
    try {
      const jsonString = JSON.stringify(json, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const filename = `execution_${executionId}.json`;
      
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
}
