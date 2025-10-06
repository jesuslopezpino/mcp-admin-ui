import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { MenubarModule } from 'primeng/menubar';
import { SidebarModule } from 'primeng/sidebar';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RouterOutlet,
    MenubarModule,
    SidebarModule,
    ButtonModule,
    ToastModule,
    ConfirmDialogModule
  ],
  templateUrl: './app-shell.component.html',
  styleUrls: ['./app-shell.component.scss']
})
export class AppShellComponent implements OnInit {
  sidebarVisible = false;
  
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

  ngOnInit(): void {
    // Initialize theme
    this.initializeTheme();
  }

  private initializeTheme(): void {
    // Set default theme to light
    const theme = localStorage.getItem('theme') || 'light';
    this.setTheme(theme);
  }

  toggleSidebar(): void {
    this.sidebarVisible = !this.sidebarVisible;
  }

  toggleTheme(): void {
    const currentTheme = document.body.classList.contains('dark') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  private setTheme(theme: string): void {
    if (theme === 'dark') {
      document.body.classList.add('dark');
      document.body.classList.remove('light');
    } else {
      document.body.classList.add('light');
      document.body.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }
}
