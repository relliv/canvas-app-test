import {
  Component,
  ChangeDetectionStrategy,
  Input,
  inject,
} from '@angular/core';
import { WorkspaceStateService, HistoryService } from '@ngeenx/state';

@Component({
  selector: 'cw-block-toolbar',
  standalone: true,
  templateUrl: './block-toolbar.component.html',
  styleUrls: ['./block-toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlockToolbarComponent {
  @Input({ required: true }) blockId!: string;

  private workspaceState = inject(WorkspaceStateService);
  private historyService = inject(HistoryService);

  onDuplicate(event: MouseEvent): void {
    event.stopPropagation();
    this.historyService.pushSnapshot();
    this.workspaceState.duplicateBlock(this.blockId);
  }

  onDelete(event: MouseEvent): void {
    event.stopPropagation();
    this.historyService.pushSnapshot();
    this.workspaceState.deleteBlock(this.blockId);
  }

  onBringToFront(event: MouseEvent): void {
    event.stopPropagation();
    this.workspaceState.bringToFront(this.blockId);
  }
}
