import { Injectable, computed, inject, signal } from '@angular/core';
import type { FusionEntity, GeoArea } from '@fusiondeck/core';
import { isLive } from './channel.util';
import { DiscoveryService } from './discovery.service';
import { SAMPLE_STATIONS } from './sample-data';

/**
 * Signal-based store of discovered stations (store-as-a-service). Seeded with
 * sample data; `load()` swaps in live results from the discovery API (or the
 * desktop's embedded LocalProvider) once available.
 */
@Injectable({ providedIn: 'root' })
export class StationsStore {
  private readonly discovery = inject(DiscoveryService);
  private readonly _stations = signal<FusionEntity[]>(SAMPLE_STATIONS);

  readonly stations = this._stations.asReadonly();
  readonly liveStations = computed(() => this._stations().filter(isLive));

  load(area: GeoArea): void {
    this.discovery.getRepeaters(area).subscribe({
      next: (repeaters) => {
        if (repeaters.length) this._stations.set(repeaters);
      },
      error: () => {
        // Keep sample/last-good data; the gateway falls back, the UI shouldn't break.
      },
    });
  }
}
