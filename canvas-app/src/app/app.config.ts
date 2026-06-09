import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  APP_INITIALIZER,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import {
  WidgetRegistryService,
  PomodoroWidgetComponent,
  TextEditorWidgetComponent,
  StickyNoteWidgetComponent,
  TerminalWidgetComponent,
  WebBrowserWidgetComponent,
  FrameWidgetComponent,
  ImageWidgetComponent,
  KanbanWidgetComponent,
  CodeSnippetWidgetComponent,
  MarkdownWidgetComponent,
  ClockWidgetComponent,
  EmbedWidgetComponent,
  DrawingWidgetComponent,
  ChatWidgetComponent,
  CalendarWidgetComponent,
  ProgressTrackerWidgetComponent,
  FilePreviewWidgetComponent,
  ApiTesterWidgetComponent,
} from '@ngeenx/widgets';

function registerWidgets(registry: WidgetRegistryService): () => void {
  return () => {
    registry.register('pomodoro', PomodoroWidgetComponent);
    registry.register('text-editor', TextEditorWidgetComponent);
    registry.register('sticky-note', StickyNoteWidgetComponent);
    registry.register('terminal', TerminalWidgetComponent);
    registry.register('web-browser', WebBrowserWidgetComponent);
    registry.register('frame', FrameWidgetComponent);
    registry.register('image', ImageWidgetComponent);
    registry.register('kanban', KanbanWidgetComponent);
    registry.register('code-snippet', CodeSnippetWidgetComponent);
    registry.register('markdown', MarkdownWidgetComponent);
    registry.register('clock', ClockWidgetComponent);
    registry.register('embed', EmbedWidgetComponent);
    registry.register('drawing', DrawingWidgetComponent);
    registry.register('chat', ChatWidgetComponent);
    registry.register('calendar', CalendarWidgetComponent);
    registry.register('progress-tracker', ProgressTrackerWidgetComponent);
    registry.register('file-preview', FilePreviewWidgetComponent);
    registry.register('api-tester', ApiTesterWidgetComponent);
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
    {
      provide: APP_INITIALIZER,
      useFactory: registerWidgets,
      deps: [WidgetRegistryService],
      multi: true,
    },
  ],
};
