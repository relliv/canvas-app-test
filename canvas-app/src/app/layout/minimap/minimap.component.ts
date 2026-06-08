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
  private animFrameId = 0;

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
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animFrameId);
  }
}
