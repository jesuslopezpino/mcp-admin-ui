import { Routes } from '@angular/router';
import { AssistantComponent } from './assistant/assistant.component';
import { CatalogComponent } from './catalog/catalog.component';
import { InventoryComponent } from './inventory/inventory.component';
import { SchedulesComponent } from './schedules/schedules.component';

export const routes: Routes = [
  { path: 'assistant', component: AssistantComponent },
  { path: 'catalog', component: CatalogComponent },
  { path: 'inventory', component: InventoryComponent },
  { path: 'schedules', component: SchedulesComponent },
  { 
    path: 'executions', 
    title: 'Executions',
    loadComponent: () => import('./executions/executions.component').then(m => m.ExecutionsComponent)
  },
  {
    path: 'plans',
    children: [
      { path: '', title: 'Plans', loadComponent: () => import('./plans/plans-list.component').then(m => m.PlansListComponent) },
      { path: 'new', title: 'New Plan', loadComponent: () => import('./plans/plan-detail.component').then(m => m.PlanDetailComponent) },
      { path: 'runs', title: 'Plan Runs', loadComponent: () => import('./plans/plan-runs.component').then(m => m.PlanRunsComponent) },
      { path: 'runs/:runId', title: 'Plan Run Detail', loadComponent: () => import('./plans/plan-run-detail.component').then(m => m.PlanRunDetailComponent) },
      { path: ':id', title: 'Plan Detail', loadComponent: () => import('./plans/plan-detail.component').then(m => m.PlanDetailComponent) }
    ]
  },
  { path: '', redirectTo: '/assistant', pathMatch: 'full' },
  { path: '**', redirectTo: '/assistant' }
];
