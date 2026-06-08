export interface Vector2 {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ViewportState {
  offset: Vector2;
  zoom: number;
  minZoom: number;
  maxZoom: number;
}

export const DEFAULT_VIEWPORT_STATE: ViewportState = {
  offset: { x: 0, y: 0 },
  zoom: 1,
  minZoom: 0.1,
  maxZoom: 5,
};
