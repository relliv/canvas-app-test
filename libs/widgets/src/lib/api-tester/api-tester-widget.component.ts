import { Component, ChangeDetectionStrategy, Input, inject, signal } from '@angular/core';
import { Block, ApiTesterConfig } from '@ngeenx/shared-models';
import { WorkspaceStateService } from '@ngeenx/state';

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const;

@Component({
  selector: 'cw-api-tester-widget',
  standalone: true,
  templateUrl: './api-tester-widget.component.html',
  styleUrls: ['./api-tester-widget.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApiTesterWidgetComponent {
  @Input({ required: true }) block!: Block;
  private ws = inject(WorkspaceStateService);
  readonly methods = METHODS;
  readonly loading = signal(false);

  get config(): ApiTesterConfig { return this.block.config as ApiTesterConfig; }

  onMethodChange(e: Event): void {
    const method = (e.target as HTMLSelectElement).value as ApiTesterConfig['method'];
    this.update({ method });
  }

  onUrlChange(e: Event): void { this.update({ url: (e.target as HTMLInputElement).value }); }
  onHeadersChange(e: Event): void { this.update({ headers: (e.target as HTMLTextAreaElement).value }); }
  onBodyChange(e: Event): void { this.update({ body: (e.target as HTMLTextAreaElement).value }); }

  async sendRequest(): Promise<void> {
    const { method, url, headers, body } = this.config;
    if (!url.trim()) return;

    this.loading.set(true);
    this.update({ response: 'Loading...', status: null });

    try {
      const parsedHeaders = JSON.parse(headers || '{}');
      const opts: RequestInit = { method, headers: parsedHeaders };
      if (method !== 'GET' && body) opts.body = body;

      const res = await fetch(url, opts);
      const text = await res.text();
      let formatted = text;
      try { formatted = JSON.stringify(JSON.parse(text), null, 2); } catch { /* not JSON */ }

      this.update({ response: formatted, status: res.status });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Request failed';
      this.update({ response: msg, status: 0 });
    } finally {
      this.loading.set(false);
    }
  }

  private update(partial: Partial<ApiTesterConfig>): void {
    this.ws.updateBlock(this.block.id, { config: { ...this.config, ...partial } });
  }
}
