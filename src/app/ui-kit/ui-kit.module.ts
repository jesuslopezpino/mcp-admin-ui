import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusBadgeComponent } from './status-badge/status-badge.component';
import { ToolbarActionsComponent } from './toolbar-actions/toolbar-actions.component';
import { FormRowComponent } from './form-row/form-row.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    StatusBadgeComponent,
    ToolbarActionsComponent,
    FormRowComponent
  ],
  exports: [
    StatusBadgeComponent,
    ToolbarActionsComponent,
    FormRowComponent
  ]
})
export class UiKitModule {}
