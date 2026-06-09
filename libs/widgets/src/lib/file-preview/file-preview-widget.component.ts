import { Component, ChangeDetectionStrategy, Input, inject, Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Block, FilePreviewConfig } from '@ngeenx/shared-models';
import { WorkspaceStateService } from '@ngeenx/state';

@Pipe({ name: 'safeFile', standalone: true })
export class SafeFilePipe implements PipeTransform {
  private s = inject(DomSanitizer);
  transform(url: string): SafeResourceUrl { return this.s.bypassSecurityTrustResourceUrl(url); }
}

@Component({
  selector: 'cw-file-preview-widget',
  standalone: true,
  imports: [SafeFilePipe],
  templateUrl: './file-preview-widget.component.html',
  styleUrls: ['./file-preview-widget.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilePreviewWidgetComponent {
  @Input({ required: true }) block!: Block;
  private ws = inject(WorkspaceStateService);

  get config(): FilePreviewConfig { return this.block.config as FilePreviewConfig; }

  get isPdf(): boolean { return this.config.fileType === 'pdf' || this.config.url.endsWith('.pdf'); }
  get isImage(): boolean { return ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].some((e) => this.config.url.endsWith('.' + e)); }

  onUrlChange(e: Event): void {
    const url = (e.target as HTMLInputElement).value;
    const filename = url.split('/').pop() || '';
    const ext = filename.split('.').pop() || '';
    this.ws.updateBlock(this.block.id, { config: { ...this.config, url, filename, fileType: ext } });
  }

  onUrlKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
  }
}
