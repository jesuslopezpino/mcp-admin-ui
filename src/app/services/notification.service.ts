import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number; // Auto-dismiss after this many milliseconds (0 = no auto-dismiss)
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notifications.asObservable();

  constructor() { }

  show(notification: Omit<Notification, 'id' | 'timestamp'>): string {
    const id = this.generateId();
    const fullNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date()
    };

    console.log('=== NOTIFICATION SERVICE SHOW ===');
    console.log('Creating notification:', fullNotification);
    console.log('Current notifications count:', this.notifications.value.length);
    console.log('==================================');

    const current = this.notifications.value;
    this.notifications.next([...current, fullNotification]);
    
    console.log('After adding notification, count:', this.notifications.value.length);

    // Auto-dismiss if duration is specified
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, notification.duration);
    }

    return id;
  }

  success(title: string, message: string, duration: number = 5000): string {
    return this.show({ type: 'success', title, message, duration });
  }

  error(title: string, message: string, duration: number = 0): string {
    console.log('=== NOTIFICATION SERVICE ERROR ===');
    console.log('Title:', title);
    console.log('Message:', message);
    console.log('Duration:', duration);
    console.log('===================================');
    return this.show({ type: 'error', title, message, duration });
  }

  warning(title: string, message: string, duration: number = 5000): string {
    return this.show({ type: 'warning', title, message, duration });
  }

  info(title: string, message: string, duration: number = 3000): string {
    return this.show({ type: 'info', title, message, duration });
  }

  dismiss(id: string): void {
    const current = this.notifications.value;
    this.notifications.next(current.filter(n => n.id !== id));
  }

  dismissAll(): void {
    this.notifications.next([]);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
