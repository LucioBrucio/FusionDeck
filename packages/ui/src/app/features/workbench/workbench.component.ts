import { Component, computed, inject, signal } from '@angular/core';
import type { FusionEntity, Network } from '@fusiondeck/core';
import { bandOf, formatMhz } from '../../core/channel.util';
import { MemoryDeckStore } from '../../core/memory-deck.store';
import { StationsStore } from '../../core/stations.store';

const ALL_NETWORKS: Network[] = ['fm', 'ysf', 'wiresx'];

/** Workbench — filter → select → fill an editable channel grid. Bulk programming. */
@Component({
  selector: 'fd-workbench',
  templateUrl: './workbench.component.html',
  styleUrl: './workbench.component.css',
})
export class WorkbenchComponent {
  private readonly stationsStore = inject(StationsStore);
  protected readonly deck = inject(MemoryDeckStore);

  protected readonly networks = ALL_NETWORKS;
  protected readonly selectedNetworks = signal<Set<Network>>(new Set(ALL_NETWORKS));

  protected readonly results = computed<FusionEntity[]>(() => {
    const nets = this.selectedNetworks();
    return this.stationsStore.stations().filter((s) => nets.has(s.network));
  });

  protected readonly formatMhz = formatMhz;
  protected readonly bandOf = bandOf;

  protected toggleNetwork(net: Network): void {
    this.selectedNetworks.update((set) => {
      const next = new Set(set);
      if (next.has(net)) {
        next.delete(net);
      } else {
        next.add(net);
      }
      return next;
    });
  }

  protected add(station: FusionEntity): void {
    this.deck.addStation(station);
  }

  protected rename(event: Event, index: number): void {
    this.deck.rename(index, (event.target as HTMLInputElement).value);
  }
}
