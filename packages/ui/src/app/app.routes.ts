import type { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'explorer', pathMatch: 'full' },
  {
    path: 'explorer',
    loadComponent: () =>
      import('./features/explorer/explorer.component').then((m) => m.ExplorerComponent),
  },
  {
    path: 'workbench',
    loadComponent: () =>
      import('./features/workbench/workbench.component').then((m) => m.WorkbenchComponent),
  },
  {
    path: 'live',
    loadComponent: () => import('./features/live/live.component').then((m) => m.LiveComponent),
  },
  { path: '**', redirectTo: 'explorer' },
];
