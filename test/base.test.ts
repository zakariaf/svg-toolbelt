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

  it('should initialize with default configuration', () => {
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
    // scaledWidth = 200, scaledHeight = 200 (both < container * 0.9, so small content)
    // Small content gets full container freedom:
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
    // scaledWidth = 600, scaledHeight = 600 (both > container, so use 10% visible logic)
    // minVisibleWidth = 600 * 0.1 = 60
    // minVisibleHeight = 600 * 0.1 = 60
    // maxTranslateX = 600 - 60 = 540
    // maxTranslateY = 600 - 60 = 540
    expect(enhancer.translateX).toBe(540);
    expect(enhancer.translateY).toBe(540);

    // Test negative translation constraints
    enhancer.translateX = -2000;
    enhancer.translateY = -2000;
    enhancer.constrainPan();

    expect(enhancer.translateX).toBe(-540);
    expect(enhancer.translateY).toBe(-540);
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

    // With very small content (10x5 at scale 1), should allow full container panning
    // scaledWidth = 10, scaledHeight = 5 (both much smaller than container 400x300)
    // Small content gets full container freedom:
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
  });

  it('should handle missing width/height attributes gracefully', () => {
    const enhancer = new SvgEnhancer(container);
    enhancer.init();

    // Set up SVG with invalid attributes
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
  });

  it('should handle getBBox throwing an exception', () => {
    const enhancer = new SvgEnhancer(container);
    enhancer.init();

    // Set up SVG with valid viewBox
    svg.setAttribute('viewBox', '0 0 150 100');

    // Make getBBox throw an exception
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

    // Should fall back to viewBox and not crash
    enhancer.scale = 1;
    enhancer.translateX = 1000;
    enhancer.translateY = 1000;
    enhancer.constrainPan();

    expect(Number.isFinite(enhancer.translateX)).toBe(true);
    expect(Number.isFinite(enhancer.translateY)).toBe(true);
  });

  it('should initialize without crashing when no SVG is found', () => {
    const emptyContainer = document.createElement('div');
    document.body.appendChild(emptyContainer);

    const enhancer = new SvgEnhancer(emptyContainer);
    expect(enhancer.isDestroyed).toBe(true);
    enhancer.init(); // Should not crash

    document.body.removeChild(emptyContainer);
  });

  it('should handle destroy gracefully', () => {
    const enhancer = new SvgEnhancer(container);
    enhancer.init();

    enhancer.destroy();
    expect(enhancer.isDestroyed).toBe(true);

    // Should not crash on double destroy
    enhancer.destroy();
  });

  it('should handle containerRect getter', () => {
    const enhancer = new SvgEnhancer(container);
    enhancer.init();

    const rect = enhancer.containerRect;
    expect(rect).toBeDefined();
    expect(typeof rect.width).toBe('number');
    expect(typeof rect.height).toBe('number');
  });

  it('should work with SvgZoom integration', () => {
    const enhancer = new SvgZoom(container, { enableKeyboard: true });
    enhancer.init();

    expect(enhancer.features.zoom).toBeTruthy();
    expect(enhancer.features.pan).toBeTruthy();
    expect(enhancer.features.keyboard).toBeTruthy();
    expect(enhancer.features.touch).toBeTruthy();
  });
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
});
