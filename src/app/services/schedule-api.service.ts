import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { ScheduledTask } from '../models/api';

@Injectable({
  providedIn: 'root'
})
export class ScheduleApiService extends BaseApiService {
  
  /**
   * Get all scheduled tasks
   */
  getSchedules(): Observable<ScheduledTask[]> {
    return this.http.get<ScheduledTask[]>(`${this.baseUrl}/schedules`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Get a specific scheduled task by ID
   */
  getSchedule(id: string): Observable<ScheduledTask> {
    return this.http.get<ScheduledTask>(`${this.baseUrl}/schedules/${id}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Create a new scheduled task
   */
  createSchedule(task: Partial<ScheduledTask>): Observable<ScheduledTask> {
    return this.http.post<ScheduledTask>(`${this.baseUrl}/schedules`, task, {
      headers: this.getHeaders()
    });
  }

  /**
   * Update an existing scheduled task
   */
  updateSchedule(id: string, task: Partial<ScheduledTask>): Observable<ScheduledTask> {
    return this.http.put<ScheduledTask>(`${this.baseUrl}/schedules/${id}`, task, {
      headers: this.getHeaders()
    });
  }

  /**
   * Delete a scheduled task
   */
  deleteSchedule(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/schedules/${id}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Run a scheduled task immediately
   */
  runNowSchedule(id: string, userId?: string): Observable<{ executionId: string }> {
    const body = userId ? { userId } : {};
    return this.http.post<{ executionId: string }>(
      `${this.baseUrl}/schedules/${id}/run-now`,
      body,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Pause a scheduled task
   */
  pauseSchedule(id: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/schedules/${id}/pause`,
      {},
      { headers: this.getHeaders() }
    );
  }

  /**
   * Resume a scheduled task
   */
  resumeSchedule(id: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/schedules/${id}/resume`,
      {},
      { headers: this.getHeaders() }
    );
  }
}
