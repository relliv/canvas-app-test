import { Viewport } from './viewport';

let _instance: Viewport | null = null;

export function registerViewport(viewport: Viewport): void {
  _instance = viewport;
}

export function getViewport(): Viewport | null {
  return _instance;
}
