import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import { SvgEnhancer } from '../src/core/base';
import { ZoomFeature } from '../src/features/zoom';
import { ZoomLevelIndicatorFeature } from '../src/features/zoomLevelIndicator';

describe('ZoomLevelIndicatorFeature', () => {
  let container: HTMLElement;
  let svg: SVGSVGElement;
  let enhancer: SvgEnhancer;
  let zoomLevelIndicator: ZoomLevelIndicatorFeature;

  beforeEach(() => {
    container = document.createElement('div');
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100');
    svg.setAttribute('height', '100');
    container.appendChild(svg);
    document.body.appendChild(container);

    // Mock getBoundingClientRect for zoom calculations
    container.getBoundingClientRect = vi.fn(() => ({
      left: 0, top: 0, width: 400, height: 300,
      right: 400, bottom: 300, x: 0, y: 0
    } as DOMRect));

    enhancer = new SvgEnhancer(container, { showZoomLevelIndicator: true });
    enhancer.init();
    enhancer.features.zoom = new ZoomFeature(enhancer) as any;
    enhancer.features.zoom.init();

    zoomLevelIndicator = new ZoomLevelIndicatorFeature(enhancer);
    enhancer.features.zoomLevelIndicator = zoomLevelIndicator as any;
    zoomLevelIndicator.init();
  });

  afterEach(() => {
    enhancer.destroy();
    document.body.removeChild(container);
  });

  it('should create zoom level indicator badge', () => {
    const badge = container.querySelector('.svg-toolbelt-zoom-indicator');
    expect(badge).toBeTruthy();
    expect(badge).toBeInstanceOf(HTMLDivElement);
  });

  it('should have correct initial properties', () => {
    const badge = container.querySelector('.svg-toolbelt-zoom-indicator') as HTMLElement;
    expect(badge.style.opacity).toBe('0');
    expect(badge.className).toBe('svg-toolbelt-zoom-indicator');
    expect(badge.getAttribute('aria-live')).toBe('polite');
    expect(badge.getAttribute('aria-label')).toBe('Current zoom level');
  });

  it('should show zoom percentage when zoom event is fired', () => {
    const badge = container.querySelector('.svg-toolbelt-zoom-indicator') as HTMLElement;

    // Trigger zoom event
    enhancer.emit('zoom', { scale: 1.5, translateX: 0, translateY: 0 });

    expect(badge.textContent).toBe('150%');
    expect(badge.style.opacity).toBe('1');
  });

  it('should update zoom percentage correctly for different scales', () => {
    const badge = container.querySelector('.svg-toolbelt-zoom-indicator') as HTMLElement;

    // Test various zoom levels
    const testCases = [
      { scale: 0.5, expected: '50%' },
      { scale: 1.0, expected: '100%' },
      { scale: 1.25, expected: '125%' },
      { scale: 2.0, expected: '200%' },
      { scale: 3.33, expected: '333%' },
    ];

    testCases.forEach(({ scale, expected }) => {
      enhancer.emit('zoom', { scale, translateX: 0, translateY: 0 });
      expect(badge.textContent).toBe(expected);
    });
  });

  it('should hide badge after timeout', async () => {
    const badge = container.querySelector('.svg-toolbelt-zoom-indicator') as HTMLElement;

    // Mock setTimeout and clearTimeout
    const timeoutSpy = vi.spyOn(window, 'setTimeout');
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');

    // Trigger zoom event
    enhancer.emit('zoom', { scale: 1.5, translateX: 0, translateY: 0 });

    expect(badge.style.opacity).toBe('1');
    expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1500);

    // Execute the timeout callback manually
    const timeoutCallback = timeoutSpy.mock.calls[0][0] as () => void;
    timeoutCallback();

    expect(badge.style.opacity).toBe('0');

    timeoutSpy.mockRestore();
    clearTimeoutSpy.mockRestore();
  });

  it('should clear existing timeout when new zoom event occurs', () => {
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');

    // First zoom event
    enhancer.emit('zoom', { scale: 1.5, translateX: 0, translateY: 0 });

    // Second zoom event should clear the first timeout
    enhancer.emit('zoom', { scale: 2.0, translateX: 0, translateY: 0 });

    expect(clearTimeoutSpy).toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
  });

  it('should not process zoom events when enhancer is destroyed', () => {
    const badge = container.querySelector('.svg-toolbelt-zoom-indicator') as HTMLElement;

    // Destroy enhancer
    enhancer.destroy();

    // Try to trigger zoom event
    enhancer.emit('zoom', { scale: 1.5, translateX: 0, translateY: 0 });

    // Badge text should remain empty as the event shouldn't be processed
    expect(badge.textContent).toBe('');
  });

  it('should not hide badge when enhancer is destroyed during timeout', () => {
    const badge = container.querySelector('.svg-toolbelt-zoom-indicator') as HTMLElement;
    const timeoutSpy = vi.spyOn(window, 'setTimeout');

    // Trigger zoom event
    enhancer.emit('zoom', { scale: 1.5, translateX: 0, translateY: 0 });
    expect(badge.style.opacity).toBe('1');

    // Destroy enhancer
    enhancer.destroy();

    // Execute the timeout callback manually
    const timeoutCallback = timeoutSpy.mock.calls[0][0] as () => void;
    timeoutCallback();

    // Badge should still be visible since enhancer is destroyed
    expect(badge.style.opacity).toBe('1');

    timeoutSpy.mockRestore();
  });

  it('should remove badge and cleanup on destroy', () => {
    const badge = container.querySelector('.svg-toolbelt-zoom-indicator') as HTMLElement;
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');

    // Trigger zoom event to set a timeout
    enhancer.emit('zoom', { scale: 1.5, translateX: 0, translateY: 0 });

    expect(badge.parentNode).toBe(container);

    // Destroy the feature
    zoomLevelIndicator.destroy();

    // Badge should be removed from DOM
    expect(badge.parentNode).toBeNull();
    expect(clearTimeoutSpy).toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
  });

  it('should handle destroy when no timeout is set', () => {
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');

    // Destroy without triggering any zoom events
    zoomLevelIndicator.destroy();

    // Should not call clearTimeout since no timeout was set
    expect(clearTimeoutSpy).not.toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
  });

  it('should remove event listener on destroy', () => {
    const badge = container.querySelector('.svg-toolbelt-zoom-indicator') as HTMLElement;

    // Destroy the feature
    zoomLevelIndicator.destroy();

    // Trigger zoom event after destroy
    enhancer.emit('zoom', { scale: 1.5, translateX: 0, translateY: 0 });

    // Badge should not update
    expect(badge.textContent).toBe('');
  });

  it('should work with actual zoom feature integration', () => {
    const badge = container.querySelector('.svg-toolbelt-zoom-indicator') as HTMLElement;

    // Use the actual zoom feature to trigger zoom events
    enhancer.features.zoom.zoomIn();

    // Badge should show the new zoom level
    expect(badge.textContent).toBe('110%'); // Default zoom step is 0.1, so 1.0 + 0.1 = 1.1 = 110%
    expect(badge.style.opacity).toBe('1');
  });

  it('should round zoom percentages correctly', () => {
    const badge = container.querySelector('.svg-toolbelt-zoom-indicator') as HTMLElement;

    // Test edge cases for rounding
    const testCases = [
      { scale: 1.234, expected: '123%' },
      { scale: 1.235, expected: '124%' }, // Should round up
      { scale: 1.999, expected: '200%' },
      { scale: 0.001, expected: '0%' },
    ];

    testCases.forEach(({ scale, expected }) => {
      enhancer.emit('zoom', { scale, translateX: 0, translateY: 0 });
      expect(badge.textContent).toBe(expected);
    });
  });
});
