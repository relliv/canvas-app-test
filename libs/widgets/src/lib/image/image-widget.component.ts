import { Component, ChangeDetectionStrategy, Input, inject } from '@angular/core';
import { Block, ImageConfig } from '@ngeenx/shared-models';
import { WorkspaceStateService } from '@ngeenx/state';

@Component({
  selector: 'cw-image-widget',
  standalone: true,
  templateUrl: './image-widget.component.html',
  styleUrls: ['./image-widget.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageWidgetComponent {
  @Input({ required: true }) block!: Block;
  private ws = inject(WorkspaceStateService);

  get config(): ImageConfig {
    return this.block.config as ImageConfig;
  }

  onUrlChange(e: Event): void {
    const url = (e.target as HTMLInputElement).value;
    this.ws.updateBlock(this.block.id, { config: { ...this.config, url } });
  }

  onUrlKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
  }

  onCaptionChange(e: FocusEvent): void {
    const caption = (e.target as HTMLElement).textContent?.trim() || '';
    this.ws.updateBlock(this.block.id, { config: { ...this.config, caption } });
  }

  onFitChange(fit: 'contain' | 'cover' | 'fill'): void {
    this.ws.updateBlock(this.block.id, { config: { ...this.config, fit } });
  }
}
