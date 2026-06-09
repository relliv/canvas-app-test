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
} from '@ngeenx/widgets';

function registerWidgets(registry: WidgetRegistryService): () => void {
  return () => {
    registry.register('pomodoro', PomodoroWidgetComponent);
    registry.register('text-editor', TextEditorWidgetComponent);
    registry.register('sticky-note', StickyNoteWidgetComponent);
    registry.register('terminal', TerminalWidgetComponent);
    registry.register('web-browser', WebBrowserWidgetComponent);
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
