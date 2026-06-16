import pino from 'pino';
import type { Logger } from '@fusiondeck/core';

/** Logger port backed by pino. */
export class PinoLogger implements Logger {
  constructor(private readonly p = pino()) {}

  debug(msg: string, meta?: Record<string, unknown>): void {
    this.p.debug(meta ?? {}, msg);
  }
  info(msg: string, meta?: Record<string, unknown>): void {
    this.p.info(meta ?? {}, msg);
  }
  warn(msg: string, meta?: Record<string, unknown>): void {
    this.p.warn(meta ?? {}, msg);
  }
  error(msg: string, meta?: Record<string, unknown>): void {
    this.p.error(meta ?? {}, msg);
  }
}
