import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Category, CategoryService } from '../../services/category.service';

@Component({
    selector: 'app-category-grid',
    imports: [CommonModule],
    templateUrl: './category-grid.component.html',
    styleUrl: './category-grid.component.scss'
})
export class CategoryGridComponent implements OnInit {
  @Input() categories: Category[] = [];
  @Input() categorizedTools: Map<string, any[]> = new Map();
  @Output() categorySelected = new EventEmitter<string>();

  constructor(private categoryService: CategoryService) {}

  ngOnInit() {
    if (this.categories.length === 0) {
      this.categories = this.categoryService.getCategories();
    }
  }

  selectCategory(categoryId: string) {
    this.categorySelected.emit(categoryId);
  }

  getToolCount(categoryId: string): number {
    const tools = this.categorizedTools.get(categoryId);
    return tools ? tools.length : 0;
  }
}
