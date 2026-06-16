import { HttpClient } from '@angular/common/http';
import { Injectable, InjectionToken, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import type { GeoArea, HeardEntry, Reflector, Repeater, Room } from '@fusiondeck/core';

export const API_BASE_URL = new InjectionToken<string>('FUSIONDECK_API_BASE_URL');

/**
 * Talks to the FusionDeck discovery API. In the desktop build this same
 * contract is answered by the embedded LocalProvider over IPC — the UI stays
 * agnostic to which side responds (§2.1, §3.3).
 */
@Injectable({ providedIn: 'root' })
export class DiscoveryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getRepeaters(area: GeoArea): Observable<Repeater[]> {
    return this.http.get<Repeater[]>(`${this.baseUrl}/api/v1/repeaters`, {
      params: { north: area.north, south: area.south, east: area.east, west: area.west },
    });
  }

  getActiveRooms(): Observable<Room[]> {
    return this.http.get<Room[]>(`${this.baseUrl}/api/v1/rooms`);
  }

  getReflectors(): Observable<Reflector[]> {
    return this.http.get<Reflector[]>(`${this.baseUrl}/api/v1/reflectors`);
  }

  getLastHeard(reflectorId: string): Observable<HeardEntry[]> {
    return this.http.get<HeardEntry[]>(
      `${this.baseUrl}/api/v1/reflectors/${encodeURIComponent(reflectorId)}/last-heard`,
    );
  }
}
