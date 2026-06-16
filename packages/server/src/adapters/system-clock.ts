import type { Clock } from '@fusiondeck/core';

export class SystemClock implements Clock {
  now(): number {
    return Date.now();
  }
}
