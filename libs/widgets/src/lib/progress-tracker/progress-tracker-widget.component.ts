import { Component, ChangeDetectionStrategy, Input, inject } from '@angular/core';
import { Block, ProgressTrackerConfig } from '@ngeenx/shared-models';
import { WorkspaceStateService } from '@ngeenx/state';

@Component({
  selector: 'cw-progress-tracker-widget',
  standalone: true,
  templateUrl: './progress-tracker-widget.component.html',
  styleUrls: ['./progress-tracker-widget.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressTrackerWidgetComponent {
  @Input({ required: true }) block!: Block;
  private ws = inject(WorkspaceStateService);

  get config(): ProgressTrackerConfig { return this.block.config as ProgressTrackerConfig; }

  get progress(): number {
    const tasks = this.config.tasks;
    if (tasks.length === 0) return 0;
    return Math.round((tasks.filter((t) => t.done).length / tasks.length) * 100);
  }

  addTask(): void {
    const tasks = [...this.config.tasks, { id: crypto.randomUUID(), text: 'New task', done: false }];
    this.update({ tasks });
  }

  toggleTask(id: string): void {
    const tasks = this.config.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
    this.update({ tasks });
  }

  removeTask(id: string): void {
    const tasks = this.config.tasks.filter((t) => t.id !== id);
    this.update({ tasks });
  }

  onTaskEdit(id: string, e: FocusEvent): void {
    const text = (e.target as HTMLElement).textContent?.trim() || '';
    const tasks = this.config.tasks.map((t) => (t.id === id ? { ...t, text } : t));
    this.update({ tasks });
  }

  onTitleChange(e: FocusEvent): void {
    const title = (e.target as HTMLElement).textContent?.trim() || 'Tasks';
    this.update({ title });
  }

  private update(partial: Partial<ProgressTrackerConfig>): void {
    this.ws.updateBlock(this.block.id, { config: { ...this.config, ...partial } });
  }
}
