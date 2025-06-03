import { describe, it, expect } from 'vitest';
import { SvgEnhancer } from '../src/core/base';
import { ZoomFeature } from '../src/features/zoom';
import { DEFAULT_SVG_ENHANCER_CONFIG } from '../src/core/config';

describe('Configuration Management', () => {
  it('should merge custom config with defaults', () => {
    const container = document.createElement('div');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    container.appendChild(svg);

    const customConfig = {
      minScale: 0.2,
      maxScale: 5,
      zoomStep: 0.05
    };

    const enhancer = new SvgEnhancer(container, customConfig);

    expect(enhancer.config.minScale).toBe(0.2);
    expect(enhancer.config.maxScale).toBe(5);
    expect(enhancer.config.zoomStep).toBe(0.05);
    // Should keep defaults for unspecified values
    expect(enhancer.config.enableTouch).toBe(DEFAULT_SVG_ENHANCER_CONFIG.enableTouch);
  });

  it('should respect scale limits during zoom', () => {
    const container = document.createElement('div');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    container.appendChild(svg);

    const enhancer = new SvgEnhancer(container, {
      minScale: 0.5,
      maxScale: 2
    });
    enhancer.init();
    enhancer.features.zoom = new ZoomFeature(enhancer) as any;
    enhancer.features.zoom.init();

    // Try to zoom below minimum
    enhancer.scale = 0.5;
    enhancer.features.zoom.zoomOut();
    expect(enhancer.scale).toBe(0.5); // Should not go below min

    // Try to zoom above maximum
    enhancer.scale = 2;
    enhancer.features.zoom.zoomIn();
    expect(enhancer.scale).toBe(2); // Should not go above max
  });
});