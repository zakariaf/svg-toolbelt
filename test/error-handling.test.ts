import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SvgEnhancer } from '../src/core/base';
import { SvgToolbelt } from '../src/index';
import { FullscreenFeature } from '../src/features/fullscreen';

describe('Error Handling', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should handle missing DOM APIs gracefully', () => {
    // Mock missing fullscreen API
    const originalFullscreenEnabled = document.fullscreenEnabled;
    delete (document as any).fullscreenEnabled;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    container.appendChild(svg);

    expect(() => {
      const enhancer = new SvgEnhancer(container);
      enhancer.init();
      enhancer.features.fullscreen = new FullscreenFeature(enhancer) as any;
      enhancer.features.fullscreen.toggleFullscreen();
    }).not.toThrow();

    // Restore
    (document as any).fullscreenEnabled = originalFullscreenEnabled;
  });

  it('should handle invalid container gracefully', () => {
    const nullContainer = null as any;

    expect(() => {
      new SvgEnhancer(nullContainer);
    }).toThrow();
  });

  it('should handle malformed SVG elements', () => {
    // Add a div instead of SVG (no SVG found scenario)
    const fakeElement = document.createElement('div');
    container.appendChild(fakeElement);

    const enhancer = new SvgEnhancer(container);
    expect(enhancer.isDestroyed).toBe(true);
  });

  describe('Edge Cases and Fallbacks', () => {
    it('should handle SvgToolbelt constructor early return when no SVG is found', () => {
      // Container with no SVG element
      expect(() => {
        const svgToolbelt = new SvgToolbelt(container);
        // When no SVG is found, isDestroyed should be true
        expect(svgToolbelt.isDestroyed).toBe(true);
      }).not.toThrow();
    });

    it('should handle getBBox fallback chain completely', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      container.appendChild(svg);

      // Remove all dimension information to force fallback chain
      svg.removeAttribute('width');
      svg.removeAttribute('height');
      svg.removeAttribute('viewBox');

      // Make getBBox throw an error
      (svg as any).getBBox = vi.fn().mockImplementation(() => {
        throw new Error('getBBox failed');
      });

      // Make viewBox access fail
      Object.defineProperty(svg, 'viewBox', {
        get: () => {
          throw new Error('viewBox access failed');
        },
        configurable: true
      });

      expect(() => {
        const svgToolbelt = new SvgToolbelt(container);
        svgToolbelt.destroy();
      }).not.toThrow();
    });

    it('should handle constraints with missing containerRect', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      container.appendChild(svg);

      const enhancer = new SvgEnhancer(container);
      enhancer.init();

      // Test when container is not in DOM (getBoundingClientRect returns zeros)
      const originalGetBoundingClientRect = container.getBoundingClientRect;
      container.getBoundingClientRect = vi.fn().mockReturnValue({
        left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0
      });

      expect(() => {
        enhancer.constrainPan();
      }).not.toThrow();

      // Restore
      container.getBoundingClientRect = originalGetBoundingClientRect;
      enhancer.destroy();
    });

    it('should handle missing feature methods gracefully', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      container.appendChild(svg);

      const enhancer = new SvgEnhancer(container);
      enhancer.init();

      // Test when zoom feature is not initialized
      enhancer.features.zoom = null as any;

      // Should not throw when feature is missing
      expect(() => {
        const wheelEvent = new WheelEvent('wheel', {
          deltaY: -100,
          clientX: 50,
          clientY: 50,
          bubbles: true
        });
        svg.dispatchEvent(wheelEvent);
      }).not.toThrow();

      enhancer.destroy();
    });
  });
});