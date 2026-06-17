import { Component, computed, inject } from '@angular/core';
import type { FusionEntity } from '@fusiondeck/core';
import { MemoryDeckStore } from '../../core/memory-deck.store';
import { StationsStore } from '../../core/stations.store';
import { NetworkBadgeComponent } from '../../shared/network-badge.component';
import { RepeaterMapComponent } from '../../shared/repeater-map.component';

/** Live — activity-first. Surfaces what's active now and writes it straight to memory. */
@Component({
  selector: 'fd-live',
  imports: [RepeaterMapComponent, NetworkBadgeComponent],
  templateUrl: './live.component.html',
  styleUrl: './live.component.css',
})
export class LiveComponent {
  private readonly stationsStore = inject(StationsStore);
  protected readonly deck = inject(MemoryDeckStore);

  protected readonly stations = this.stationsStore.stations;
  protected readonly live = this.stationsStore.liveStations;

  protected readonly hotList = computed<FusionEntity[]>(() =>
    this.stationsStore
      .stations()
      .filter((s) => (s.connectedCount ?? 0) > 0)
      .sort((a, b) => (b.connectedCount ?? 0) - (a.connectedCount ?? 0)),
  );

  private readonly maxConnected = computed<number>(() =>
    Math.max(1, ...this.hotList().map((s) => s.connectedCount ?? 0)),
  );

  protected add(station: FusionEntity): void {
    this.deck.addStation(station);
  }

  protected lastCall(station: FusionEntity): string {
    return station.lastHeard?.[0]?.callsign ?? '';
  }

  protected barWidth(station: FusionEntity): string {
    return `${Math.round(((station.connectedCount ?? 0) / this.maxConnected()) * 100)}%`;
  }
}
