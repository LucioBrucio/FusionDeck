import { provideHttpClient } from '@angular/common/http';
import type { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { API_BASE_URL } from './core/discovery.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    // In the desktop build this is overridden to point at the embedded
    // provider's IPC bridge; in the browser it points at the central server.
    { provide: API_BASE_URL, useValue: 'http://localhost:8787' },
  ],
};
