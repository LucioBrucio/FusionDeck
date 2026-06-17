import { Injectable, computed, signal } from '@angular/core';
import type { Channel, FusionEntity } from '@fusiondeck/core';
import { stationToChannel } from './channel.util';

/**
 * The "memory deck" — channels the user has staged to write to the radio.
 * Shared across all three layouts (Explorer adds, Workbench edits, the header
 * shows the count). Signal store; a NgRx migration stays an option later.
 */
@Injectable({ providedIn: 'root' })
export class MemoryDeckStore {
  private readonly _channels = signal<Channel[]>([]);

  readonly channels = this._channels.asReadonly();
  readonly count = computed(() => this._channels().length);

  has(stationId: string, station: FusionEntity): boolean {
    const name = (station.callsign ?? station.name).slice(0, 16);
    return this._channels().some((c) => c.name === name);
  }

  addStation(station: FusionEntity): void {
    const next = stationToChannel(station, this._channels().length + 1);
    this._channels.update((list) => [...list, next]);
  }

  removeAt(index: number): void {
    this._channels.update((list) => list.filter((_, i) => i !== index).map(reindex));
  }

  rename(index: number, name: string): void {
    this._channels.update((list) =>
      list.map((c, i) => (i === index ? { ...c, name } : c)),
    );
  }

  clear(): void {
    this._channels.set([]);
  }
}

function reindex(channel: Channel, i: number): Channel {
  return { ...channel, index: i + 1 };
}
