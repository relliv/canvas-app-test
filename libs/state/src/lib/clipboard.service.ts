import { Injectable, inject } from '@angular/core';
import { Block, Connection } from '@ngeenx/shared-models';
import { WorkspaceStateService } from './workspace-state.service';
import { HistoryService } from './history.service';

interface ClipboardData {
  blocks: Block[];
  connections: Connection[];
}

const PASTE_OFFSET = 40;

@Injectable({ providedIn: 'root' })
export class ClipboardService {
  private workspaceState = inject(WorkspaceStateService);
  private historyService = inject(HistoryService);
  private clipboard: ClipboardData | null = null;
  private pasteCount = 0;

  copy(): void {
    const selectedIds = this.workspaceState.selectedBlockIds();
    if (selectedIds.size === 0) return;

    const allBlocks = this.workspaceState.blocks();
    const allConnections = this.workspaceState.connections();

    const blocks = [...selectedIds]
      .map((id) => allBlocks[id])
      .filter(Boolean);

    const blockIdSet = new Set(blocks.map((b) => b.id));
    const connections = Object.values(allConnections).filter(
      (c) =>
        blockIdSet.has(c.sourceBlockId) && blockIdSet.has(c.targetBlockId)
    );

    this.clipboard = {
      blocks: structuredClone(blocks),
      connections: structuredClone(connections),
    };
    this.pasteCount = 0;
  }

  cut(): void {
    this.copy();
    this.historyService.pushSnapshot();
    this.workspaceState.deleteSelectedBlocks();
  }

  paste(): void {
    if (!this.clipboard || this.clipboard.blocks.length === 0) return;

    this.historyService.pushSnapshot();
    this.pasteCount++;
    const offset = PASTE_OFFSET * this.pasteCount;

    const oldToNewId = new Map<string, string>();
    const newBlockIds: string[] = [];

    for (const original of this.clipboard.blocks) {
      const newId = crypto.randomUUID();
      oldToNewId.set(original.id, newId);

      const newBlock: Block = {
        ...structuredClone(original),
        id: newId,
        position: {
          x: original.position.x + offset,
          y: original.position.y + offset,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      this.workspaceState.addBlockDirect(newBlock);
      newBlockIds.push(newId);
    }

    for (const original of this.clipboard.connections) {
      const newSourceId = oldToNewId.get(original.sourceBlockId);
      const newTargetId = oldToNewId.get(original.targetBlockId);
      if (newSourceId && newTargetId) {
        this.workspaceState.addConnection(
          newSourceId,
          original.sourcePointId,
          newTargetId,
          original.targetPointId
        );
      }
    }

    this.workspaceState.clearSelection();
    for (const id of newBlockIds) {
      this.workspaceState.selectBlock(id, true);
    }
  }

  get hasData(): boolean {
    return this.clipboard !== null && this.clipboard.blocks.length > 0;
  }
}
