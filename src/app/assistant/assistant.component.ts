import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Plan, ExecuteResult, Tool } from '../services/api.service';

@Component({
  selector: 'app-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './assistant.component.html',
  styleUrl: './assistant.component.scss'
})
export class AssistantComponent implements OnInit {
  message: string = '';
  assetId: string = '';
  plan: Plan | null = null;
  executionResult: ExecuteResult | null = null;
  isLoading: boolean = false;
  error: string = '';
  showFullOutput: boolean = false;
  availableTools: Tool[] = [];
  selectedTool: string = '';
  useManualSelection: boolean = false;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadAvailableTools();
  }

  loadAvailableTools() {
    this.apiService.tools().subscribe({
      next: (tools) => {
        this.availableTools = tools;
        console.log('Herramientas disponibles:', tools);
      },
      error: (err) => {
        console.error('Error al cargar herramientas:', err);
        this.error = this.getErrorMessage(err, 'Error al cargar herramientas');
      }
    });
  }

  onPlan() {
    if (!this.message.trim()) {
      this.error = 'Por favor ingresa un mensaje';
      return;
    }

    this.isLoading = true;
    this.error = '';
    this.plan = null;
    this.executionResult = null;

    // If manual selection is enabled and a tool is selected, create a direct plan
    if (this.useManualSelection && this.selectedTool) {
      this.createDirectPlan();
    } else {
      this.apiService.plan(this.message, this.assetId || undefined).subscribe({
        next: (response) => {
          this.plan = response.plan;
          this.isLoading = false;
          console.log('Plan creado:', this.plan);
        },
        error: (err) => {
          console.error('Error al planificar:', err);
          this.error = this.getErrorMessage(err, 'Error al planificar');
          this.isLoading = false;
        }
      });
    }
  }

  createDirectPlan() {
    // Create a direct plan with the selected tool
    const selectedToolObj = this.availableTools.find(t => t.name === this.selectedTool);
    if (selectedToolObj) {
      this.plan = {
        id: 'manual-' + Date.now(),
        toolName: this.selectedTool,
        arguments: {},
        riskScore: 5, // Default risk score
        rationale: `Herramienta seleccionada manualmente: ${selectedToolObj.description}`,
        requiresConfirmation: selectedToolObj.requiresConfirmation,
        userId: 'admin',
        assetId: this.assetId || 'admin-ui-asset'
      };
      this.isLoading = false;
      console.log('Plan manual creado:', this.plan);
    }
  }

  onExecute() {
    if (!this.plan) return;

    this.isLoading = true;
    this.error = '';
    this.executionResult = null;

    this.apiService.execute(this.plan.id, true).subscribe({
      next: (result) => {
        this.executionResult = result;
        this.isLoading = false;
        console.log('Ejecución completada:', result);
        
        // Show success/warning message based on result
        if (result.status === 'SUCCESS') {
          console.log('✅ Ejecución exitosa');
        } else if (result.status === 'FAILURE') {
          console.warn('⚠️ Ejecución falló con código:', result.exitCode);
        }
      },
      error: (err) => {
        console.error('Error al ejecutar:', err);
        this.error = this.getErrorMessage(err, 'Error al ejecutar');
        this.isLoading = false;
      }
    });
  }

  onReset() {
    this.message = '';
    this.assetId = '';
    this.plan = null;
    this.executionResult = null;
    this.error = '';
    this.selectedTool = '';
    this.useManualSelection = false;
    this.showFullOutput = false;
  }

  toggleManualSelection() {
    this.useManualSelection = !this.useManualSelection;
    if (!this.useManualSelection) {
      this.selectedTool = '';
    }
  }

  getTruncatedStdout(stdout: string): string {
    if (stdout.length <= 200) return stdout;
    return stdout.substring(0, 200) + '...';
  }

  getErrorMessage(error: any, defaultMessage: string): string {
    if (error.status === 0) {
      return `${defaultMessage}: No se puede conectar al servidor. Verifica que el backend esté ejecutándose.`;
    }
    if (error.status === 400) {
      return `${defaultMessage}: Solicitud inválida. ${error.error?.message || 'Verifica los datos enviados.'}`;
    }
    if (error.status === 401) {
      return `${defaultMessage}: No autorizado. Verifica la API Key.`;
    }
    if (error.status === 500) {
      return `${defaultMessage}: Error interno del servidor. ${error.error?.message || 'Contacta al administrador.'}`;
    }
    return `${defaultMessage}: ${error.error?.message || error.message || 'Error desconocido'}`;
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'SUCCESS': return '✅';
      case 'FAILURE': return '❌';
      case 'ERROR': return '⚠️';
      default: return '❓';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'SUCCESS': return 'green';
      case 'FAILURE': return 'orange';
      case 'ERROR': return 'red';
      default: return 'gray';
    }
  }
}
