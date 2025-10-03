import { Injectable } from '@angular/core';

/**
 * Service for displaying notifications to the user.
 * Currently uses browser alert() for simplicity, but can be extended
 * to use toast notifications or other UI components.
 */
@Injectable({
  providedIn: 'root'
})
export class NotifyService {

  /**
   * Show a success notification
   * @param message The success message to display
   */
  success(message: string): void {
    console.log('✅ Success:', message);
    // For now, use alert. In a real app, you'd use a toast notification library
    alert(`✅ ${message}`);
  }

  /**
   * Show an error notification
   * @param message The error message to display
   */
  error(message: string): void {
    console.error('❌ Error:', message);
    // For now, use alert. In a real app, you'd use a toast notification library
    alert(`❌ ${message}`);
  }

  /**
   * Show an info notification
   * @param message The info message to display
   */
  info(message: string): void {
    console.info('ℹ️ Info:', message);
    // For now, use alert. In a real app, you'd use a toast notification library
    alert(`ℹ️ ${message}`);
  }

  /**
   * Show a warning notification
   * @param message The warning message to display
   */
  warning(message: string): void {
    console.warn('⚠️ Warning:', message);
    // For now, use alert. In a real app, you'd use a toast notification library
    alert(`⚠️ ${message}`);
  }
}

