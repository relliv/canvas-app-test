import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
  HostListener,
} from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ToolbarComponent } from '../toolbar/toolbar.component';
import { MinimapComponent } from '../minimap/minimap.component';
import { CanvasViewportComponent } from '../../canvas/canvas-viewport/canvas-viewport.component';
import {
  PersistenceService,
  WorkspaceStateService,
  HistoryService,
} from '@ngeenx/state';

@Component({
  selector: 'cw-workspace',
  standalone: true,
  imports: [
    SidebarComponent,
    ToolbarComponent,
    MinimapComponent,
    CanvasViewportComponent,
  ],
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceComponent implements OnInit {
  private persistenceService = inject(PersistenceService);
  private workspaceState = inject(WorkspaceStateService);
  private historyService = inject(HistoryService);

  ngOnInit(): void {
    this.persistenceService.initialize();
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    const isInput =
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'INPUT' ||
      target.isContentEditable;

    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (!isInput) {
        event.preventDefault();
        this.historyService.pushSnapshot();
        this.workspaceState.deleteSelectedBlocks();
      }
    }

    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'z':
          if (event.shiftKey) {
            event.preventDefault();
            this.historyService.redo();
          } else {
            event.preventDefault();
            this.historyService.undo();
          }
          break;
        case 'd':
          if (!isInput) {
            event.preventDefault();
            const selected = [
              ...this.workspaceState.selectedBlockIds(),
            ];
            if (selected.length > 0) {
              this.historyService.pushSnapshot();
              for (const id of selected) {
                this.workspaceState.duplicateBlock(id);
              }
            }
          }
          break;
        case 'a':
          if (!isInput) {
            event.preventDefault();
            this.workspaceState.selectAll();
          }
          break;
        case '=':
        case '+':
          event.preventDefault();
          this.workspaceState.updateViewport({
            ...this.workspaceState.viewportState(),
            zoom: Math.min(
              5,
              this.workspaceState.viewportState().zoom + 0.1
            ),
          });
          break;
        case '-':
          event.preventDefault();
          this.workspaceState.updateViewport({
            ...this.workspaceState.viewportState(),
            zoom: Math.max(
              0.1,
              this.workspaceState.viewportState().zoom - 0.1
            ),
          });
          break;
        case '0':
          event.preventDefault();
          this.workspaceState.updateViewport({
            ...this.workspaceState.viewportState(),
            offset: { x: 0, y: 0 },
            zoom: 1,
          });
          break;
      }
    }

    if (event.key === 'Escape') {
      this.workspaceState.clearSelection();
    }
  }
}
