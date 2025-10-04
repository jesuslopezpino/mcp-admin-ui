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
  { path: '', redirectTo: '/assistant', pathMatch: 'full' },
  { path: '**', redirectTo: '/assistant' }
];
