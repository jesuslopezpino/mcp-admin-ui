import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { PlanDetailComponent } from './plan-detail.component';
import { ApiService } from '../services/api.service';
import { PlanTemplate, PlanStep } from '../models/plans';

describe('PlanDetailComponent', () => {
  let component: PlanDetailComponent;
  let fixture: ComponentFixture<PlanDetailComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: jasmine.SpyObj<ActivatedRoute>;

  beforeEach(async () => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['getPlan', 'createPlan', 'updatePlan', 'getTools', 'getAssets', 'runPlan']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', [], {
      snapshot: { paramMap: { get: jasmine.createSpy('get').and.returnValue('1') } }
    });

    await TestBed.configureTestingModule({
      imports: [PlanDetailComponent],
      providers: [
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRouteSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PlanDetailComponent);
    component = fixture.componentInstance;
    mockApiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockActivatedRoute = TestBed.inject(ActivatedRoute) as jasmine.SpyObj<ActivatedRoute>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load plan for edit mode', () => {
    const mockPlan: PlanTemplate = {
      id: '1',
      name: 'Test Plan',
      description: 'Test Description',
      tags: ['test'],
      enabled: true,
      steps: []
    };

    mockApiService.getPlan.and.returnValue(of(mockPlan));
    mockApiService.getTools.and.returnValue(of([]));
    mockApiService.getAssets.and.returnValue(of([]));

    component.ngOnInit();

    expect(mockApiService.getPlan).toHaveBeenCalledWith('1');
    expect(component.plan).toEqual(mockPlan);
    expect(component.isNew).toBeFalse();
  });

  it('should initialize new plan for create mode', () => {
    mockActivatedRoute.snapshot.paramMap.get.and.returnValue('new');
    mockApiService.getTools.and.returnValue(of([]));
    mockApiService.getAssets.and.returnValue(of([]));

    component.ngOnInit();

    expect(component.isNew).toBeTrue();
    expect(component.plan).toBeTruthy();
  });

  it('should add step', () => {
    component.addStep();
    expect(component.steps.length).toBe(1);
    expect(component.steps[0].orderIndex).toBe(1);
  });

  it('should remove step', () => {
    component.steps = [
      { orderIndex: 1, toolName: 'test', argumentsJson: {}, onFail: 'ABORT', retryCount: 0, retryDelayMs: 0, requiresConfirm: false }
    ];
    
    component.removeStep(0);
    expect(component.steps.length).toBe(0);
  });

  it('should reorder steps after removal', () => {
    component.steps = [
      { orderIndex: 1, toolName: 'test1', argumentsJson: {}, onFail: 'ABORT', retryCount: 0, retryDelayMs: 0, requiresConfirm: false },
      { orderIndex: 2, toolName: 'test2', argumentsJson: {}, onFail: 'ABORT', retryCount: 0, retryDelayMs: 0, requiresConfirm: false },
      { orderIndex: 3, toolName: 'test3', argumentsJson: {}, onFail: 'ABORT', retryCount: 0, retryDelayMs: 0, requiresConfirm: false }
    ];
    
    component.removeStep(1);
    
    expect(component.steps.length).toBe(2);
    expect(component.steps[0].orderIndex).toBe(1);
    expect(component.steps[1].orderIndex).toBe(2);
  });

  it('should validate form with required fields', () => {
    component.planForm.name = '';
    component.steps = [];
    
    const isValid = component.validateForm();
    expect(isValid).toBeFalse();
  });

  it('should validate form with valid data', () => {
    component.planForm.name = 'Test Plan';
    component.steps = [
      { orderIndex: 1, toolName: 'test', argumentsJson: {}, onFail: 'ABORT', retryCount: 0, retryDelayMs: 0, requiresConfirm: false }
    ];
    
    const isValid = component.validateForm();
    expect(isValid).toBeTrue();
  });
});
