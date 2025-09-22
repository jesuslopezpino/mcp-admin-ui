import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategorizedTool, CategoryService } from '../../services/category.service';

@Component({
  selector: 'app-category-tools',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './category-tools.component.html',
  styleUrl: './category-tools.component.scss'
})
export class CategoryToolsComponent implements OnInit {
  @Input() categoryId: string = '';
  @Input() tools: CategorizedTool[] = [];
  @Output() toolSelected = new EventEmitter<string>();
  @Output() backToCategories = new EventEmitter<void>();

  categoryName: string = '';
  categoryIcon: string = '';
  categoryColor: string = '';

  constructor(private categoryService: CategoryService) {}

  ngOnInit() {
    const category = this.categoryService.getCategoryById(this.categoryId);
    if (category) {
      this.categoryName = category.name;
      this.categoryIcon = category.icon;
      this.categoryColor = category.color;
    }
  }

  selectTool(toolId: string) {
    this.toolSelected.emit(toolId);
  }

  goBack() {
    this.backToCategories.emit();
  }
}
