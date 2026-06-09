import { Block, ViewportState, Rect } from '@ngeenx/shared-models';

export interface MinimapTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export class MinimapRenderer {
  private padding = 20;
  private lastTransform: MinimapTransform = { scale: 1, offsetX: 0, offsetY: 0 };
  private lastCanvasSize = { width: 0, height: 0 };
  private lastViewportState: ViewportState | null = null;

  get transform(): MinimapTransform {
    return this.lastTransform;
  }

  render(
    ctx: CanvasRenderingContext2D,
    blocks: Record<string, Block>,
    viewportState: ViewportState,
    canvasSize: { width: number; height: number }
  ): void {
    const { width, height } = ctx.canvas;
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = 'rgba(26, 26, 30, 0.9)';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(63, 63, 70, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, height);

    this.lastCanvasSize = canvasSize;
    this.lastViewportState = viewportState;

    const blockList = Object.values(blocks);
    if (blockList.length === 0) {
      this.lastTransform = { scale: 1, offsetX: 0, offsetY: 0 };
      return;
    }

    const bounds = this.calculateBounds(blockList, viewportState, canvasSize);
    const scale = this.calculateScale(bounds, width, height);
    const offsetX = (width - bounds.width * scale) / 2 - bounds.x * scale;
    const offsetY = (height - bounds.height * scale) / 2 - bounds.y * scale;

    this.lastTransform = { scale, offsetX, offsetY };

    for (const block of blockList) {
      const x = block.position.x * scale + offsetX;
      const y = block.position.y * scale + offsetY;
      const w = block.size.width * scale;
      const h = block.size.height * scale;

      ctx.fillStyle = this.getBlockColor(block.type);
      ctx.fillRect(x, y, Math.max(w, 3), Math.max(h, 3));
    }

    const vpX = (-viewportState.offset.x / viewportState.zoom) * scale + offsetX;
    const vpY = (-viewportState.offset.y / viewportState.zoom) * scale + offsetY;
    const vpW = (canvasSize.width / viewportState.zoom) * scale;
    const vpH = (canvasSize.height / viewportState.zoom) * scale;

    ctx.strokeStyle = 'rgba(99, 102, 241, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(vpX, vpY, vpW, vpH);
  }

  minimapToWorldCenter(
    minimapX: number,
    minimapY: number
  ): { x: number; y: number } | null {
    if (!this.lastViewportState) return null;
    const { scale, offsetX, offsetY } = this.lastTransform;
    if (scale === 0) return null;

    const worldX = (minimapX - offsetX) / scale;
    const worldY = (minimapY - offsetY) / scale;
    return { x: worldX, y: worldY };
  }

  private calculateBounds(
    blocks: Block[],
    viewportState: ViewportState,
    canvasSize: { width: number; height: number }
  ): Rect {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const block of blocks) {
      minX = Math.min(minX, block.position.x);
      minY = Math.min(minY, block.position.y);
      maxX = Math.max(maxX, block.position.x + block.size.width);
      maxY = Math.max(maxY, block.position.y + block.size.height);
    }

    const vpMinX = -viewportState.offset.x / viewportState.zoom;
    const vpMinY = -viewportState.offset.y / viewportState.zoom;
    const vpMaxX = vpMinX + canvasSize.width / viewportState.zoom;
    const vpMaxY = vpMinY + canvasSize.height / viewportState.zoom;

    minX = Math.min(minX, vpMinX) - this.padding;
    minY = Math.min(minY, vpMinY) - this.padding;
    maxX = Math.max(maxX, vpMaxX) + this.padding;
    maxY = Math.max(maxY, vpMaxY) + this.padding;

    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }

  private calculateScale(
    bounds: Rect,
    minimapWidth: number,
    minimapHeight: number
  ): number {
    const scaleX = (minimapWidth - this.padding * 2) / bounds.width;
    const scaleY = (minimapHeight - this.padding * 2) / bounds.height;
    return Math.min(scaleX, scaleY);
  }

  private getBlockColor(type: string): string {
    switch (type) {
      case 'pomodoro':
        return 'rgba(239, 68, 68, 0.6)';
      case 'text-editor':
        return 'rgba(99, 102, 241, 0.6)';
      case 'sticky-note':
        return 'rgba(250, 204, 21, 0.6)';
      case 'terminal':
        return 'rgba(34, 197, 94, 0.6)';
      case 'web-browser':
        return 'rgba(6, 182, 212, 0.6)';
      default:
        return 'rgba(161, 161, 170, 0.6)';
    }
  }
}
