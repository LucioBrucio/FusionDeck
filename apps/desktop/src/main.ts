import { join } from 'node:path';
import { app, BrowserWindow, ipcMain } from 'electron';
import type { GeoArea, Repeater } from '@fusiondeck/core';

const isDev = process.env.FUSIONDECK_DEV === '1';

/**
 * Embedded core as local fallback (§2.1). Dynamically imported so this CJS
 * entry can load the ESM core. Adapters here are desktop-flavored: global
 * fetch + in-memory cache for now (SQLite/fs is the next step). The full
 * DiscoveryGateway (remote-first → this local) gets wired once the central
 * server has a public URL.
 */
async function getRepeatersLocally(area: GeoArea): Promise<Repeater[]> {
  const core = await import('@fusiondeck/core');
  const clock = { now: () => Date.now() };
  const provider = new core.LocalProvider({
    http: {
      async request(req) {
        const res = await fetch(req.url, {
          method: req.method ?? 'GET',
          headers: req.headers,
          body: req.body,
        });
        const headers: Record<string, string> = {};
        res.headers.forEach((value, key) => {
          headers[key] = value;
        });
        return {
          status: res.status,
          headers,
          text: () => res.text(),
          json: <T = unknown>(): Promise<T> => res.json() as Promise<T>,
        };
      },
    },
    cache: new core.MemoryCacheStore(clock),
    clock,
    log: { debug() {}, info: console.info, warn: console.warn, error: console.error },
  });
  return provider.getRepeaters(area);
}

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: false,
    },
  });

  if (isDev) {
    void win.loadURL('http://localhost:4200');
  } else {
    // Packaged UI build copied next to the desktop bundle (see electron-builder.yml).
    void win.loadFile(join(__dirname, '..', 'ui', 'index.html'));
  }
}

void app.whenReady().then(() => {
  ipcMain.handle('fd:discovery:getRepeaters', (_event, area: GeoArea) => getRepeatersLocally(area));
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
