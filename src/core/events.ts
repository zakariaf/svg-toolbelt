/**
 * Simple event emitter for feature communication.
 */
export type Listener = (...args: any[]) => void;

export class EventEmitter {
  private events: Map<string, Listener[]> = new Map();

  on(event: string, listener: Listener): this {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(listener);
    return this;
  }

  emit(event: string, ...args: any[]): boolean {
    if (!this.events.has(event)) return false;
    for (const listener of this.events.get(event)!) {
      try {
        listener(...args);
      } catch (err) {
        console.error(`Error in event listener for '${event}':`, err);
      }
    }
    return true;
  }

  off(event: string, listener?: Listener): this {
    if (!this.events.has(event)) return this;
    if (!listener) {
      this.events.delete(event);
      return this;
    }
    const listeners = this.events.get(event)!;
    const idx = listeners.indexOf(listener);
    if (idx > -1) {
      listeners.splice(idx, 1);
    }
    if (listeners.length === 0) {
      this.events.delete(event);
    }
    return this;
  }

  removeAllListeners(): this {
    this.events.clear();
    return this;
  }
}
