import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Tool, Plan, ExecuteResult } from '../services/api.service';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.scss'
})
export class CatalogComponent implements OnInit {
  tools: Tool[] = [];
  isLoading: boolean = false;
  error: string = '';
  executingTool: string | null = null;
  executionResults: { [toolName: string]: ExecuteResult } = {};

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadTools();
  }

  loadTools() {
    this.isLoading = true;
    this.error = '';

    this.apiService.tools().subscribe({
      next: (tools) => {
        this.tools = tools;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar herramientas: ' + (err.error?.message || err.message || 'Error desconocido');
        this.isLoading = false;
      }
    });
  }

  executeTool(tool: Tool) {
    this.executingTool = tool.name;
    this.error = '';
    this.executionResults[tool.name] = null as any;

    // Crear un mensaje genérico para ejecutar la herramienta
    const message = `Ejecutar herramienta ${tool.name}`;

    this.apiService.plan(message).subscribe({
      next: (response) => {
        const plan = response.plan;
        
        // Ejecutar directamente sin confirmación
        this.apiService.execute(plan.id, true).subscribe({
          next: (result) => {
            this.executionResults[tool.name] = result;
            this.executingTool = null;
          },
          error: (err) => {
            this.error = `Error al ejecutar ${tool.name}: ` + (err.error?.message || err.message || 'Error desconocido');
            this.executingTool = null;
          }
        });
      },
      error: (err) => {
        this.error = `Error al planificar ${tool.name}: ` + (err.error?.message || err.message || 'Error desconocido');
        this.executingTool = null;
      }
    });
  }

  getTruncatedStdout(stdout: string): string {
    if (stdout.length <= 150) return stdout;
    return stdout.substring(0, 150) + '...';
  }

  hasResult(toolName: string): boolean {
    return this.executionResults[toolName] != null;
  }

  getResult(toolName: string): ExecuteResult {
    return this.executionResults[toolName];
  }
}
