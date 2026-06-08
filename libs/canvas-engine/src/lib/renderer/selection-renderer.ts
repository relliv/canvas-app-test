import { Rect } from '@ngeenx/shared-models';
import { Viewport } from '../viewport/viewport';

export class SelectionRenderer {
  constructor(
    private ctx: CanvasRenderingContext2D,
    private viewport: Viewport
  ) {}

  render(selectionRect: Rect | null): void {
    if (!selectionRect) return;

    const topLeft = this.viewport.worldToScreen({
      x: selectionRect.x,
      y: selectionRect.y,
    });
    const bottomRight = this.viewport.worldToScreen({
      x: selectionRect.x + selectionRect.width,
      y: selectionRect.y + selectionRect.height,
    });

    const ctx = this.ctx;
    const w = bottomRight.x - topLeft.x;
    const h = bottomRight.y - topLeft.y;

    ctx.fillStyle = 'rgba(99, 102, 241, 0.08)';
    ctx.fillRect(topLeft.x, topLeft.y, w, h);

    ctx.strokeStyle = 'rgba(99, 102, 241, 0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(topLeft.x, topLeft.y, w, h);
    ctx.setLineDash([]);
  }
}
