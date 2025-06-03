/**
 * Integration test: simulate adding a dynamic container,
 * calling initializeSvgZoom, and verifying wrapper and data attributes.
 */

import { describe, beforeEach, afterEach, it, expect } from 'vitest';
import { initializeSvgZoom } from '../src';

describe('initializeSvgZoom (integration)', () => {
  let container: HTMLElement;
  let svg: SVGSVGElement;

  beforeEach(() => {
    container = document.createElement('div');
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    container.appendChild(svg);
    container.className = 'custom-zoomable';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should wrap the container and initialize SvgZoom instance', () => {
    initializeSvgZoom('.custom-zoomable');
    const wrapper = document.querySelector('.svg-toolbelt-wrapper');
    expect(wrapper).not.toBeNull();
    // instance stored on wrapper
    const instance = (wrapper as any).svgZoomInstance;
    expect(instance).toBeDefined();
    expect(wrapper!.getAttribute('data-svg-toolbelt-initialized')).toBe('true');
  });

  it('should not re-initialize an already initialized container', () => {
    initializeSvgZoom(container as any, {});
    const wrappers = document.querySelectorAll('.svg-toolbelt-wrapper');
    expect(wrappers.length).toBe(1);

    // Call again
    initializeSvgZoom(container as any, {});
    expect(document.querySelectorAll('.svg-toolbelt-wrapper').length).toBe(1);
  });
});
