import { Component, ChangeDetectionStrategy, Input, inject, Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Block, EmbedConfig } from '@ngeenx/shared-models';
import { WorkspaceStateService } from '@ngeenx/state';

@Pipe({ name: 'safeRes', standalone: true })
export class SafeResPipe implements PipeTransform {
  private s = inject(DomSanitizer);
  transform(url: string): SafeResourceUrl { return this.s.bypassSecurityTrustResourceUrl(url); }
}

@Component({
  selector: 'cw-embed-widget',
  standalone: true,
  imports: [SafeResPipe],
  templateUrl: './embed-widget.component.html',
  styleUrls: ['./embed-widget.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmbedWidgetComponent {
  @Input({ required: true }) block!: Block;
  private ws = inject(WorkspaceStateService);

  get config(): EmbedConfig { return this.block.config as EmbedConfig; }

  onUrlChange(e: Event): void {
    const url = (e.target as HTMLInputElement).value;
    this.ws.updateBlock(this.block.id, { config: { ...this.config, url } });
  }

  onUrlKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
  }

  onTitleChange(e: FocusEvent): void {
    const title = (e.target as HTMLElement).textContent?.trim() || 'Embed';
    this.ws.updateBlock(this.block.id, { config: { ...this.config, title } });
  }
}
