import { describe, it, expect } from 'vitest';
import { SvgEnhancer } from '../src/core/base';
import { ZoomFeature } from '../src/features/zoom';

describe('Performance and Memory Management', () => {
  it('should not leak memory when creating/destroying multiple instances', () => {
    const instances: SvgEnhancer[] = [];

    // Create many instances
    for (let i = 0; i < 50; i++) {
      const container = document.createElement('div');
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      container.appendChild(svg);
      document.body.appendChild(container);

      const enhancer = new SvgEnhancer(container);
      enhancer.init();
      instances.push(enhancer);
    }

    // Destroy all instances
    instances.forEach(instance => {
      instance.destroy();
      expect(instance.isDestroyed).toBe(true);
    });

    // Clean up DOM
    document.body.innerHTML = '';

    // Should complete without errors
    expect(instances.length).toBe(50);
  });

  it('should handle rapid zoom operations smoothly', () => {
    const container = document.createElement('div');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    container.appendChild(svg);
    document.body.appendChild(container);

    const enhancer = new SvgEnhancer(container);
    enhancer.init();
    enhancer.features.zoom = new ZoomFeature(enhancer) as any;
    enhancer.features.zoom.init();

    const startTime = performance.now();

    // Perform many rapid zoom operations
    for (let i = 0; i < 100; i++) {
      enhancer.features.zoom.zoomIn();
      enhancer.features.zoom.zoomOut();
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Should complete quickly (less than 100ms for 100 operations)
    expect(duration).toBeLessThan(100);

    // Should end up close to original scale
    expect(enhancer.scale).toBeCloseTo(1, 1);

    enhancer.destroy();
    document.body.removeChild(container);
  });
});