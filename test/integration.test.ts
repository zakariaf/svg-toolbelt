/**
 * Integration test: simulate adding a dynamic container,
 * calling initializeSvgToolbelt, and verifying wrapper and data attributes.
 */

import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';
import { initializeSvgToolbelt } from '../src';

describe('initializeSvgToolbelt (integration)', () => {
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

  it('should wrap the container and initialize SvgToolbelt instance', () => {
    initializeSvgToolbelt('.custom-zoomable');
    const wrapper = document.querySelector('.svg-toolbelt-wrapper');
    expect(wrapper).not.toBeNull();
    // instance stored on wrapper
    const instance = (wrapper as any).svgToolbeltInstance;
    expect(instance).toBeDefined();
    expect(wrapper!.getAttribute('data-svg-toolbelt-initialized')).toBe('true');
  });

  it('should not re-initialize an already initialized container', () => {
    initializeSvgToolbelt(container as any, {});
    const wrappers = document.querySelectorAll('.svg-toolbelt-wrapper');
    expect(wrappers.length).toBe(1);

    // Call again
    initializeSvgToolbelt(container as any, {});
    expect(document.querySelectorAll('.svg-toolbelt-wrapper').length).toBe(1);
  });

  describe('Error handling scenarios', () => {
    it('should log info when no containers found', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      // Call with empty selector result
      initializeSvgToolbelt('.non-existent-selector');

      expect(consoleSpy).toHaveBeenCalledWith('SvgToolbelt: No containers found to initialize');

      consoleSpy.mockRestore();
    });

    it('should log warning when no SVG found in container', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Create container without SVG
      const containerWithoutSvg = document.createElement('div');
      document.body.appendChild(containerWithoutSvg);

      initializeSvgToolbelt([containerWithoutSvg]);

      expect(warnSpy).toHaveBeenCalledWith('SvgToolbelt: No <svg> found in container #1');

      consoleSpy.mockRestore();
      warnSpy.mockRestore();
    });

    it('should handle exceptions during initialization', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Create a scenario that throws an error
      const mockContainer = document.createElement('div');
      const mockSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      mockContainer.appendChild(mockSvg);
      document.body.appendChild(mockContainer);

      // Mock parentNode to be null to cause an error
      Object.defineProperty(mockContainer, 'parentNode', {
        get: () => null,
        configurable: true
      });

      initializeSvgToolbelt([mockContainer]);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('SvgToolbelt: Failed to initialize #1:'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});
