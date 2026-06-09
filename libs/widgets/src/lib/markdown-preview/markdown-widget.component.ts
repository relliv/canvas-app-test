import { Component, ChangeDetectionStrategy, ViewEncapsulation, Input, inject, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Block, MarkdownConfig } from '@ngeenx/shared-models';
import { WorkspaceStateService } from '@ngeenx/state';
import { marked } from 'marked';

@Component({
  selector: 'cw-markdown-widget',
  standalone: true,
  templateUrl: './markdown-widget.component.html',
  styleUrls: ['./markdown-widget.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class MarkdownWidgetComponent {
  @Input({ required: true }) block!: Block;
  private ws = inject(WorkspaceStateService);
  private sanitizer = inject(DomSanitizer);

  readonly editing = signal(false);

  get config(): MarkdownConfig { return this.block.config as MarkdownConfig; }

  get rendered(): SafeHtml {
    const html = marked.parse(this.config.content || '', { async: false }) as string;
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  toggleEdit(): void { this.editing.update((v) => !v); }

  onContentChange(e: Event): void {
    const content = (e.target as HTMLTextAreaElement).value;
    this.ws.updateBlock(this.block.id, { config: { ...this.config, content } });
  }

  onTitleChange(e: FocusEvent): void {
    const title = (e.target as HTMLElement).textContent?.trim() || 'Markdown';
    this.ws.updateBlock(this.block.id, { config: { ...this.config, title } });
  }
}
