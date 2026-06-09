import { Component, ChangeDetectionStrategy, Input, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { Block, ClockConfig } from '@ngeenx/shared-models';
import { WorkspaceStateService } from '@ngeenx/state';

const TIMEZONES = [
  { label: 'Local', value: 'local' },
  { label: 'UTC', value: 'UTC' },
  { label: 'New York', value: 'America/New_York' },
  { label: 'London', value: 'Europe/London' },
  { label: 'Istanbul', value: 'Europe/Istanbul' },
  { label: 'Tokyo', value: 'Asia/Tokyo' },
  { label: 'Sydney', value: 'Australia/Sydney' },
  { label: 'Dubai', value: 'Asia/Dubai' },
];

@Component({
  selector: 'cw-clock-widget',
  standalone: true,
  templateUrl: './clock-widget.component.html',
  styleUrls: ['./clock-widget.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClockWidgetComponent implements OnInit, OnDestroy {
  @Input({ required: true }) block!: Block;
  private ws = inject(WorkspaceStateService);
  private intervalId: ReturnType<typeof setInterval> | null = null;
  readonly timezones = TIMEZONES;
  readonly time = signal('');
  readonly date = signal('');

  get config(): ClockConfig { return this.block.config as ClockConfig; }

  ngOnInit(): void {
    this.tick();
    this.intervalId = setInterval(() => this.tick(), 1000);
  }

  private tick(): void {
    const opts: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: this.config.format === '12h',
    };
    const dateOpts: Intl.DateTimeFormatOptions = {
      weekday: 'short', month: 'short', day: 'numeric',
    };
    const tz = this.config.timezone === 'local' ? undefined : this.config.timezone;
    if (tz) { opts.timeZone = tz; dateOpts.timeZone = tz; }

    const now = new Date();
    this.time.set(now.toLocaleTimeString('en-US', opts));
    this.date.set(now.toLocaleDateString('en-US', dateOpts));
  }

  onTimezoneChange(e: Event): void {
    const timezone = (e.target as HTMLSelectElement).value;
    this.ws.updateBlock(this.block.id, { config: { ...this.config, timezone } });
  }

  onLabelChange(e: FocusEvent): void {
    const label = (e.target as HTMLElement).textContent?.trim() || 'Clock';
    this.ws.updateBlock(this.block.id, { config: { ...this.config, label } });
  }

  toggleFormat(): void {
    const format = this.config.format === '24h' ? '12h' : '24h';
    this.ws.updateBlock(this.block.id, { config: { ...this.config, format } });
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }
}
