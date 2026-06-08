import { Block, ConnectionPoint } from '@ngeenx/shared-models';
import { Connection, Vector2 } from '@ngeenx/shared-models';
import { Viewport } from '../viewport/viewport';

export interface ConnectionPreview {
  start: Vector2;
  end: Vector2;
  startSide: 'top' | 'right' | 'bottom' | 'left';
}

export class ConnectionRenderer {
  constructor(
    private ctx: CanvasRenderingContext2D,
    private viewport: Viewport
  ) {}

  render(connections: Connection[], blocks: Record<string, Block>): void {
    for (const conn of connections) {
      const source = blocks[conn.sourceBlockId];
      const target = blocks[conn.targetBlockId];
      if (!source || !target) continue;

      const startWorld = this.getConnectionPointWorld(source, conn.sourcePointId);
      const endWorld = this.getConnectionPointWorld(target, conn.targetPointId);

      const startScreen = this.viewport.worldToScreen(startWorld);
      const endScreen = this.viewport.worldToScreen(endWorld);

      const sourcePoint = source.connectionPoints.find(
        (p) => p.id === conn.sourcePointId
      );
      const targetPoint = target.connectionPoints.find(
        (p) => p.id === conn.targetPointId
      );

      this.drawBezierCurve(
        startScreen,
        endScreen,
        sourcePoint?.side ?? 'right',
        targetPoint?.side ?? 'left',
        conn.color || '#6366f1',
        (conn.strokeWidth || 2) * this.viewport.zoom
      );
    }
  }

  renderPreview(preview: ConnectionPreview | null): void {
    if (!preview) return;

    const startScreen = this.viewport.worldToScreen(preview.start);
    const endScreen = this.viewport.worldToScreen(preview.end);

    this.ctx.setLineDash([6, 4]);
    this.drawBezierCurve(
      startScreen,
      endScreen,
      preview.startSide,
      'left',
      '#818cf8',
      2 * this.viewport.zoom
    );
    this.ctx.setLineDash([]);
  }

  private drawBezierCurve(
    start: Vector2,
    end: Vector2,
    startSide: string,
    endSide: string,
    color: string,
    strokeWidth: number
  ): void {
    const ctx = this.ctx;
    const dist = Math.max(50, Math.abs(end.x - start.x) * 0.4);

    const cp1 = this.getControlPoint(start, startSide, dist);
    const cp2 = this.getControlPoint(end, endSide, dist);

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.stroke();

    this.drawArrowhead(end, cp2, color, strokeWidth);
  }

  private getControlPoint(
    point: Vector2,
    side: string,
    dist: number
  ): Vector2 {
    switch (side) {
      case 'right':
        return { x: point.x + dist, y: point.y };
      case 'left':
        return { x: point.x - dist, y: point.y };
      case 'top':
        return { x: point.x, y: point.y - dist };
      case 'bottom':
        return { x: point.x, y: point.y + dist };
      default:
        return { x: point.x + dist, y: point.y };
    }
  }

  private drawArrowhead(
    tip: Vector2,
    from: Vector2,
    color: string,
    strokeWidth: number
  ): void {
    const ctx = this.ctx;
    const angle = Math.atan2(tip.y - from.y, tip.x - from.x);
    const arrowLen = 10 + strokeWidth;

    ctx.beginPath();
    ctx.moveTo(tip.x, tip.y);
    ctx.lineTo(
      tip.x - arrowLen * Math.cos(angle - Math.PI / 6),
      tip.y - arrowLen * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(tip.x, tip.y);
    ctx.lineTo(
      tip.x - arrowLen * Math.cos(angle + Math.PI / 6),
      tip.y - arrowLen * Math.sin(angle + Math.PI / 6)
    );
    ctx.strokeStyle = color;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();
  }

  getConnectionPointWorld(block: Block, pointId: string): Vector2 {
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
}
