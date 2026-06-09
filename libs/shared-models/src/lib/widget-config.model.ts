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

export interface FrameConfig {
  type: 'frame';
  title: string;
  color: string;
}

export interface ImageConfig {
  type: 'image';
  url: string;
  caption: string;
  fit: 'contain' | 'cover' | 'fill';
}

export interface KanbanCard {
  id: string;
  text: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  cards: KanbanCard[];
}

export interface KanbanConfig {
  type: 'kanban';
  title: string;
  columns: KanbanColumn[];
}

export interface CodeSnippetConfig {
  type: 'code-snippet';
  title: string;
  language: string;
  code: string;
}

export interface MarkdownConfig {
  type: 'markdown';
  title: string;
  content: string;
}

export interface ClockConfig {
  type: 'clock';
  label: string;
  timezone: string;
  format: '12h' | '24h';
}

export interface EmbedConfig {
  type: 'embed';
  url: string;
  title: string;
}

export interface DrawingStroke {
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

export interface DrawingConfig {
  type: 'drawing';
  strokes: DrawingStroke[];
  backgroundColor: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChatConfig {
  type: 'chat';
  title: string;
  messages: ChatMessage[];
}

export interface CalendarConfig {
  type: 'calendar';
  selectedDate: string;
  events: { date: string; title: string; color: string }[];
}

export interface ProgressTrackerConfig {
  type: 'progress-tracker';
  title: string;
  tasks: { id: string; text: string; done: boolean }[];
}

export interface FilePreviewConfig {
  type: 'file-preview';
  url: string;
  filename: string;
  fileType: string;
}

export interface ApiTesterConfig {
  type: 'api-tester';
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers: string;
  body: string;
  response: string;
  status: number | null;
}

export type WidgetConfig =
  | PomodoroConfig
  | TextEditorConfig
  | StickyNoteConfig
  | TerminalConfig
  | WebBrowserConfig
  | FrameConfig
  | ImageConfig
  | KanbanConfig
  | CodeSnippetConfig
  | MarkdownConfig
  | ClockConfig
  | EmbedConfig
  | DrawingConfig
  | ChatConfig
  | CalendarConfig
  | ProgressTrackerConfig
  | FilePreviewConfig
  | ApiTesterConfig;

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

export const DEFAULT_FRAME_CONFIG: FrameConfig = {
  type: 'frame',
  title: 'Frame',
  color: '#6366f1',
};

export const DEFAULT_STICKY_NOTE_CONFIG: StickyNoteConfig = {
  type: 'sticky-note',
  text: '',
  backgroundColor: '#fef08a',
  textColor: '#1a1a1e',
};

export const DEFAULT_IMAGE_CONFIG: ImageConfig = {
  type: 'image',
  url: '',
  caption: '',
  fit: 'contain',
};

export const DEFAULT_KANBAN_CONFIG: KanbanConfig = {
  type: 'kanban',
  title: 'Kanban',
  columns: [
    { id: crypto.randomUUID(), title: 'To Do', cards: [] },
    { id: crypto.randomUUID(), title: 'In Progress', cards: [] },
    { id: crypto.randomUUID(), title: 'Done', cards: [] },
  ],
};

export const DEFAULT_CODE_SNIPPET_CONFIG: CodeSnippetConfig = {
  type: 'code-snippet',
  title: 'Snippet',
  language: 'typescript',
  code: '',
};

export const DEFAULT_MARKDOWN_CONFIG: MarkdownConfig = {
  type: 'markdown',
  title: 'Markdown',
  content: '# Hello\n\nStart writing...',
};

export const DEFAULT_CLOCK_CONFIG: ClockConfig = {
  type: 'clock',
  label: 'Local Time',
  timezone: 'local',
  format: '24h',
};

export const DEFAULT_EMBED_CONFIG: EmbedConfig = {
  type: 'embed',
  url: '',
  title: 'Embed',
};

export const DEFAULT_DRAWING_CONFIG: DrawingConfig = {
  type: 'drawing',
  strokes: [],
  backgroundColor: 'transparent',
};

export const DEFAULT_CHAT_CONFIG: ChatConfig = {
  type: 'chat',
  title: 'Chat',
  messages: [],
};

export const DEFAULT_CALENDAR_CONFIG: CalendarConfig = {
  type: 'calendar',
  selectedDate: new Date().toISOString().split('T')[0],
  events: [],
};

export const DEFAULT_PROGRESS_TRACKER_CONFIG: ProgressTrackerConfig = {
  type: 'progress-tracker',
  title: 'Tasks',
  tasks: [],
};

export const DEFAULT_FILE_PREVIEW_CONFIG: FilePreviewConfig = {
  type: 'file-preview',
  url: '',
  filename: '',
  fileType: '',
};

export const DEFAULT_API_TESTER_CONFIG: ApiTesterConfig = {
  type: 'api-tester',
  method: 'GET',
  url: '',
  headers: '{\n  "Content-Type": "application/json"\n}',
  body: '',
  response: '',
  status: null,
};
