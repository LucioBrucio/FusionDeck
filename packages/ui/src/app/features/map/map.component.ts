import { Component, signal } from '@angular/core';
import { LeafletModule } from '@bluehalo/ngx-leaflet';
import * as L from 'leaflet';

/**
 * Fase 0 map placeholder, centered on Italy (initial scope, §10). Next step:
 * layer RepeaterBook markers from DiscoveryService, filterable by band and
 * mode (FM / C4FM / DMR / D-STAR), per §6.
 */
@Component({
  selector: 'fd-map',
  imports: [LeafletModule],
  template: `<div class="fd-map" leaflet [leafletOptions]="options()"></div>`,
  styles: [
    `
      .fd-map {
        height: 100%;
        width: 100%;
      }
    `,
  ],
})
export class MapComponent {
  readonly options = signal<L.MapOptions>({
    layers: [
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors',
      }),
    ],
    zoom: 6,
    center: L.latLng(42.5, 12.5),
  });
}
