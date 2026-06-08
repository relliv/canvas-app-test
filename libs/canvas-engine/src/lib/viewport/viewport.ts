import { Vector2, Size, Rect, ViewportState } from '@ngeenx/shared-models';

export class Viewport {
  private _offset: Vector2 = { x: 0, y: 0 };
  private _zoom = 1;
  private _minZoom = 0.1;
  private _maxZoom = 5;
  private _canvasSize: Size = { width: 0, height: 0 };

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
    this._offset.x += delta.x;
    this._offset.y += delta.y;
    this.onChanged?.();
  }

  zoomAt(focalScreenPoint: Vector2, zoomDelta: number): void {
    const worldBefore = this.screenToWorld(focalScreenPoint);
    this._zoom = Math.max(
      this._minZoom,
      Math.min(this._maxZoom, this._zoom * (1 + zoomDelta))
    );
    const screenAfter = this.worldToScreen(worldBefore);
    this._offset.x += focalScreenPoint.x - screenAfter.x;
    this._offset.y += focalScreenPoint.y - screenAfter.y;
    this.onChanged?.();
  }

  setZoom(zoom: number): void {
    const center: Vector2 = {
      x: this._canvasSize.width / 2,
      y: this._canvasSize.height / 2,
    };
    const worldCenter = this.screenToWorld(center);
    this._zoom = Math.max(this._minZoom, Math.min(this._maxZoom, zoom));
    const screenAfter = this.worldToScreen(worldCenter);
    this._offset.x += center.x - screenAfter.x;
    this._offset.y += center.y - screenAfter.y;
    this.onChanged?.();
  }

  resetView(): void {
    this._offset = { x: 0, y: 0 };
    this._zoom = 1;
    this.onChanged?.();
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
