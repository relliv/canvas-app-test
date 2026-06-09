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
    this.workspaceState.updateViewport({
      ...this.workspaceState.viewportState(),
      zoom: Math.min(5, this.workspaceState.viewportState().zoom + 0.1),
    });
  }

  zoomOut(): void {
    this.workspaceState.updateViewport({
      ...this.workspaceState.viewportState(),
      zoom: Math.max(0.1, this.workspaceState.viewportState().zoom - 0.1),
    });
  }

  resetZoom(): void {
    this.workspaceState.updateViewport({
      ...this.workspaceState.viewportState(),
      offset: { x: 0, y: 0 },
      zoom: 1,
    });
  }

  save(): void {
    this.persistenceService.saveNow();
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }
}
