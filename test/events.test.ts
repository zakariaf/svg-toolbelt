/**
 * Tests for EventEmitter class
 */
import { describe, it, expect, vi } from 'vitest';
import { EventEmitter } from '../src/core/events';

describe('EventEmitter', () => {
  describe('Error handling and listener management', () => {
    it('should handle errors in event listeners', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const emitter = new EventEmitter();

      // Add a listener that throws an error
      const errorListener = () => {
        throw new Error('Test error');
      };

      emitter.on('test', errorListener);
      emitter.emit('test');

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error in event listener for 'test':",
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should remove specific listeners', () => {
      const emitter = new EventEmitter();
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      emitter.on('test', listener1);
      emitter.on('test', listener2);

      // Remove specific listener
      emitter.off('test', listener1);
      emitter.emit('test');

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it('should remove all listeners for an event', () => {
      const emitter = new EventEmitter();
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      emitter.on('test', listener1);
      emitter.on('test', listener2);

      // Remove all listeners for the event
      emitter.off('test');
      emitter.emit('test');

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });

    it('should clear all listeners', () => {
      const emitter = new EventEmitter();
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      emitter.on('test1', listener1);
      emitter.on('test2', listener2);

      emitter.removeAllListeners();
      emitter.emit('test1');
      emitter.emit('test2');

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });
  });
});
