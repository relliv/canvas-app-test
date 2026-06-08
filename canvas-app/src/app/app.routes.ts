import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/workspace/workspace.component').then(
        (m) => m.WorkspaceComponent
      ),
  },
];
