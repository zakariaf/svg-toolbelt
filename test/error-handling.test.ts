import { describe, it, expect } from 'vitest';
import { SvgEnhancer } from '../src/core/base';
import { FullscreenFeature } from '../src/features/fullscreen';

describe('Error Handling', () => {
  it('should handle missing DOM APIs gracefully', () => {
    // Mock missing fullscreen API
    const originalFullscreenEnabled = document.fullscreenEnabled;
    delete (document as any).fullscreenEnabled;

    const container = document.createElement('div');
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
    const container = document.createElement('div');
    // Add a div instead of SVG (no SVG found scenario)
    const fakeElement = document.createElement('div');
    container.appendChild(fakeElement);

    const enhancer = new SvgEnhancer(container);
    expect(enhancer.isDestroyed).toBe(true);
  });
});