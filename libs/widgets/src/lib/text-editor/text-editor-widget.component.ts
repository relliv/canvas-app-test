import {
  Component,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  Input,
  inject,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { TiptapEditorDirective } from 'ngx-tiptap';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Block, TextEditorConfig } from '@ngeenx/shared-models';
import { WorkspaceStateService } from '@ngeenx/state';

@Component({
  selector: 'cw-text-editor-widget',
  standalone: true,
  imports: [TiptapEditorDirective],
  templateUrl: './text-editor-widget.component.html',
  styleUrls: ['./text-editor-widget.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class TextEditorWidgetComponent implements OnInit, OnDestroy {
  @Input({ required: true }) block!: Block;

  private workspaceState = inject(WorkspaceStateService);
  editor!: Editor;

  get config(): TextEditorConfig {
    return this.block.config as TextEditorConfig;
  }

  ngOnInit(): void {
    this.editor = new Editor({
      extensions: [
        StarterKit,
        Placeholder.configure({
          placeholder: 'Write something...',
        }),
      ],
      content: this.config.content || '',
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        this.workspaceState.updateBlock(this.block.id, {
          config: { ...this.config, content: html },
        });
      },
    });
  }

  toggleBold(): void {
    this.editor.chain().focus().toggleBold().run();
  }

  toggleItalic(): void {
    this.editor.chain().focus().toggleItalic().run();
  }

  toggleStrike(): void {
    this.editor.chain().focus().toggleStrike().run();
  }

  toggleBulletList(): void {
    this.editor.chain().focus().toggleBulletList().run();
  }

  toggleOrderedList(): void {
    this.editor.chain().focus().toggleOrderedList().run();
  }

  toggleCodeBlock(): void {
    this.editor.chain().focus().toggleCodeBlock().run();
  }

  onToolbarMouseDown(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
  }

  ngOnDestroy(): void {
    this.editor?.destroy();
  }
}
