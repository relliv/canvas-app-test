export interface PomodoroConfig {
  type: 'pomodoro';
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
  currentTime: number;
  isRunning: boolean;
  isBreak: boolean;
  completedSessions: number;
}

export interface TextEditorConfig {
  type: 'text-editor';
  content: string;
  fontSize: number;
}

export interface StickyNoteConfig {
  type: 'sticky-note';
  text: string;
  backgroundColor: string;
  textColor: string;
}

export type WidgetConfig = PomodoroConfig | TextEditorConfig | StickyNoteConfig;

export const DEFAULT_POMODORO_CONFIG: PomodoroConfig = {
  type: 'pomodoro',
  workDuration: 25 * 60,
  breakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  sessionsBeforeLongBreak: 4,
  currentTime: 25 * 60,
  isRunning: false,
  isBreak: false,
  completedSessions: 0,
};

export const DEFAULT_TEXT_EDITOR_CONFIG: TextEditorConfig = {
  type: 'text-editor',
  content: '',
  fontSize: 14,
};

export const DEFAULT_STICKY_NOTE_CONFIG: StickyNoteConfig = {
  type: 'sticky-note',
  text: '',
  backgroundColor: '#fef08a',
  textColor: '#1a1a1e',
};
