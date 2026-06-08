import { Vector2, Size } from './viewport.model';
import {
  WidgetConfig,
  DEFAULT_POMODORO_CONFIG,
  DEFAULT_TEXT_EDITOR_CONFIG,
  DEFAULT_STICKY_NOTE_CONFIG,
} from './widget-config.model';

export type BlockType = 'pomodoro' | 'text-editor' | 'sticky-note';

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
};

const DEFAULT_CONFIGS: Record<BlockType, WidgetConfig> = {
  pomodoro: DEFAULT_POMODORO_CONFIG,
  'text-editor': DEFAULT_TEXT_EDITOR_CONFIG,
  'sticky-note': DEFAULT_STICKY_NOTE_CONFIG,
};

export function createDefaultBlock(
  type: BlockType,
  position: Vector2,
  zIndex: number
): Block {
  return {
    id: crypto.randomUUID(),
    type,
    position,
    size: { ...DEFAULT_BLOCK_SIZES[type] },
    zIndex,
    config: { ...DEFAULT_CONFIGS[type] },
    connectionPoints: DEFAULT_CONNECTION_POINTS.map((p) => ({ ...p })),
    locked: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
