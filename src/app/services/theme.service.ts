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
   * Update the theme link in the DOM
   */
  private updateThemeLink(theme: ThemeType): void {
    const themeLink = document.getElementById('theme-css') as HTMLLinkElement;
    if (themeLink) {
      themeLink.href = `primeng/resources/themes/${theme}/theme.css`;
    } else {
      // Create theme link if it doesn't exist
      const link = document.createElement('link');
      link.id = 'theme-css';
      link.rel = 'stylesheet';
      link.href = `primeng/resources/themes/${theme}/theme.css`;
      document.head.appendChild(link);
    }

    // Update body class for additional styling
    document.body.classList.remove('lara-light-blue', 'lara-dark-blue');
    document.body.classList.add(theme);
  }
}
