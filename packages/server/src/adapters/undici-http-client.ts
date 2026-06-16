import { request } from 'undici';
import type { HttpClient, HttpRequest, HttpResponse } from '@fusiondeck/core';

/** HttpClient port backed by undici (Node). */
export class UndiciHttpClient implements HttpClient {
  async request(req: HttpRequest): Promise<HttpResponse> {
    const res = await request(req.url, {
      method: req.method ?? 'GET',
      headers: req.headers,
      body: req.body,
      headersTimeout: req.timeoutMs,
      bodyTimeout: req.timeoutMs,
    });
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(res.headers)) {
      headers[key] = Array.isArray(value) ? value.join(', ') : String(value ?? '');
    }
    return {
      status: res.statusCode,
      headers,
      text: () => res.body.text(),
      json: <T = unknown>() => res.body.json() as Promise<T>,
    };
  }
}
