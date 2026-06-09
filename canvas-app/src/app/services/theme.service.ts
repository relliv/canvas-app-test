import { Injectable, signal } from '@angular/core';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'canvas-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _theme = signal<Theme>(this.loadTheme());
  readonly theme = this._theme.asReadonly();

  constructor() {
    this.applyTheme(this._theme());
  }

  toggle(): void {
    const next = this._theme() === 'dark' ? 'light' : 'dark';
    this._theme.set(next);
    this.applyTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  private loadTheme(): Theme {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    return 'dark';
  }

  private applyTheme(theme: Theme): void {
    document.documentElement.setAttribute('data-theme', theme);
  }
}
