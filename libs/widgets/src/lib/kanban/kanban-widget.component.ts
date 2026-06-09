import { Component, ChangeDetectionStrategy, Input, inject } from '@angular/core';
import { Block, KanbanConfig, KanbanColumn, KanbanCard } from '@ngeenx/shared-models';
import { WorkspaceStateService } from '@ngeenx/state';

@Component({
  selector: 'cw-kanban-widget',
  standalone: true,
  templateUrl: './kanban-widget.component.html',
  styleUrls: ['./kanban-widget.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanWidgetComponent {
  @Input({ required: true }) block!: Block;
  private ws = inject(WorkspaceStateService);

  get config(): KanbanConfig { return this.block.config as KanbanConfig; }

  addCard(colId: string): void {
    const cols = this.config.columns.map((c) =>
      c.id === colId
        ? { ...c, cards: [...c.cards, { id: crypto.randomUUID(), text: 'New task' }] }
        : c
    );
    this.update({ columns: cols });
  }

  removeCard(colId: string, cardId: string): void {
    const cols = this.config.columns.map((c) =>
      c.id === colId ? { ...c, cards: c.cards.filter((k) => k.id !== cardId) } : c
    );
    this.update({ columns: cols });
  }

  onCardEdit(colId: string, cardId: string, e: FocusEvent): void {
    const text = (e.target as HTMLElement).textContent?.trim() || '';
    const cols = this.config.columns.map((c) =>
      c.id === colId
        ? { ...c, cards: c.cards.map((k) => (k.id === cardId ? { ...k, text } : k)) }
        : c
    );
    this.update({ columns: cols });
  }

  onTitleEdit(colId: string, e: FocusEvent): void {
    const title = (e.target as HTMLElement).textContent?.trim() || '';
    const cols = this.config.columns.map((c) =>
      c.id === colId ? { ...c, title } : c
    );
    this.update({ columns: cols });
  }

  onBoardTitleChange(e: FocusEvent): void {
    const title = (e.target as HTMLElement).textContent?.trim() || 'Kanban';
    this.update({ title });
  }

  private update(partial: Partial<KanbanConfig>): void {
    this.ws.updateBlock(this.block.id, { config: { ...this.config, ...partial } });
  }
}
