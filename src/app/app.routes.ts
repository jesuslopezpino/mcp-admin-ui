import { Routes } from '@angular/router';
import { AssistantComponent } from './assistant/assistant.component';
import { CatalogComponent } from './catalog/catalog.component';
import { InventoryComponent } from './inventory/inventory.component';

export const routes: Routes = [
  { path: 'assistant', component: AssistantComponent },
  { path: 'catalog', component: CatalogComponent },
  { path: 'inventory', component: InventoryComponent },
  { path: '', redirectTo: '/assistant', pathMatch: 'full' },
  { path: '**', redirectTo: '/assistant' }
];
