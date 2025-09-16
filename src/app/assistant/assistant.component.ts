import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Plan, ExecuteResult } from '../services/api.service';

@Component({
  selector: 'app-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './assistant.component.html',
  styleUrl: './assistant.component.scss'
})
export class AssistantComponent {
  message: string = '';
  assetId: string = '';
  plan: Plan | null = null;
  executionResult: ExecuteResult | null = null;
  isLoading: boolean = false;
  error: string = '';

  constructor(private apiService: ApiService) {}

  onPlan() {
    if (!this.message.trim()) {
      this.error = 'Por favor ingresa un mensaje';
      return;
    }

    this.isLoading = true;
    this.error = '';
    this.plan = null;
    this.executionResult = null;

    this.apiService.plan(this.message, this.assetId || undefined).subscribe({
      next: (response) => {
        this.plan = response.plan;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Error al planificar: ' + (err.error?.message || err.message || 'Error desconocido');
        this.isLoading = false;
      }
    });
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
      },
      error: (err) => {
        this.error = 'Error al ejecutar: ' + (err.error?.message || err.message || 'Error desconocido');
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
  }

  getTruncatedStdout(stdout: string): string {
    if (stdout.length <= 200) return stdout;
    return stdout.substring(0, 200) + '...';
  }
}
