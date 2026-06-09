import { Vector2, Size } from './viewport.model';
import {
  WidgetConfig,
  DEFAULT_POMODORO_CONFIG,
  DEFAULT_TEXT_EDITOR_CONFIG,
  DEFAULT_STICKY_NOTE_CONFIG,
  DEFAULT_TERMINAL_CONFIG,
  DEFAULT_WEB_BROWSER_CONFIG,
} from './widget-config.model';

export type BlockType = 'pomodoro' | 'text-editor' | 'sticky-note' | 'terminal' | 'web-browser';

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
};

const DEFAULT_CONFIGS: Record<BlockType, WidgetConfig> = {
  pomodoro: DEFAULT_POMODORO_CONFIG,
  'text-editor': DEFAULT_TEXT_EDITOR_CONFIG,
  'sticky-note': DEFAULT_STICKY_NOTE_CONFIG,
  terminal: DEFAULT_TERMINAL_CONFIG,
  'web-browser': DEFAULT_WEB_BROWSER_CONFIG,
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
