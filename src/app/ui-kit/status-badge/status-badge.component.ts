import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type StatusType = 'SUCCESS' | 'FAILED' | 'RUNNING' | 'PENDING' | 'CANCELLED' | string;

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span 
      class="badge" 
      [ngClass]="getStatusClass()"
      [attr.data-testid]="'badge-' + status">
      {{ getStatusLabel() }}
    </span>
  `,
  styles: [`
    .badge {
      @apply inline-flex items-center px-2 py-0.5 rounded text-xs font-medium;
    }
    
    .badge-success {
      @apply bg-green-100 text-green-800;
    }
    
    .badge-error {
      @apply bg-red-100 text-red-800;
    }
    
    .badge-warn {
      @apply bg-yellow-100 text-yellow-800;
    }
    
    .badge-info {
      @apply bg-blue-100 text-blue-800;
    }
    
    .badge-secondary {
      @apply bg-gray-100 text-gray-800;
    }
  `]
})
export class StatusBadgeComponent {
  @Input() status: StatusType = 'PENDING';

  private statusMap: Record<string, { class: string; label: string }> = {
    'SUCCESS': { class: 'badge-success', label: 'Success' },
    'FAILED': { class: 'badge-error', label: 'Failed' },
    'RUNNING': { class: 'badge-info', label: 'Running' },
    'PENDING': { class: 'badge-warn', label: 'Pending' },
    'CANCELLED': { class: 'badge-secondary', label: 'Cancelled' }
  };

  getStatusClass(): string {
    const statusInfo = this.statusMap[this.status] || this.statusMap['PENDING'];
    return statusInfo.class;
  }

  getStatusLabel(): string {
    const statusInfo = this.statusMap[this.status] || this.statusMap['PENDING'];
    return statusInfo.label;
  }
}
