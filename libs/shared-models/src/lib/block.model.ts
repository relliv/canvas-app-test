import { Vector2, Size } from './viewport.model';
import {
  WidgetConfig,
  DEFAULT_POMODORO_CONFIG,
  DEFAULT_TEXT_EDITOR_CONFIG,
  DEFAULT_STICKY_NOTE_CONFIG,
  DEFAULT_TERMINAL_CONFIG,
  DEFAULT_WEB_BROWSER_CONFIG,
  DEFAULT_FRAME_CONFIG,
  DEFAULT_IMAGE_CONFIG,
  DEFAULT_KANBAN_CONFIG,
  DEFAULT_CODE_SNIPPET_CONFIG,
  DEFAULT_MARKDOWN_CONFIG,
  DEFAULT_CLOCK_CONFIG,
  DEFAULT_EMBED_CONFIG,
  DEFAULT_DRAWING_CONFIG,
  DEFAULT_CHAT_CONFIG,
  DEFAULT_CALENDAR_CONFIG,
  DEFAULT_PROGRESS_TRACKER_CONFIG,
  DEFAULT_FILE_PREVIEW_CONFIG,
  DEFAULT_API_TESTER_CONFIG,
} from './widget-config.model';

export type BlockType =
  | 'pomodoro'
  | 'text-editor'
  | 'sticky-note'
  | 'terminal'
  | 'web-browser'
  | 'frame'
  | 'image'
  | 'kanban'
  | 'code-snippet'
  | 'markdown'
  | 'clock'
  | 'embed'
  | 'drawing'
  | 'chat'
  | 'calendar'
  | 'progress-tracker'
  | 'file-preview'
  | 'api-tester';

export interface ConnectionPoint {
  id: string;
  side: 'top' | 'right' | 'bottom' | 'left';
  offset: number;
}

export const DEFAULT_CONNECTION_POINTS: ConnectionPoint[] = [
  { id: 'top', side: 'top', offset: 0.5 },
  { id: 'right', side: 'right', offset: 0.5 },
  { id: 'bottom', side: 'bottom', offset: 0.5 },
  { id: 'left', side: 'left', offset: 0.5 },
];

export interface Block {
  id: string;
  type: BlockType;
  position: Vector2;
  size: Size;
  zIndex: number;
  config: WidgetConfig;
  connectionPoints: ConnectionPoint[];
  locked: boolean;
  createdAt: number;
  updatedAt: number;
}

const DEFAULT_BLOCK_SIZES: Record<BlockType, Size> = {
  pomodoro: { width: 280, height: 320 },
  'text-editor': { width: 360, height: 280 },
  'sticky-note': { width: 240, height: 200 },
  terminal: { width: 500, height: 320 },
  'web-browser': { width: 600, height: 450 },
  frame: { width: 800, height: 600 },
  image: { width: 320, height: 260 },
  kanban: { width: 660, height: 400 },
  'code-snippet': { width: 420, height: 300 },
  markdown: { width: 400, height: 340 },
  clock: { width: 220, height: 220 },
  embed: { width: 500, height: 380 },
  drawing: { width: 400, height: 320 },
  chat: { width: 360, height: 440 },
  calendar: { width: 300, height: 320 },
  'progress-tracker': { width: 300, height: 280 },
  'file-preview': { width: 460, height: 380 },
  'api-tester': { width: 500, height: 480 },
};

const DEFAULT_CONFIGS: Record<BlockType, WidgetConfig> = {
  pomodoro: DEFAULT_POMODORO_CONFIG,
  'text-editor': DEFAULT_TEXT_EDITOR_CONFIG,
  'sticky-note': DEFAULT_STICKY_NOTE_CONFIG,
  terminal: DEFAULT_TERMINAL_CONFIG,
  'web-browser': DEFAULT_WEB_BROWSER_CONFIG,
  frame: DEFAULT_FRAME_CONFIG,
  image: DEFAULT_IMAGE_CONFIG,
  kanban: DEFAULT_KANBAN_CONFIG,
  'code-snippet': DEFAULT_CODE_SNIPPET_CONFIG,
  markdown: DEFAULT_MARKDOWN_CONFIG,
  clock: DEFAULT_CLOCK_CONFIG,
  embed: DEFAULT_EMBED_CONFIG,
  drawing: DEFAULT_DRAWING_CONFIG,
  chat: DEFAULT_CHAT_CONFIG,
  calendar: DEFAULT_CALENDAR_CONFIG,
  'progress-tracker': DEFAULT_PROGRESS_TRACKER_CONFIG,
  'file-preview': DEFAULT_FILE_PREVIEW_CONFIG,
  'api-tester': DEFAULT_API_TESTER_CONFIG,
};

export function createDefaultBlock(
  type: BlockType,
  position: Vector2,
  zIndex: number
): Block {
  const config = structuredClone(DEFAULT_CONFIGS[type]);

  if (config.type === 'web-browser') {
    const tabId = crypto.randomUUID();
    const defaultUrl = 'https://example.com';
    config.tabs = [{
      id: tabId,
      title: 'New Tab',
      url: defaultUrl,
      history: [defaultUrl],
      historyIndex: 0,
    }];
    config.activeTabId = tabId;
  }

  if (config.type === 'kanban') {
    config.columns = config.columns.map((col) => ({
      ...col,
      id: crypto.randomUUID(),
    }));
  }

  return {
    id: crypto.randomUUID(),
    type,
    position,
    size: { ...DEFAULT_BLOCK_SIZES[type] },
    zIndex,
    config,
    connectionPoints: DEFAULT_CONNECTION_POINTS.map((p) => ({ ...p })),
    locked: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
