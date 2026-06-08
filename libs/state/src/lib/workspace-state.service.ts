import { Injectable, computed, signal } from '@angular/core';
import {
  Block,
  BlockType,
  createDefaultBlock,
  Connection,
  Workspace,
  createDefaultWorkspace,
  Vector2,
  Size,
  Rect,
  ViewportState,
} from '@ngeenx/shared-models';

@Injectable({ providedIn: 'root' })
export class WorkspaceStateService {
  private readonly _workspace = signal<Workspace>(createDefaultWorkspace());

  readonly workspace = this._workspace.asReadonly();
  readonly blocks = computed(() => this._workspace().blocks);
  readonly connections = computed(() => this._workspace().connections);
  readonly connectionList = computed(() =>
    Object.values(this._workspace().connections)
  );
  readonly viewportState = computed(() => this._workspace().viewport);

  private readonly _selectedBlockIds = signal<Set<string>>(new Set());
  readonly selectedBlockIds = this._selectedBlockIds.asReadonly();
  readonly selectedBlocks = computed(() => {
    const ids = this._selectedBlockIds();
    const allBlocks = this.blocks();
    return [...ids].map((id) => allBlocks[id]).filter(Boolean);
  });

  // Block CRUD

  addBlockDirect(block: Block): void {
    this._workspace.update((ws) => ({
      ...ws,
      blocks: { ...ws.blocks, [block.id]: block },
      nextZIndex: Math.max(ws.nextZIndex, block.zIndex + 1),
    }));
  }

  addBlock(type: BlockType, position: Vector2): Block {
    const block = createDefaultBlock(
      type,
      position,
      this._workspace().nextZIndex
    );
    this._workspace.update((ws) => ({
      ...ws,
      blocks: { ...ws.blocks, [block.id]: block },
      nextZIndex: ws.nextZIndex + 1,
    }));
    return block;
  }

  updateBlock(blockId: string, partial: Partial<Block>): void {
    this._workspace.update((ws) => {
      const existing = ws.blocks[blockId];
      if (!existing) return ws;
      return {
        ...ws,
        blocks: {
          ...ws.blocks,
          [blockId]: { ...existing, ...partial, updatedAt: Date.now() },
        },
      };
    });
  }

  moveBlock(blockId: string, position: Vector2): void {
    this.updateBlock(blockId, { position });
  }

  resizeBlock(blockId: string, size: Size): void {
    this.updateBlock(blockId, { size });
  }

  deleteBlock(blockId: string): void {
    this._workspace.update((ws) => {
      const { [blockId]: _, ...remainingBlocks } = ws.blocks;
      const remainingConnections = Object.fromEntries(
        Object.entries(ws.connections).filter(
          ([, c]) =>
            c.sourceBlockId !== blockId && c.targetBlockId !== blockId
        )
      );
      return {
        ...ws,
        blocks: remainingBlocks,
        connections: remainingConnections,
      };
    });
    this._selectedBlockIds.update((ids) => {
      const next = new Set(ids);
      next.delete(blockId);
      return next;
    });
  }

  deleteSelectedBlocks(): void {
    const ids = [...this._selectedBlockIds()];
    for (const id of ids) {
      this.deleteBlock(id);
    }
  }

  duplicateBlock(blockId: string): Block | null {
    const original = this.blocks()[blockId];
    if (!original) return null;

    const duplicate: Block = {
      ...structuredClone(original),
      id: crypto.randomUUID(),
      position: {
        x: original.position.x + 30,
        y: original.position.y + 30,
      },
      zIndex: this._workspace().nextZIndex,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this._workspace.update((ws) => ({
      ...ws,
      blocks: { ...ws.blocks, [duplicate.id]: duplicate },
      nextZIndex: ws.nextZIndex + 1,
    }));

    return duplicate;
  }

  bringToFront(blockId: string): void {
    const next = this._workspace().nextZIndex;
    this.updateBlock(blockId, { zIndex: next });
    this._workspace.update((ws) => ({
      ...ws,
      nextZIndex: next + 1,
    }));
  }

  // Connection CRUD

  addConnection(
    sourceBlockId: string,
    sourcePointId: string,
    targetBlockId: string,
    targetPointId: string
  ): Connection {
    const connection: Connection = {
      id: crypto.randomUUID(),
      sourceBlockId,
      sourcePointId,
      targetBlockId,
      targetPointId,
      curveType: 'bezier',
      color: '#6366f1',
      strokeWidth: 2,
    };
    this._workspace.update((ws) => ({
      ...ws,
      connections: { ...ws.connections, [connection.id]: connection },
    }));
    return connection;
  }

  deleteConnection(connectionId: string): void {
    this._workspace.update((ws) => {
      const { [connectionId]: _, ...remaining } = ws.connections;
      return { ...ws, connections: remaining };
    });
  }

  // Selection

  selectBlock(blockId: string, addToSelection: boolean): void {
    if (addToSelection) {
      this._selectedBlockIds.update((ids) => new Set([...ids, blockId]));
    } else {
      this._selectedBlockIds.set(new Set([blockId]));
    }
  }

  selectBlocksInRect(rect: Rect): void {
    const ids = Object.values(this.blocks())
      .filter(
        (b) =>
          b.position.x + b.size.width > rect.x &&
          b.position.x < rect.x + rect.width &&
          b.position.y + b.size.height > rect.y &&
          b.position.y < rect.y + rect.height
      )
      .map((b) => b.id);
    this._selectedBlockIds.set(new Set(ids));
  }

  clearSelection(): void {
    this._selectedBlockIds.set(new Set());
  }

  selectAll(): void {
    this._selectedBlockIds.set(new Set(Object.keys(this.blocks())));
  }

  // Viewport

  updateViewport(viewport: Partial<ViewportState>): void {
    this._workspace.update((ws) => ({
      ...ws,
      viewport: { ...ws.viewport, ...viewport },
    }));
  }

  // Restore full workspace (from localStorage)

  restore(workspace: Workspace): void {
    this._workspace.set(workspace);
    this._selectedBlockIds.set(new Set());
  }
}
