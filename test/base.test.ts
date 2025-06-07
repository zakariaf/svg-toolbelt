/**
 * Tests for SvgEnhancer core logic (no DOM manipulation)
 */

import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';
import { SvgEnhancer } from '../src/core/base';
import { SvgZoom } from '../src/index';

describe('SvgEnhancer (core)', () => {
  let container: HTMLElement;
  let svg: SVGSVGElement;

  beforeEach(() => {
    // Set up a container with an <svg> child
    container = document.createElement('div');
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    container.appendChild(svg);
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should initialize even if no <svg> found and mark as destroyed', () => {
    const emptyContainer = document.createElement('div');
    const enhancer = new SvgEnhancer(emptyContainer);
    expect(enhancer.isDestroyed).toBe(true);
  });

  it('should set up CSS classes on init', () => {
    const enhancer = new SvgEnhancer(container);
    expect(enhancer.isDestroyed).toBe(false);
    enhancer.init();
    expect(container.classList.contains('svg-toolbelt-container')).toBe(true);
    expect(svg.classList.contains('svg-toolbelt-svg')).toBe(true);
  });

  it('should constrain pan based on content size and zoom level', () => {
    const enhancer = new SvgEnhancer(container);
    enhancer.init();

    // Set up SVG with known dimensions
    svg.setAttribute('width', '200');
    svg.setAttribute('height', '200');
    svg.setAttribute('viewBox', '0 0 200 200');

    // Add getBBox method to SVG element for JSDOM compatibility
    (svg as any).getBBox = vi.fn().mockReturnValue({
      x: 0,
      y: 0,
      width: 200,
      height: 200
    });

    // Mock getBoundingClientRect for container
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      width: 400,
      height: 300,
      left: 0,
      top: 0,
      right: 400,
      bottom: 300,
      x: 0,
      y: 0,
      toJSON: () => ({})
    } as DOMRect);

    // Test at scale 1 - SVG (200x200) is smaller than container (400x300)
    enhancer.scale = 1;
    enhancer.translateX = 1000;
    enhancer.translateY = 1000;
    enhancer.constrainPan();

    // With container 400x300, SVG 200x200, scale 1:
    // scaledWidth (200) < containerWidth (400) * 0.9 (360), so use small content logic
    // scaledHeight (200) < containerHeight (300) * 0.9 (270), so use small content logic
    // maxTranslateX = containerWidth = 400
    // maxTranslateY = containerHeight = 300
    expect(enhancer.translateX).toBe(400);
    expect(enhancer.translateY).toBe(300);

    // Test at higher zoom - should allow more panning when content exceeds container
    enhancer.scale = 3;
    enhancer.translateX = 2000;
    enhancer.translateY = 2000;
    enhancer.constrainPan();

    // With container 400x300, SVG 200x200, scale 3:
    // scaledWidth (600) > containerWidth (400) * 0.9 (360), so use large content logic
    // scaledHeight (600) > containerHeight (300) * 0.9 (270), so use large content logic
    // minVisibleWidth = 600 * 0.1 = 60, maxTranslateX = 600 - 60 = 540
    // minVisibleHeight = 600 * 0.1 = 60, maxTranslateY = 600 - 60 = 540
    expect(enhancer.translateX).toBe(540);
    expect(enhancer.translateY).toBe(540);

    // Test negative translation constraints
    enhancer.translateX = -2000;
    enhancer.translateY = -2000;
    enhancer.constrainPan();

    // Should be constrained to negative maxTranslate values
    expect(enhancer.translateX).toBe(-540);
    expect(enhancer.translateY).toBe(-540);
  });

  it('destroy() should remove features and listeners', () => {
    const enhancer = new SvgEnhancer(container);
    enhancer.init();
    // Mock a dummy listener
    const cb = vi.fn();
    enhancer.on('test', cb);
    expect(enhancer.emit('test')).toBe(true);
    enhancer.destroy();
    expect(enhancer.isDestroyed).toBe(true);
    expect(enhancer.emit('test')).toBe(false);
  });

  it('should handle invalid SVG dimension attributes gracefully', () => {
    const enhancer = new SvgEnhancer(container);
    enhancer.init();

    // Set up SVG with invalid dimension attributes
    svg.setAttribute('width', 'invalid');
    svg.setAttribute('height', 'foo');
    svg.removeAttribute('viewBox');

    // Remove getBBox to force fallback to attributes
    delete (svg as any).getBBox;
    (svg as any).viewBox = undefined;

    // Mock getBoundingClientRect for container
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      width: 400,
      height: 300,
      left: 0,
      top: 0,
      right: 400,
      bottom: 300,
      x: 0,
      y: 0,
      toJSON: () => ({})
    } as DOMRect);

    // Should fall back to default dimensions and not crash
    enhancer.scale = 1;
    enhancer.translateX = 1000;
    enhancer.translateY = 1000;
    enhancer.constrainPan();

    // Should use fallback dimensions (400x300) and constrain properly
    expect(Number.isFinite(enhancer.translateX)).toBe(true);
    expect(Number.isFinite(enhancer.translateY)).toBe(true);
    expect(isNaN(enhancer.translateX)).toBe(false);
    expect(isNaN(enhancer.translateY)).toBe(false);
  });

  it('should handle very small content with adaptive padding', () => {
    const enhancer = new SvgEnhancer(container);
    enhancer.init();

    // Set up SVG with very small dimensions
    svg.setAttribute('width', '10');
    svg.setAttribute('height', '5');
    svg.setAttribute('viewBox', '0 0 10 5');

    // Add getBBox method to SVG element for JSDOM compatibility
    (svg as any).getBBox = vi.fn().mockReturnValue({
      x: 0,
      y: 0,
      width: 10,
      height: 5
    });

    // Mock getBoundingClientRect for container
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      width: 400,
      height: 300,
      left: 0,
      top: 0,
      right: 400,
      bottom: 300,
      x: 0,
      y: 0,
      toJSON: () => ({})
    } as DOMRect);

    // Test at scale 1 with very small content
    enhancer.scale = 1;
    enhancer.translateX = 1000;
    enhancer.translateY = 1000;
    enhancer.constrainPan();

    // With very small content (10x5 at scale 1), it should be treated as small content
    // scaledWidth = 10, scaledHeight = 5
    // Container: 400x300, so content is much smaller than container
    // scaledWidth (10) < containerWidth (400) * 0.9 (360), so use small content logic
    // scaledHeight (5) < containerHeight (300) * 0.9 (270), so use small content logic
    // maxTranslateX = containerWidth = 400
    // maxTranslateY = containerHeight = 300
    expect(enhancer.translateX).toBe(400);
    expect(enhancer.translateY).toBe(300);
    expect(Number.isFinite(enhancer.translateX)).toBe(true);
    expect(Number.isFinite(enhancer.translateY)).toBe(true);

    // Test negative translation constraints for small content
    enhancer.translateX = -1000;
    enhancer.translateY = -1000;
    enhancer.constrainPan();

    expect(enhancer.translateX).toBe(-400);
    expect(enhancer.translateY).toBe(-300);
  });

  it('should handle zero-dimension SVG gracefully', () => {
    const enhancer = new SvgEnhancer(container);
    enhancer.init();

    // Set up SVG with zero dimensions
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.removeAttribute('viewBox');

    // Remove getBBox to force fallback to attributes
    delete (svg as any).getBBox;
    (svg as any).viewBox = undefined;

    // Mock getBoundingClientRect for container
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      width: 400,
      height: 300,
      left: 0,
      top: 0,
      right: 400,
      bottom: 300,
      x: 0,
      y: 0,
      toJSON: () => ({})
    } as DOMRect);

    // Should fall back to default dimensions
    enhancer.scale = 1;
    enhancer.translateX = 1000;
    enhancer.translateY = 1000;
    enhancer.constrainPan();

    expect(Number.isFinite(enhancer.translateX)).toBe(true);
    expect(Number.isFinite(enhancer.translateY)).toBe(true);
    expect(isNaN(enhancer.translateX)).toBe(false);
    expect(isNaN(enhancer.translateY)).toBe(false);
  });

  it('should handle missing or malformed viewBox attributes', () => {
    const enhancer = new SvgEnhancer(container);
    enhancer.init();

    // Set up SVG with malformed viewBox
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    svg.setAttribute('viewBox', 'invalid viewbox string');

    // Remove getBBox to force fallback to viewBox parsing
    delete (svg as any).getBBox;

    // Mock viewBox with invalid data
    Object.defineProperty(svg, 'viewBox', {
      value: {
        baseVal: {
          width: NaN,
          height: NaN
        }
      },
      configurable: true
    });

    // Mock getBoundingClientRect for container
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      width: 400,
      height: 300,
      left: 0,
      top: 0,
      right: 400,
      bottom: 300,
      x: 0,
      y: 0,
      toJSON: () => ({})
    } as DOMRect);

    // Should fall back to default dimensions and not crash
    enhancer.scale = 1;
    enhancer.translateX = 1000;
    enhancer.translateY = 1000;
    enhancer.constrainPan();

    expect(Number.isFinite(enhancer.translateX)).toBe(true);
    expect(Number.isFinite(enhancer.translateY)).toBe(true);
    expect(isNaN(enhancer.translateX)).toBe(false);
    expect(isNaN(enhancer.translateY)).toBe(false);
  });

  it('should test individual SVG bounds detection methods', () => {
    const enhancer = new SvgEnhancer(container);
    enhancer.init();

    // Test getBBox method
    (svg as any).getBBox = vi.fn().mockReturnValue({
      x: 0, y: 0, width: 100, height: 80
    });

    // Access private method for testing
    const tryGetBBox = (enhancer as any)._tryGetBoundsFromBBox();
    expect(tryGetBBox).toEqual({ width: 100, height: 80 });

    // Test getBBox failure
    delete (svg as any).getBBox;
    const noBBox = (enhancer as any)._tryGetBoundsFromBBox();
    expect(noBBox).toBeNull();

    // Test viewBox method
    Object.defineProperty(svg, 'viewBox', {
      value: { baseVal: { width: 200, height: 150 } },
      configurable: true
    });
    const tryGetViewBox = (enhancer as any)._tryGetBoundsFromViewBox();
    expect(tryGetViewBox).toEqual({ width: 200, height: 150 });

    // Test viewBox with invalid data
    Object.defineProperty(svg, 'viewBox', {
      value: { baseVal: { width: NaN, height: NaN } },
      configurable: true
    });
    const invalidViewBox = (enhancer as any)._tryGetBoundsFromViewBox();
    expect(invalidViewBox).toBeNull();

    // Test attributes method
    svg.setAttribute('width', '300');
    svg.setAttribute('height', '250');
    const fromAttributes = (enhancer as any)._getBoundsFromAttributesOrDefault();
    expect(fromAttributes).toEqual({ width: 300, height: 250 });

    // Test fallback to defaults
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    const fallbackDefaults = (enhancer as any)._getBoundsFromAttributesOrDefault();
    expect(fallbackDefaults).toEqual({ width: 400, height: 300 });
  });

  it('should handle edge case where content exactly matches threshold', () => {
    const enhancer = new SvgEnhancer(container);
    enhancer.init();

    // Set up SVG to be exactly at the threshold (90% of container)
    svg.setAttribute('width', '360'); // 400 * 0.9 = 360
    svg.setAttribute('height', '270'); // 300 * 0.9 = 270
    svg.setAttribute('viewBox', '0 0 360 270');

    // Add getBBox method to SVG element for JSDOM compatibility
    (svg as any).getBBox = vi.fn().mockReturnValue({
      x: 0,
      y: 0,
      width: 360,
      height: 270
    });

    // Mock getBoundingClientRect for container
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      width: 400,
      height: 300,
      left: 0,
      top: 0,
      right: 400,
      bottom: 300,
      x: 0,
      y: 0,
      toJSON: () => ({})
    } as DOMRect);

    // Test at scale 1 - content exactly at threshold
    enhancer.scale = 1;
    enhancer.translateX = 1000;
    enhancer.translateY = 1000;
    enhancer.constrainPan();

    // scaledWidth (360) = containerWidth (400) * 0.9 (360), so NOT < threshold, use large content logic
    // scaledHeight (270) = containerHeight (300) * 0.9 (270), so NOT < threshold, use large content logic
    // minVisibleWidth = 360 * 0.1 = 36, maxTranslateX = 360 - 36 = 324
    // minVisibleHeight = 270 * 0.1 = 27, maxTranslateY = 270 - 27 = 243
    expect(enhancer.translateX).toBe(324);
    expect(enhancer.translateY).toBe(243);
  });

  it('should handle constrainPan when svg is null', () => {
    // Create enhancer with no SVG
    const emptyContainer = document.createElement('div');
    const enhancer = new SvgEnhancer(emptyContainer);

    // Set some translation values
    enhancer.translateX = 100;
    enhancer.translateY = 200;

    // constrainPan should exit early and not modify values
    enhancer.constrainPan();

    expect(enhancer.translateX).toBe(100);
    expect(enhancer.translateY).toBe(200);
  });

  it('should handle large content with mixed constraint axes', () => {
    const enhancer = new SvgEnhancer(container);
    enhancer.init();

    // Set up SVG where width is large but height is small
    svg.setAttribute('width', '500'); // Large: 500 > 400 * 0.9 (360)
    svg.setAttribute('height', '100'); // Small: 100 < 300 * 0.9 (270)
    svg.setAttribute('viewBox', '0 0 500 100');

    // Add getBBox method to SVG element for JSDOM compatibility
    (svg as any).getBBox = vi.fn().mockReturnValue({
      x: 0,
      y: 0,
      width: 500,
      height: 100
    });

    // Mock getBoundingClientRect for container
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      width: 400,
      height: 300,
      left: 0,
      top: 0,
      right: 400,
      bottom: 300,
      x: 0,
      y: 0,
      toJSON: () => ({})
    } as DOMRect);

    enhancer.scale = 1;
    enhancer.translateX = 1000;
    enhancer.translateY = 1000;
    enhancer.constrainPan();

    // Width: scaledWidth (500) > containerWidth (400) * 0.9 (360), so use large content logic
    // minVisibleWidth = 500 * 0.1 = 50, maxTranslateX = 500 - 50 = 450
    // Height: scaledHeight (100) < containerHeight (300) * 0.9 (270), so use small content logic
    // maxTranslateY = containerHeight = 300
    expect(enhancer.translateX).toBe(450);
    expect(enhancer.translateY).toBe(300);
  });

  it('should handle getBBox method throwing an exception', () => {
    const enhancer = new SvgEnhancer(container);
    enhancer.init();

    // Set up SVG with getBBox that throws an exception
    svg.setAttribute('width', '200');
    svg.setAttribute('height', '150');

    // Make getBBox throw an exception to test error handling
    (svg as any).getBBox = vi.fn().mockImplementation(() => {
      throw new Error('getBBox failed');
    });

    // Mock getBoundingClientRect for container
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      width: 400,
      height: 300,
      left: 0,
      top: 0,
      right: 400,
      bottom: 300,
      x: 0,
      y: 0,
      toJSON: () => ({})
    } as DOMRect);

    // Should fall back to viewBox and then attributes
    enhancer.scale = 1;
    enhancer.translateX = 1000;
    enhancer.translateY = 1000;
    enhancer.constrainPan();

    // Should use fallback dimensions from attributes (200x150) and constrain properly
    expect(Number.isFinite(enhancer.translateX)).toBe(true);
    expect(Number.isFinite(enhancer.translateY)).toBe(true);
    expect(enhancer.translateX).toBe(400); // Small content logic: maxTranslateX = containerWidth
    expect(enhancer.translateY).toBe(300); // Small content logic: maxTranslateY = containerHeight
  });

  it('should handle viewBox method throwing an exception', () => {
    const enhancer = new SvgEnhancer(container);
    enhancer.init();

    // Remove getBBox to force viewBox usage
    delete (svg as any).getBBox;

    // Set up SVG with attributes as fallback
    svg.setAttribute('width', '180');
    svg.setAttribute('height', '120');

    // Make viewBox access throw an exception
    Object.defineProperty(svg, 'viewBox', {
      get: () => {
        throw new Error('viewBox access failed');
      },
      configurable: true
    });

    // Mock getBoundingClientRect for container
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      width: 400,
      height: 300,
      left: 0,
      top: 0,
      right: 400,
      bottom: 300,
      x: 0,
      y: 0,
      toJSON: () => ({})
    } as DOMRect);

    // Should fall back to attributes
    enhancer.scale = 1;
    enhancer.translateX = 1000;
    enhancer.translateY = 1000;
    enhancer.constrainPan();

    // Should use fallback dimensions from attributes (180x120) and constrain properly
    expect(Number.isFinite(enhancer.translateX)).toBe(true);
    expect(Number.isFinite(enhancer.translateY)).toBe(true);
    expect(enhancer.translateX).toBe(400); // Small content logic: maxTranslateX = containerWidth
    expect(enhancer.translateY).toBe(300); // Small content logic: maxTranslateY = containerHeight
  });

  it('should handle init() called on destroyed instance (covers base.ts:58)', () => {
    const emptyContainer = document.createElement('div');
    const enhancer = new SvgEnhancer(emptyContainer);

    // Should be destroyed since no SVG
    expect(enhancer.isDestroyed).toBe(true);

    // Call init on destroyed instance - should return early
    expect(() => enhancer.init()).not.toThrow();

    // Should still be destroyed
    expect(enhancer.isDestroyed).toBe(true);
  });

  it('should handle complete bounds detection fallback chain (covers base.ts:267)', () => {
    // Create an SVG with no bounds information to force fallback chain
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    container.appendChild(svg);

    // Remove all dimension attributes
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    svg.removeAttribute('viewBox');

    // Mock getBBox to fail
    (svg as any).getBBox = vi.fn().mockImplementation(() => {
      throw new Error('getBBox not supported');
    });

    // Mock viewBox property to fail
    Object.defineProperty(svg, 'viewBox', {
      get: () => {
        throw new Error('viewBox access failed');
      },
      configurable: true
    });

    const enhancer = new SvgEnhancer(container);
    enhancer.init();

    // Force bounds detection which should hit the final fallback
    const bounds = (enhancer as any)._getSvgBounds();

    // Should fallback to default dimensions
    expect(bounds).toEqual({
      width: 400,
      height: 300
    });
  });

  // ...existing code...
});

describe('SvgZoom public API', () => {
  let container: HTMLElement;
  let svg: SVGSVGElement;

  beforeEach(() => {
    container = document.createElement('div');
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100');
    svg.setAttribute('height', '100');
    container.appendChild(svg);
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should expose zoomIn and zoomOut methods', () => {
    const enhancer = new SvgZoom(container);
    enhancer.init();

    const initialScale = enhancer.scale;

    // Test zoomIn
    enhancer.zoomIn();
    expect(enhancer.scale).toBeGreaterThan(initialScale);

    // Test zoomOut
    const zoomedScale = enhancer.scale;
    enhancer.zoomOut();
    expect(enhancer.scale).toBeLessThan(zoomedScale);
  });

  it('should handle keyboard feature edge case', () => {
    const enhancer = new SvgZoom(container, { enableKeyboard: true });
    enhancer.init();

    // Test potential edge case in keyboard handling
    expect(enhancer.features.keyboard).toBeTruthy();
  });

  it('should handle touch feature edge case', () => {
    const enhancer = new SvgZoom(container, { enableTouch: true });
    enhancer.init();

    // Test touch feature initialization
    expect(enhancer.features.touch).toBeTruthy();
  });

  it('should reset transform and emit reset event', () => {
    const enhancer = new SvgEnhancer(container);
    enhancer.init();

    // Set some transform values
    enhancer.scale = 2;
    enhancer.translateX = 100;
    enhancer.translateY = 50;

    const resetEventSpy = vi.fn();
    enhancer.on('reset', resetEventSpy);

    enhancer.reset();

    // Check that values are reset
    expect(enhancer.scale).toBe(1);
    expect(enhancer.translateX).toBe(0);
    expect(enhancer.translateY).toBe(0);

    // Check that reset event was emitted
    expect(resetEventSpy).toHaveBeenCalledWith({
      translateX: 0,
      translateY: 0,
      scale: 1,
    });
  });

  it('should apply transform without transition', () => {
    const enhancer = new SvgEnhancer(container);
    enhancer.init();

    enhancer.scale = 1.5;
    enhancer.translateX = 50;
    enhancer.translateY = 25;

    enhancer.applyTransform();

    expect(svg.style.transition).toBe('none');
    expect(svg.style.transform).toBe('translate(50px, 25px) scale(1.5)');
  });

  it('should apply transform with transition', async () => {
    const enhancer = new SvgEnhancer(container);
    enhancer.init();

    enhancer.scale = 0.8;
    enhancer.translateX = -30;
    enhancer.translateY = 40;

    enhancer.applyTransformWithTransition();

    expect(svg.style.transition).toBe(`transform ${enhancer.config.transitionDuration}ms ease-out`);
    expect(svg.style.transform).toBe('translate(-30px, 40px) scale(0.8)');

    // Wait for the transition to complete and check that transition is removed
    await new Promise(resolve => setTimeout(resolve, enhancer.config.transitionDuration + 10));
    expect(svg.style.transition).toBe('none');
  });

  it('should handle reset when destroyed', () => {
    const enhancer = new SvgEnhancer(container);
    enhancer.init();
    enhancer.destroy();

    const resetEventSpy = vi.fn();
    enhancer.on('reset', resetEventSpy);

    enhancer.reset();

    // Should not emit event or change values when destroyed
    expect(resetEventSpy).not.toHaveBeenCalled();
  });

  it('should handle applyTransform when destroyed', () => {
    const enhancer = new SvgEnhancer(container);
    enhancer.init();
    const originalTransform = svg.style.transform;
    enhancer.destroy();

    enhancer.applyTransform();

    // Transform should not change when destroyed
    expect(svg.style.transform).toBe(originalTransform);
  });

  it('should handle applyTransformWithTransition when destroyed', () => {
    const enhancer = new SvgEnhancer(container);
    enhancer.init();
    const originalTransform = svg.style.transform;
    enhancer.destroy();

    enhancer.applyTransformWithTransition();

    // Transform should not change when destroyed
    expect(svg.style.transform).toBe(originalTransform);
  });

  it('should handle rapid successive calls to applyTransformWithTransition', async () => {
    const enhancer = new SvgEnhancer(container);
    enhancer.init();

    enhancer.scale = 1.5;
    enhancer.translateX = 50;
    enhancer.translateY = 25;

    // First call
    enhancer.applyTransformWithTransition();
    expect(svg.style.transition).toBe(`transform ${enhancer.config.transitionDuration}ms ease-out`);

    // Rapid second call should clear the first timeout
    enhancer.scale = 2.0;
    enhancer.translateX = 100;
    enhancer.translateY = 50;
    enhancer.applyTransformWithTransition();

    // Should still have transition set for the second call
    expect(svg.style.transition).toBe(`transform ${enhancer.config.transitionDuration}ms ease-out`);
    expect(svg.style.transform).toBe('translate(100px, 50px) scale(2)');

    // Wait for the transition to complete
    await new Promise(resolve => setTimeout(resolve, enhancer.config.transitionDuration + 10));
    expect(svg.style.transition).toBe('none');
  });

  it('should clear transition timeout on destroy', () => {
    const enhancer = new SvgEnhancer(container);
    enhancer.init();

    // Start a transition
    enhancer.applyTransformWithTransition();
    expect(svg.style.transition).toBe(`transform ${enhancer.config.transitionDuration}ms ease-out`);

    // Destroy should clear the timeout
    enhancer.destroy();

    // Even if we wait for the original timeout duration, transition should not be cleared
    // because the timeout was cleared on destroy
    // Note: We can't easily test this directly, but the destroy method should not throw
    expect(() => enhancer.destroy()).not.toThrow();
  });

  it('should handle SvgZoom constructor with no SVG (covers index.ts early return)', () => {
    // Test SvgZoom specifically (not just SvgEnhancer) with no SVG
    const emptyContainer = document.createElement('div');
    const svgZoom = new SvgZoom(emptyContainer);

    // Should be destroyed and features should be empty
    expect(svgZoom.isDestroyed).toBe(true);
    expect(Object.keys(svgZoom.features)).toHaveLength(0);

    // Methods should be safe to call even when destroyed
    expect(() => svgZoom.zoomIn()).not.toThrow();
    expect(() => svgZoom.zoomOut()).not.toThrow();
    expect(() => svgZoom.init()).not.toThrow();
  });
});
