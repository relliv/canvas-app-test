import { Block } from '@ngeenx/shared-models';
import { Viewport } from '../viewport/viewport';

const CANVAS_RENDERED_TYPES = new Set(['clock', 'image']);

export function isCanvasRenderedType(type: string): boolean {
  return CANVAS_RENDERED_TYPES.has(type);
}

export class WidgetCanvasRenderer {
  private imageCache = new Map<string, HTMLImageElement>();

  constructor(
    private ctx: CanvasRenderingContext2D,
    private viewport: Viewport
  ) {}

  render(blocks: Record<string, Block>): void {
    for (const block of Object.values(blocks)) {
      if (!CANVAS_RENDERED_TYPES.has(block.type)) continue;
      if (
        !this.viewport.isRectVisible({
          x: block.position.x,
          y: block.position.y,
          width: block.size.width,
          height: block.size.height,
        })
      )
        continue;

      switch (block.type) {
        case 'clock':
          this.renderClock(block);
          break;
        case 'image':
          this.renderImage(block);
          break;
      }
    }
  }

  private renderClock(block: Block): void {
    const config = block.config as { type: 'clock'; label: string; timezone: string; format: '12h' | '24h' };
    const ctx = this.ctx;
    const vp = this.viewport;

    const tl = vp.worldToScreen(block.position);
    const br = vp.worldToScreen({
      x: block.position.x + block.size.width,
      y: block.position.y + block.size.height,
    });
    const w = br.x - tl.x;
    const h = br.y - tl.y;
    const zoom = vp.zoom;

    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const bg = isDark ? '#27272a' : '#f4f4f5';
    const border = isDark ? '#3f3f46' : '#d4d4d8';
    const textColor = isDark ? '#e4e4e7' : '#18181b';
    const mutedColor = isDark ? '#a1a1aa' : '#52525b';
    const accentColor = '#6366f1';

    const r = 10 * zoom;
    ctx.beginPath();
    ctx.roundRect(tl.x, tl.y, w, h, r);
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.strokeStyle = border;
    ctx.lineWidth = 1;
    ctx.stroke();

    const headerH = 32 * zoom;
    ctx.beginPath();
    ctx.moveTo(tl.x, tl.y + headerH);
    ctx.lineTo(tl.x + w, tl.y + headerH);
    ctx.strokeStyle = border;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = mutedColor;
    ctx.font = `${11 * zoom}px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(config.label || 'Clock', tl.x + 12 * zoom, tl.y + headerH / 2);

    const bodyCenter = { x: tl.x + w / 2, y: tl.y + headerH + (h - headerH) / 2 };

    const opts: Intl.DateTimeFormatOptions = {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: config.format === '12h',
    };
    const dateOpts: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    const tz = config.timezone === 'local' ? undefined : config.timezone;
    if (tz) { opts.timeZone = tz; dateOpts.timeZone = tz; }

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', opts);
    const dateStr = now.toLocaleDateString('en-US', dateOpts);

    ctx.fillStyle = textColor;
    ctx.font = `700 ${32 * zoom}px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(timeStr, bodyCenter.x, bodyCenter.y - 10 * zoom);

    ctx.fillStyle = mutedColor;
    ctx.font = `${12 * zoom}px 'JetBrains Mono', monospace`;
    ctx.fillText(dateStr, bodyCenter.x, bodyCenter.y + 18 * zoom);

    ctx.fillStyle = accentColor;
    ctx.font = `${9 * zoom}px 'JetBrains Mono', monospace`;
    ctx.fillText(config.format, bodyCenter.x, bodyCenter.y + 36 * zoom);
  }

  private renderImage(block: Block): void {
    const config = block.config as { type: 'image'; url: string; caption: string; fit: string };
    const ctx = this.ctx;
    const vp = this.viewport;

    const tl = vp.worldToScreen(block.position);
    const br = vp.worldToScreen({
      x: block.position.x + block.size.width,
      y: block.position.y + block.size.height,
    });
    const w = br.x - tl.x;
    const h = br.y - tl.y;
    const zoom = vp.zoom;

    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const bg = isDark ? '#27272a' : '#f4f4f5';
    const border = isDark ? '#3f3f46' : '#d4d4d8';
    const mutedColor = isDark ? '#71717a' : '#a1a1aa';

    const r = 10 * zoom;
    ctx.beginPath();
    ctx.roundRect(tl.x, tl.y, w, h, r);
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.strokeStyle = border;
    ctx.lineWidth = 1;
    ctx.stroke();

    const headerH = 30 * zoom;
    ctx.beginPath();
    ctx.moveTo(tl.x, tl.y + headerH);
    ctx.lineTo(tl.x + w, tl.y + headerH);
    ctx.strokeStyle = border;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = mutedColor;
    ctx.font = `600 ${10 * zoom}px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('IMAGE', tl.x + 10 * zoom, tl.y + headerH / 2);

    if (!config.url) {
      ctx.fillStyle = mutedColor;
      ctx.font = `${11 * zoom}px 'JetBrains Mono', monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Double-click to set URL', tl.x + w / 2, tl.y + headerH + (h - headerH) / 2);
      return;
    }

    let img = this.imageCache.get(config.url);
    if (!img) {
      img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = config.url;
      this.imageCache.set(config.url, img);
    }

    if (img.complete && img.naturalWidth > 0) {
      const bodyTop = tl.y + headerH;
      const bodyH = h - headerH - (config.caption ? 24 * zoom : 0);

      ctx.save();
      ctx.beginPath();
      ctx.rect(tl.x, bodyTop, w, bodyH);
      ctx.clip();

      let dw = w;
      let dh = bodyH;
      let dx = tl.x;
      let dy = bodyTop;

      if (config.fit === 'contain') {
        const scale = Math.min(w / img.naturalWidth, bodyH / img.naturalHeight);
        dw = img.naturalWidth * scale;
        dh = img.naturalHeight * scale;
        dx = tl.x + (w - dw) / 2;
        dy = bodyTop + (bodyH - dh) / 2;
      }

      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.restore();

      if (config.caption) {
        ctx.fillStyle = mutedColor;
        ctx.font = `${10 * zoom}px 'JetBrains Mono', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(config.caption, tl.x + w / 2, tl.y + h - 12 * zoom);
      }
    }
  }
}
