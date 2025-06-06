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

    // Test at scale 1 - should allow moderate panning
    enhancer.scale = 1;
    enhancer.translateX = 1000;
    enhancer.translateY = 1000;
    enhancer.constrainPan();

    // Should be constrained but not to the old fixed limits
    expect(enhancer.translateX).toBeLessThan(1000);
    expect(enhancer.translateY).toBeLessThan(1000);
    expect(enhancer.translateX).toBeGreaterThan(0); // Should allow some positive translation
    expect(enhancer.translateY).toBeGreaterThan(0);

    // Test at higher zoom - should allow more panning
    enhancer.scale = 3;
    enhancer.translateX = 2000;
    enhancer.translateY = 2000;
    enhancer.constrainPan();

    // At higher zoom, should allow more translation
    expect(enhancer.translateX).toBeLessThan(2000);
    expect(enhancer.translateY).toBeLessThan(2000);
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
