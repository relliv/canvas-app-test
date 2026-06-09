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
  title: string;
  content: string;
  fontSize: number;
}

export interface StickyNoteConfig {
  type: 'sticky-note';
  text: string;
  backgroundColor: string;
  textColor: string;
}

export interface TerminalConfig {
  type: 'terminal';
  title: string;
  fontSize: number;
  history: string[];
}

export interface BrowserTab {
  id: string;
  title: string;
  url: string;
  history: string[];
  historyIndex: number;
}

export interface WebBrowserConfig {
  type: 'web-browser';
  tabs: BrowserTab[];
  activeTabId: string;
}

export type WidgetConfig = PomodoroConfig | TextEditorConfig | StickyNoteConfig | TerminalConfig | WebBrowserConfig;

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
  title: 'Untitled',
  content: '',
  fontSize: 14,
};

export const DEFAULT_TERMINAL_CONFIG: TerminalConfig = {
  type: 'terminal',
  title: 'Terminal',
  fontSize: 13,
  history: [],
};

export const DEFAULT_WEB_BROWSER_CONFIG: WebBrowserConfig = {
  type: 'web-browser',
  tabs: [
    {
      id: crypto.randomUUID(),
      title: 'New Tab',
      url: 'https://example.com',
      history: ['https://example.com'],
      historyIndex: 0,
    },
  ],
  activeTabId: '',
};

export const DEFAULT_STICKY_NOTE_CONFIG: StickyNoteConfig = {
  type: 'sticky-note',
  text: '',
  backgroundColor: '#fef08a',
  textColor: '#1a1a1e',
};
