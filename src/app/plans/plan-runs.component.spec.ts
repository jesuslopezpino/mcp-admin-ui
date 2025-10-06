import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { PlanRunsComponent } from './plan-runs.component';
import { ApiService } from '../services/api.service';
import { PlanRun } from '../models/plans';
import { PageResponse } from '../models/api';

describe('PlanRunsComponent', () => {
  let component: PlanRunsComponent;
  let fixture: ComponentFixture<PlanRunsComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['getPlanRuns', 'cancelPlanRun']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [PlanRunsComponent],
      providers: [
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PlanRunsComponent);
    component = fixture.componentInstance;
    mockApiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load runs on init', () => {
    const mockRuns: PageResponse<PlanRun> = {
      content: [
        {
          id: '1',
          planId: 'plan1',
          planName: 'Test Plan',
          requestedBy: 'user1',
          status: 'SUCCESS',
          steps: []
        }
      ],
      totalElements: 1,
      totalPages: 1,
      size: 20,
      number: 0
    };

    mockApiService.getPlanRuns.and.returnValue(of(mockRuns));

    component.ngOnInit();

    expect(mockApiService.getPlanRuns).toHaveBeenCalled();
    expect(component.runs).toEqual(mockRuns.content);
  });

  it('should navigate to run detail', () => {
    const run: PlanRun = {
      id: '1',
      planId: 'plan1',
      requestedBy: 'user1',
      status: 'SUCCESS',
      steps: []
    };

    component.viewRun(run);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/plans/runs', run.id]);
  });

  it('should cancel run', () => {
    const run: PlanRun = {
      id: '1',
      planId: 'plan1',
      requestedBy: 'user1',
      status: 'RUNNING',
      steps: []
    };

    spyOn(window, 'confirm').and.returnValue(true);
    mockApiService.cancelPlanRun.and.returnValue(of(undefined));

    component.cancelRun(run);

    expect(mockApiService.cancelPlanRun).toHaveBeenCalledWith(run.id);
  });

  it('should filter by status', () => {
    component.onStatusChange('SUCCESS', true);
    expect(component.statusFilter).toContain('SUCCESS');
    
    component.onStatusChange('SUCCESS', false);
    expect(component.statusFilter).not.toContain('SUCCESS');
  });

  it('should sort by field', () => {
    component.sortBy('status');
    expect(component.sortField).toBe('status');
    expect(component.sortDirection).toBe('asc');
    
    component.sortBy('status');
    expect(component.sortDirection).toBe('desc');
  });

  it('should check if run can be cancelled', () => {
    const runnableRun: PlanRun = {
      id: '1',
      planId: 'plan1',
      requestedBy: 'user1',
      status: 'RUNNING',
      steps: []
    };

    const completedRun: PlanRun = {
      id: '2',
      planId: 'plan1',
      requestedBy: 'user1',
      status: 'SUCCESS',
      steps: []
    };

    expect(component.canCancel(runnableRun)).toBeTrue();
    expect(component.canCancel(completedRun)).toBeFalse();
  });
});
