import { Block } from './block.model';
import { Connection } from './connection.model';
import { ViewportState, DEFAULT_VIEWPORT_STATE } from './viewport.model';

export interface Workspace {
  id: string;
  name: string;
  blocks: Record<string, Block>;
  connections: Record<string, Connection>;
  viewport: ViewportState;
  nextZIndex: number;
  version: number;
  lastSavedAt: number;
}

export function createDefaultWorkspace(): Workspace {
  return {
    id: crypto.randomUUID(),
    name: 'My Workspace',
    blocks: {},
    connections: {},
    viewport: { ...DEFAULT_VIEWPORT_STATE },
    nextZIndex: 1,
    version: 1,
    lastSavedAt: Date.now(),
  };
}
