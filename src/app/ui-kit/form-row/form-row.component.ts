import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form-row',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="form-row" [attr.data-testid]="'form-row-' + (label | lowercase | replace:' ':'-')">
      <label 
        *ngIf="label" 
        class="form-label"
        [class.required]="required">
        {{ label }}
        <span *ngIf="required" class="required-asterisk">*</span>
      </label>
      
      <div class="form-control">
        <ng-content></ng-content>
      </div>
      
      <div *ngIf="help" class="form-help">
        {{ help }}
      </div>
      
      <div *ngIf="error" class="form-error">
        {{ error }}
      </div>
    </div>
  `,
  styles: [`
    .form-row {
      @apply mb-4;
    }
    
    .form-label {
      @apply block text-sm font-medium text-gray-700 mb-1;
    }
    
    .form-label.required {
      @apply font-semibold;
    }
    
    .required-asterisk {
      @apply text-red-500 ml-1;
    }
    
    .form-control {
      @apply w-full;
    }
    
    .form-help {
      @apply text-xs text-gray-500 mt-1;
    }
    
    .form-error {
      @apply text-xs text-red-600 mt-1;
    }
  `]
})
export class FormRowComponent {
  @Input() label?: string;
  @Input() required = false;
  @Input() help?: string;
  @Input() error?: string;
}
