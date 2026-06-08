import {
  Component,
  ChangeDetectionStrategy,
  Input,
  computed,
  inject,
  Type,
} from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { Block } from '@ngeenx/shared-models';
import { WidgetRegistryService } from '@ngeenx/widgets';

@Component({
  selector: 'cw-block-host',
  standalone: true,
  imports: [NgComponentOutlet],
  template: `
    @if (widgetComponent()) {
      <ng-container
        [ngComponentOutlet]="widgetComponent()!"
        [ngComponentOutletInputs]="{ block: block }"
      />
    }
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
        overflow: hidden;
        border-radius: var(--radius-md);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlockHostComponent {
  @Input({ required: true }) block!: Block;

  private widgetRegistry = inject(WidgetRegistryService);

  readonly widgetComponent = computed(() => {
    return this.widgetRegistry.getComponent(this.block.type);
  });
}
