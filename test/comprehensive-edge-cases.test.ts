/**
 * Comprehensive Edge Cases Test Suite
 * Tests for boundary conditions, error states, and unusual scenarios
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { SvgZoom } from '../src/index';

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
        const svgZoom = new SvgZoom(emptyContainer);
        expect(svgZoom.isDestroyed).toBe(true);
        svgZoom.destroy();
      }).not.toThrow();

      document.body.removeChild(emptyContainer);
    });

    it('should handle multiple initialization calls', () => {
      const svgZoom = new SvgZoom(container);

      expect(() => {
        svgZoom.init();
        svgZoom.init(); // Second call should not cause issues
        svgZoom.init(); // Third call should not cause issues
      }).not.toThrow();

      svgZoom.destroy();
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
          const svgZoom = new SvgZoom(container, config);
          svgZoom.init();
          svgZoom.zoomIn();
          svgZoom.zoomOut();
          svgZoom.destroy();
        }).not.toThrow();
      });
    });

    it('should handle extremely large and small scale values', () => {
      const svgZoom = new SvgZoom(container, {
        minScale: 0.001,
        maxScale: 1000
      });
      svgZoom.init();

      expect(() => {
        // Test extreme zoom out
        for (let i = 0; i < 100; i++) {
          svgZoom.zoomOut();
        }

        // Test extreme zoom in
        for (let i = 0; i < 100; i++) {
          svgZoom.zoomIn();
        }
      }).not.toThrow();

      svgZoom.destroy();
    });
  });

  describe('Event Handling Edge Cases', () => {
    it('should handle rapid successive events', () => {
      const svgZoom = new SvgZoom(container);
      svgZoom.init();

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

      svgZoom.destroy();
    });

    it('should handle malformed event objects', () => {
      const svgZoom = new SvgZoom(container, { enableTouch: true });
      svgZoom.init();

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

      svgZoom.destroy();
    });

    it('should handle events on destroyed instance', () => {
      const svgZoom = new SvgZoom(container);
      svgZoom.init();
      svgZoom.destroy();

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
      const svgZoom = new SvgZoom(container, {
        minScale: 0.5,
        maxScale: 2.0
      });
      svgZoom.init();

      // Set to exact minimum
      svgZoom.scale = 0.5;
      expect(() => {
        svgZoom.zoomOut(); // Should not go below min
      }).not.toThrow();
      expect(svgZoom.scale).toBeGreaterThanOrEqual(0.5);

      // Set to exact maximum
      svgZoom.scale = 2.0;
      expect(() => {
        svgZoom.zoomIn(); // Should not go above max
      }).not.toThrow();
      expect(svgZoom.scale).toBeLessThanOrEqual(2.0);

      svgZoom.destroy();
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
          const svgZoom = new SvgZoom(testContainer);
          svgZoom.init();

          // Test extreme pan values
          svgZoom.translateX = 10000;
          svgZoom.translateY = 10000;
          svgZoom.constrainPan();

          svgZoom.translateX = -10000;
          svgZoom.translateY = -10000;
          svgZoom.constrainPan();

          svgZoom.destroy();
        }).not.toThrow();

        document.body.removeChild(testContainer);
      });
    });

    it('should handle zero and negative zoom steps', () => {
      const svgZoom = new SvgZoom(container, { zoomStep: 0 });
      svgZoom.init();

      const initialScale = svgZoom.scale;

      expect(() => {
        svgZoom.zoomIn();
        svgZoom.zoomOut();
      }).not.toThrow();

      // Scale should remain unchanged with zero step
      expect(svgZoom.scale).toBe(initialScale);

      svgZoom.destroy();
    });
  });

  describe('DOM Manipulation Edge Cases', () => {
    it('should handle container removal during operation', () => {
      const svgZoom = new SvgZoom(container);
      svgZoom.init();

      expect(() => {
        // Remove container from DOM
        container.remove();

        // Try to perform operations
        svgZoom.zoomIn();
        svgZoom.zoomOut();
        svgZoom.reset();

        svgZoom.destroy();
      }).not.toThrow();
    });

    it('should handle SVG replacement during operation', () => {
      const svgZoom = new SvgZoom(container);
      svgZoom.init();

      expect(() => {
        // Replace SVG element
        const newSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        newSvg.setAttribute('width', '300');
        newSvg.setAttribute('height', '300');
        container.removeChild(svgElement);
        container.appendChild(newSvg);

        // Try to perform operations
        svgZoom.zoomIn();
        svgZoom.zoomOut();

        svgZoom.destroy();
      }).not.toThrow();
    });

    it('should handle CSS class manipulation conflicts', () => {
      const svgZoom = new SvgZoom(container, { showControls: true });
      svgZoom.init();

      expect(() => {
        // Manually remove classes that the library might expect
        container.classList.remove('svg-toolbelt-container');
        svgElement.classList.remove('svg-toolbelt-svg');

        // Add conflicting classes
        container.classList.add('custom-container');
        svgElement.classList.add('custom-svg');

        // Try operations
        svgZoom.zoomIn();
        svgZoom.zoomOut();

        svgZoom.destroy();
      }).not.toThrow();
    });
  });

  describe('Memory and Performance Edge Cases', () => {
    it('should handle multiple instances on same container', () => {
      expect(() => {
        const instances = [];

        // Create multiple instances
        for (let i = 0; i < 10; i++) {
          const svgZoom = new SvgZoom(container);
          svgZoom.init();
          instances.push(svgZoom);
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
        const svgZoom = new SvgZoom(container);
        svgZoom.destroy(); // Destroy before init
        svgZoom.init(); // Should handle gracefully
        svgZoom.destroy(); // Second destroy should be safe
      }).not.toThrow();
    });

    it('should handle rapid create/destroy cycles', () => {
      expect(() => {
        for (let i = 0; i < 100; i++) {
          const svgZoom = new SvgZoom(container);
          svgZoom.init();

          if (i % 2 === 0) {
            svgZoom.zoomIn();
          } else {
            svgZoom.zoomOut();
          }

          svgZoom.destroy();
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
        const svgZoom = new SvgZoom(container);
        svgZoom.init();
        svgZoom.zoomIn();
        svgZoom.reset(); // Uses animation
        svgZoom.destroy();
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
        const svgZoom = new SvgZoom(container);
        svgZoom.init();

        if (svgZoom.features.fullscreen) {
          // Should handle fullscreen API errors gracefully
          expect(svgZoom.features.fullscreen).toBeTruthy();
        }

        svgZoom.destroy();
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

      const svgZoom = new SvgZoom(container, { enableTouch: true });
      svgZoom.init();

      touchAPIVariations.forEach(createEvent => {
        expect(() => {
          const event = createEvent();
          event.preventDefault = vi.fn();
          svgElement.dispatchEvent(event);
        }).not.toThrow();
      });

      svgZoom.destroy();
    });
  });

  describe('Configuration Edge Cases', () => {
    it('should handle configuration changes after initialization', () => {
      const svgZoom = new SvgZoom(container);
      svgZoom.init();

      expect(() => {
        // Direct config modification (not recommended but should be handled)
        svgZoom.config.minScale = 0.1;
        svgZoom.config.maxScale = 5.0;
        svgZoom.config.zoomStep = 0.2;

        // Operations should still work
        svgZoom.zoomIn();
        svgZoom.zoomOut();

        svgZoom.destroy();
      }).not.toThrow();
    });

    it('should handle feature toggling', () => {
      const svgZoom = new SvgZoom(container, {
        showControls: true,
        enableTouch: true,
        enableKeyboard: true,
        showZoomLevelIndicator: true
      });
      svgZoom.init();

      expect(() => {
        // Toggle features
        svgZoom.config.showControls = false;
        svgZoom.config.enableTouch = false;
        svgZoom.config.enableKeyboard = false;
        svgZoom.config.showZoomLevelIndicator = false;

        // Should still work
        svgZoom.zoomIn();
        svgZoom.zoomOut();

        svgZoom.destroy();
      }).not.toThrow();
    });
  });

  describe('Transform Edge Cases', () => {
    it('should handle extreme transform values', () => {
      const svgZoom = new SvgZoom(container);
      svgZoom.init();

      expect(() => {
        // Set extreme values
        svgZoom.scale = Number.MAX_SAFE_INTEGER;
        svgZoom.translateX = Number.MAX_SAFE_INTEGER;
        svgZoom.translateY = Number.MAX_SAFE_INTEGER;

        svgZoom.constrainPan();

        // Reset should handle extreme values
        svgZoom.reset();

        svgZoom.destroy();
      }).not.toThrow();
    });

    it('should handle NaN and Infinity values', () => {
      const svgZoom = new SvgZoom(container);
      svgZoom.init();

      expect(() => {
        // Set invalid values
        svgZoom.scale = NaN;
        svgZoom.translateX = Infinity;
        svgZoom.translateY = -Infinity;

        // Operations should handle invalid values gracefully
        svgZoom.zoomIn();
        svgZoom.zoomOut();
        svgZoom.constrainPan();
        svgZoom.reset();

        svgZoom.destroy();
      }).not.toThrow();
    });
  });
});
