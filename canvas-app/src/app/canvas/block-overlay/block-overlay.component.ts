import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  inject,
} from '@angular/core';
import { NgStyle } from '@angular/common';
import { Block, Vector2 } from '@ngeenx/shared-models';
import { BlockHostComponent } from '../block-host/block-host.component';
import { BlockToolbarComponent } from '../block-toolbar/block-toolbar.component';
import { WorkspaceStateService, HistoryService } from '@ngeenx/state';

const DRAG_THRESHOLD_SQ = 16;
const MIN_SIZE = 100;

export interface BlockDragEvent {
  blockId: string;
  screenPos: Vector2;
}

@Component({
  selector: 'cw-block-overlay',
  standalone: true,
  imports: [NgStyle, BlockHostComponent, BlockToolbarComponent],
  templateUrl: './block-overlay.component.html',
  styleUrls: ['./block-overlay.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlockOverlayComponent {
  @Input({ required: true }) block!: Block;
  @Input() isSelected = false;
  @Input() isHovered = false;
  @Input() isFocused = false;
  @Input() canvasZoom = 1;

  @Output() blockDragStart = new EventEmitter<BlockDragEvent>();
  @Output() blockDragMove = new EventEmitter<Vector2>();
  @Output() blockDragEnd = new EventEmitter<void>();
  @Output() blockSelect = new EventEmitter<{
    blockId: string;
    shiftKey: boolean;
  }>();
  @Output() blockFocus = new EventEmitter<string>();
  @Output() blockContextMenu = new EventEmitter<{
    blockId: string;
    x: number;
    y: number;
  }>();

  @ViewChild('frameEl', { static: true })
  frameRef!: ElementRef<HTMLDivElement>;

  private workspaceState = inject(WorkspaceStateService);
  private historyService = inject(HistoryService);

  private dragging = false;
  private pending = false;
  private startX = 0;
  private startY = 0;

  private resizing = false;
  private resizeHandle = '';
  private resizeStartPos = { x: 0, y: 0 };
  private resizeStartBlock = { x: 0, y: 0, w: 0, h: 0 };

  private onDocMove = (e: PointerEvent) => this.handleMove(e);
  private onDocUp = (e: PointerEvent) => this.handleUp(e);
  private onResizeDocMove = (e: PointerEvent) => this.handleResizeMove(e);
  private onResizeDocUp = () => this.handleResizeUp();

  get showToolbar(): boolean {
    return this.isSelected || this.isHovered;
  }

  get showConnectionPoints(): boolean {
    return this.isHovered;
  }

  get blockStyles(): Record<string, string> {
    return {
      position: 'absolute',
      left: this.block.position.x + 'px',
      top: this.block.position.y + 'px',
      width: this.block.size.width + 'px',
      height: this.block.size.height + 'px',
      'z-index': String(this.block.zIndex),
    };
  }

  onFramePointerDown(e: PointerEvent): void {
    if (e.button !== 0) return;

    const target = e.target as HTMLElement;
    const isDragHandle = !!target.closest('[data-drag-handle]');

    if (this.isFocused && !isDragHandle) {
      e.stopPropagation();
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    this.startX = e.clientX;
    this.startY = e.clientY;
    this.pending = true;
    this.dragging = false;

    document.addEventListener('pointermove', this.onDocMove);
    document.addEventListener('pointerup', this.onDocUp);
  }

  onFrameDblClick(e: MouseEvent): void {
    e.stopPropagation();

    if (this.block.type === 'image') {
      const cfg = this.block.config as import('@ngeenx/shared-models').ImageConfig;
      const url = prompt('Enter image URL:', cfg.url || '');
      if (url !== null) {
        this.workspaceState.updateBlock(this.block.id, {
          config: { ...cfg, url },
        });
      }
      return;
    }

    if (this.block.type === 'clock') {
      const cfg = this.block.config as import('@ngeenx/shared-models').ClockConfig;
      const label = prompt('Clock label:', cfg.label || 'Clock');
      if (label !== null) {
        this.workspaceState.updateBlock(this.block.id, {
          config: { ...cfg, label },
        });
      }
      return;
    }

    if (!this.isFocused) {
      this.blockFocus.emit(this.block.id);
      this.focusContent();
    }
  }

  onFrameContextMenu(e: MouseEvent): void {
    e.preventDefault();
    e.stopPropagation();
    if (!this.workspaceState.selectedBlockIds().has(this.block.id)) {
      this.blockSelect.emit({ blockId: this.block.id, shiftKey: false });
    }
    this.blockContextMenu.emit({
      blockId: this.block.id,
      x: e.clientX,
      y: e.clientY,
    });
  }

  onResizePointerDown(e: PointerEvent, handle: string): void {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    this.historyService.pushSnapshot();
    this.resizing = true;
    this.resizeHandle = handle;
    this.resizeStartPos = { x: e.clientX, y: e.clientY };
    this.resizeStartBlock = {
      x: this.block.position.x,
      y: this.block.position.y,
      w: this.block.size.width,
      h: this.block.size.height,
    };

    document.addEventListener('pointermove', this.onResizeDocMove);
    document.addEventListener('pointerup', this.onResizeDocUp);
  }

  private handleResizeMove(e: PointerEvent): void {
    const zoom = this.canvasZoom || 1;
    const dx = (e.clientX - this.resizeStartPos.x) / zoom;
    const dy = (e.clientY - this.resizeStartPos.y) / zoom;

    let { x, y, w, h } = this.resizeStartBlock;

    if (this.resizeHandle.includes('e')) {
      w = Math.max(MIN_SIZE, w + dx);
    }
    if (this.resizeHandle.includes('w')) {
      const nw = Math.max(MIN_SIZE, w - dx);
      x = x + w - nw;
      w = nw;
    }
    if (this.resizeHandle.includes('s')) {
      h = Math.max(MIN_SIZE, h + dy);
    }
    if (this.resizeHandle.includes('n')) {
      const nh = Math.max(MIN_SIZE, h - dy);
      y = y + h - nh;
      h = nh;
    }

    this.workspaceState.moveBlock(this.block.id, { x, y });
    this.workspaceState.resizeBlock(this.block.id, {
      width: w,
      height: h,
    });
  }

  private handleResizeUp(): void {
    this.resizing = false;
    document.removeEventListener('pointermove', this.onResizeDocMove);
    document.removeEventListener('pointerup', this.onResizeDocUp);
  }

  private handleMove(e: PointerEvent): void {
    const dx = e.clientX - this.startX;
    const dy = e.clientY - this.startY;

    if (this.pending && dx * dx + dy * dy > DRAG_THRESHOLD_SQ) {
      this.pending = false;
      this.dragging = true;
      this.blockDragStart.emit({
        blockId: this.block.id,
        screenPos: { x: this.startX, y: this.startY },
      });
    }

    if (this.dragging) {
      this.blockDragMove.emit({ x: e.clientX, y: e.clientY });
    }
  }

  private handleUp(e: PointerEvent): void {
    document.removeEventListener('pointermove', this.onDocMove);
    document.removeEventListener('pointerup', this.onDocUp);

    if (this.dragging) {
      this.dragging = false;
      this.blockDragEnd.emit();
      return;
    }

    this.pending = false;

    if (e.shiftKey) {
      this.blockSelect.emit({
        blockId: this.block.id,
        shiftKey: true,
      });
    } else if (this.isSelected) {
      this.blockFocus.emit(this.block.id);
      this.focusContent();
    } else {
      this.blockSelect.emit({
        blockId: this.block.id,
        shiftKey: false,
      });
    }
  }

  private focusContent(): void {
    requestAnimationFrame(() => {
      const frame = this.frameRef.nativeElement;
      const focusable = frame.querySelector<HTMLElement>(
        '.tiptap, .xterm-helper-textarea, textarea, input:not([type="hidden"]), [contenteditable="true"]'
      );
      if (focusable) {
        focusable.focus();
      }
    });
  }
}
