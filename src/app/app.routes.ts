import { Routes } from '@angular/router';
import { AssistantComponent } from './assistant/assistant.component';
import { CatalogComponent } from './catalog/catalog.component';

export const routes: Routes = [
  { path: 'assistant', component: AssistantComponent },
  { path: 'catalog', component: CatalogComponent },
  { path: '', redirectTo: '/assistant', pathMatch: 'full' },
  { path: '**', redirectTo: '/assistant' }
];
