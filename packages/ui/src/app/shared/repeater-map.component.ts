import { Component, computed, input, output } from '@angular/core';
import { LeafletModule } from '@bluehalo/ngx-leaflet';
import * as L from 'leaflet';
import type { FusionEntity } from '@fusiondeck/core';
import { isLive } from '../core/channel.util';

/**
 * Reusable Leaflet map. Renders stations as circle markers (no image assets,
 * so no broken-icon issues in the bundler), colored green when live. Shared by
 * the Explorer and Live layouts.
 */
@Component({
  selector: 'fd-repeater-map',
  imports: [LeafletModule],
  template: `<div
    class="fd-map"
    leaflet
    [leafletOptions]="options"
    [leafletLayers]="layers()"
    (leafletMapReady)="onReady($event)"
  ></div>`,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
      .fd-map {
        height: 100%;
        width: 100%;
        min-height: 240px;
      }
    `,
  ],
})
export class RepeaterMapComponent {
  readonly stations = input<FusionEntity[]>([]);
  readonly select = output<FusionEntity>();

  readonly options: L.MapOptions = {
    layers: [
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors',
      }),
    ],
    zoom: 6,
    center: L.latLng(42.5, 12.5),
  };

  readonly layers = computed<L.Layer[]>(() =>
    this.stations()
      .filter((s) => s.geoloc)
      .map((s) => this.toMarker(s)),
  );

  onReady(map: L.Map): void {
    const points = this.stations()
      .filter((s) => s.geoloc)
      .map((s) => L.latLng(s.geoloc!.lat, s.geoloc!.lng));
    if (points.length) {
      map.fitBounds(L.latLngBounds(points).pad(0.3));
    }
  }

  private toMarker(station: FusionEntity): L.CircleMarker {
    const live = isLive(station);
    const marker = L.circleMarker([station.geoloc!.lat, station.geoloc!.lng], {
      radius: 7,
      weight: 2,
      color: live ? '#0f6e56' : '#185fa5',
      fillColor: live ? '#5dcaa5' : '#85b7eb',
      fillOpacity: 0.85,
    });
    marker.bindTooltip(station.name);
    marker.on('click', () => this.select.emit(station));
    return marker;
  }
}
