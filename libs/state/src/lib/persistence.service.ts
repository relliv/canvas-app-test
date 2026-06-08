import { Injectable, inject, effect, Injector } from '@angular/core';
import { Workspace } from '@ngeenx/shared-models';
import { WorkspaceStateService } from './workspace-state.service';

const STORAGE_KEY = 'canvas-workspace-v1';
const SAVE_DEBOUNCE_MS = 1000;

@Injectable({ providedIn: 'root' })
export class PersistenceService {
  private workspaceState = inject(WorkspaceStateService);
  private injector = inject(Injector);
  private saveTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private initialized = false;

  initialize(): void {
    if (this.initialized) return;
    this.initialized = true;

    this.load();

    effect(
      () => {
        const workspace = this.workspaceState.workspace();
        this.debouncedSave(workspace);
      },
      { injector: this.injector }
    );
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: Workspace = JSON.parse(raw);
        if (parsed.version === 1) {
          this.workspaceState.restore(parsed);
        }
      }
    } catch {
      console.warn('Failed to load workspace from localStorage');
    }
  }

  private debouncedSave(workspace: Workspace): void {
    if (this.saveTimeoutId) clearTimeout(this.saveTimeoutId);
    this.saveTimeoutId = setTimeout(() => {
      const serialized = JSON.stringify({
        ...workspace,
        lastSavedAt: Date.now(),
      });
      try {
        localStorage.setItem(STORAGE_KEY, serialized);
      } catch {
        console.warn('Failed to save workspace to localStorage');
      }
    }, SAVE_DEBOUNCE_MS);
  }

  saveNow(): void {
    if (this.saveTimeoutId) clearTimeout(this.saveTimeoutId);
    const workspace = this.workspaceState.workspace();
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...workspace, lastSavedAt: Date.now() })
      );
    } catch {
      console.warn('Failed to save workspace to localStorage');
    }
  }

  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}
