/**
 * Comprehensive Edge Cases Test Suite
 * Tests for boundary conditions, error states, and unusual scenarios
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { SvgToolbelt } from '../src/index';

declare const global: typeof globalThis;

describe('Comprehensive Edge Cases', () => {
  let container: HTMLElement;
  let svgElement: SVGSVGElement;
  let dom: JSDOM;

  beforeEach(() => {
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="container">
            <svg width="200" height="200" viewBox="0 0 200 200">
              <rect x="50" y="50" width="100" height="100" fill="blue" />
            </svg>
          </div>
        </body>
      </html>
    `);

    global.window = dom.window as any;
    global.document = dom.window.document;
    global.HTMLElement = dom.window.HTMLElement;
    global.SVGElement = dom.window.SVGElement;
    global.Element = dom.window.Element;
    // Mock requestAnimationFrame to return a numeric ID and schedule the callback
    global.requestAnimationFrame = vi.fn((cb: any): number => {
      setTimeout(cb, 16);
      return 0;
    });
    global.cancelAnimationFrame = vi.fn();

    container = document.getElementById('container') as HTMLElement;
    svgElement = container.querySelector('svg') as SVGSVGElement;
  });

  afterEach(() => {
    if (dom) {
      dom.window.close();
    }
    vi.restoreAllMocks();
  });

  describe('Initialization Edge Cases', () => {
    it('should handle missing SVG element gracefully', () => {
      const emptyContainer = document.createElement('div');
      document.body.appendChild(emptyContainer);

      expect(() => {
        const svgToolbelt = new SvgToolbelt(emptyContainer);
        expect(svgToolbelt.isDestroyed).toBe(true);
        svgToolbelt.destroy();
      }).not.toThrow();

      document.body.removeChild(emptyContainer);
    });

    it('should handle multiple initialization calls', () => {
      const svgToolbelt = new SvgToolbelt(container);

      expect(() => {
        svgToolbelt.init();
        svgToolbelt.init(); // Second call should not cause issues
        svgToolbelt.init(); // Third call should not cause issues
      }).not.toThrow();

      svgToolbelt.destroy();
    });

    it('should handle invalid configuration values', () => {
      const invalidConfigs = [
        { minScale: -1, maxScale: 0 }, // Invalid scale range
        { minScale: 10, maxScale: 1 }, // Inverted scale range
        { zoomStep: 0 }, // Zero zoom step
        { zoomStep: -0.5 }, // Negative zoom step
        { transitionDuration: -100 } // Negative duration
      ];

      invalidConfigs.forEach(config => {
        expect(() => {
          const svgToolbelt = new SvgToolbelt(container, config);
          svgToolbelt.init();
          svgToolbelt.zoomIn();
          svgToolbelt.zoomOut();
          svgToolbelt.destroy();
        }).not.toThrow();
      });
    });

    it('should handle extremely large and small scale values', () => {
      const svgToolbelt = new SvgToolbelt(container, {
        minScale: 0.001,
        maxScale: 1000
      });
      svgToolbelt.init();

      expect(() => {
        // Test extreme zoom out
        for (let i = 0; i < 100; i++) {
          svgToolbelt.zoomOut();
        }

        // Test extreme zoom in
        for (let i = 0; i < 100; i++) {
          svgToolbelt.zoomIn();
        }
      }).not.toThrow();

      svgToolbelt.destroy();
    });
  });

  describe('Event Handling Edge Cases', () => {
    it('should handle rapid successive events', () => {
      const svgToolbelt = new SvgToolbelt(container);
      svgToolbelt.init();

      expect(() => {
        // Simulate rapid wheel events
        for (let i = 0; i < 50; i++) {
          const wheelEvent = new WheelEvent('wheel', {
            deltaY: i % 2 === 0 ? 100 : -100,
            clientX: 100,
            clientY: 100
          });
          svgElement.dispatchEvent(wheelEvent);
        }
      }).not.toThrow();

      svgToolbelt.destroy();
    });

    it('should handle malformed event objects', () => {
      const svgToolbelt = new SvgToolbelt(container, { enableTouch: true });
      svgToolbelt.init();

      const malformedEvents = [
        // Touch event with no touches
        new Event('touchstart'),
        // Touch event with malformed touch objects
        (() => {
          const event = new Event('touchstart') as any;
          event.touches = [{}]; // Empty touch object
          return event;
        })(),
        // Wheel event with extreme values
        new WheelEvent('wheel', {
          deltaY: Number.MAX_SAFE_INTEGER,
          clientX: -1000,
          clientY: -1000
        }),
        // Keyboard event with undefined key
        new KeyboardEvent('keydown', { key: undefined as any })
      ];

      malformedEvents.forEach(event => {
        expect(() => {
          svgElement.dispatchEvent(event);
        }).not.toThrow();
      });

      svgToolbelt.destroy();
    });

    it('should handle events on destroyed instance', () => {
      const svgToolbelt = new SvgToolbelt(container);
      svgToolbelt.init();
      svgToolbelt.destroy();

      expect(() => {
        const wheelEvent = new WheelEvent('wheel', {
          deltaY: 100,
          clientX: 100,
          clientY: 100
        });
        svgElement.dispatchEvent(wheelEvent);

        const keyEvent = new KeyboardEvent('keydown', {
          key: '+',
          ctrlKey: true
        });
        document.dispatchEvent(keyEvent);
      }).not.toThrow();
    });
  });

  describe('Zoom and Pan Boundary Conditions', () => {
    it('should handle zoom at exact min/max boundaries', () => {
      const svgToolbelt = new SvgToolbelt(container, {
        minScale: 0.5,
        maxScale: 2.0
      });
      svgToolbelt.init();

      // Set to exact minimum
      svgToolbelt.scale = 0.5;
      expect(() => {
        svgToolbelt.zoomOut(); // Should not go below min
      }).not.toThrow();
      expect(svgToolbelt.scale).toBeGreaterThanOrEqual(0.5);

      // Set to exact maximum
      svgToolbelt.scale = 2.0;
      expect(() => {
        svgToolbelt.zoomIn(); // Should not go above max
      }).not.toThrow();
      expect(svgToolbelt.scale).toBeLessThanOrEqual(2.0);

      svgToolbelt.destroy();
    });

    it('should handle pan constraints with various content sizes', () => {
      const testCases = [
        // Very small SVG
        { width: 10, height: 10, viewBox: '0 0 10 10' },
        // Very large SVG
        { width: 2000, height: 2000, viewBox: '0 0 2000 2000' },
        // Asymmetric SVG
        { width: 1000, height: 100, viewBox: '0 0 1000 100' },
        // Zero-sized SVG
        { width: 0, height: 0, viewBox: '0 0 0 0' }
      ];

      testCases.forEach(({ width, height, viewBox }) => {
        const testContainer = document.createElement('div');
        const testSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        testSvg.setAttribute('width', width.toString());
        testSvg.setAttribute('height', height.toString());
        testSvg.setAttribute('viewBox', viewBox);
        testContainer.appendChild(testSvg);
        document.body.appendChild(testContainer);

        expect(() => {
          const svgToolbelt = new SvgToolbelt(testContainer);
          svgToolbelt.init();

          // Test extreme pan values
          svgToolbelt.translateX = 10000;
          svgToolbelt.translateY = 10000;
          svgToolbelt.constrainPan();

          svgToolbelt.translateX = -10000;
          svgToolbelt.translateY = -10000;
          svgToolbelt.constrainPan();

          svgToolbelt.destroy();
        }).not.toThrow();

        document.body.removeChild(testContainer);
      });
    });

    it('should handle zero and negative zoom steps', () => {
      const svgToolbelt = new SvgToolbelt(container, { zoomStep: 0 });
      svgToolbelt.init();

      const initialScale = svgToolbelt.scale;

      expect(() => {
        svgToolbelt.zoomIn();
        svgToolbelt.zoomOut();
      }).not.toThrow();

      // Scale should remain unchanged with zero step
      expect(svgToolbelt.scale).toBe(initialScale);

      svgToolbelt.destroy();
    });
  });

  describe('DOM Manipulation Edge Cases', () => {
    it('should handle container removal during operation', () => {
      const svgToolbelt = new SvgToolbelt(container);
      svgToolbelt.init();

      expect(() => {
        // Remove container from DOM
        container.remove();

        // Try to perform operations
        svgToolbelt.zoomIn();
        svgToolbelt.zoomOut();
        svgToolbelt.reset();

        svgToolbelt.destroy();
      }).not.toThrow();
    });

    it('should handle SVG replacement during operation', () => {
      const svgToolbelt = new SvgToolbelt(container);
      svgToolbelt.init();

      expect(() => {
        // Replace SVG element
        const newSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        newSvg.setAttribute('width', '300');
        newSvg.setAttribute('height', '300');
        container.removeChild(svgElement);
        container.appendChild(newSvg);

        // Try to perform operations
        svgToolbelt.zoomIn();
        svgToolbelt.zoomOut();

        svgToolbelt.destroy();
      }).not.toThrow();
    });

    it('should handle CSS class manipulation conflicts', () => {
      const svgToolbelt = new SvgToolbelt(container, { showControls: true });
      svgToolbelt.init();

      expect(() => {
        // Manually remove classes that the library might expect
        container.classList.remove('svg-toolbelt-container');
        svgElement.classList.remove('svg-toolbelt-svg');

        // Add conflicting classes
        container.classList.add('custom-container');
        svgElement.classList.add('custom-svg');

        // Try operations
        svgToolbelt.zoomIn();
        svgToolbelt.zoomOut();

        svgToolbelt.destroy();
      }).not.toThrow();
    });
  });

  describe('Memory and Performance Edge Cases', () => {
    it('should handle multiple instances on same container', () => {
      expect(() => {
        const instances = [];

        // Create multiple instances
        for (let i = 0; i < 10; i++) {
          const svgToolbelt = new SvgToolbelt(container);
          svgToolbelt.init();
          instances.push(svgToolbelt);
        }

        // Perform operations on all instances
        instances.forEach(instance => {
          instance.zoomIn();
          instance.zoomOut();
        });

        // Destroy all instances
        instances.forEach(instance => {
          instance.destroy();
        });
      }).not.toThrow();
    });

    it('should handle destroy before init', () => {
      expect(() => {
        const svgToolbelt = new SvgToolbelt(container);
        svgToolbelt.destroy(); // Destroy before init
        svgToolbelt.init(); // Should handle gracefully
        svgToolbelt.destroy(); // Second destroy should be safe
      }).not.toThrow();
    });

    it('should handle rapid create/destroy cycles', () => {
      expect(() => {
        for (let i = 0; i < 100; i++) {
          const svgToolbelt = new SvgToolbelt(container);
          svgToolbelt.init();

          if (i % 2 === 0) {
            svgToolbelt.zoomIn();
          } else {
            svgToolbelt.zoomOut();
          }

          svgToolbelt.destroy();
        }
      }).not.toThrow();
    });
  });

  describe('Browser API Edge Cases', () => {
    it('should handle missing or broken requestAnimationFrame', () => {
      const originalRAF = global.requestAnimationFrame;
      const originalCAF = global.cancelAnimationFrame;

      // Remove RAF
      delete (global as any).requestAnimationFrame;
      delete (global as any).cancelAnimationFrame;

      expect(() => {
        const svgToolbelt = new SvgToolbelt(container);
        svgToolbelt.init();
        svgToolbelt.zoomIn();
        svgToolbelt.reset(); // Uses animation
        svgToolbelt.destroy();
      }).not.toThrow();

      // Restore
      global.requestAnimationFrame = originalRAF;
      global.cancelAnimationFrame = originalCAF;
    });

    it('should handle broken fullscreen API', () => {
      // Mock broken fullscreen API
      Object.defineProperty(document, 'fullscreenEnabled', {
        value: true,
        configurable: true
      });
      Object.defineProperty(document, 'fullscreenElement', {
        get: () => { throw new Error('Fullscreen API error'); },
        configurable: true
      });

      expect(() => {
        const svgToolbelt = new SvgToolbelt(container);
        svgToolbelt.init();

        if (svgToolbelt.features.fullscreen) {
          // Should handle fullscreen API errors gracefully
          expect(svgToolbelt.features.fullscreen).toBeTruthy();
        }

        svgToolbelt.destroy();
      }).not.toThrow();
    });

    it('should handle touch API variations', () => {
      // Test with different touch API implementations
      const touchAPIVariations = [
        // Standard TouchEvent
        () => new Event('touchstart'),
        // Custom touch event with minimal properties
        () => {
          const event = new Event('touchstart') as any;
          event.touches = [];
          return event;
        },
        // Touch event with single touch
        () => {
          const event = new Event('touchstart') as any;
          event.touches = [{ clientX: 100, clientY: 100, identifier: 0 }];
          return event;
        }
      ];

      const svgToolbelt = new SvgToolbelt(container, { enableTouch: true });
      svgToolbelt.init();

      touchAPIVariations.forEach(createEvent => {
        expect(() => {
          const event = createEvent();
          event.preventDefault = vi.fn();
          svgElement.dispatchEvent(event);
        }).not.toThrow();
      });

      svgToolbelt.destroy();
    });
  });

  describe('Configuration Edge Cases', () => {
    it('should handle configuration changes after initialization', () => {
      const svgToolbelt = new SvgToolbelt(container);
      svgToolbelt.init();

      expect(() => {
        // Direct config modification (not recommended but should be handled)
        svgToolbelt.config.minScale = 0.1;
        svgToolbelt.config.maxScale = 5.0;
        svgToolbelt.config.zoomStep = 0.2;

        // Operations should still work
        svgToolbelt.zoomIn();
        svgToolbelt.zoomOut();

        svgToolbelt.destroy();
      }).not.toThrow();
    });

    it('should handle feature toggling', () => {
      const svgToolbelt = new SvgToolbelt(container, {
        showControls: true,
        enableTouch: true,
        enableKeyboard: true,
        showZoomLevelIndicator: true
      });
      svgToolbelt.init();

      expect(() => {
        // Toggle features
        svgToolbelt.config.showControls = false;
        svgToolbelt.config.enableTouch = false;
        svgToolbelt.config.enableKeyboard = false;
        svgToolbelt.config.showZoomLevelIndicator = false;

        // Should still work
        svgToolbelt.zoomIn();
        svgToolbelt.zoomOut();

        svgToolbelt.destroy();
      }).not.toThrow();
    });
  });

  describe('Transform Edge Cases', () => {
    it('should handle extreme transform values', () => {
      const svgToolbelt = new SvgToolbelt(container);
      svgToolbelt.init();

      expect(() => {
        // Set extreme values
        svgToolbelt.scale = Number.MAX_SAFE_INTEGER;
        svgToolbelt.translateX = Number.MAX_SAFE_INTEGER;
        svgToolbelt.translateY = Number.MAX_SAFE_INTEGER;

        svgToolbelt.constrainPan();

        // Reset should handle extreme values
        svgToolbelt.reset();

        svgToolbelt.destroy();
      }).not.toThrow();
    });

    it('should handle NaN and Infinity values', () => {
      const svgToolbelt = new SvgToolbelt(container);
      svgToolbelt.init();

      expect(() => {
        // Set invalid values
        svgToolbelt.scale = NaN;
        svgToolbelt.translateX = Infinity;
        svgToolbelt.translateY = -Infinity;

        // Operations should handle invalid values gracefully
        svgToolbelt.zoomIn();
        svgToolbelt.zoomOut();
        svgToolbelt.constrainPan();
        svgToolbelt.reset();

        svgToolbelt.destroy();
      }).not.toThrow();
    });
  });
});
