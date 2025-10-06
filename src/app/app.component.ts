import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { NotificationComponent } from './components/notification/notification.component';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, RouterLink, RouterLinkActive, NotificationComponent],
    templateUrl: './app.component.html',
    styleUrls: []
})
export class AppComponent {
  title = 'mcp-admin-ui';
}
