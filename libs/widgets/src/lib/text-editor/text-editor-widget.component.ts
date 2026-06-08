import {
  Component,
  ChangeDetectionStrategy,
  Input,
  inject,
} from '@angular/core';
import { Block, TextEditorConfig } from '@ngeenx/shared-models';
import { WorkspaceStateService } from '@ngeenx/state';

@Component({
  selector: 'cw-text-editor-widget',
  standalone: true,
  templateUrl: './text-editor-widget.component.html',
  styleUrls: ['./text-editor-widget.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextEditorWidgetComponent {
  @Input({ required: true }) block!: Block;

  private workspaceState = inject(WorkspaceStateService);

  get config(): TextEditorConfig {
    return this.block.config as TextEditorConfig;
  }

  onContentChange(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.workspaceState.updateBlock(this.block.id, {
      config: { ...this.config, content: value },
    });
  }

  onMouseDown(event: MouseEvent): void {
    event.stopPropagation();
  }
}
