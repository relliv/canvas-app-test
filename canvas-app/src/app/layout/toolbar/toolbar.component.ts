import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
} from '@angular/core';
import {
  WorkspaceStateService,
  HistoryService,
  PersistenceService,
} from '@ngeenx/state';
import { getViewport } from '@ngeenx/canvas-engine';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'cw-toolbar',
  standalone: true,
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarComponent {
  protected workspaceState = inject(WorkspaceStateService);
  protected historyService = inject(HistoryService);
  protected persistenceService = inject(PersistenceService);
  protected themeService = inject(ThemeService);

  readonly zoomPercent = computed(() =>
    Math.round(this.workspaceState.viewportState().zoom * 100)
  );

  undo(): void {
    this.historyService.undo();
  }

  redo(): void {
    this.historyService.redo();
  }

  zoomIn(): void {
    const vp = getViewport();
    if (vp) {
      vp.setZoom(vp.zoom + 0.15);
    }
  }

  zoomOut(): void {
    const vp = getViewport();
    if (vp) {
      vp.setZoom(vp.zoom - 0.15);
    }
  }

  resetZoom(): void {
    const vp = getViewport();
    if (vp) {
      vp.resetView();
    }
  }

  save(): void {
    this.persistenceService.saveNow();
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }
}
