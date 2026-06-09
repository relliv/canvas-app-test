import {
  Component,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  inject,
  effect,
  Injector,
} from '@angular/core';
import { MinimapRenderer } from '@ngeenx/canvas-engine';
import { WorkspaceStateService } from '@ngeenx/state';

@Component({
  selector: 'cw-minimap',
  standalone: true,
  templateUrl: './minimap.component.html',
  styleUrls: ['./minimap.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MinimapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('minimapCanvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  private workspaceState = inject(WorkspaceStateService);
  private injector = inject(Injector);
  private minimapRenderer = new MinimapRenderer();
  private isDragging = false;

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = 200;
    canvas.height = 150;

    effect(
      () => {
        const blocks = this.workspaceState.blocks();
        const viewport = this.workspaceState.viewportState();
        const ctx = canvas.getContext('2d')!;
        this.minimapRenderer.render(ctx, blocks, viewport, {
          width: window.innerWidth,
          height: window.innerHeight,
        });
      },
      { injector: this.injector }
    );

    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('pointerup', this.onPointerUp);
  }

  private navigateTo(e: PointerEvent): void {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const worldCenter = this.minimapRenderer.minimapToWorldCenter(mx, my);
    if (!worldCenter) return;

    const vp = this.workspaceState.viewportState();
    const newOffset = {
      x: -worldCenter.x * vp.zoom + window.innerWidth / 2,
      y: -worldCenter.y * vp.zoom + window.innerHeight / 2,
    };

    this.workspaceState.updateViewport({
      ...vp,
      offset: newOffset,
    });
  }

  private onPointerDown = (e: PointerEvent): void => {
    e.stopPropagation();
    this.isDragging = true;
    this.canvasRef.nativeElement.setPointerCapture(e.pointerId);
    this.navigateTo(e);
  };

  private onPointerMove = (e: PointerEvent): void => {
    if (!this.isDragging) return;
    this.navigateTo(e);
  };

  private onPointerUp = (e: PointerEvent): void => {
    this.isDragging = false;
    this.canvasRef.nativeElement.releasePointerCapture(e.pointerId);
  };

  ngOnDestroy(): void {
    const canvas = this.canvasRef.nativeElement;
    canvas.removeEventListener('pointerdown', this.onPointerDown);
    canvas.removeEventListener('pointermove', this.onPointerMove);
    canvas.removeEventListener('pointerup', this.onPointerUp);
  }
}
