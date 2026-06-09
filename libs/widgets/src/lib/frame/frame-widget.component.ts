import {
  Component,
  ChangeDetectionStrategy,
  Input,
  inject,
} from '@angular/core';
import { Block, FrameConfig } from '@ngeenx/shared-models';
import { WorkspaceStateService } from '@ngeenx/state';

const FRAME_COLORS = [
  { label: 'Indigo', value: '#6366f1' },
  { label: 'Red', value: '#ef4444' },
  { label: 'Green', value: '#22c55e' },
  { label: 'Yellow', value: '#f59e0b' },
  { label: 'Cyan', value: '#06b6d4' },
  { label: 'Gray', value: '#71717a' },
];

@Component({
  selector: 'cw-frame-widget',
  standalone: true,
  templateUrl: './frame-widget.component.html',
  styleUrls: ['./frame-widget.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FrameWidgetComponent {
  @Input({ required: true }) block!: Block;

  private workspaceState = inject(WorkspaceStateService);
  readonly colors = FRAME_COLORS;

  get config(): FrameConfig {
    return this.block.config as FrameConfig;
  }

  onTitleChange(event: FocusEvent): void {
    const el = event.target as HTMLElement;
    const title = el.textContent?.trim() || 'Frame';
    this.workspaceState.updateBlock(this.block.id, {
      config: { ...this.config, title },
    });
  }

  onTitleEnter(event: KeyboardEvent): void {
    event.preventDefault();
    (event.target as HTMLElement).blur();
  }

  onColorChange(color: string): void {
    this.workspaceState.updateBlock(this.block.id, {
      config: { ...this.config, color },
    });
  }
}
