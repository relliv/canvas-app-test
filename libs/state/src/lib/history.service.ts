import { Injectable, inject, signal, computed } from '@angular/core';
import { Workspace } from '@ngeenx/shared-models';
import { WorkspaceStateService } from './workspace-state.service';

const MAX_HISTORY = 50;

@Injectable({ providedIn: 'root' })
export class HistoryService {
  private workspaceState = inject(WorkspaceStateService);
  private undoStack: Workspace[] = [];
  private redoStack: Workspace[] = [];

  private readonly _canUndo = signal(false);
  private readonly _canRedo = signal(false);
  readonly canUndo = this._canUndo.asReadonly();
  readonly canRedo = this._canRedo.asReadonly();

  pushSnapshot(): void {
    this.undoStack.push(structuredClone(this.workspaceState.workspace()));
    if (this.undoStack.length > MAX_HISTORY) {
      this.undoStack.shift();
    }
    this.redoStack = [];
    this.updateFlags();
  }

  undo(): void {
    if (this.undoStack.length === 0) return;
    this.redoStack.push(
      structuredClone(this.workspaceState.workspace())
    );
    const prev = this.undoStack.pop()!;
    this.workspaceState.restore(prev);
    this.updateFlags();
  }

  redo(): void {
    if (this.redoStack.length === 0) return;
    this.undoStack.push(
      structuredClone(this.workspaceState.workspace())
    );
    const next = this.redoStack.pop()!;
    this.workspaceState.restore(next);
    this.updateFlags();
  }

  private updateFlags(): void {
    this._canUndo.set(this.undoStack.length > 0);
    this._canRedo.set(this.redoStack.length > 0);
  }
}
