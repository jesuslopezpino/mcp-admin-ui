import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Plan, ExecuteResult } from '../services/api.service';
import { Tool } from '../models/api';

export interface ParameterDefinition {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'checkbox';
  required: boolean;
  options?: string[];
  defaultValue?: any;
  placeholder?: string;
}

@Component({
    selector: 'app-assistant',
    imports: [CommonModule, FormsModule],
    templateUrl: './assistant.component.html',
    styleUrl: './assistant.component.scss',
    host: {
        'ngSkipHydration': 'true'
    }
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
  toolParameters: { [key: string]: any } = {};
  parameterDefinitions: ParameterDefinition[] = [];
  showConfirmation: boolean = false;

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
        arguments: this.toolParameters,
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

  onToolSelected() {
    this.parameterDefinitions = this.getToolParameters(this.selectedTool);
    this.toolParameters = {};
    
    // Initialize parameters with default values
    this.parameterDefinitions.forEach(param => {
      if (param.defaultValue !== undefined) {
        this.toolParameters[param.name] = param.defaultValue;
      }
    });
  }

  getToolParameters(toolName: string): ParameterDefinition[] {
    const parameterMap: { [key: string]: ParameterDefinition[] } = {
      'apps.install': [
        { 
          name: 'name', 
          label: 'Nombre de la aplicación', 
          type: 'select', 
          required: true,
          options: [
            'Microsoft.VisualStudioCode',
            'Google.Chrome',
            'Mozilla.Firefox',
            'Microsoft.Edge',
            'Notepad++.Notepad++',
            '7zip.7zip',
            'Git.Git',
            'Python.Python.3.12',
            'Node.js.NodeJS',
            'Microsoft.WindowsTerminal',
            'Microsoft.PowerToys',
            'OBSProject.OBSStudio',
            'Discord.Discord',
            'Spotify.Spotify',
            'Adobe.Acrobat.Reader.DC'
          ],
          placeholder: 'Selecciona una aplicación...'
        },
        { 
          name: 'silent', 
          label: 'Instalación silenciosa', 
          type: 'checkbox', 
          required: false,
          defaultValue: true
        }
      ],
      'system.restart_service': [
        { 
          name: 'name', 
          label: 'Nombre del servicio', 
          type: 'select', 
          required: true,
          options: [
            'Spooler',
            'BITS',
            'Windows Update',
            'Windows Search',
            'Print Spooler',
            'Windows Audio',
            'Windows Audio Endpoint Builder',
            'Themes',
            'Desktop Window Manager Session Manager',
            'User Profile Service'
          ],
          placeholder: 'Selecciona un servicio...'
        },
        { 
          name: 'timeoutSec', 
          label: 'Timeout (segundos)', 
          type: 'number', 
          required: false,
          defaultValue: 30
        }
      ],
      'security.quick_scan_defender': [
        { 
          name: 'scanType', 
          label: 'Tipo de escaneo', 
          type: 'select', 
          required: false,
          options: ['QuickScan', 'FullScan'],
          defaultValue: 'QuickScan'
        }
      ],
      'files.backup_user_docs': [
        { 
          name: 'user', 
          label: 'Usuario', 
          type: 'text', 
          required: true,
          placeholder: 'Nombre de usuario'
        },
        { 
          name: 'destZip', 
          label: 'Archivo ZIP destino', 
          type: 'text', 
          required: true,
          defaultValue: 'C:\\Temp\\user-docs.zip'
        },
        { 
          name: 'includeDesktop', 
          label: 'Incluir Escritorio', 
          type: 'checkbox', 
          required: false,
          defaultValue: true
        },
        { 
          name: 'includeDocuments', 
          label: 'Incluir Documentos', 
          type: 'checkbox', 
          required: false,
          defaultValue: true
        },
        { 
          name: 'includeDownloads', 
          label: 'Incluir Descargas', 
          type: 'checkbox', 
          required: false,
          defaultValue: false
        }
      ]
    };
    
    return parameterMap[toolName] || [];
  }

  isParameterValid(): boolean {
    return this.parameterDefinitions.every(param => 
      !param.required || (this.toolParameters[param.name] && this.toolParameters[param.name] !== '')
    );
  }

  onExecute() {
    if (!this.plan) return;

    // Check if the tool requires confirmation
    const tool = this.availableTools.find(t => t.name === this.plan?.toolName);
    if (tool?.requiresConfirmation) {
      this.showConfirmation = true;
    } else {
      this.executePlan();
    }
  }

  onConfirmExecution() {
    this.showConfirmation = false;
    this.executePlan();
  }

  onCancelExecution() {
    this.showConfirmation = false;
  }

  private executePlan() {
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
    this.toolParameters = {};
    this.parameterDefinitions = [];
  }

  toggleManualSelection() {
    this.useManualSelection = !this.useManualSelection;
    if (!this.useManualSelection) {
      this.selectedTool = '';
      this.toolParameters = {};
      this.parameterDefinitions = [];
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
