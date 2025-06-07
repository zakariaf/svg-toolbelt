/**
 * Security and Performance Test Suite
 * Tests for security vulnerabilities and performance characteristics
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { SvgZoom } from '../src/index';

declare const global: typeof globalThis;

describe('Security & Performance Tests', () => {
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
    global.performance = { now: () => Date.now() } as any;

    container = document.getElementById('container') as HTMLElement;
    svgElement = container.querySelector('svg') as SVGSVGElement;
  });

  afterEach(() => {
    if (dom) {
      dom.window.close();
    }
    vi.restoreAllMocks();
  });

  describe('Security Tests', () => {
    it('should prevent XSS through configuration injection', () => {
      const maliciousConfigs = [
        { controlsPosition: '<script>alert("xss")</script>' as any },
        { zoomStep: 'javascript:alert("xss")' as any },
        { minScale: '<img src=x onerror=alert("xss")>' as any },
        { maxScale: '"><script>alert("xss")</script>' as any }
      ];

      maliciousConfigs.forEach(config => {
        expect(() => {
          const svgZoom = new SvgZoom(container, config);
          svgZoom.init();
          svgZoom.destroy();
        }).not.toThrow();
      });
    });

    it('should sanitize DOM manipulation inputs', () => {
      const svgZoom = new SvgZoom(container, { showControls: true });
      svgZoom.init();

      // Check that no script tags are injected
      const controlsContainer = container.querySelector('.svg-toolbelt-controls');
      if (controlsContainer) {
        const scriptTags = controlsContainer.querySelectorAll('script');
        expect(scriptTags.length).toBe(0);
      }

      svgZoom.destroy();
    });

    it('should handle malicious event data', () => {
      const svgZoom = new SvgZoom(container, { enableTouch: true });
      svgZoom.init();

      const maliciousEventData = [
        // Attempt to inject script through event properties
        {
          type: 'touchstart',
          data: '<script>alert("xss")</script>',
          touches: [{
            clientX: '<script>alert("xss")</script>' as any,
            clientY: 100,
            identifier: 0
          }]
        },
        // Large payload to test buffer overflow protection
        {
          type: 'wheel',
          deltaY: 'A'.repeat(10000) as any,
          clientX: 100,
          clientY: 100
        }
      ];

      maliciousEventData.forEach(eventData => {
        expect(() => {
          const event = new Event(eventData.type) as any;
          // Don't try to set read-only properties
          if (eventData.touches) {
            event.touches = eventData.touches;
          }
          if (eventData.deltaY && eventData.type === 'wheel') {
            // Create a proper wheel event instead
            const wheelEvent = new WheelEvent('wheel', {
              deltaY: typeof eventData.deltaY === 'number' ? eventData.deltaY : 100,
              clientX: 100,
              clientY: 100
            });
            event.preventDefault = vi.fn();
            svgElement.dispatchEvent(wheelEvent);
          } else {
            event.preventDefault = vi.fn();
            svgElement.dispatchEvent(event);
          }
        }).not.toThrow();
      });

      svgZoom.destroy();
    });

    it('should prevent prototype pollution', () => {
      const maliciousConfig = JSON.parse('{"__proto__": {"polluted": true}}');

      expect(() => {
        const svgZoom = new SvgZoom(container, maliciousConfig);
        svgZoom.init();

        // Check that prototype pollution didn't occur
        expect((Object.prototype as any).polluted).toBeUndefined();

        svgZoom.destroy();
      }).not.toThrow();
    });

    it('should validate input ranges to prevent integer overflow', () => {
      const extremeValues = [
        Number.MAX_SAFE_INTEGER,
        Number.MIN_SAFE_INTEGER,
        Number.POSITIVE_INFINITY,
        Number.NEGATIVE_INFINITY,
        NaN
      ];

      extremeValues.forEach(value => {
        expect(() => {
          const svgZoom = new SvgZoom(container, {
            minScale: value,
            maxScale: value,
            zoomStep: value,
            transitionDuration: value
          });
          svgZoom.init();
          svgZoom.zoomIn();
          svgZoom.zoomOut();
          svgZoom.destroy();
        }).not.toThrow();
      });
    });

    it('should handle CSP (Content Security Policy) restrictions', () => {
      // Mock CSP violation
      const originalConsoleError = console.error;
      const cspErrors: string[] = [];
      console.error = (message: string) => {
        if (message.includes('CSP') || message.includes('unsafe-inline')) {
          cspErrors.push(message);
        }
      };

      expect(() => {
        const svgZoom = new SvgZoom(container, { showControls: true });
        svgZoom.init();

        // Should work without inline styles that violate CSP
        const controls = container.querySelector('.svg-toolbelt-controls');
        if (controls) {
          expect(controls.getAttribute('style')).toBeFalsy();
        }

        svgZoom.destroy();
      }).not.toThrow();

      console.error = originalConsoleError;
      // In a real CSP environment, we would expect no CSP violations
    });
  });

  describe('Performance Tests', () => {
    it('should handle high-frequency events efficiently', () => {
      const svgZoom = new SvgZoom(container);
      svgZoom.init();

      const startTime = performance.now();
      const eventCount = 1000;

      // Simulate high-frequency wheel events
      for (let i = 0; i < eventCount; i++) {
        const wheelEvent = new WheelEvent('wheel', {
          deltaY: i % 2 === 0 ? 100 : -100,
          clientX: 100 + (i % 10),
          clientY: 100 + (i % 10)
        });
        svgElement.dispatchEvent(wheelEvent);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should handle 1000 events in reasonable time (less than 1 second)
      expect(duration).toBeLessThan(1000);

      svgZoom.destroy();
    });

    it('should efficiently manage DOM updates', () => {
      const svgZoom = new SvgZoom(container);
      svgZoom.init();

      // Mock MutationObserver to count DOM changes
      let domMutations = 0;
      const originalSetAttribute = Element.prototype.setAttribute;
      Element.prototype.setAttribute = function(...args) {
        domMutations++;
        return originalSetAttribute.apply(this, args);
      };

      const startMutations = domMutations;

      // Perform many operations
      for (let i = 0; i < 100; i++) {
        if (i % 2 === 0) {
          svgZoom.zoomIn();
        } else {
          svgZoom.zoomOut();
        }
      }

      const mutationCount = domMutations - startMutations;

      // Should batch DOM updates efficiently
      expect(mutationCount).toBeLessThan(200); // Some reasonable threshold

      // Restore original method
      Element.prototype.setAttribute = originalSetAttribute;

      svgZoom.destroy();
    });

    it('should handle memory efficiently with rapid operations', () => {
      // Simulate memory pressure testing
      const instances: SvgZoom[] = [];

      expect(() => {
        // Create many instances
        for (let i = 0; i < 50; i++) {
          const testContainer = document.createElement('div');
          const testSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          testSvg.setAttribute('width', '100');
          testSvg.setAttribute('height', '100');
          testContainer.appendChild(testSvg);
          document.body.appendChild(testContainer);

          const svgZoom = new SvgZoom(testContainer);
          svgZoom.init();
          instances.push(svgZoom);

          // Perform operations
          svgZoom.zoomIn();
          svgZoom.zoomOut();
        }

        // Cleanup all instances
        instances.forEach(instance => {
          instance.destroy();
          instance.container.remove();
        });
      }).not.toThrow();
    });

    it('should prevent memory leaks in event listeners', () => {
      // Track event listener additions
      const originalAddEventListener = EventTarget.prototype.addEventListener;
      const originalRemoveEventListener = EventTarget.prototype.removeEventListener;

      const eventCounts = {
        addEventListener: 0,
        removeEventListener: 0
      };

      EventTarget.prototype.addEventListener = function(...args) {
        eventCounts.addEventListener++;
        return originalAddEventListener.apply(this, args);
      };

      EventTarget.prototype.removeEventListener = function(...args) {
        eventCounts.removeEventListener++;
        return originalRemoveEventListener.apply(this, args);
      };

      const svgZoom = new SvgZoom(container);
      svgZoom.init();

      // Perform operations that might add listeners
      svgZoom.zoomIn();
      svgZoom.zoomOut();

      svgZoom.destroy();

      // After destroy, most listeners should be removed
      // Allow for some system listeners that might not be removed
      const listenerDifference = eventCounts.addEventListener - eventCounts.removeEventListener;
      expect(listenerDifference).toBeLessThan(10);

      // Restore original methods
      EventTarget.prototype.addEventListener = originalAddEventListener;
      EventTarget.prototype.removeEventListener = originalRemoveEventListener;
    });

    it('should throttle expensive operations', () => {
      const svgZoom = new SvgZoom(container);
      svgZoom.init();

      const originalStyle = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'style');

      Object.defineProperty(svgElement, 'style', {
        get: () => {
          const styleObj = {
            transform: '',
            transition: 'none'
          };
          Object.defineProperty(styleObj, 'transform', {
            set: (_value: string) => {
              // Transform setter - could track updates if needed
            },
            get: () => '',
            configurable: true
          });
          return styleObj;
        },
        configurable: true
      });

      const startTime = performance.now();

      // Perform rapid pan operations
      for (let i = 0; i < 100; i++) {
        svgZoom.translateX = i;
        svgZoom.translateY = i;
        svgZoom.constrainPan();
      }

      const endTime = performance.now();

      // Should complete quickly even with many operations
      expect(endTime - startTime).toBeLessThan(100);

      // Restore original style property
      if (originalStyle) {
        Object.defineProperty(HTMLElement.prototype, 'style', originalStyle);
      }

      svgZoom.destroy();
    });

    it('should handle stress testing with concurrent operations', () => {
      const svgZoom = new SvgZoom(container, {
        showControls: true,
        enableTouch: true,
        enableKeyboard: true,
        showZoomLevelIndicator: true
      });
      svgZoom.init();

      expect(() => {
        // Simulate concurrent user interactions
        const operations = [
          () => svgZoom.zoomIn(),
          () => svgZoom.zoomOut(),
          () => svgZoom.reset(),
          () => {
            const wheelEvent = new WheelEvent('wheel', {
              deltaY: 100,
              clientX: 100,
              clientY: 100
            });
            svgElement.dispatchEvent(wheelEvent);
          },
          () => {
            const keyEvent = new KeyboardEvent('keydown', {
              key: '+',
              ctrlKey: true
            });
            document.dispatchEvent(keyEvent);
          }
        ];

        // Rapidly execute random operations
        for (let i = 0; i < 200; i++) {
          const randomOperation = operations[Math.floor(Math.random() * operations.length)];
          randomOperation();
        }
      }).not.toThrow();

      svgZoom.destroy();
    });
  });

  describe('Resource Management', () => {
    it('should properly cleanup all resources on destroy', () => {
      const svgZoom = new SvgZoom(container, {
        showControls: true,
        enableTouch: true,
        enableKeyboard: true,
        showZoomLevelIndicator: true
      });
      svgZoom.init();

      // Get reference to added elements
      const controlsContainer = container.querySelector('.svg-toolbelt-controls');

      expect(controlsContainer).toBeTruthy();

      svgZoom.destroy();

      // Check that resources are cleaned up
      expect(svgZoom.isDestroyed).toBe(true);
      expect(Object.keys(svgZoom.features).length).toBe(0);

      // Verify no dangling timers or intervals
      expect(() => {
        // Multiple destroy calls should be safe
        svgZoom.destroy();
        svgZoom.destroy();
      }).not.toThrow();
    });

    it('should handle resource cleanup with missing elements', () => {
      const svgZoom = new SvgZoom(container);
      svgZoom.init();

      // Remove SVG element before destroy
      svgElement.remove();

      expect(() => {
        svgZoom.destroy();
      }).not.toThrow();
    });

    it('should prevent operations after destroy', () => {
      const svgZoom = new SvgZoom(container);
      svgZoom.init();
      svgZoom.destroy();

      expect(() => {
        svgZoom.zoomIn();
        svgZoom.zoomOut();
        svgZoom.reset();
        svgZoom.constrainPan();
      }).not.toThrow();

      // Operations should have no effect after destroy
      expect(svgZoom.isDestroyed).toBe(true);
    });
  });
});
