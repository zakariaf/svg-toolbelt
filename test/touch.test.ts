import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import { SvgEnhancer } from '../src/core/base';
import { ZoomFeature } from '../src/features/zoom';
import { TouchFeature } from '../src/features/touch';

describe('TouchFeature (advanced)', () => {
  let container: HTMLElement;
  let svg: SVGSVGElement;
  let enhancer: SvgEnhancer;

  beforeEach(() => {
    container = document.createElement('div');
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    container.appendChild(svg);
    document.body.appendChild(container);

    // Mock getBoundingClientRect for zoom calculations
    container.getBoundingClientRect = vi.fn(() => ({
      left: 0, top: 0, width: 400, height: 300,
      right: 400, bottom: 300, x: 0, y: 0
    } as DOMRect));

    enhancer = new SvgEnhancer(container, { enableTouch: true });
    enhancer.init();
    enhancer.features.zoom = new ZoomFeature(enhancer) as any;
    enhancer.features.touch = new TouchFeature(enhancer) as any;
    enhancer.features.zoom.init();
    enhancer.features.touch.init();
  });

  afterEach(() => {
    enhancer.destroy();
    document.body.removeChild(container);
  });

  it('should handle single touch for panning', () => {
    const initialX = enhancer.translateX;
    const initialY = enhancer.translateY;

    // Start touch
    const touchStart = new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 } as Touch],
      bubbles: true
    });
    svg.dispatchEvent(touchStart);

    // Move touch
    const touchMove = new TouchEvent('touchmove', {
      touches: [{ clientX: 120, clientY: 130 } as Touch],
      bubbles: true
    });
    svg.dispatchEvent(touchMove);

    expect(enhancer.translateX).toBe(initialX + 20);
    expect(enhancer.translateY).toBe(initialY + 30);
  });

  it('should handle pinch-to-zoom with two touches', () => {
    const initialScale = enhancer.scale;

    // Start with two touches close together
    const touchStart = new TouchEvent('touchstart', {
      touches: [
        { clientX: 100, clientY: 100 } as Touch,
        { clientX: 110, clientY: 110 } as Touch
      ],
      bubbles: true
    });
    svg.dispatchEvent(touchStart);

    // Move touches apart (zoom in)
    const touchMove = new TouchEvent('touchmove', {
      touches: [
        { clientX: 90, clientY: 90 } as Touch,
        { clientX: 130, clientY: 130 } as Touch
      ],
      bubbles: true
    });
    svg.dispatchEvent(touchMove);

    expect(enhancer.scale).toBeGreaterThan(initialScale);
  });

  describe('TouchFeature: touchend handling', () => {
    it('should handle touchend event and stop dragging', () => {
      const container = document.createElement('div');
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      container.appendChild(svg);
      document.body.appendChild(container);

      const enhancer = new SvgEnhancer(container);
      const touchFeature = new TouchFeature(enhancer);
      touchFeature.init();

      // Start dragging by triggering touchstart
      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [
          { clientX: 100, clientY: 100 } as Touch,
        ],
      });
      svg.dispatchEvent(touchStartEvent);
      expect((touchFeature as any).isDragging).toBe(true);

      // Trigger touchend to stop dragging
      const touchEndEvent = new TouchEvent('touchend', {
        touches: [],
      });
      svg.dispatchEvent(touchEndEvent);

      // Verify dragging is stopped
      expect((touchFeature as any).isDragging).toBe(false);

      document.body.removeChild(container);
    });
  });
});