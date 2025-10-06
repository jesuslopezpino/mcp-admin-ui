import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { PlanRunDetailComponent } from './plan-run-detail.component';
import { ApiService } from '../services/api.service';
import { PlanRunDetail, PlanRunStep } from '../models/plans';

describe('PlanRunDetailComponent', () => {
  let component: PlanRunDetailComponent;
  let fixture: ComponentFixture<PlanRunDetailComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: jasmine.SpyObj<ActivatedRoute>;

  beforeEach(async () => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['getPlanRun', 'cancelPlanRun']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', [], {
      snapshot: { paramMap: { get: jasmine.createSpy('get').and.returnValue('run1') } }
    });

    await TestBed.configureTestingModule({
      imports: [PlanRunDetailComponent],
      providers: [
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRouteSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PlanRunDetailComponent);
    component = fixture.componentInstance;
    mockApiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockActivatedRoute = TestBed.inject(ActivatedRoute) as jasmine.SpyObj<ActivatedRoute>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load run on init', () => {
    const mockRun: PlanRunDetail = {
      id: 'run1',
      planId: 'plan1',
      planName: 'Test Plan',
      requestedBy: 'user1',
      status: 'SUCCESS',
      steps: []
    };

    mockApiService.getPlanRun.and.returnValue(of(mockRun));

    component.ngOnInit();

    expect(mockApiService.getPlanRun).toHaveBeenCalledWith('run1');
    expect(component.run).toEqual(mockRun);
  });

  it('should navigate to execution detail', () => {
    const step: PlanRunStep = {
      id: 'step1',
      stepId: 'step1',
      orderIndex: 1,
      toolName: 'test-tool',
      status: 'SUCCESS',
      attempt: 1,
      executionId: 'exec1'
    };

    component.viewExecution(step);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/executions', step.executionId]);
  });

  it('should navigate to plan detail', () => {
    component.run = {
      id: 'run1',
      planId: 'plan1',
      requestedBy: 'user1',
      status: 'SUCCESS',
      steps: []
    };

    component.viewPlan();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/plans', 'plan1']);
  });

  it('should cancel run with confirmation', () => {
    component.run = {
      id: 'run1',
      planId: 'plan1',
      requestedBy: 'user1',
      status: 'RUNNING',
      steps: []
    };

    spyOn(window, 'confirm').and.returnValue(true);
    mockApiService.cancelPlanRun.and.returnValue(of(undefined));

    component.cancelRun();

    expect(mockApiService.cancelPlanRun).toHaveBeenCalledWith('run1');
  });

  it('should format duration correctly', () => {
    const startedAt = '2023-01-01T10:00:00Z';
    const finishedAt = '2023-01-01T10:01:30Z';

    const duration = component.formatDuration(startedAt, finishedAt);
    expect(duration).toBe('1m');
  });

  it('should check if run is completed', () => {
    component.run = {
      id: 'run1',
      planId: 'plan1',
      requestedBy: 'user1',
      status: 'SUCCESS',
      steps: []
    };

    expect(component.isCompleted()).toBeTrue();

    component.run.status = 'RUNNING';
    expect(component.isCompleted()).toBeFalse();
  });

  it('should check if run can be cancelled', () => {
    component.run = {
      id: 'run1',
      planId: 'plan1',
      requestedBy: 'user1',
      status: 'RUNNING',
      steps: []
    };

    expect(component.canCancel()).toBeTrue();

    component.run.status = 'SUCCESS';
    expect(component.canCancel()).toBeFalse();
  });

  it('should format JSON correctly', () => {
    const json = { key: 'value', nested: { prop: 'test' } };
    const formatted = component.formatJson(json);
    expect(formatted).toContain('"key": "value"');
    expect(formatted).toContain('"nested"');
  });
});
