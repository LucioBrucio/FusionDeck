export interface HttpRequest {
  url: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: string;
  /** Per-request timeout in milliseconds. */
  timeoutMs?: number;
}

export interface HttpResponse {
  status: number;
  headers: Record<string, string>;
  text(): Promise<string>;
  json<T = unknown>(): Promise<T>;
}

/**
 * Outbound HTTP port. Implemented by host adapters: undici on the server,
 * Electron `net`/fetch in the desktop. Keeps @fusiondeck/core free of any
 * host-specific networking dependency (hexagonal ports, §2).
 */
export interface HttpClient {
  request(req: HttpRequest): Promise<HttpResponse>;
}
