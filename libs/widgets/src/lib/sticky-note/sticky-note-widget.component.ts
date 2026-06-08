import {
  Component,
  ChangeDetectionStrategy,
  Input,
  inject,
} from '@angular/core';
import { Block, StickyNoteConfig } from '@ngeenx/shared-models';
import { WorkspaceStateService } from '@ngeenx/state';

@Component({
  selector: 'cw-sticky-note-widget',
  standalone: true,
  templateUrl: './sticky-note-widget.component.html',
  styleUrls: ['./sticky-note-widget.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StickyNoteWidgetComponent {
  @Input({ required: true }) block!: Block;

  private workspaceState = inject(WorkspaceStateService);

  readonly colorOptions = [
    '#fef08a',
    '#86efac',
    '#93c5fd',
    '#fca5a5',
    '#c4b5fd',
    '#fdba74',
  ];

  get config(): StickyNoteConfig {
    return this.block.config as StickyNoteConfig;
  }

  onTextChange(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.workspaceState.updateBlock(this.block.id, {
      config: { ...this.config, text: value },
    });
  }

  onColorChange(color: string, event: MouseEvent): void {
    event.stopPropagation();
    this.workspaceState.updateBlock(this.block.id, {
      config: { ...this.config, backgroundColor: color },
    });
  }

  onMouseDown(event: MouseEvent): void {
    event.stopPropagation();
  }
}
