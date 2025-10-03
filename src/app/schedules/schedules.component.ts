import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../services/api.service';
import { NotifyService } from '../services/notify.service';
import { ScheduledTask, Tool, Asset } from '../models/api';
import { ScheduleModalComponent } from './schedule-modal.component';

@Component({
  selector: 'app-schedules',
  standalone: true,
  imports: [CommonModule, RouterModule, ScheduleModalComponent],
  templateUrl: './schedules.component.html',
  styleUrls: ['./schedules.component.scss']
})
export class SchedulesComponent implements OnInit {
  schedules: ScheduledTask[] = [];
  tools: Tool[] = [];
  assets: Asset[] = [];
  loading = true;
  showModal = false;
  editingTask: ScheduledTask | undefined = undefined;

  constructor(
    private apiService: ApiService,
    private notifyService: NotifyService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    
    // Load schedules, tools, and assets in parallel
    this.apiService.getSchedules().subscribe({
      next: (schedules) => {
        this.schedules = schedules;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading schedules:', error);
        this.notifyService.error('Error loading scheduled tasks');
        this.loading = false;
      }
    });

    this.apiService.tools().subscribe({
      next: (tools) => {
        this.tools = tools;
      },
      error: (error) => {
        console.error('Error loading tools:', error);
        this.notifyService.error('Error loading tools');
      }
    });

    this.apiService.getAssets().subscribe({
      next: (assets) => {
        this.assets = assets || [];
      },
      error: (error) => {
        console.error('Error loading assets:', error);
        this.notifyService.error('Error loading assets');
      }
    });
  }

  openNewModal(): void {
    this.editingTask = undefined;
    this.showModal = true;
  }

  openEditModal(task: ScheduledTask): void {
    this.editingTask = task;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingTask = undefined;
  }

  onTaskSaved(savedTask: ScheduledTask): void {
    if (this.editingTask) {
      // Update existing task in the list
      const index = this.schedules.findIndex(t => t.id === savedTask.id);
      if (index !== -1) {
        this.schedules[index] = savedTask;
      }
      this.notifyService.success('Scheduled task updated successfully');
    } else {
      // Add new task to the list
      this.schedules.push(savedTask);
      this.notifyService.success('Scheduled task created successfully');
    }
    this.closeModal();
  }

  deleteTask(task: ScheduledTask): void {
    if (confirm(`Are you sure you want to delete the scheduled task "${task.name}"?`)) {
      this.apiService.deleteSchedule(task.id).subscribe({
        next: () => {
          this.schedules = this.schedules.filter(t => t.id !== task.id);
          this.notifyService.success('Scheduled task deleted successfully');
        },
        error: (error) => {
          console.error('Error deleting task:', error);
          this.notifyService.error('Error deleting scheduled task');
        }
      });
    }
  }

  getDestinationLabel(task: ScheduledTask): string {
    if (!task.assetId) {
      return 'Servidor (local)';
    }
    
    const asset = this.assets.find(a => a.id === task.assetId);
    if (asset) {
      return asset.hostname || asset.ip;
    }
    
    return 'Unknown asset';
  }

  getToolName(task: ScheduledTask): string {
    const tool = this.tools.find(t => t.name === task.toolName);
    return tool ? tool.name : task.toolName;
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  }

  trackByTaskId(index: number, task: ScheduledTask): string {
    return task.id;
  }
}
