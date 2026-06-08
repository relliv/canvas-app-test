import {
  Component,
  ChangeDetectionStrategy,
  Input,
  OnDestroy,
  inject,
  computed,
} from '@angular/core';
import { Block, PomodoroConfig } from '@ngeenx/shared-models';
import { WorkspaceStateService } from '@ngeenx/state';

@Component({
  selector: 'cw-pomodoro-widget',
  standalone: true,
  templateUrl: './pomodoro-widget.component.html',
  styleUrls: ['./pomodoro-widget.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PomodoroWidgetComponent implements OnDestroy {
  @Input({ required: true }) block!: Block;

  private workspaceState = inject(WorkspaceStateService);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  get config(): PomodoroConfig {
    return this.block.config as PomodoroConfig;
  }

  get displayTime(): string {
    const c = this.config;
    const minutes = Math.floor(c.currentTime / 60);
    const seconds = c.currentTime % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  get progress(): number {
    const c = this.config;
    const total = c.isBreak ? c.breakDuration : c.workDuration;
    return ((total - c.currentTime) / total) * 100;
  }

  get strokeDashoffset(): number {
    return 283 - (283 * this.progress) / 100;
  }

  get sessionDots(): number[] {
    return [1, 2, 3, 4];
  }

  toggleTimer(event: MouseEvent): void {
    event.stopPropagation();
    const c = this.config;
    if (c.isRunning) {
      this.stopInterval();
    } else {
      this.startInterval();
    }
    this.updateConfig({ isRunning: !c.isRunning });
  }

  resetTimer(event: MouseEvent): void {
    event.stopPropagation();
    this.stopInterval();
    const c = this.config;
    this.updateConfig({
      currentTime: c.isBreak ? c.breakDuration : c.workDuration,
      isRunning: false,
    });
  }

  private startInterval(): void {
    this.intervalId = setInterval(() => {
      const c = this.config;
      if (c.currentTime <= 0) {
        this.onTimerComplete();
        return;
      }
      this.updateConfig({ currentTime: c.currentTime - 1 });
    }, 1000);
  }

  private stopInterval(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private onTimerComplete(): void {
    this.stopInterval();
    const c = this.config;
    if (c.isBreak) {
      this.updateConfig({
        isBreak: false,
        currentTime: c.workDuration,
        isRunning: false,
      });
    } else {
      const newCompleted = c.completedSessions + 1;
      const isLongBreak = newCompleted % c.sessionsBeforeLongBreak === 0;
      this.updateConfig({
        isBreak: true,
        currentTime: isLongBreak ? c.longBreakDuration : c.breakDuration,
        completedSessions: newCompleted,
        isRunning: false,
      });
    }
  }

  private updateConfig(partial: Partial<PomodoroConfig>): void {
    this.workspaceState.updateBlock(this.block.id, {
      config: { ...this.config, ...partial },
    });
  }

  ngOnDestroy(): void {
    this.stopInterval();
  }
}
