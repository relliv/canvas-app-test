import { Injectable, Type } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class WidgetRegistryService {
  private registry = new Map<string, Type<unknown>>();

  register(type: string, component: Type<unknown>): void {
    this.registry.set(type, component);
  }

  getComponent(type: string): Type<unknown> | null {
    return this.registry.get(type) ?? null;
  }
}
