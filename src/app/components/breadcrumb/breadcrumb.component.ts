import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: string;
}

@Component({
    selector: 'app-breadcrumb',
    imports: [CommonModule],
    templateUrl: './breadcrumb.component.html',
    styleUrl: './breadcrumb.component.scss'
})
export class BreadcrumbComponent {
  @Input() items: BreadcrumbItem[] = [];
  @Output() itemClicked = new EventEmitter<BreadcrumbItem>();

  onItemClick(item: BreadcrumbItem) {
    if (item.path) {
      this.itemClicked.emit(item);
    }
  }
}
