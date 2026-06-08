import {
  Component,
  ChangeDetectionStrategy,
  Input,
} from '@angular/core';
import { NgStyle } from '@angular/common';
import { Block } from '@ngeenx/shared-models';
import { BlockHostComponent } from '../block-host/block-host.component';
import { BlockToolbarComponent } from '../block-toolbar/block-toolbar.component';

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
}
