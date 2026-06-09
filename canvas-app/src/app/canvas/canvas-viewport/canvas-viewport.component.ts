import {
  Component,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  inject,
  computed,
  signal,
  effect,
  Injector,
} from '@angular/core';
import {
  BlockOverlayComponent,
  BlockDragEvent,
} from '../block-overlay/block-overlay.component';
import {
  Viewport,
  CanvasRenderer,
  InputHandler,
  InputCallbacks,
} from '@ngeenx/canvas-engine';
import { WorkspaceStateService, HistoryService } from '@ngeenx/state';
import {
  Vector2,
  Rect,
  Block,
  createDefaultBlock,
} from '@ngeenx/shared-models';
import { ThemeService } from '../../services/theme.service';
import {
  ContextMenuComponent,
  ContextMenuItem,
} from '../context-menu/context-menu.component';

@Component({
  selector: 'cw-canvas-viewport',
  standalone: true,
  imports: [BlockOverlayComponent, ContextMenuComponent],
  templateUrl: './canvas-viewport.component.html',
  styleUrls: ['./canvas-viewport.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CanvasViewportComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvasEl', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('containerEl', { static: true })
  containerRef!: ElementRef<HTMLDivElement>;

  private viewport = new Viewport();
  private renderer!: CanvasRenderer;
  private inputHandler!: InputHandler;
  private resizeObserver!: ResizeObserver;
  private injector = inject(Injector);

  protected workspaceState = inject(WorkspaceStateService);
  private historyService = inject(HistoryService);
  private themeService = inject(ThemeService);

  private dragStartBlockPos: Vector2 | null = null;
  private dragBlockId: string | null = null;
  private dragOffset: Vector2 = { x: 0, y: 0 };
  private dragChildOffsets: { id: string; offset: Vector2 }[] = [];
  private selectionStart: Vector2 | null = null;
  private selectionRect = signal<Rect | null>(null);

  private resizeBlockId: string | null = null;
  private resizeHandle: string | null = null;
  private resizeStartPos: Vector2 | null = null;
  private resizeStartBlock: {
    position: Vector2;
    size: { width: number; height: number };
  } | null = null;

  private connDragSourceBlockId: string | null = null;
  private connDragSourcePointId: string | null = null;

  readonly hoveredBlockId = signal<string | null>(null);
  readonly focusedBlockId = signal<string | null>(null);
  readonly contextMenuOpen = signal(false);
  readonly contextMenuPos = signal<Vector2>({ x: 0, y: 0 });
  readonly contextMenuItems = signal<ContextMenuItem[]>([]);

  readonly visibleBlocks = computed(() => {
    const allBlocks = this.workspaceState.blocks();
    const vp = this.workspaceState.viewportState();
    const zoom = vp.zoom;
    const vpWidth = (this.viewport.canvasSize.width || window.innerWidth) / zoom;
    const vpHeight = (this.viewport.canvasSize.height || window.innerHeight) / zoom;
    const vpX = -vp.offset.x / zoom;
    const vpY = -vp.offset.y / zoom;

    const visible = Object.values(allBlocks).filter((block) => {
      return !(
        block.position.x + block.size.width < vpX ||
        block.position.x > vpX + vpWidth ||
        block.position.y + block.size.height < vpY ||
        block.position.y > vpY + vpHeight
      );
    });
    return visible.sort((a, b) => {
      const aFrame = a.type === 'frame' ? 0 : 1;
      const bFrame = b.type === 'frame' ? 0 : 1;
      if (aFrame !== bFrame) return aFrame - bFrame;
      return a.zIndex - b.zIndex;
    });
  });

  readonly overlayTransform = computed(() => {
    const vp = this.workspaceState.viewportState();
    return `translate(${vp.offset.x}px, ${vp.offset.y}px) scale(${vp.zoom})`;
  });

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    const container = this.containerRef.nativeElement;

    this.setupCanvasSize(canvas, container);
    this.renderer = new CanvasRenderer(canvas, this.viewport);

    const callbacks = this.createCallbacks();
    this.inputHandler = new InputHandler(
      container,
      this.viewport,
      callbacks,
      (worldPos) => this.hitTest(worldPos),
      (screenPos) => this.hitTestResizeHandle(screenPos),
      (worldPos) => this.hitTestConnectionPoint(worldPos)
    );

    this.renderer.start();

    effect(
      () => {
        const blocks = this.workspaceState.blocks();
        const connections = this.workspaceState.connectionList();
        this.renderer.setBlocks(blocks);
        this.renderer.setConnections(connections);
      },
      { injector: this.injector }
    );

    effect(
      () => {
        const rect = this.selectionRect();
        this.renderer.setSelectionRect(rect);
      },
      { injector: this.injector }
    );

    effect(
      () => {
        this.themeService.theme();
        this.renderer.markDirty();
      },
      { injector: this.injector }
    );

    this.viewport.onChanged = () => {
      const serialized = this.viewport.serialize();
      this.workspaceState.updateViewport(serialized);
      this.renderer.markDirty();
    };

    const savedViewport = this.workspaceState.viewportState();
    this.viewport.restore(savedViewport);
  }

  private setupCanvasSize(
    canvas: HTMLCanvasElement,
    container: HTMLElement
  ): void {
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const dpr = devicePixelRatio;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        const ctx = canvas.getContext('2d')!;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.viewport.setCanvasSize({ width, height });
        this.renderer?.markDirty();
      }
    });
    this.resizeObserver.observe(container);
  }

  private createCallbacks(): InputCallbacks {
    return {
      onPan: (delta) => {
        this.viewport.pan(delta);
      },
      onZoom: (focalPoint, delta) => {
        this.viewport.zoomAt(focalPoint, delta);
      },
      onHover: (blockId) => {
        this.hoveredBlockId.set(blockId);
      },
      onBlockDragStart: () => {},
      onBlockDragMove: () => {},
      onBlockDragEnd: () => {},
      onSelectionStart: (worldPos) => {
        this.selectionStart = worldPos;
        this.selectionRect.set({
          x: worldPos.x,
          y: worldPos.y,
          width: 0,
          height: 0,
        });
      },
      onSelectionMove: (worldPos) => {
        if (!this.selectionStart) return;
        const rect: Rect = {
          x: Math.min(this.selectionStart.x, worldPos.x),
          y: Math.min(this.selectionStart.y, worldPos.y),
          width: Math.abs(worldPos.x - this.selectionStart.x),
          height: Math.abs(worldPos.y - this.selectionStart.y),
        };
        this.selectionRect.set(rect);
        this.workspaceState.selectBlocksInRect(rect);
      },
      onSelectionEnd: () => {
        this.selectionStart = null;
        this.selectionRect.set(null);
      },
      onBlockClick: () => {},
      onCanvasClick: () => {
        this.workspaceState.clearSelection();
        this.focusedBlockId.set(null);
      },
      onResizeStart: (blockId, handle, worldPos) => {
        this.historyService.pushSnapshot();
        const block = this.workspaceState.blocks()[blockId];
        if (!block) return;
        this.resizeBlockId = blockId;
        this.resizeHandle = handle;
        this.resizeStartPos = worldPos;
        this.resizeStartBlock = {
          position: { ...block.position },
          size: { ...block.size },
        };
      },
      onResizeMove: (worldPos) => {
        if (
          !this.resizeBlockId ||
          !this.resizeStartPos ||
          !this.resizeStartBlock ||
          !this.resizeHandle
        )
          return;
        const dx = worldPos.x - this.resizeStartPos.x;
        const dy = worldPos.y - this.resizeStartPos.y;
        const minSize = 100;

        let { x, y } = this.resizeStartBlock.position;
        let { width, height } = this.resizeStartBlock.size;

        if (this.resizeHandle.includes('e')) {
          width = Math.max(minSize, width + dx);
        }
        if (this.resizeHandle.includes('s')) {
          height = Math.max(minSize, height + dy);
        }
        if (this.resizeHandle.includes('w')) {
          const newWidth = Math.max(minSize, width - dx);
          x = x + width - newWidth;
          width = newWidth;
        }
        if (this.resizeHandle.includes('n')) {
          const newHeight = Math.max(minSize, height - dy);
          y = y + height - newHeight;
          height = newHeight;
        }

        this.workspaceState.moveBlock(this.resizeBlockId, { x, y });
        this.workspaceState.resizeBlock(this.resizeBlockId, { width, height });
      },
      onResizeEnd: () => {
        this.resizeBlockId = null;
        this.resizeHandle = null;
        this.resizeStartPos = null;
        this.resizeStartBlock = null;
      },
      onConnectionDragStart: (blockId, pointId) => {
        this.connDragSourceBlockId = blockId;
        this.connDragSourcePointId = pointId;
        const block = this.workspaceState.blocks()[blockId];
        if (block) {
          const start =
            this.renderer.connectionRendererInstance.getConnectionPointWorld(
              block,
              pointId
            );
          const point = block.connectionPoints.find(
            (p) => p.id === pointId
          );
          this.renderer.setConnectionPreview({
            start,
            end: start,
            startSide: point?.side ?? 'right',
          });
        }
      },
      onConnectionDragMove: (worldPos) => {
        if (!this.connDragSourceBlockId) return;
        const block =
          this.workspaceState.blocks()[this.connDragSourceBlockId];
        if (block && this.connDragSourcePointId) {
          const start =
            this.renderer.connectionRendererInstance.getConnectionPointWorld(
              block,
              this.connDragSourcePointId
            );
          const point = block.connectionPoints.find(
            (p) => p.id === this.connDragSourcePointId
          );
          this.renderer.setConnectionPreview({
            start,
            end: worldPos,
            startSide: point?.side ?? 'right',
          });
        }
      },
      onConnectionDragEnd: (targetBlockId, targetPointId) => {
        if (
          this.connDragSourceBlockId &&
          this.connDragSourcePointId &&
          targetBlockId &&
          targetPointId &&
          targetBlockId !== this.connDragSourceBlockId
        ) {
          this.historyService.pushSnapshot();
          this.workspaceState.addConnection(
            this.connDragSourceBlockId,
            this.connDragSourcePointId,
            targetBlockId,
            targetPointId
          );
        }
        this.renderer.setConnectionPreview(null);
        this.connDragSourceBlockId = null;
        this.connDragSourcePointId = null;
      },
    };
  }

  private hitTest(worldPos: Vector2): string | null {
    const blocks = Object.values(this.workspaceState.blocks());
    const sorted = [...blocks].sort((a, b) => b.zIndex - a.zIndex);
    for (const block of sorted) {
      if (
        worldPos.x >= block.position.x &&
        worldPos.x <= block.position.x + block.size.width &&
        worldPos.y >= block.position.y &&
        worldPos.y <= block.position.y + block.size.height
      ) {
        return block.id;
      }
    }
    return null;
  }

  private hitTestResizeHandle(
    screenPos: Vector2
  ): { blockId: string; handle: string } | null {
    const selectedIds = this.workspaceState.selectedBlockIds();
    const blocks = this.workspaceState.blocks();
    const handleSize = 12;

    for (const id of selectedIds) {
      const block = blocks[id];
      if (!block) continue;

      const corners = [
        { handle: 'nw', x: block.position.x, y: block.position.y },
        {
          handle: 'ne',
          x: block.position.x + block.size.width,
          y: block.position.y,
        },
        {
          handle: 'sw',
          x: block.position.x,
          y: block.position.y + block.size.height,
        },
        {
          handle: 'se',
          x: block.position.x + block.size.width,
          y: block.position.y + block.size.height,
        },
      ];

      for (const corner of corners) {
        const screen = this.viewport.worldToScreen(corner);
        if (
          Math.abs(screenPos.x - screen.x) < handleSize &&
          Math.abs(screenPos.y - screen.y) < handleSize
        ) {
          return { blockId: id, handle: corner.handle };
        }
      }
    }
    return null;
  }

  private hitTestConnectionPoint(
    worldPos: Vector2
  ): { blockId: string; pointId: string } | null {
    const blocks = this.workspaceState.blocks();
    const hitRadius = 12 / this.viewport.zoom;

    for (const block of Object.values(blocks)) {
      for (const point of block.connectionPoints) {
        const pointPos = this.getConnectionPointWorld(block, point.id);
        const dx = worldPos.x - pointPos.x;
        const dy = worldPos.y - pointPos.y;
        if (Math.sqrt(dx * dx + dy * dy) < hitRadius) {
          return { blockId: block.id, pointId: point.id };
        }
      }
    }
    return null;
  }

  private getConnectionPointWorld(
    block: Block,
    pointId: string
  ): Vector2 {
    const point = block.connectionPoints.find((p) => p.id === pointId);
    if (!point) return block.position;

    switch (point.side) {
      case 'top':
        return {
          x: block.position.x + block.size.width * point.offset,
          y: block.position.y,
        };
      case 'bottom':
        return {
          x: block.position.x + block.size.width * point.offset,
          y: block.position.y + block.size.height,
        };
      case 'left':
        return {
          x: block.position.x,
          y: block.position.y + block.size.height * point.offset,
        };
      case 'right':
        return {
          x: block.position.x + block.size.width,
          y: block.position.y + block.size.height * point.offset,
        };
    }
  }

  // Block overlay drag handlers

  private screenToWorld(screenPos: Vector2): Vector2 {
    const container = this.containerRef.nativeElement;
    const rect = container.getBoundingClientRect();
    const localPos: Vector2 = {
      x: screenPos.x - rect.left,
      y: screenPos.y - rect.top,
    };
    return this.viewport.screenToWorld(localPos);
  }

  onOverlayDragStart(event: BlockDragEvent): void {
    this.historyService.pushSnapshot();
    const blocks = this.workspaceState.blocks();
    const block = blocks[event.blockId];
    if (!block) return;

    if (!this.workspaceState.selectedBlockIds().has(event.blockId)) {
      this.workspaceState.selectBlock(event.blockId, false);
    }
    this.workspaceState.bringToFront(event.blockId);

    const worldPos = this.screenToWorld(event.screenPos);
    this.dragBlockId = event.blockId;
    this.dragStartBlockPos = { ...block.position };
    this.dragOffset = {
      x: worldPos.x - block.position.x,
      y: worldPos.y - block.position.y,
    };

    this.dragChildOffsets = [];
    if (block.type === 'frame') {
      for (const child of Object.values(blocks)) {
        if (child.id === block.id || child.type === 'frame') continue;
        if (this.isInsideFrame(child, block)) {
          this.dragChildOffsets.push({
            id: child.id,
            offset: {
              x: child.position.x - block.position.x,
              y: child.position.y - block.position.y,
            },
          });
        }
      }
    }
  }

  onOverlayDragMove(screenPos: Vector2): void {
    if (!this.dragBlockId) return;
    const worldPos = this.screenToWorld(screenPos);
    const newPos: Vector2 = {
      x: worldPos.x - this.dragOffset.x,
      y: worldPos.y - this.dragOffset.y,
    };
    this.workspaceState.moveBlock(this.dragBlockId, newPos);

    for (const child of this.dragChildOffsets) {
      this.workspaceState.moveBlock(child.id, {
        x: newPos.x + child.offset.x,
        y: newPos.y + child.offset.y,
      });
    }
  }

  onOverlayDragEnd(): void {
    this.dragBlockId = null;
    this.dragStartBlockPos = null;
    this.dragChildOffsets = [];
  }

  private isInsideFrame(child: Block, frame: Block): boolean {
    return (
      child.position.x >= frame.position.x &&
      child.position.y >= frame.position.y &&
      child.position.x + child.size.width <=
        frame.position.x + frame.size.width &&
      child.position.y + child.size.height <=
        frame.position.y + frame.size.height
    );
  }

  onOverlaySelect(event: { blockId: string; shiftKey: boolean }): void {
    this.focusedBlockId.set(null);
    this.workspaceState.selectBlock(event.blockId, event.shiftKey);
    this.workspaceState.bringToFront(event.blockId);
  }

  onOverlayFocus(blockId: string): void {
    this.focusedBlockId.set(blockId);
    if (!this.workspaceState.selectedBlockIds().has(blockId)) {
      this.workspaceState.selectBlock(blockId, false);
    }
  }

  onContextMenu(e: MouseEvent): void {
    e.preventDefault();
    const selectedIds = this.workspaceState.selectedBlockIds();
    if (selectedIds.size === 0) return;

    const items: ContextMenuItem[] = [];
    if (selectedIds.size >= 1) {
      items.push({
        id: 'group-frame',
        label: 'Group into Frame',
      });
    }
    items.push({ id: 'divider-1', label: '', divider: true });
    items.push({ id: 'duplicate', label: 'Duplicate' });
    items.push({
      id: 'delete',
      label: 'Delete',
      danger: true,
    });

    this.contextMenuItems.set(items);
    this.contextMenuPos.set({ x: e.clientX, y: e.clientY });
    this.contextMenuOpen.set(true);
  }

  readonly confirmDialogOpen = signal(false);
  readonly confirmDialogMessage = signal('');
  private confirmDialogCallback: (() => void) | null = null;

  onContextMenuAction(actionId: string): void {
    this.contextMenuOpen.set(false);

    switch (actionId) {
      case 'group-frame':
        this.groupIntoFrame();
        break;
      case 'ungroup-frame':
        this.ungroupFrame();
        break;
      case 'delete-frame-with-children':
        this.confirmDeleteFrameWithChildren();
        break;
      case 'duplicate': {
        const ids = [...this.workspaceState.selectedBlockIds()];
        this.historyService.pushSnapshot();
        for (const id of ids) {
          this.workspaceState.duplicateBlock(id);
        }
        break;
      }
      case 'delete':
        this.historyService.pushSnapshot();
        this.workspaceState.deleteSelectedBlocks();
        break;
    }
    this.contextMenuTargetBlockId = null;
  }

  private ungroupFrame(): void {
    if (!this.contextMenuTargetBlockId) return;
    this.historyService.pushSnapshot();
    this.workspaceState.deleteBlock(this.contextMenuTargetBlockId);
  }

  private confirmDeleteFrameWithChildren(): void {
    if (!this.contextMenuTargetBlockId) return;
    const blocks = this.workspaceState.blocks();
    const frame = blocks[this.contextMenuTargetBlockId];
    if (!frame) return;

    const children = Object.values(blocks).filter(
      (b) => b.id !== frame.id && b.type !== 'frame' && this.isInsideFrame(b, frame)
    );

    this.confirmDialogMessage.set(
      `Are you sure you want to delete this frame and ${children.length} node${children.length !== 1 ? 's' : ''} inside it?`
    );
    this.confirmDialogCallback = () => {
      this.historyService.pushSnapshot();
      for (const child of children) {
        this.workspaceState.deleteBlock(child.id);
      }
      this.workspaceState.deleteBlock(frame.id);
    };
    this.confirmDialogOpen.set(true);
  }

  onConfirmDialogAccept(): void {
    this.confirmDialogOpen.set(false);
    this.confirmDialogCallback?.();
    this.confirmDialogCallback = null;
  }

  onConfirmDialogCancel(): void {
    this.confirmDialogOpen.set(false);
    this.confirmDialogCallback = null;
  }

  onContextMenuClose(): void {
    this.contextMenuOpen.set(false);
  }

  onBlockContextMenu(event: { blockId: string; x: number; y: number }): void {
    const blocks = this.workspaceState.blocks();
    const block = blocks[event.blockId];
    if (!block) return;

    const items: ContextMenuItem[] = [];

    if (block.type === 'frame') {
      items.push({ id: 'ungroup-frame', label: 'Ungroup Frame' });
      items.push({
        id: 'delete-frame-with-children',
        label: 'Delete Frame and Contents',
        danger: true,
      });
      items.push({ id: 'divider-1', label: '', divider: true });
    }

    const selectedIds = this.workspaceState.selectedBlockIds();
    if (selectedIds.size >= 2) {
      items.push({ id: 'group-frame', label: 'Group into Frame' });
      items.push({ id: 'divider-2', label: '', divider: true });
    }

    items.push({ id: 'duplicate', label: 'Duplicate' });
    items.push({ id: 'delete', label: 'Delete', danger: true });

    this.contextMenuItems.set(items);
    this.contextMenuPos.set({ x: event.x, y: event.y });
    this.contextMenuOpen.set(true);
    this.contextMenuTargetBlockId = event.blockId;
  }

  private contextMenuTargetBlockId: string | null = null;

  private groupIntoFrame(): void {
    const selectedIds = [...this.workspaceState.selectedBlockIds()];
    const blocks = this.workspaceState.blocks();
    const selectedBlocks = selectedIds
      .map((id) => blocks[id])
      .filter(Boolean);

    if (selectedBlocks.length === 0) return;

    this.historyService.pushSnapshot();

    const padding = 40;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const b of selectedBlocks) {
      minX = Math.min(minX, b.position.x);
      minY = Math.min(minY, b.position.y);
      maxX = Math.max(maxX, b.position.x + b.size.width);
      maxY = Math.max(maxY, b.position.y + b.size.height);
    }

    const framePos: Vector2 = {
      x: minX - padding,
      y: minY - padding - 30,
    };

    const frame = createDefaultBlock('frame', framePos, 0);
    frame.size = {
      width: maxX - minX + padding * 2,
      height: maxY - minY + padding * 2 + 30,
    };

    this.workspaceState.addBlockDirect(frame);
    this.workspaceState.clearSelection();
    this.workspaceState.selectBlock(frame.id, false);
  }

  ngOnDestroy(): void {
    this.renderer?.stop();
    this.inputHandler?.destroy();
    this.resizeObserver?.disconnect();
  }
}
