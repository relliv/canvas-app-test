import {
  Component,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  Input,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  inject,
} from '@angular/core';
import { Terminal, ITheme } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { LucideTerminal } from '@lucide/angular';
import { Block, TerminalConfig } from '@ngeenx/shared-models';
import { WorkspaceStateService } from '@ngeenx/state';

const DARK_THEME: ITheme = {
  background: '#1a1a1e',
  foreground: '#e4e4e7',
  cursor: '#6366f1',
  cursorAccent: '#1a1a1e',
  selectionBackground: 'rgba(99, 102, 241, 0.3)',
  black: '#27272a',
  red: '#ef4444',
  green: '#22c55e',
  yellow: '#f59e0b',
  blue: '#6366f1',
  magenta: '#a855f7',
  cyan: '#06b6d4',
  white: '#e4e4e7',
  brightBlack: '#71717a',
  brightRed: '#f87171',
  brightGreen: '#4ade80',
  brightYellow: '#fbbf24',
  brightBlue: '#818cf8',
  brightMagenta: '#c084fc',
  brightCyan: '#22d3ee',
  brightWhite: '#fafafa',
};

const LIGHT_THEME: ITheme = {
  background: '#ffffff',
  foreground: '#1e1e2e',
  cursor: '#6366f1',
  cursorAccent: '#ffffff',
  selectionBackground: 'rgba(99, 102, 241, 0.2)',
  black: '#52525b',
  red: '#dc2626',
  green: '#16a34a',
  yellow: '#ca8a04',
  blue: '#4f46e5',
  magenta: '#9333ea',
  cyan: '#0891b2',
  white: '#18181b',
  brightBlack: '#a1a1aa',
  brightRed: '#ef4444',
  brightGreen: '#22c55e',
  brightYellow: '#eab308',
  brightBlue: '#6366f1',
  brightMagenta: '#a855f7',
  brightCyan: '#06b6d4',
  brightWhite: '#09090b',
};

const PROMPT = '\x1b[32m$ \x1b[0m';

const COMMANDS: Record<string, (args: string[]) => string> = {
  help: () =>
    [
      'Available commands:',
      '  help      Show this help message',
      '  echo      Print text to terminal',
      '  clear     Clear the terminal',
      '  date      Show current date and time',
      '  whoami    Show current user',
      '  uname     Show system info',
      '  ls        List files (simulated)',
      '  pwd       Print working directory',
      '  history   Show command history',
      '  calc      Simple calculator (e.g. calc 2+3)',
      '',
    ].join('\r\n'),
  echo: (args) => args.join(' ') + '\r\n',
  date: () => new Date().toString() + '\r\n',
  whoami: () => 'canvas-user\r\n',
  uname: () => 'CanvasOS 1.0.0 (Canvas Workspace)\r\n',
  pwd: () => '/home/canvas-user/workspace\r\n',
  ls: () =>
    [
      '\x1b[34mdocuments\x1b[0m  \x1b[34mprojects\x1b[0m  \x1b[34mdownloads\x1b[0m',
      'notes.md   todo.txt   README.md',
      '',
    ].join('\r\n'),
  calc: (args) => {
    const expr = args.join('');
    try {
      const sanitized = expr.replace(/[^0-9+\-*/().%\s]/g, '');
      if (!sanitized) return 'Usage: calc <expression>\r\n';
      const result = new Function(`return (${sanitized})`)();
      return `${result}\r\n`;
    } catch {
      return `Error: invalid expression "${expr}"\r\n`;
    }
  },
};

@Component({
  selector: 'cw-terminal-widget',
  standalone: true,
  imports: [LucideTerminal],
  templateUrl: './terminal-widget.component.html',
  styleUrls: ['./terminal-widget.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class TerminalWidgetComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) block!: Block;
  @ViewChild('terminalContainer', { static: true })
  terminalRef!: ElementRef<HTMLDivElement>;

  private workspaceState = inject(WorkspaceStateService);
  private terminal!: Terminal;
  private fitAddon!: FitAddon;
  private currentLine = '';
  private commandHistory: string[] = [];
  private historyIndex = -1;
  private resizeObserver!: ResizeObserver;
  private themeObserver!: MutationObserver;

  get config(): TerminalConfig {
    return this.block.config as TerminalConfig;
  }

  ngAfterViewInit(): void {
    this.commandHistory = [...(this.config.history || [])];

    const currentTheme = this.getCurrentTheme();

    this.terminal = new Terminal({
      fontSize: this.config.fontSize,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      theme: currentTheme === 'light' ? LIGHT_THEME : DARK_THEME,
      cursorBlink: true,
      cursorStyle: 'bar',
      scrollback: 1000,
      convertEol: true,
    });

    this.fitAddon = new FitAddon();
    this.terminal.loadAddon(this.fitAddon);
    this.terminal.loadAddon(new WebLinksAddon());

    this.terminal.open(this.terminalRef.nativeElement);

    requestAnimationFrame(() => {
      this.fitAddon.fit();
    });

    this.terminal.writeln('\x1b[1;36mCanvas Terminal v1.0\x1b[0m');
    this.terminal.writeln('Type \x1b[33mhelp\x1b[0m for available commands.\r\n');
    this.terminal.write(PROMPT);

    this.terminal.onKey(({ key, domEvent }) => {
      this.handleKey(key, domEvent);
    });

    this.resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        this.fitAddon.fit();
      });
    });
    this.resizeObserver.observe(this.terminalRef.nativeElement);

    this.themeObserver = new MutationObserver(() => {
      const theme = this.getCurrentTheme();
      this.terminal.options.theme = { ...(theme === 'light' ? LIGHT_THEME : DARK_THEME) };
      this.terminal.refresh(0, this.terminal.rows - 1);
    });
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
  }

  private getCurrentTheme(): string {
    return document.documentElement.getAttribute('data-theme') || 'dark';
  }

  private handleKey(key: string, e: KeyboardEvent): void {
    const charCode = key.charCodeAt(0);

    if (e.key === 'Enter') {
      this.terminal.writeln('');
      this.executeCommand(this.currentLine.trim());
      this.currentLine = '';
      this.historyIndex = -1;
      this.terminal.write(PROMPT);
      return;
    }

    if (e.key === 'Backspace') {
      if (this.currentLine.length > 0) {
        this.currentLine = this.currentLine.slice(0, -1);
        this.terminal.write('\b \b');
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      if (this.commandHistory.length === 0) return;
      if (this.historyIndex < this.commandHistory.length - 1) {
        this.historyIndex++;
      }
      this.replaceCurrentLine(
        this.commandHistory[this.commandHistory.length - 1 - this.historyIndex]
      );
      return;
    }

    if (e.key === 'ArrowDown') {
      if (this.historyIndex > 0) {
        this.historyIndex--;
        this.replaceCurrentLine(
          this.commandHistory[this.commandHistory.length - 1 - this.historyIndex]
        );
      } else {
        this.historyIndex = -1;
        this.replaceCurrentLine('');
      }
      return;
    }

    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') return;

    if (charCode >= 32) {
      this.currentLine += key;
      this.terminal.write(key);
    }
  }

  private replaceCurrentLine(newLine: string): void {
    const clearLen = this.currentLine.length;
    this.terminal.write('\b'.repeat(clearLen) + ' '.repeat(clearLen) + '\b'.repeat(clearLen));
    this.currentLine = newLine;
    this.terminal.write(newLine);
  }

  private executeCommand(input: string): void {
    if (!input) return;

    this.commandHistory.push(input);
    this.persistHistory();

    const parts = input.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    if (cmd === 'clear') {
      this.terminal.clear();
      return;
    }

    if (cmd === 'history') {
      const output = this.commandHistory
        .map((c, i) => `  ${i + 1}  ${c}`)
        .join('\r\n');
      this.terminal.writeln(output);
      return;
    }

    const handler = COMMANDS[cmd];
    if (handler) {
      this.terminal.write(handler(args));
    } else {
      this.terminal.writeln(
        `\x1b[31mcommand not found: ${cmd}\x1b[0m`
      );
    }
  }

  private persistHistory(): void {
    const last50 = this.commandHistory.slice(-50);
    this.workspaceState.updateBlock(this.block.id, {
      config: { ...this.config, history: last50 },
    });
  }

  onPointerDown(event: PointerEvent): void {
    event.stopPropagation();
  }

  onTitleFocus(): void {
    this.terminal.blur();
  }

  onTitleBlur(event: FocusEvent): void {
    const el = event.target as HTMLElement;
    const title = el.textContent?.trim() || 'Terminal';
    this.workspaceState.updateBlock(this.block.id, {
      config: { ...this.config, title },
    });
  }

  onTitleKeydown(event: KeyboardEvent): void {
    event.stopPropagation();
  }

  onTitleEnter(event: KeyboardEvent): void {
    event.preventDefault();
    (event.target as HTMLElement).blur();
    this.terminal.focus();
  }

  ngOnDestroy(): void {
    this.themeObserver?.disconnect();
    this.resizeObserver?.disconnect();
    this.terminal?.dispose();
  }
}
