import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ThemeType = 'lara-light-blue' | 'lara-dark-blue';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private currentThemeSubject = new BehaviorSubject<ThemeType>('lara-light-blue');
  public currentTheme$ = this.currentThemeSubject.asObservable();

  constructor() {
    // Load theme from localStorage on initialization
    const savedTheme = localStorage.getItem('mcp-theme') as ThemeType;
    if (savedTheme && (savedTheme === 'lara-light-blue' || savedTheme === 'lara-dark-blue')) {
      this.setTheme(savedTheme);
    } else {
      this.setTheme('lara-light-blue');
    }
  }

  /**
   * Get current theme
   */
  getCurrentTheme(): ThemeType {
    return this.currentThemeSubject.value;
  }

  /**
   * Set theme and update DOM
   */
  setTheme(theme: ThemeType): void {
    this.currentThemeSubject.next(theme);
    localStorage.setItem('mcp-theme', theme);
    this.updateThemeLink(theme);
  }

  /**
   * Toggle between light and dark theme
   */
  toggleTheme(): void {
    const currentTheme = this.getCurrentTheme();
    const newTheme = currentTheme === 'lara-light-blue' ? 'lara-dark-blue' : 'lara-light-blue';
    this.setTheme(newTheme);
  }

  /**
   * Check if current theme is dark
   */
  isDarkTheme(): boolean {
    return this.getCurrentTheme() === 'lara-dark-blue';
  }

  /**
   * Update the theme by adding CSS classes to body
   */
  private updateThemeLink(theme: ThemeType): void {
    // Update body class for theme styling
    document.body.classList.remove('lara-light-blue', 'lara-dark-blue');
    document.body.classList.add(theme);
    
    // Add theme-specific CSS variables
    if (theme === 'lara-dark-blue') {
      document.documentElement.style.setProperty('--surface-ground', '#1a1a1a');
      document.documentElement.style.setProperty('--surface-card', '#2d2d2d');
      document.documentElement.style.setProperty('--surface-border', '#404040');
      document.documentElement.style.setProperty('--text-color', '#ffffff');
      document.documentElement.style.setProperty('--text-color-secondary', '#a0a0a0');
    } else {
      document.documentElement.style.setProperty('--surface-ground', '#f8f9fa');
      document.documentElement.style.setProperty('--surface-card', '#ffffff');
      document.documentElement.style.setProperty('--surface-border', '#e9ecef');
      document.documentElement.style.setProperty('--text-color', '#212529');
      document.documentElement.style.setProperty('--text-color-secondary', '#6c757d');
    }
  }
}
