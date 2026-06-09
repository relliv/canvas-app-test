import { Component, ChangeDetectionStrategy, Input, inject, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { Block, DrawingConfig, DrawingStroke } from '@ngeenx/shared-models';
import { WorkspaceStateService } from '@ngeenx/state';

const COLORS = ['#e4e4e7', '#ef4444', '#22c55e', '#6366f1', '#f59e0b', '#06b6d4'];
const WIDTHS = [2, 4, 8];

@Component({
  selector: 'cw-drawing-widget',
  standalone: true,
  templateUrl: './drawing-widget.component.html',
  styleUrls: ['./drawing-widget.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawingWidgetComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) block!: Block;
  @ViewChild('drawCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  private ws = inject(WorkspaceStateService);

  readonly colors = COLORS;
  readonly widths = WIDTHS;
  activeColor = COLORS[0];
  activeWidth = WIDTHS[0];

  private ctx!: CanvasRenderingContext2D;
  private drawing = false;
  private currentPoints: { x: number; y: number }[] = [];
  private resizeObs!: ResizeObserver;

  get config(): DrawingConfig { return this.block.config as DrawingConfig; }

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.resizeObs = new ResizeObserver(() => {
      requestAnimationFrame(() => this.fitAndRedraw());
    });
    this.resizeObs.observe(canvas.parentElement!);
    requestAnimationFrame(() => this.fitAndRedraw());
  }

  private fitAndRedraw(): void {
    const canvas = this.canvasRef.nativeElement;
    const parent = canvas.parentElement!;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    this.redraw();
  }

  private redraw(): void {
    const ctx = this.ctx;
    const canvas = this.canvasRef.nativeElement;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const stroke of this.config.strokes) {
      if (stroke.points.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
  }

  private getCanvasPoint(e: PointerEvent): { x: number; y: number } {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  onPointerDown(e: PointerEvent): void {
    e.stopPropagation();
    this.drawing = true;
    this.currentPoints = [this.getCanvasPoint(e)];
    this.canvasRef.nativeElement.setPointerCapture(e.pointerId);
  }

  onPointerMove(e: PointerEvent): void {
    if (!this.drawing) return;
    const point = this.getCanvasPoint(e);
    this.currentPoints.push(point);

    const ctx = this.ctx;
    const pts = this.currentPoints;
    if (pts.length >= 2) {
      ctx.beginPath();
      ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
      ctx.lineTo(point.x, point.y);
      ctx.strokeStyle = this.activeColor;
      ctx.lineWidth = this.activeWidth;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  }

  onPointerUp(e: PointerEvent): void {
    if (!this.drawing) return;
    this.drawing = false;
    this.canvasRef.nativeElement.releasePointerCapture(e.pointerId);

    if (this.currentPoints.length >= 2) {
      const newStroke: DrawingStroke = {
        points: [...this.currentPoints],
        color: this.activeColor,
        width: this.activeWidth,
      };
      this.ws.updateBlock(this.block.id, {
        config: { ...this.config, strokes: [...this.config.strokes, newStroke] },
      });
    }
    this.currentPoints = [];
  }

  clear(): void {
    this.ws.updateBlock(this.block.id, { config: { ...this.config, strokes: [] } });
    requestAnimationFrame(() => this.fitAndRedraw());
  }

  setColor(c: string): void { this.activeColor = c; }
  setWidth(w: number): void { this.activeWidth = w; }

  ngOnDestroy(): void { this.resizeObs?.disconnect(); }
}
