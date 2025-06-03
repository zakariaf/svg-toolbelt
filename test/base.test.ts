/**
 * Tests for SvgEnhancer core logic (no DOM manipulation)
 */

import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';
import { SvgEnhancer } from '../src/core/base';
import { SvgZoom } from '../src/index';
import { DEFAULT_SVG_ENHANCER_CONFIG } from '../src/core/config';

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

  it('should constrain pan within limits', () => {
    const enhancer = new SvgEnhancer(container);
    enhancer.init();
    enhancer.translateX = 5000;
    enhancer.translateY = -5000;
    enhancer.constrainPan();
    expect(enhancer.translateX).toBe(DEFAULT_SVG_ENHANCER_CONFIG.maxPanX);
    expect(enhancer.translateY).toBe(-DEFAULT_SVG_ENHANCER_CONFIG.maxPanY);
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
