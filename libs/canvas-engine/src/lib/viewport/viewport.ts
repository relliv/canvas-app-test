import { Vector2, Size, Rect, ViewportState } from '@ngeenx/shared-models';

const ZOOM_LERP = 0.15;
const ZOOM_SNAP_THRESHOLD = 0.001;
const FLING_FRICTION = 0.92;
const FLING_STOP_THRESHOLD = 0.5;

export class Viewport {
  private _offset: Vector2 = { x: 0, y: 0 };
  private _zoom = 1;
  private _minZoom = 0.1;
  private _maxZoom = 5;
  private _canvasSize: Size = { width: 0, height: 0 };

  private _targetZoom = 1;
  private _targetOffset: Vector2 = { x: 0, y: 0 };
  private _zoomFocal: Vector2 = { x: 0, y: 0 };
  private _animating = false;
  private _animFrameId = 0;
  private _flingVelocity: Vector2 = { x: 0, y: 0 };
  private _flinging = false;
  private _flingFrameId = 0;

  onChanged: (() => void) | null = null;

  get offset(): Vector2 {
    return this._offset;
  }

  get zoom(): number {
    return this._zoom;
  }

  get canvasSize(): Size {
    return this._canvasSize;
  }

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

  pan(delta: Vector2): void {
    this.stopFling();
    this._offset.x += delta.x;
    this._offset.y += delta.y;
    this._targetOffset = { ...this._offset };
    this.onChanged?.();
  }

  fling(velocity: Vector2): void {
    this._flingVelocity = { ...velocity };
    if (!this._flinging) {
      this._flinging = true;
      this._flingFrameId = requestAnimationFrame(() => this.animateFling());
    }
  }

  private stopFling(): void {
    this._flinging = false;
    cancelAnimationFrame(this._flingFrameId);
    this._flingVelocity = { x: 0, y: 0 };
  }

  private animateFling(): void {
    this._offset.x += this._flingVelocity.x;
    this._offset.y += this._flingVelocity.y;
    this._targetOffset = { ...this._offset };

    this._flingVelocity.x *= FLING_FRICTION;
    this._flingVelocity.y *= FLING_FRICTION;

    this.onChanged?.();

    if (
      Math.abs(this._flingVelocity.x) < FLING_STOP_THRESHOLD &&
      Math.abs(this._flingVelocity.y) < FLING_STOP_THRESHOLD
    ) {
      this._flinging = false;
      return;
    }

    this._flingFrameId = requestAnimationFrame(() => this.animateFling());
  }

  zoomAt(focalScreenPoint: Vector2, zoomDelta: number): void {
    this._zoomFocal = focalScreenPoint;
    this._targetZoom = Math.max(
      this._minZoom,
      Math.min(this._maxZoom, this._targetZoom * (1 + zoomDelta))
    );

    if (!this._animating) {
      this._animating = true;
      this._animFrameId = requestAnimationFrame(() => this.animateZoom());
    }
  }

  private animateZoom(): void {
    const prevZoom = this._zoom;
    const diff = this._targetZoom - this._zoom;

    if (Math.abs(diff) < ZOOM_SNAP_THRESHOLD) {
      this._zoom = this._targetZoom;
      this._animating = false;
    } else {
      this._zoom += diff * ZOOM_LERP;
    }

    const worldFocal = {
      x: (this._zoomFocal.x - this._offset.x) / prevZoom,
      y: (this._zoomFocal.y - this._offset.y) / prevZoom,
    };
    this._offset.x = this._zoomFocal.x - worldFocal.x * this._zoom;
    this._offset.y = this._zoomFocal.y - worldFocal.y * this._zoom;
    this._targetOffset = { ...this._offset };

    this.onChanged?.();

    if (this._animating) {
      this._animFrameId = requestAnimationFrame(() => this.animateZoom());
    }
  }

  setZoom(zoom: number): void {
    const center: Vector2 = {
      x: this._canvasSize.width / 2,
      y: this._canvasSize.height / 2,
    };
    this._zoomFocal = center;
    this._targetZoom = Math.max(this._minZoom, Math.min(this._maxZoom, zoom));

    if (!this._animating) {
      this._animating = true;
      this._animFrameId = requestAnimationFrame(() => this.animateZoom());
    }
  }

  resetView(): void {
    this._zoomFocal = {
      x: this._canvasSize.width / 2,
      y: this._canvasSize.height / 2,
    };
    this._targetZoom = 1;
    this._targetOffset = { x: 0, y: 0 };

    if (!this._animating) {
      this._animating = true;
      this._animFrameId = requestAnimationFrame(() => this.animateReset());
    }
  }

  private animateReset(): void {
    const zoomDiff = this._targetZoom - this._zoom;
    const oxDiff = this._targetOffset.x - this._offset.x;
    const oyDiff = this._targetOffset.y - this._offset.y;

    if (
      Math.abs(zoomDiff) < ZOOM_SNAP_THRESHOLD &&
      Math.abs(oxDiff) < 0.5 &&
      Math.abs(oyDiff) < 0.5
    ) {
      this._zoom = this._targetZoom;
      this._offset = { ...this._targetOffset };
      this._animating = false;
    } else {
      this._zoom += zoomDiff * ZOOM_LERP;
      this._offset.x += oxDiff * ZOOM_LERP;
      this._offset.y += oyDiff * ZOOM_LERP;
    }

    this.onChanged?.();

    if (this._animating) {
      this._animFrameId = requestAnimationFrame(() => this.animateReset());
    }
  }

  stopAnimation(): void {
    this._animating = false;
    cancelAnimationFrame(this._animFrameId);
    this._targetZoom = this._zoom;
    this._targetOffset = { ...this._offset };
    this.stopFling();
  }

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
    this._targetZoom = state.zoom;
    this._targetOffset = { ...state.offset };
    this._minZoom = state.minZoom;
    this._maxZoom = state.maxZoom;
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
