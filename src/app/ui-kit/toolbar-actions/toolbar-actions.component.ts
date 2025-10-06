import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toolbar-actions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toolbar-actions" data-testid="toolbar-actions">
      <div class="toolbar-left">
        <ng-content select="[slot=left]"></ng-content>
      </div>
      <div class="toolbar-right">
        <ng-content select="[slot=right]"></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .toolbar-actions {
      @apply flex justify-between items-center gap-4 p-4 bg-white border-b border-gray-200;
    }
    
    .toolbar-left {
      @apply flex items-center gap-2;
    }
    
    .toolbar-right {
      @apply flex items-center gap-2;
    }
    
    @media (max-width: 768px) {
      .toolbar-actions {
        @apply flex-col gap-2;
      }
      
      .toolbar-left,
      .toolbar-right {
        @apply w-full justify-center;
      }
    }
  `]
})
export class ToolbarActionsComponent {}
