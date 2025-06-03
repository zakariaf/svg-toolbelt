import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import { SvgEnhancer } from '../src/core/base';
import { ZoomFeature } from '../src/features/zoom';
import { KeyboardFeature } from '../src/features/keyboard';

describe('Accessibility Features', () => {
  let container: HTMLElement;
  let enhancer: SvgEnhancer;

  beforeEach(() => {
    container = document.createElement('div');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    container.appendChild(svg);
    document.body.appendChild(container);

    enhancer = new SvgEnhancer(container, { enableKeyboard: true });
    enhancer.init();
  });

  afterEach(() => {
    enhancer.destroy();
    document.body.removeChild(container);
  });

  it('should set tabindex for keyboard accessibility', () => {
    enhancer.features.keyboard = new KeyboardFeature(enhancer) as any;
    enhancer.features.keyboard.init();

    expect(container.getAttribute('tabindex')).toBe('0');
  });

  it('should handle all documented keyboard shortcuts', () => {
    enhancer.features.zoom = new ZoomFeature(enhancer) as any;
    enhancer.features.keyboard = new KeyboardFeature(enhancer) as any;
    enhancer.features.zoom.init();
    enhancer.features.keyboard.init();

    const keyTests = [
      { key: '+', expectedAction: 'zoom_in' },
      { key: '=', expectedAction: 'zoom_in' },
      { key: '-', expectedAction: 'zoom_out' },
      { key: '0', expectedAction: 'reset' },
      { key: 'ArrowUp', expectedAction: 'pan_up' },
      { key: 'ArrowDown', expectedAction: 'pan_down' },
      { key: 'ArrowLeft', expectedAction: 'pan_left' },
      { key: 'ArrowRight', expectedAction: 'pan_right' }
    ];

    keyTests.forEach(({ key }) => {
      const keyEvent = new KeyboardEvent('keydown', {
        key,
        bubbles: true,
        cancelable: true
      });

      // Should not throw and should prevent default
      expect(() => {
        container.dispatchEvent(keyEvent);
        // For zoom keys, default should be prevented
        if (['+', '=', '-', '0'].includes(key)) {
          expect(keyEvent.defaultPrevented).toBe(true);
        }
      }).not.toThrow();
    });
  });
});