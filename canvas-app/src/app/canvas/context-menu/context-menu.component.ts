import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  danger?: boolean;
  disabled?: boolean;
  divider?: boolean;
}

@Component({
  selector: 'cw-context-menu',
  standalone: true,
  templateUrl: './context-menu.component.html',
  styleUrls: ['./context-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContextMenuComponent {
  @Input() items: ContextMenuItem[] = [];
  @Input() x = 0;
  @Input() y = 0;

  @Output() action = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();

  onItemClick(item: ContextMenuItem): void {
    if (item.disabled) return;
    this.action.emit(item.id);
  }

  onBackdropClick(): void {
    this.close.emit();
  }

  onBackdropPointerDown(e: PointerEvent): void {
    e.stopPropagation();
    e.preventDefault();
  }
}
