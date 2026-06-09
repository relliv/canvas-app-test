import {
  Component,
  ChangeDetectionStrategy,
  Input,
  inject,
  signal,
  OnDestroy,
  Pipe,
  PipeTransform,
  Renderer2,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  LucideArrowLeft,
  LucideArrowRight,
  LucideRefreshCw,
  LucideX,
  LucidePlus,
  LucideGlobe,
  LucideLoaderCircle,
  LucideMonitorSmartphone,
} from '@lucide/angular';
import { Block, WebBrowserConfig, BrowserTab } from '@ngeenx/shared-models';
import { WorkspaceStateService, HistoryService } from '@ngeenx/state';

@Pipe({ name: 'safeUrl', standalone: true })
export class SafeUrlPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);
  transform(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}

export interface ScreenSizePreset {
  label: string;
  width: number;
  height: number;
  category: 'mobile' | 'tablet' | 'desktop';
  icon: string;
}

const HEADER_HEIGHT = 72;

const SCREEN_SIZE_PRESETS: ScreenSizePreset[] = [
  { label: 'Mobile S', width: 375, height: 667, category: 'mobile', icon: '📱' },
  { label: 'Mobile L', width: 393, height: 852, category: 'mobile', icon: '📱' },
  { label: 'Tablet S', width: 768, height: 1024, category: 'tablet', icon: '📋' },
  { label: 'Tablet L', width: 834, height: 1194, category: 'tablet', icon: '📋' },
  { label: 'Laptop', width: 1366, height: 768, category: 'desktop', icon: '💻' },
  { label: 'Desktop HD', width: 1920, height: 1080, category: 'desktop', icon: '🖥' },
];

@Component({
  selector: 'cw-web-browser-widget',
  standalone: true,
  imports: [
    SafeUrlPipe,
    LucideArrowLeft,
    LucideArrowRight,
    LucideRefreshCw,
    LucideX,
    LucidePlus,
    LucideGlobe,
    LucideLoaderCircle,
    LucideMonitorSmartphone,
  ],
  templateUrl: './web-browser-widget.component.html',
  styleUrls: ['./web-browser-widget.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebBrowserWidgetComponent implements OnDestroy {
  @Input({ required: true }) block!: Block;

  private workspaceState = inject(WorkspaceStateService);
  private historyService = inject(HistoryService);
  private renderer2 = inject(Renderer2);
  private doc = inject(DOCUMENT);
  urlInput = '';

  readonly loadingTabs = signal<Set<string>>(new Set());
  readonly presets = SCREEN_SIZE_PRESETS;

  private dropdownEl: HTMLElement | null = null;
  private backdropEl: HTMLElement | null = null;

  get config(): WebBrowserConfig {
    return this.block.config as WebBrowserConfig;
  }

  get activeTab(): BrowserTab | undefined {
    return this.config.tabs.find((t) => t.id === this.config.activeTabId);
  }

  get activeUrl(): string {
    return this.activeTab?.url || '';
  }

  get canGoBack(): boolean {
    const tab = this.activeTab;
    if (!tab) return false;
    return (tab.historyIndex ?? 0) > 0;
  }

  get canGoForward(): boolean {
    const tab = this.activeTab;
    if (!tab) return false;
    return (tab.historyIndex ?? 0) < (tab.history?.length ?? 1) - 1;
  }

  get iframeSrc(): string {
    const url = this.activeUrl;
    if (!url) return '';
    return url.startsWith('http') ? url : `https://${url}`;
  }

  get currentSizeLabel(): string {
    const w = Math.round(this.block.size.width);
    const h = Math.round(this.block.size.height - HEADER_HEIGHT);
    const match = SCREEN_SIZE_PRESETS.find(
      (p) => p.width === w && p.height === h
    );
    return match ? match.label : `${w} x ${h}`;
  }

  isTabLoading(tabId: string): boolean {
    return this.loadingTabs().has(tabId);
  }

  private setTabLoading(tabId: string): void {
    this.loadingTabs.update((set) => new Set(set).add(tabId));
  }

  private clearTabLoading(tabId: string): void {
    this.loadingTabs.update((set) => {
      const next = new Set(set);
      next.delete(tabId);
      return next;
    });
  }

  onIframeLoad(): void {
    const tab = this.activeTab;
    if (tab) this.clearTabLoading(tab.id);
  }

  onUrlKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.navigateTo(this.urlInput);
      (event.target as HTMLInputElement).blur();
    }
  }

  onUrlInput(event: Event): void {
    this.urlInput = (event.target as HTMLInputElement).value;
  }

  onUrlFocus(): void {
    this.urlInput = this.activeUrl;
  }

  toggleSizeDropdown(event: MouseEvent): void {
    if (this.dropdownEl) {
      this.closeSizeDropdown();
      return;
    }

    const btn = event.currentTarget as HTMLElement;
    const rect = btn.getBoundingClientRect();

    this.backdropEl = this.renderer2.createElement('div');
    Object.assign(this.backdropEl!.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '9999',
    });
    this.backdropEl!.addEventListener('pointerdown', (e: Event) => {
      e.stopPropagation();
      this.closeSizeDropdown();
    });

    this.dropdownEl = this.renderer2.createElement('div');
    Object.assign(this.dropdownEl!.style, {
      position: 'fixed',
      top: rect.bottom + 4 + 'px',
      left: Math.max(8, rect.right - 220) + 'px',
      width: '220px',
      zIndex: '10000',
      pointerEvents: 'auto',
    });
    this.dropdownEl!.className = 'size-dropdown-portal';
    this.dropdownEl!.addEventListener('pointerdown', (e: Event) => e.stopPropagation());

    const categories = [
      { label: 'Mobile', items: this.presets.filter((p) => p.category === 'mobile') },
      { label: 'Tablet', items: this.presets.filter((p) => p.category === 'tablet') },
      { label: 'Desktop', items: this.presets.filter((p) => p.category === 'desktop') },
    ];

    for (const cat of categories) {
      const group = this.renderer2.createElement('div');
      group.className = 'size-group';

      const groupLabel = this.renderer2.createElement('span');
      groupLabel.className = 'size-group-label';
      groupLabel.textContent = cat.label;
      group.appendChild(groupLabel);

      for (const preset of cat.items) {
        const option = this.renderer2.createElement('button');
        option.className = 'size-option';
        option.innerHTML = `<span class="size-option-name">${preset.label}</span><span class="size-option-dim">${preset.width} x ${preset.height}</span>`;
        option.addEventListener('click', () => this.selectSize(preset));
        group.appendChild(option);
      }

      this.dropdownEl!.appendChild(group);
    }

    this.doc.body.appendChild(this.backdropEl!);
    this.doc.body.appendChild(this.dropdownEl!);
  }

  private closeSizeDropdown(): void {
    if (this.backdropEl) {
      this.backdropEl.remove();
      this.backdropEl = null;
    }
    if (this.dropdownEl) {
      this.dropdownEl.remove();
      this.dropdownEl = null;
    }
  }

  selectSize(preset: ScreenSizePreset): void {
    this.closeSizeDropdown();
    this.workspaceState.resizeBlock(this.block.id, {
      width: preset.width,
      height: preset.height + HEADER_HEIGHT,
    });
  }

  navigateTo(url: string): void {
    if (!url.trim()) return;
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    const tab = this.activeTab;
    if (!tab) return;

    this.setTabLoading(tab.id);
    const history = [...(tab.history || [])].slice(0, (tab.historyIndex ?? 0) + 1);
    history.push(fullUrl);

    const tabs = this.config.tabs.map((t) =>
      t.id === tab.id
        ? { ...t, url: fullUrl, title: this.extractDomain(fullUrl), history, historyIndex: history.length - 1 }
        : t
    );
    this.updateConfig({ tabs });
  }

  goBack(): void {
    const tab = this.activeTab;
    if (!tab || !this.canGoBack) return;
    this.setTabLoading(tab.id);
    const newIndex = (tab.historyIndex ?? 0) - 1;
    const url = tab.history[newIndex];
    const tabs = this.config.tabs.map((t) =>
      t.id === tab.id ? { ...t, url, title: this.extractDomain(url), historyIndex: newIndex } : t
    );
    this.updateConfig({ tabs });
  }

  goForward(): void {
    const tab = this.activeTab;
    if (!tab || !this.canGoForward) return;
    this.setTabLoading(tab.id);
    const newIndex = (tab.historyIndex ?? 0) + 1;
    const url = tab.history[newIndex];
    const tabs = this.config.tabs.map((t) =>
      t.id === tab.id ? { ...t, url, title: this.extractDomain(url), historyIndex: newIndex } : t
    );
    this.updateConfig({ tabs });
  }

  reload(): void {
    const tab = this.activeTab;
    if (!tab) return;
    this.setTabLoading(tab.id);
    const tabs = this.config.tabs.map((t) =>
      t.id === tab.id ? { ...t, url: tab.url } : t
    );
    this.updateConfig({ tabs });
  }

  selectTab(tabId: string): void {
    this.updateConfig({ activeTabId: tabId });
  }

  addTab(): void {
    const defaultUrl = 'https://example.com';
    const newTab: BrowserTab = {
      id: crypto.randomUUID(),
      title: 'New Tab',
      url: defaultUrl,
      history: [defaultUrl],
      historyIndex: 0,
    };
    this.setTabLoading(newTab.id);
    this.updateConfig({ tabs: [...this.config.tabs, newTab], activeTabId: newTab.id });
  }

  closeTab(tabId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.clearTabLoading(tabId);
    const tabs = this.config.tabs.filter((t) => t.id !== tabId);
    if (tabs.length === 0) {
      this.historyService.pushSnapshot();
      this.workspaceState.deleteBlock(this.block.id);
      return;
    }
    const activeTabId = this.config.activeTabId === tabId ? tabs[0].id : this.config.activeTabId;
    this.updateConfig({ tabs, activeTabId });
  }

  getFaviconUrl(url: string): string {
    try {
      return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=16`;
    } catch {
      return '';
    }
  }

  onFaviconError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
    const fallback = (event.target as HTMLElement).nextElementSibling as HTMLElement;
    if (fallback) fallback.style.display = '';
  }

  private updateConfig(partial: Partial<WebBrowserConfig>): void {
    this.workspaceState.updateBlock(this.block.id, {
      config: { ...this.config, ...partial },
    });
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  }

  ngOnDestroy(): void {
    this.closeSizeDropdown();
  }
}
