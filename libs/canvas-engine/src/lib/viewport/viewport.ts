import { Vector2, Size, Rect, ViewportState } from '@ngeenx/shared-models';

const LERP = 0.15;
const OFFSET_SNAP = 0.5;
const ZOOM_SNAP = 0.001;
const FLING_FRICTION = 0.92;
const FLING_STOP = 0.5;

export class Viewport {
  private _offset: Vector2 = { x: 0, y: 0 };
  private _zoom = 1;
  private _minZoom = 0.1;
  private _maxZoom = 5;
  private _canvasSize: Size = { width: 0, height: 0 };

  private _targetOffset: Vector2 = { x: 0, y: 0 };
  private _targetZoom = 1;
  private _zoomFocal: Vector2 = { x: 0, y: 0 };
  private _useZoomFocal = false;
  private _velocity: Vector2 = { x: 0, y: 0 };

  private _running = false;
  private _frameId = 0;

  onChanged: (() => void) | null = null;

  get offset(): Vector2 { return this._offset; }
  get zoom(): number { return this._zoom; }
  get canvasSize(): Size { return this._canvasSize; }

  setCanvasSize(size: Size): void {
    this._canvasSize = size;
    this.onChanged?.();
  }

  screenToWorld(screenPos: Vector2): Vector2 {
    return {
      x: (screenPos.x - this._offset.x) / this._zoom,
      y: (screenPos.y - this._offset.y) / this._zoom,
    };
  }

  worldToScreen(worldPos: Vector2): Vector2 {
    return {
      x: worldPos.x * this._zoom + this._offset.x,
      y: worldPos.y * this._zoom + this._offset.y,
    };
  }

  // Immediate pan (mouse drag), no animation
  pan(delta: Vector2): void {
    this.stopAll();
    this._offset.x += delta.x;
    this._offset.y += delta.y;
    this.syncTarget();
    this.onChanged?.();
  }

  // Animated pan to a relative delta
  smoothPan(delta: Vector2): void {
    this._targetOffset.x += delta.x;
    this._targetOffset.y += delta.y;
    this._useZoomFocal = false;
    this.startLoop();
  }

  // Fling with initial velocity (after mouse release)
  fling(velocity: Vector2): void {
    this._velocity = { ...velocity };
    this.startLoop();
  }

  // Animated zoom toward a focal point
  zoomAt(focalScreenPoint: Vector2, zoomDelta: number): void {
    this._zoomFocal = focalScreenPoint;
    this._useZoomFocal = true;
    this._targetZoom = this.clampZoom(this._targetZoom * (1 + zoomDelta));
    this.startLoop();
  }

  // Animated zoom to absolute value (toolbar buttons)
  setZoom(zoom: number): void {
    this._zoomFocal = {
      x: this._canvasSize.width / 2,
      y: this._canvasSize.height / 2,
    };
    this._useZoomFocal = true;
    this._targetZoom = this.clampZoom(zoom);
    this.startLoop();
  }

  // Animated pan + zoom to target (shared method for any transition)
  animateTo(offset: Vector2, zoom?: number): void {
    this._targetOffset = { ...offset };
    if (zoom !== undefined) {
      this._targetZoom = this.clampZoom(zoom);
      this._zoomFocal = {
        x: this._canvasSize.width / 2,
        y: this._canvasSize.height / 2,
      };
      this._useZoomFocal = true;
    }
    this.startLoop();
  }

  // Reset to origin with animation
  resetView(): void {
    this.animateTo({ x: 0, y: 0 }, 1);
  }

  stopAll(): void {
    this._running = false;
    cancelAnimationFrame(this._frameId);
    this._velocity = { x: 0, y: 0 };
    this.syncTarget();
  }

  // --- animation loop ---

  private startLoop(): void {
    if (this._running) return;
    this._running = true;
    this._frameId = requestAnimationFrame(() => this.tick());
  }

  private tick(): void {
    let settled = true;

    // fling velocity
    if (Math.abs(this._velocity.x) > FLING_STOP || Math.abs(this._velocity.y) > FLING_STOP) {
      this._targetOffset.x += this._velocity.x;
      this._targetOffset.y += this._velocity.y;
      this._velocity.x *= FLING_FRICTION;
      this._velocity.y *= FLING_FRICTION;
      settled = false;
    } else {
      this._velocity.x = 0;
      this._velocity.y = 0;
    }

    // zoom lerp
    const zoomDiff = this._targetZoom - this._zoom;
    if (Math.abs(zoomDiff) > ZOOM_SNAP) {
      if (this._useZoomFocal) {
        const prevZoom = this._zoom;
        this._zoom += zoomDiff * LERP;
        const worldFocal = {
          x: (this._zoomFocal.x - this._offset.x) / prevZoom,
          y: (this._zoomFocal.y - this._offset.y) / prevZoom,
        };
        this._offset.x = this._zoomFocal.x - worldFocal.x * this._zoom;
        this._offset.y = this._zoomFocal.y - worldFocal.y * this._zoom;
        this._targetOffset = { ...this._offset };
      } else {
        this._zoom += zoomDiff * LERP;
      }
      settled = false;
    } else if (Math.abs(zoomDiff) > 0) {
      this._zoom = this._targetZoom;
    }

    // offset lerp
    const oxDiff = this._targetOffset.x - this._offset.x;
    const oyDiff = this._targetOffset.y - this._offset.y;
    if (Math.abs(oxDiff) > OFFSET_SNAP || Math.abs(oyDiff) > OFFSET_SNAP) {
      this._offset.x += oxDiff * LERP;
      this._offset.y += oyDiff * LERP;
      settled = false;
    } else if (Math.abs(oxDiff) > 0 || Math.abs(oyDiff) > 0) {
      this._offset = { ...this._targetOffset };
    }

    this.onChanged?.();

    if (settled) {
      this._running = false;
      this._useZoomFocal = false;
    } else {
      this._frameId = requestAnimationFrame(() => this.tick());
    }
  }

  private syncTarget(): void {
    this._targetOffset = { ...this._offset };
    this._targetZoom = this._zoom;
  }

  private clampZoom(z: number): number {
    return Math.max(this._minZoom, Math.min(this._maxZoom, z));
  }

  // --- queries ---

  getVisibleRect(): Rect {
    const topLeft = this.screenToWorld({ x: 0, y: 0 });
    const bottomRight = this.screenToWorld({
      x: this._canvasSize.width,
      y: this._canvasSize.height,
    });
    return {
      x: topLeft.x,
      y: topLeft.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y,
    };
  }

  isRectVisible(rect: Rect): boolean {
    const visible = this.getVisibleRect();
    return !(
      rect.x + rect.width < visible.x ||
      rect.x > visible.x + visible.width ||
      rect.y + rect.height < visible.y ||
      rect.y > visible.y + visible.height
    );
  }

  restore(state: ViewportState): void {
    this._offset = { ...state.offset };
    this._zoom = state.zoom;
    this._minZoom = state.minZoom;
    this._maxZoom = state.maxZoom;
    this.syncTarget();
    this.onChanged?.();
  }

  serialize(): ViewportState {
    return {
      offset: { ...this._offset },
      zoom: this._zoom,
      minZoom: this._minZoom,
      maxZoom: this._maxZoom,
    };
  }
}
