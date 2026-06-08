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
import { BlockOverlayComponent } from '../block-overlay/block-overlay.component';
import {
  Viewport,
  CanvasRenderer,
  InputHandler,
  InputCallbacks,
} from '@ngeenx/canvas-engine';
import { WorkspaceStateService, HistoryService } from '@ngeenx/state';
import { Vector2, Rect, Block } from '@ngeenx/shared-models';

@Component({
  selector: 'cw-canvas-viewport',
  standalone: true,
  imports: [BlockOverlayComponent],
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

  private dragStartBlockPos: Vector2 | null = null;
  private dragBlockId: string | null = null;
  private dragOffset: Vector2 = { x: 0, y: 0 };
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

  readonly visibleBlocks = computed(() => {
    const allBlocks = this.workspaceState.blocks();
    return Object.values(allBlocks).filter((block) =>
      this.viewport.isRectVisible({
        x: block.position.x,
        y: block.position.y,
        width: block.size.width,
        height: block.size.height,
      })
    );
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
      onBlockDragStart: (blockId, worldPos) => {
        this.historyService.pushSnapshot();
        const block = this.workspaceState.blocks()[blockId];
        if (!block) return;

        if (!this.workspaceState.selectedBlockIds().has(blockId)) {
          this.workspaceState.selectBlock(blockId, false);
        }
        this.workspaceState.bringToFront(blockId);

        this.dragBlockId = blockId;
        this.dragStartBlockPos = { ...block.position };
        this.dragOffset = {
          x: worldPos.x - block.position.x,
          y: worldPos.y - block.position.y,
        };
      },
      onBlockDragMove: (worldPos) => {
        if (!this.dragBlockId) return;
        const newPos: Vector2 = {
          x: worldPos.x - this.dragOffset.x,
          y: worldPos.y - this.dragOffset.y,
        };
        this.workspaceState.moveBlock(this.dragBlockId, newPos);
      },
      onBlockDragEnd: () => {
        this.dragBlockId = null;
        this.dragStartBlockPos = null;
      },
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
      onBlockClick: (blockId, shiftKey) => {
        this.workspaceState.selectBlock(blockId, shiftKey);
        this.workspaceState.bringToFront(blockId);
      },
      onCanvasClick: () => {
        this.workspaceState.clearSelection();
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

  ngOnDestroy(): void {
    this.renderer?.stop();
    this.inputHandler?.destroy();
    this.resizeObserver?.disconnect();
  }
}
