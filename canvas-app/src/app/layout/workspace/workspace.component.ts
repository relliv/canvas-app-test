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
  ClipboardService,
} from '@ngeenx/state';
import { getViewport } from '@ngeenx/canvas-engine';

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
  private clipboardService = inject(ClipboardService);

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
        case 'c':
          if (!isInput) {
            event.preventDefault();
            this.clipboardService.copy();
          }
          break;
        case 'x':
          if (!isInput) {
            event.preventDefault();
            this.clipboardService.cut();
          }
          break;
        case 'v':
          if (!isInput) {
            event.preventDefault();
            this.clipboardService.paste();
          }
          break;
        case 'a':
          if (!isInput) {
            event.preventDefault();
            this.workspaceState.selectAll();
          }
          break;
        case '=':
        case '+': {
          event.preventDefault();
          const vp1 = getViewport();
          if (vp1) vp1.setZoom(vp1.zoom + 0.15);
          break;
        }
        case '-': {
          event.preventDefault();
          const vp2 = getViewport();
          if (vp2) vp2.setZoom(vp2.zoom - 0.15);
          break;
        }
        case '0': {
          event.preventDefault();
          const vp3 = getViewport();
          if (vp3) vp3.resetView();
          break;
        }
      }
    }

    if (event.key === 'Escape') {
      this.workspaceState.clearSelection();
    }
  }
}
