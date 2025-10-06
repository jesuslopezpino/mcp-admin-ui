import { Component, Input, Output, EventEmitter } from '@angular/core';


export interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: string;
}

@Component({
    selector: 'app-breadcrumb',
    imports: [],
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
