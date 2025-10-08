import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ApiService } from '../../services/api.service';
import { NotifyService } from '../../services/notify.service';
import { CrudTableComponent, CrudColumn, CrudAction } from '../crud-table/crud-table.component';
import { CrudFormComponent, CrudFormConfig } from '../crud-form/crud-form.component';

/**
 * Abstract base class for CRUD components
 * Provides common functionality for create, read, update, delete operations
 */
@Component({
  template: '' // Empty template since this is an abstract base class
})
export abstract class BaseCrudComponent<T> implements OnInit {
  // Common properties
  data: T[] = [];
  loading = signal(true);
  showModal = signal(false);
  editingItem: T | undefined = undefined;
  actionInProgress: Set<string> = new Set();
  globalFilter = '';
  selectedItems: T[] = [];

  constructor(
    protected apiService: ApiService,
    protected notifyService: NotifyService,
    protected confirmationService: ConfirmationService,
    protected messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  // Abstract methods that must be implemented by subclasses
  abstract loadData(): void;
  abstract getColumns(): CrudColumn[];
  abstract getActions(): CrudAction[];
  abstract getFormConfig(): CrudFormConfig;
  abstract getEntityName(): string;
  abstract getEntityNamePlural(): string;

  // Common CRUD operations
  openNewModal(): void {
    this.editingItem = undefined;
    this.showModal.set(true);
  }

  openEditModal(item: T): void {
    this.editingItem = item;
    this.showModal.set(true);
  }

  onFormSave(formData: any): void {
    this.loading.set(true);

    if (this.editingItem) {
      this.updateItem(formData);
    } else {
      this.createItem(formData);
    }
  }

  onFormCancel(): void {
    this.showModal.set(false);
    this.editingItem = undefined;
  }

  onFormClose(): void {
    this.showModal.set(false);
    this.editingItem = undefined;
  }

  deleteItem(item: T): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete this ${this.getEntityName()}?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.performDelete(item);
      }
    });
  }

  // Abstract methods for specific CRUD operations
  protected abstract createItem(data: any): Promise<void>;
  protected abstract updateItem(data: any): Promise<void>;
  protected abstract performDelete(item: T): Promise<void>;

  // Common utility methods
  protected handleSuccess(message: string): void {
    this.notifyService.success(message);
    this.showModal.set(false);
    this.editingItem = undefined;
    this.loadData();
  }

  protected handleError(message: string): void {
    this.notifyService.error(message);
    this.loading.set(false);
  }

  protected isActionInProgress(itemId: string): boolean {
    return this.actionInProgress.has(itemId);
  }

  protected setActionInProgress(itemId: string, inProgress: boolean): void {
    if (inProgress) {
      this.actionInProgress.add(itemId);
    } else {
      this.actionInProgress.delete(itemId);
    }
  }
}
