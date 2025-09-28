import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CategoryGridComponent } from './category-grid.component';
import { Category } from '../../services/category.service';

describe('CategoryGridComponent', () => {
  let component: CategoryGridComponent;
  let fixture: ComponentFixture<CategoryGridComponent>;

  const mockCategories: Category[] = [
    {
      id: 'system',
      name: 'Sistema',
      icon: '⚙️',
      description: 'Herramientas de administración del sistema',
      color: '#4CAF50'
    },
    {
      id: 'apps',
      name: 'Aplicaciones',
      icon: '📱',
      description: 'Gestión de aplicaciones y software',
      color: '#2196F3'
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryGridComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryGridComponent);
    component = fixture.componentInstance;
    component.categories = mockCategories;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('selectCategory', () => {
    it('should emit categorySelected event', () => {
      spyOn(component.categorySelected, 'emit');
      
      component.selectCategory('system');
      
      expect(component.categorySelected.emit).toHaveBeenCalledWith('system');
    });

    it('should emit different category IDs', () => {
      spyOn(component.categorySelected, 'emit');
      
      component.selectCategory('apps');
      
      expect(component.categorySelected.emit).toHaveBeenCalledWith('apps');
    });
  });

  describe('component inputs', () => {
    it('should accept categories input', () => {
      expect(component.categories).toEqual(mockCategories);
    });

    it('should handle empty categories array', () => {
      component.categories = [];
      
      expect(component.categories).toEqual([]);
    });
  });
});
