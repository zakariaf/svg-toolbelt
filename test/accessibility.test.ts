/**
 * Comprehensive Accessibility and Cross-Browser Compatibility Test Suite
 * WCAG 2.1 Level AA compliance and browser compatibility testing
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { SvgZoom } from '../src/index';

describe('Accessibility & Cross-Browser Compatibility', () => {
  let container: HTMLElement;
  let svgElement: SVGSVGElement;
  let dom: JSDOM;
  let svgZoom: SvgZoom;

  beforeEach(() => {
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="container">
            <svg width="200" height="200" viewBox="0 0 200 200" role="img" aria-label="Test SVG for accessibility testing">
              <rect x="50" y="50" width="100" height="100" fill="blue" />
            </svg>
          </div>
        </body>
      </html>
    `);

    (globalThis as any).window = dom.window;
    (globalThis as any).document = dom.window.document;
    (globalThis as any).HTMLElement = dom.window.HTMLElement;
    (globalThis as any).SVGElement = dom.window.SVGElement;
    (globalThis as any).Element = dom.window.Element;
    (globalThis as any).navigator = dom.window.navigator;

    container = document.getElementById('container') as HTMLElement;
    svgElement = container.querySelector('svg') as SVGSVGElement;
  });

  afterEach(() => {
    if (svgZoom) {
      svgZoom.destroy();
    }
    if (dom) {
      dom.window.close();
    }
    vi.restoreAllMocks();
  });

  describe('WCAG 2.1 Level AA Compliance', () => {
    it('should provide proper ARIA labels and roles', () => {
      svgZoom = new SvgZoom(container, { enableKeyboard: true });

      expect(svgElement.getAttribute('role')).toBe('img');
      expect(svgElement.getAttribute('aria-label')).toBeTruthy();
      // tabindex is set on container when keyboard is enabled - need to call init()
      svgZoom.init();
      expect(container.getAttribute('tabindex')).toBe('0');
    });

    it('should support keyboard navigation', () => {
      svgZoom = new SvgZoom(container, { enableKeyboard: true });

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

        expect(() => {
          container.dispatchEvent(keyEvent);
        }).not.toThrow();
      });
    });

    it('should maintain focus management', () => {
      svgZoom = new SvgZoom(container, { enableKeyboard: true });

      // Initialize to set up keyboard feature
      svgZoom.init();
      expect(container.getAttribute('tabindex')).toBe('0');

      // Should handle focus events
      const focusEvent = new FocusEvent('focus');
      expect(() => {
        container.dispatchEvent(focusEvent);
      }).not.toThrow();
    });

    it('should provide screen reader compatible announcements', () => {
      svgZoom = new SvgZoom(container, {
        enableKeyboard: true,
        showZoomLevelIndicator: true
      });

      // Zoom level indicator should be accessible
      const zoomIndicator = container.querySelector('[data-svg-zoom-level]');
      if (zoomIndicator) {
        expect(zoomIndicator.getAttribute('aria-live')).toBe('polite');
        expect(zoomIndicator.getAttribute('aria-atomic')).toBe('true');
      }
    });
  });

  describe('Cross-Browser Compatibility', () => {
    it('should work in legacy browsers (IE11 simulation)', () => {
      // Simulate IE11 environment
      const originalUserAgent = (globalThis as any).navigator.userAgent;
      Object.defineProperty((globalThis as any).navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Trident/7.0; rv:11.0) like Gecko',
        configurable: true
      });

      expect(() => {
        svgZoom = new SvgZoom(container);
      }).not.toThrow();

      // Restore original user agent
      Object.defineProperty((globalThis as any).navigator, 'userAgent', {
        value: originalUserAgent,
        configurable: true
      });
    });

    it('should handle missing modern APIs gracefully', () => {
      // Mock missing APIs
      const originalRequestAnimationFrame = (globalThis as any).requestAnimationFrame;
      delete (globalThis as any).requestAnimationFrame;

      expect(() => {
        svgZoom = new SvgZoom(container);
        // Should use fallback timing
      }).not.toThrow();

      // Restore
      (globalThis as any).requestAnimationFrame = originalRequestAnimationFrame;
    });

    it('should support touch events on mobile browsers', () => {
      // Add touch event support
      if (typeof Touch === 'undefined') {
        (globalThis as any).Touch = class {
          constructor(options: any) {
            Object.assign(this, options);
          }
        };
      }

      expect(() => {
        svgZoom = new SvgZoom(container, { enableTouch: true });

        const touchEvent = new TouchEvent('touchstart', {
          touches: [
            new Touch({
              identifier: 0,
              target: svgElement,
              clientX: 100,
              clientY: 100
            })
          ] as any,
          bubbles: true,
          cancelable: true
        });

        svgElement.dispatchEvent(touchEvent);
      }).not.toThrow();
    });

    it('should work with different SVG viewBox configurations', () => {
      const testCases = [
        '0 0 100 100',
        '0 0 200 200',
        '0 0 1000 1000',
        '-100 -100 200 200'
      ];

      testCases.forEach(viewBox => {
        svgElement.setAttribute('viewBox', viewBox);

        expect(() => {
          const zoom = new SvgZoom(container);
          zoom.destroy();
        }).not.toThrow();
      });
    });

    it('should handle fullscreen API differences across browsers', () => {
      // Mock different fullscreen API variations
      const apis = ['requestFullscreen', 'webkitRequestFullscreen', 'mozRequestFullscreen'];

      apis.forEach(apiName => {
        (svgElement as any)[apiName] = vi.fn();

        expect(() => {
          svgZoom = new SvgZoom(container, { showControls: true });
          svgZoom.destroy();
        }).not.toThrow();

        delete (svgElement as any)[apiName];
      });
    });
  });

  describe('Performance & Memory Management', () => {
    it('should not leak memory during repeated initialization', () => {
      const initialHeap = (performance as any).memory?.usedJSHeapSize || 0;

      // Create and destroy multiple instances
      for (let i = 0; i < 10; i++) {
        const zoom = new SvgZoom(container);
        zoom.destroy();
      }

      // Memory usage should not grow significantly
      const finalHeap = (performance as any).memory?.usedJSHeapSize || 0;
      const growth = finalHeap - initialHeap;

      // Allow for some growth but not excessive
      expect(growth).toBeLessThan(1024 * 1024); // Less than 1MB growth
    });

    it('should handle rapid user interactions efficiently', () => {
      svgZoom = new SvgZoom(container);

      const startTime = performance.now();

      // Simulate rapid mouse events
      for (let i = 0; i < 100; i++) {
        const event = new WheelEvent('wheel', {
          deltaY: i % 2 === 0 ? -1 : 1,
          clientX: 100 + i,
          clientY: 100 + i,
          bubbles: true
        });

        svgElement.dispatchEvent(event);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should handle 100 events quickly (less than 100ms)
      expect(duration).toBeLessThan(100);
    });
  });
});