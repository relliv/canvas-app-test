import {
  Component,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { BlockType, Vector2 } from '@ngeenx/shared-models';
import { WorkspaceStateService, HistoryService } from '@ngeenx/state';

interface WidgetOption {
  type: BlockType;
  label: string;
  icon: string;
}

@Component({
  selector: 'cw-sidebar',
  standalone: true,
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  private workspaceState = inject(WorkspaceStateService);
  private historyService = inject(HistoryService);

  readonly blockTypes: WidgetOption[] = [
    { type: 'sticky-note', label: 'Note', icon: 'note' },
    { type: 'text-editor', label: 'Text', icon: 'edit' },
    { type: 'markdown', label: 'Markdown', icon: 'markdown' },
    { type: 'code-snippet', label: 'Code', icon: 'code' },
    { type: 'image', label: 'Image', icon: 'image' },
    { type: 'pomodoro', label: 'Timer', icon: 'timer' },
    { type: 'clock', label: 'Clock', icon: 'clock' },
    { type: 'terminal', label: 'Terminal', icon: 'terminal' },
    { type: 'web-browser', label: 'Browser', icon: 'browser' },
    { type: 'embed', label: 'Embed', icon: 'embed' },
    { type: 'kanban', label: 'Kanban', icon: 'kanban' },
    { type: 'chat', label: 'Chat', icon: 'chat' },
    { type: 'drawing', label: 'Draw', icon: 'drawing' },
    { type: 'calendar', label: 'Calendar', icon: 'calendar' },
    { type: 'progress-tracker', label: 'Tasks', icon: 'tasks' },
    { type: 'file-preview', label: 'File', icon: 'file' },
    { type: 'api-tester', label: 'API', icon: 'api' },
    { type: 'frame', label: 'Frame', icon: 'frame' },
  ];

  addBlock(type: BlockType): void {
    this.historyService.pushSnapshot();
    const viewport = this.workspaceState.viewportState();
    const centerWorld: Vector2 = {
      x: -viewport.offset.x / viewport.zoom + 400,
      y: -viewport.offset.y / viewport.zoom + 200,
    };
    this.workspaceState.addBlock(type, centerWorld);
  }
}
