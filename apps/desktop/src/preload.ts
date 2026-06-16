import { contextBridge, ipcRenderer } from 'electron';
import type { GeoArea } from '@fusiondeck/core';

/**
 * The thin bridge the UI talks to (§3.3). Keeps the renderer sandboxed while
 * exposing exactly the discovery + (future) SD-card filesystem operations.
 */
contextBridge.exposeInMainWorld('fusiondeck', {
  getRepeaters: (area: GeoArea) => ipcRenderer.invoke('fd:discovery:getRepeaters', area),
  // SD-card bridge goes here next: readDat / writeDat against the radio's
  // fixed folder layout (FTM510DE_SD_LAYOUT). Stubbed for the Fase 0 skeleton.
});
