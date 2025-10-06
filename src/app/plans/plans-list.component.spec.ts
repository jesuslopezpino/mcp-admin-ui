import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { PlansListComponent } from './plans-list.component';
import { ApiService } from '../services/api.service';
import { PlanTemplate } from '../models/plans';
import { PageResponse } from '../models/api';

describe('PlansListComponent', () => {
  let component: PlansListComponent;
  let fixture: ComponentFixture<PlansListComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['getPlans']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [PlansListComponent],
      providers: [
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PlansListComponent);
    component = fixture.componentInstance;
    mockApiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load plans on init', () => {
    const mockPlans: PageResponse<PlanTemplate> = {
      content: [
        {
          id: '1',
          name: 'Test Plan',
          description: 'Test Description',
          tags: ['test'],
          enabled: true,
          steps: []
        }
      ],
      totalElements: 1,
      totalPages: 1,
      size: 20,
      number: 0
    };

    mockApiService.getPlans.and.returnValue(of(mockPlans));

    component.ngOnInit();

    expect(mockApiService.getPlans).toHaveBeenCalled();
    expect(component.plans).toEqual(mockPlans.content);
  });

  it('should navigate to create plan', () => {
    component.createPlan();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/plans/new']);
  });

  it('should navigate to edit plan', () => {
    const plan: PlanTemplate = {
      id: '1',
      name: 'Test Plan',
      enabled: true,
      steps: []
    };

    component.editPlan(plan);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/plans', plan.id]);
  });

  it('should filter plans by search query', () => {
    component.searchQuery = 'test';
    component.onSearchChange();
    
    expect(mockApiService.getPlans).toHaveBeenCalledWith(
      jasmine.objectContaining({ q: 'test' })
    );
  });
});
