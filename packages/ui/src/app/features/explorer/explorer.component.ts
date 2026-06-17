import { Component, inject, signal } from '@angular/core';
import type { FusionEntity } from '@fusiondeck/core';
import { bandOf, formatMhz, isLive } from '../../core/channel.util';
import { MemoryDeckStore } from '../../core/memory-deck.store';
import { StationsStore } from '../../core/stations.store';
import { NetworkBadgeComponent } from '../../shared/network-badge.component';
import { RepeaterMapComponent } from '../../shared/repeater-map.component';

/** Explorer (default) — map-first browse, inspect, and add to the memory deck. */
@Component({
  selector: 'fd-explorer',
  imports: [RepeaterMapComponent, NetworkBadgeComponent],
  templateUrl: './explorer.component.html',
  styleUrl: './explorer.component.css',
})
export class ExplorerComponent {
  private readonly stationsStore = inject(StationsStore);
  protected readonly deck = inject(MemoryDeckStore);

  protected readonly stations = this.stationsStore.stations;
  protected readonly selected = signal<FusionEntity | null>(null);

  protected readonly formatMhz = formatMhz;
  protected readonly bandOf = bandOf;
  protected readonly isLive = isLive;

  protected onSelect(station: FusionEntity): void {
    this.selected.set(station);
  }

  protected add(station: FusionEntity): void {
    this.deck.addStation(station);
  }

  protected lastCall(station: FusionEntity): string {
    return station.lastHeard?.[0]?.callsign ?? '';
  }
}
