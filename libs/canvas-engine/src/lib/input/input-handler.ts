import { Vector2 } from '@ngeenx/shared-models';
import { Viewport } from '../viewport/viewport';

export type InputMode =
  | 'idle'
  | 'panning'
  | 'selecting'
  | 'dragging-block'
  | 'resizing-block'
  | 'connecting';

export interface InputCallbacks {
  onPan(delta: Vector2): void;
  onZoom(focalPoint: Vector2, delta: number): void;
  onBlockDragStart(blockId: string, worldPos: Vector2): void;
  onBlockDragMove(worldPos: Vector2): void;
  onBlockDragEnd(): void;
  onSelectionStart(worldPos: Vector2): void;
  onSelectionMove(worldPos: Vector2): void;
  onSelectionEnd(): void;
  onBlockClick(blockId: string, shiftKey: boolean): void;
  onCanvasClick(worldPos: Vector2): void;
  onResizeStart(blockId: string, handle: string, worldPos: Vector2): void;
  onResizeMove(worldPos: Vector2): void;
  onResizeEnd(): void;
  onConnectionDragStart(blockId: string, pointId: string): void;
  onConnectionDragMove(worldPos: Vector2): void;
  onConnectionDragEnd(
    targetBlockId: string | null,
    targetPointId: string | null
  ): void;
  onHover(blockId: string | null): void;
}

export class InputHandler {
  private mode: InputMode = 'idle';
  private isPanKeyHeld = false;
  private lastMousePos: Vector2 = { x: 0, y: 0 };
  private dragStartPos: Vector2 = { x: 0, y: 0 };
  private hasDragged = false;
  private containerRect: DOMRect | null = null;

  constructor(
    private container: HTMLElement,
    private viewport: Viewport,
    private callbacks: InputCallbacks,
    private hitTest: (worldPos: Vector2) => string | null,
    private hitTestResizeHandle: (
      screenPos: Vector2
    ) => { blockId: string; handle: string } | null,
    private hitTestConnectionPoint: (
      worldPos: Vector2
    ) => { blockId: string; pointId: string } | null
  ) {
    this.bindEvents();
  }

  private getLocalPos(e: PointerEvent | WheelEvent): Vector2 {
    if (!this.containerRect) {
      this.containerRect = this.container.getBoundingClientRect();
    }
    return {
      x: e.clientX - this.containerRect.left,
      y: e.clientY - this.containerRect.top,
    };
  }

  private invalidateRect(): void {
    this.containerRect = null;
  }

  private bindEvents(): void {
    this.container.addEventListener('pointerdown', this.onPointerDown);
    this.container.addEventListener('pointermove', this.onPointerMove);
    this.container.addEventListener('pointerup', this.onPointerUp);
    this.container.addEventListener('wheel', this.onWheel, { passive: false });
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('resize', this.onResize);
  }

  private onResize = (): void => {
    this.invalidateRect();
  };

  private onPointerDown = (e: PointerEvent): void => {
    this.invalidateRect();
    const screenPos = this.getLocalPos(e);
    const worldPos = this.viewport.screenToWorld(screenPos);
    this.lastMousePos = screenPos;
    this.dragStartPos = worldPos;
    this.hasDragged = false;

    if (e.button === 1 || (e.button === 0 && this.isPanKeyHeld)) {
      this.mode = 'panning';
      this.container.setPointerCapture(e.pointerId);
      this.container.style.cursor = 'grabbing';
      return;
    }

    if (e.button === 0) {
      const connPoint = this.hitTestConnectionPoint(worldPos);
      if (connPoint) {
        this.mode = 'connecting';
        this.container.setPointerCapture(e.pointerId);
        this.callbacks.onConnectionDragStart(
          connPoint.blockId,
          connPoint.pointId
        );
        return;
      }

      const resizeHandle = this.hitTestResizeHandle(screenPos);
      if (resizeHandle) {
        this.mode = 'resizing-block';
        this.container.setPointerCapture(e.pointerId);
        this.callbacks.onResizeStart(
          resizeHandle.blockId,
          resizeHandle.handle,
          worldPos
        );
        return;
      }

      const hitBlockId = this.hitTest(worldPos);
      if (hitBlockId) {
        this.mode = 'dragging-block';
        this.container.setPointerCapture(e.pointerId);
        this.callbacks.onBlockDragStart(hitBlockId, worldPos);
      } else {
        this.mode = 'selecting';
        this.container.setPointerCapture(e.pointerId);
        this.callbacks.onSelectionStart(worldPos);
      }
    }
  };

  private onPointerMove = (e: PointerEvent): void => {
    const screenPos = this.getLocalPos(e);
    const worldPos = this.viewport.screenToWorld(screenPos);

    switch (this.mode) {
      case 'idle': {
        const hoveredId = this.hitTest(worldPos);
        this.callbacks.onHover(hoveredId);
        break;
      }
      case 'panning': {
        const delta: Vector2 = {
          x: screenPos.x - this.lastMousePos.x,
          y: screenPos.y - this.lastMousePos.y,
        };
        this.callbacks.onPan(delta);
        this.lastMousePos = screenPos;
        break;
      }
      case 'dragging-block':
        this.hasDragged = true;
        this.callbacks.onBlockDragMove(worldPos);
        break;
      case 'selecting':
        this.hasDragged = true;
        this.callbacks.onSelectionMove(worldPos);
        break;
      case 'resizing-block':
        this.hasDragged = true;
        this.callbacks.onResizeMove(worldPos);
        break;
      case 'connecting':
        this.hasDragged = true;
        this.callbacks.onConnectionDragMove(worldPos);
        break;
    }
  };

  private onPointerUp = (e: PointerEvent): void => {
    const screenPos = this.getLocalPos(e);
    const worldPos = this.viewport.screenToWorld(screenPos);

    switch (this.mode) {
      case 'panning':
        this.container.style.cursor = this.isPanKeyHeld ? 'grab' : 'default';
        break;
      case 'dragging-block':
        if (!this.hasDragged) {
          const hitBlockId = this.hitTest(this.dragStartPos);
          if (hitBlockId) {
            this.callbacks.onBlockClick(hitBlockId, e.shiftKey);
          }
        }
        this.callbacks.onBlockDragEnd();
        break;
      case 'selecting':
        if (!this.hasDragged) {
          this.callbacks.onCanvasClick(worldPos);
        }
        this.callbacks.onSelectionEnd();
        break;
      case 'resizing-block':
        this.callbacks.onResizeEnd();
        break;
      case 'connecting': {
        const target = this.hitTestConnectionPoint(worldPos);
        this.callbacks.onConnectionDragEnd(
          target?.blockId ?? null,
          target?.pointId ?? null
        );
        break;
      }
    }

    this.mode = 'idle';
    this.container.releasePointerCapture(e.pointerId);
  };

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    const focalPoint = this.getLocalPos(e);
    const zoomDelta = -e.deltaY * 0.001;
    this.callbacks.onZoom(focalPoint, zoomDelta);
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.code === 'Space' && !e.repeat) {
      this.isPanKeyHeld = true;
      this.container.style.cursor = 'grab';
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    if (e.code === 'Space') {
      this.isPanKeyHeld = false;
      if (this.mode !== 'panning') {
        this.container.style.cursor = 'default';
      }
    }
  };

  destroy(): void {
    this.container.removeEventListener('pointerdown', this.onPointerDown);
    this.container.removeEventListener('pointermove', this.onPointerMove);
    this.container.removeEventListener('pointerup', this.onPointerUp);
    this.container.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('resize', this.onResize);
  }
}
