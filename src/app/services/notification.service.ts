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

    const current = this.notifications.value;
    this.notifications.next([...current, fullNotification]);

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
