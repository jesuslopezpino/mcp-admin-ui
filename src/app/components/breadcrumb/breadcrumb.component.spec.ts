import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BreadcrumbComponent, BreadcrumbItem } from './breadcrumb.component';

describe('BreadcrumbComponent', () => {
  let component: BreadcrumbComponent;
  let fixture: ComponentFixture<BreadcrumbComponent>;

  const mockBreadcrumbItems: BreadcrumbItem[] = [
    { label: 'Inicio', path: '/', icon: '🏠' },
    { label: 'Catálogo', path: '/catalog', icon: '🛠️' },
    { label: 'Sistema', path: undefined, icon: '⚙️' }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BreadcrumbComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(BreadcrumbComponent);
    component = fixture.componentInstance;
    component.items = mockBreadcrumbItems;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('onItemClick', () => {
    it('should emit itemClicked for items with path', () => {
      spyOn(component.itemClicked, 'emit');
      
      component.onItemClick(mockBreadcrumbItems[0]);
      
      expect(component.itemClicked.emit).toHaveBeenCalledWith(mockBreadcrumbItems[0]);
    });

    it('should not emit for items without path', () => {
      spyOn(component.itemClicked, 'emit');
      
      component.onItemClick(mockBreadcrumbItems[2]);
      
      expect(component.itemClicked.emit).not.toHaveBeenCalled();
    });
  });

  describe('component inputs', () => {
    it('should accept items input', () => {
      expect(component.items).toEqual(mockBreadcrumbItems);
    });

    it('should handle empty items array', () => {
      component.items = [];
      
      expect(component.items).toEqual([]);
    });
  });
});
