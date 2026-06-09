import { Component, ChangeDetectionStrategy, Input, inject, computed, signal } from '@angular/core';
import { Block, CalendarConfig } from '@ngeenx/shared-models';
import { WorkspaceStateService } from '@ngeenx/state';

@Component({
  selector: 'cw-calendar-widget',
  standalone: true,
  templateUrl: './calendar-widget.component.html',
  styleUrls: ['./calendar-widget.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarWidgetComponent {
  @Input({ required: true }) block!: Block;
  private ws = inject(WorkspaceStateService);
  readonly viewDate = signal(new Date());
  readonly weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  get config(): CalendarConfig { return this.block.config as CalendarConfig; }

  get monthLabel(): string {
    return this.viewDate().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  get days(): (number | null)[] {
    const d = this.viewDate();
    const year = d.getFullYear();
    const month = d.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = Array(firstDay).fill(null);
    for (let i = 1; i <= daysInMonth; i++) cells.push(i);
    return cells;
  }

  isToday(day: number | null): boolean {
    if (!day) return false;
    const d = this.viewDate();
    const today = new Date();
    return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && day === today.getDate();
  }

  isSelected(day: number | null): boolean {
    if (!day) return false;
    const d = this.viewDate();
    const sel = this.config.selectedDate;
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return sel === dateStr;
  }

  selectDay(day: number | null): void {
    if (!day) return;
    const d = this.viewDate();
    const selectedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    this.ws.updateBlock(this.block.id, { config: { ...this.config, selectedDate } });
  }

  prevMonth(): void {
    const d = this.viewDate();
    this.viewDate.set(new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  nextMonth(): void {
    const d = this.viewDate();
    this.viewDate.set(new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }
}
