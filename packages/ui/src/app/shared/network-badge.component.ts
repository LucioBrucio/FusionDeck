import { Component } from '@angular/core';

/**
 * The §4.3 honesty marker. Shown wherever live/network data appears, to make
 * clear this is *network* activity — purely local RF QSOs aren't visible.
 */
@Component({
  selector: 'fd-network-badge',
  template: `<span class="nb" tabindex="0" [title]="explain">network activity</span>`,
  styles: [
    `
      .nb {
        font-size: 11px;
        color: var(--fd-muted);
        border: 1px solid var(--fd-border);
        border-radius: 999px;
        padding: 2px 8px;
        white-space: nowrap;
        cursor: help;
      }
    `,
  ],
})
export class NetworkBadgeComponent {
  protected readonly explain =
    'Network activity only — purely local RF QSOs not forwarded to a room/reflector are invisible here. Cross-check with the repeater beacon/ID (design doc §4.3).';
}
