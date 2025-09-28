import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CategoryToolsComponent } from './category-tools.component';
import { CategoryService, CategorizedTool } from '../../services/category.service';

describe('CategoryToolsComponent', () => {
  let component: CategoryToolsComponent;
  let fixture: ComponentFixture<CategoryToolsComponent>;
  let mockCategoryService: jasmine.SpyObj<CategoryService>;

  const mockCategorizedTools: CategorizedTool[] = [
    {
      id: '1',
      name: 'system.list_services',
      description: 'List system services',
      requiresConfirmation: false,
      category: 'system'
    },
    {
      id: '2',
      name: 'system.get_uptime',
      description: 'Get system uptime',
      requiresConfirmation: false,
      category: 'system'
    }
  ];

  const mockCategory: any = {
    id: 'system',
    name: 'Sistema',
    icon: '⚙️',
    description: 'Herramientas de administración del sistema',
    color: '#4CAF50'
  };

  beforeEach(async () => {
    const categoryServiceSpy = jasmine.createSpyObj('CategoryService', ['getCategoryById']);

    await TestBed.configureTestingModule({
      imports: [CategoryToolsComponent],
      providers: [
        { provide: CategoryService, useValue: categoryServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryToolsComponent);
    component = fixture.componentInstance;
    mockCategoryService = TestBed.inject(CategoryService) as jasmine.SpyObj<CategoryService>;
    
    component.categoryId = 'system';
    component.tools = mockCategorizedTools;
    mockCategoryService.getCategoryById.and.returnValue(mockCategory);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should set category details when categoryId changes', () => {
      component.categoryId = 'apps';
      const appsCategory = { id: 'apps', name: 'Aplicaciones', icon: '📱', description: 'Apps description', color: '#2196F3' };
      mockCategoryService.getCategoryById.and.returnValue(appsCategory);
      
      component.ngOnInit();
      
      expect(component.categoryName).toBe('Aplicaciones');
      expect(component.categoryIcon).toBe('📱');
      expect(component.categoryColor).toBe('#2196F3');
      expect(mockCategoryService.getCategoryById).toHaveBeenCalledWith('apps');
    });

    it('should handle undefined category', () => {
      component.categoryId = 'non-existent';
      mockCategoryService.getCategoryById.and.returnValue(undefined);
      
      component.ngOnInit();
      
      expect(component.categoryName).toBe('Sistema');
      expect(component.categoryIcon).toBe('⚙️');
      expect(component.categoryColor).toBe('#4CAF50');
    });
  });

  describe('selectTool', () => {
    it('should emit toolSelected event', () => {
      spyOn(component.toolSelected, 'emit');
      
      component.selectTool('system.list_services');
      
      expect(component.toolSelected.emit).toHaveBeenCalledWith('system.list_services');
    });
  });

  describe('goBack', () => {
    it('should emit backToCategories event', () => {
      spyOn(component.backToCategories, 'emit');
      
      component.goBack();
      
      expect(component.backToCategories.emit).toHaveBeenCalled();
    });
  });

  describe('component inputs', () => {
    it('should accept categoryId input', () => {
      expect(component.categoryId).toBe('system');
    });

    it('should accept tools input', () => {
      expect(component.tools).toEqual(mockCategorizedTools);
    });

    it('should handle empty tools array', () => {
      component.tools = [];
      
      expect(component.tools).toEqual([]);
    });
  });
});
