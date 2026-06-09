import { Component, ChangeDetectionStrategy, Input, inject, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { Block, ChatConfig, ChatMessage } from '@ngeenx/shared-models';
import { WorkspaceStateService } from '@ngeenx/state';

const BOT_RESPONSES = [
  'I understand. Can you tell me more?',
  'That is interesting. Let me think about it.',
  'Great question! Here is what I think...',
  'Sure, I can help with that.',
  'Thanks for sharing. What else would you like to know?',
];

@Component({
  selector: 'cw-chat-widget',
  standalone: true,
  templateUrl: './chat-widget.component.html',
  styleUrls: ['./chat-widget.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatWidgetComponent implements AfterViewChecked {
  @Input({ required: true }) block!: Block;
  @ViewChild('msgList') msgListRef!: ElementRef<HTMLDivElement>;
  private ws = inject(WorkspaceStateService);
  inputText = '';
  private shouldScroll = false;

  get config(): ChatConfig { return this.block.config as ChatConfig; }

  ngAfterViewChecked(): void {
    if (this.shouldScroll && this.msgListRef) {
      this.msgListRef.nativeElement.scrollTop = this.msgListRef.nativeElement.scrollHeight;
      this.shouldScroll = false;
    }
  }

  onInput(e: Event): void { this.inputText = (e.target as HTMLInputElement).value; }

  send(): void {
    const text = this.inputText.trim();
    if (!text) return;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: text, timestamp: Date.now() };
    const msgs = [...this.config.messages, userMsg];
    this.inputText = '';
    this.shouldScroll = true;

    const botReply: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: BOT_RESPONSES[Math.floor(Math.random() * BOT_RESPONSES.length)],
      timestamp: Date.now() + 1,
    };
    msgs.push(botReply);
    this.ws.updateBlock(this.block.id, { config: { ...this.config, messages: msgs } });
  }

  onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.send(); }
  }

  onTitleChange(e: FocusEvent): void {
    const title = (e.target as HTMLElement).textContent?.trim() || 'Chat';
    this.ws.updateBlock(this.block.id, { config: { ...this.config, title } });
  }

  clearChat(): void {
    this.ws.updateBlock(this.block.id, { config: { ...this.config, messages: [] } });
  }
}
