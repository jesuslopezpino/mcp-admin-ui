import { Routes } from '@angular/router';
import { AppShellComponent } from './shell/app-shell.component';
import { AssistantComponent } from './assistant/assistant.component';
import { CatalogComponent } from './catalog/catalog.component';
import { InventoryComponent } from './inventory/inventory.component';

export const routes: Routes = [
  { 
    path: '', 
    component: AppShellComponent,
    children: [
      { path: 'assistant', component: AssistantComponent },
      { path: 'catalog', component: CatalogComponent },
      { 
        path: 'inventory', 
        title: 'Inventory',
        loadComponent: () => import('./inventory/inventory-prime-crud.component').then(m => m.InventoryPrimeCrudComponent)
      },
      { 
        path: 'schedules', 
        title: 'Schedules',
        loadComponent: () => import('./schedules/schedules-prime.component').then(m => m.SchedulesPrimeComponent)
      },
      { 
        path: 'executions', 
        title: 'Executions',
        loadComponent: () => import('./executions/executions-prime-crud.component').then(m => m.ExecutionsPrimeCrudComponent)
      },
      {
        path: 'plans',
        children: [
          { path: '', title: 'Plans', loadComponent: () => import('./plans/plans-prime.component').then(m => m.PlansPrimeComponent) },
          { path: 'new', title: 'New Plan', loadComponent: () => import('./plans/plan-detail.component').then(m => m.PlanDetailComponent) },
          { path: 'runs', title: 'Plan Runs', loadComponent: () => import('./plans/plan-runs.component').then(m => m.PlanRunsComponent) },
          { path: 'runs/:runId', title: 'Plan Run Detail', loadComponent: () => import('./plans/plan-run-detail.component').then(m => m.PlanRunDetailComponent) },
          { path: ':id', title: 'Plan Detail', loadComponent: () => import('./plans/plan-detail.component').then(m => m.PlanDetailComponent) }
        ]
      },
      { path: '', redirectTo: '/assistant', pathMatch: 'full' },
      { path: '**', redirectTo: '/assistant' }
    ]
  }
];
