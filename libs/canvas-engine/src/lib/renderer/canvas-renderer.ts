import { Block, Connection, Rect } from '@ngeenx/shared-models';
import { Viewport } from '../viewport/viewport';
import { GridRenderer } from './grid-renderer';
import { ConnectionRenderer, ConnectionPreview } from './connection-renderer';
import { SelectionRenderer } from './selection-renderer';
import { WidgetCanvasRenderer } from './widget-canvas-renderer';

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private gridRenderer: GridRenderer;
  private connectionRenderer: ConnectionRenderer;
  private selectionRenderer: SelectionRenderer;
  private widgetCanvasRenderer: WidgetCanvasRenderer;
  private animFrameId = 0;
  private needsRedraw = true;
  private hasClockBlocks = false;

  private _blocks: Record<string, Block> = {};
  private _connections: Connection[] = [];
  private _selectionRect: Rect | null = null;
  private _connectionPreview: ConnectionPreview | null = null;

  constructor(
    private canvas: HTMLCanvasElement,
    private viewport: Viewport
  ) {
    this.ctx = canvas.getContext('2d')!;
    this.gridRenderer = new GridRenderer(this.ctx, this.viewport);
    this.connectionRenderer = new ConnectionRenderer(this.ctx, this.viewport);
    this.selectionRenderer = new SelectionRenderer(this.ctx, this.viewport);
    this.widgetCanvasRenderer = new WidgetCanvasRenderer(this.ctx, this.viewport);
  }

  get connectionRendererInstance(): ConnectionRenderer {
    return this.connectionRenderer;
  }

  start(): void {
    const loop = () => {
      if (this.needsRedraw || this.hasClockBlocks) {
        this.render();
        this.needsRedraw = false;
      }
      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  stop(): void {
    cancelAnimationFrame(this.animFrameId);
  }

  markDirty(): void {
    this.needsRedraw = true;
  }

  setBlocks(blocks: Record<string, Block>): void {
    this._blocks = blocks;
    this.hasClockBlocks = Object.values(blocks).some((b) => b.type === 'clock');
    this.markDirty();
  }

  setConnections(connections: Connection[]): void {
    this._connections = connections;
    this.markDirty();
  }

  setSelectionRect(rect: Rect | null): void {
    this._selectionRect = rect;
    this.markDirty();
  }

  setConnectionPreview(preview: ConnectionPreview | null): void {
    this._connectionPreview = preview;
    this.markDirty();
  }

  private render(): void {
    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);

    this.gridRenderer.render();
    this.widgetCanvasRenderer.render(this._blocks);
    this.connectionRenderer.render(this._connections, this._blocks);
    this.selectionRenderer.render(this._selectionRect);
    this.connectionRenderer.renderPreview(this._connectionPreview);
  }
}
