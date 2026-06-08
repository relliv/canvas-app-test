import { Viewport } from '../viewport/viewport';

export class GridRenderer {
  private dotColor = 'rgba(255, 255, 255, 0.08)';
  private dotRadius = 1.5;
  private gridSpacing = 20;

  constructor(
    private ctx: CanvasRenderingContext2D,
    private viewport: Viewport
  ) {}

  render(): void {
    const visible = this.viewport.getVisibleRect();
    const zoom = this.viewport.zoom;
    const ctx = this.ctx;

    let step = this.gridSpacing;
    if (zoom < 0.3) step *= 8;
    else if (zoom < 0.5) step *= 4;
    else if (zoom < 0.8) step *= 2;

    const startX = Math.floor(visible.x / step) * step;
    const startY = Math.floor(visible.y / step) * step;
    const endX = visible.x + visible.width;
    const endY = visible.y + visible.height;

    ctx.fillStyle = this.dotColor;
    const radius = this.dotRadius * Math.min(zoom, 1);

    for (let wx = startX; wx <= endX; wx += step) {
      for (let wy = startY; wy <= endY; wy += step) {
        const screen = this.viewport.worldToScreen({ x: wx, y: wy });
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}
