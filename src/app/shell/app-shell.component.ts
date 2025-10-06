import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { ToolbarModule } from 'primeng/toolbar';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { PanelMenuModule } from 'primeng/panelmenu';
import { MenuModule } from 'primeng/menu';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ConfirmationService } from 'primeng/api';
import { MenuItem } from 'primeng/api';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RouterOutlet,
    ToolbarModule,
    DrawerModule,
    ButtonModule,
    ToastModule,
    ConfirmDialogModule,
    PanelMenuModule,
    MenuModule,
    TooltipModule
  ],
  providers: [
    MessageService,
    ConfirmationService
  ],
  templateUrl: './app-shell.component.html',
  styleUrls: ['./app-shell.component.scss']
})
export class AppShellComponent implements OnInit {
  sidebarVisible = false;
  isDarkTheme = false;
  
  menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'pi pi-home',
      routerLink: '/assistant'
    },
    {
      label: 'Catalog',
      icon: 'pi pi-th-large',
      routerLink: '/catalog'
    },
    {
      label: 'Inventory',
      icon: 'pi pi-box',
      routerLink: '/inventory'
    },
    {
      label: 'Executions',
      icon: 'pi pi-play',
      routerLink: '/executions'
    },
    {
      label: 'Plans',
      icon: 'pi pi-calendar',
      routerLink: '/plans'
    },
    {
      label: 'Schedules',
      icon: 'pi pi-clock',
      routerLink: '/schedules'
    },
    {
      label: 'Settings',
      icon: 'pi pi-cog',
      routerLink: '/settings'
    }
  ];

  topbarItems: MenuItem[] = [
    {
      label: 'Profile',
      icon: 'pi pi-user'
    },
    {
      label: 'Settings',
      icon: 'pi pi-cog'
    },
    {
      separator: true
    },
    {
      label: 'Logout',
      icon: 'pi pi-sign-out'
    }
  ];

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    // Subscribe to theme changes
    this.themeService.currentTheme$.subscribe(theme => {
      this.isDarkTheme = theme === 'lara-dark-blue';
    });
  }

  toggleSidebar(): void {
    this.sidebarVisible = !this.sidebarVisible;
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
