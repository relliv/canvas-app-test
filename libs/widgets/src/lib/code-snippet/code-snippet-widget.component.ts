import { Component, ChangeDetectionStrategy, Input, inject } from '@angular/core';
import { Block, CodeSnippetConfig } from '@ngeenx/shared-models';
import { WorkspaceStateService } from '@ngeenx/state';

const LANGUAGES = ['typescript', 'javascript', 'python', 'html', 'css', 'json', 'bash', 'sql', 'rust', 'go'];

@Component({
  selector: 'cw-code-snippet-widget',
  standalone: true,
  templateUrl: './code-snippet-widget.component.html',
  styleUrls: ['./code-snippet-widget.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodeSnippetWidgetComponent {
  @Input({ required: true }) block!: Block;
  private ws = inject(WorkspaceStateService);
  readonly languages = LANGUAGES;

  get config(): CodeSnippetConfig { return this.block.config as CodeSnippetConfig; }

  onCodeChange(e: Event): void {
    const code = (e.target as HTMLTextAreaElement).value;
    this.ws.updateBlock(this.block.id, { config: { ...this.config, code } });
  }

  onLangChange(e: Event): void {
    const language = (e.target as HTMLSelectElement).value;
    this.ws.updateBlock(this.block.id, { config: { ...this.config, language } });
  }

  onTitleChange(e: FocusEvent): void {
    const title = (e.target as HTMLElement).textContent?.trim() || 'Snippet';
    this.ws.updateBlock(this.block.id, { config: { ...this.config, title } });
  }
}
