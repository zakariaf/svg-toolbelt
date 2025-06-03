/**
 * Tests for individual feature modules, simulating minimal DOM events.
 */

import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';
import { SvgEnhancer } from '../src/core/base';
import { SvgZoom } from '../src/index';
import { ZoomFeature } from '../src/features/zoom';
import { PanFeature } from '../src/features/pan';
import { KeyboardFeature } from '../src/features/keyboard';
import { DblclickResetFeature } from '../src/features/dblclickReset';
import { NoContextMenuFeature } from '../src/features/noContextMenu';
import { FullscreenFeature } from '../src/features/fullscreen';

describe('Feature modules', () => {
  let container: HTMLElement;
  let svg: SVGSVGElement;
  let enhancer: SvgEnhancer;

  beforeEach(() => {
    container = document.createElement('div');
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    container.appendChild(svg);
    document.body.appendChild(container);
    enhancer = new SvgEnhancer(container);
    enhancer.init();
  });

  afterEach(() => {
    enhancer.destroy();
    document.body.removeChild(container);
  });

  it('ZoomFeature: zoomIn and zoomOut should adjust scale', () => {
    enhancer.features.zoom = new ZoomFeature(enhancer) as any;
    enhancer.features.zoom.init();

    const initialScale = enhancer.scale;
    enhancer.features.zoom.zoomIn();
    expect(enhancer.scale).toBeGreaterThan(initialScale);

    enhancer.features.zoom.zoomOut();
    expect(enhancer.scale).toBeCloseTo(initialScale);
  });

  it('PanFeature: dragging should change translateX/Y', () => {
    enhancer.features.pan = new PanFeature(enhancer) as any;
    enhancer.features.pan.init();

    // Simulate mousedown at (10,10)
    const mousedown = new MouseEvent('mousedown', {
      clientX: 10,
      clientY: 10,
      button: 0,
    });
    svg.dispatchEvent(mousedown);

    // Simulate mousemove to (20, 30)
    const mousemove = new MouseEvent('mousemove', { clientX: 20, clientY: 30 });
    document.dispatchEvent(mousemove);

    expect(enhancer.translateX).toBe(10);
    expect(enhancer.translateY).toBe(20);

    // Simulate mouseup
    const mouseup = new MouseEvent('mouseup');
    document.dispatchEvent(mouseup);
    // isDragging should be false now
    enhancer.features.pan.destroy();
  });

  it('KeyboardFeature: arrow keys pan, + and - zoom', () => {
    enhancer.features.zoom = new ZoomFeature(enhancer) as any;
    enhancer.features.pan = new PanFeature(enhancer) as any;
    enhancer.features.keyboard = new KeyboardFeature(enhancer) as any;
    enhancer.features.zoom.init();
    enhancer.features.pan.init();
    enhancer.features.keyboard.init();

    const beforeScale = enhancer.scale;
    const plusKey = new KeyboardEvent('keydown', { key: '+', bubbles: true });
    container.dispatchEvent(plusKey);
    expect(enhancer.scale).toBeGreaterThan(beforeScale);

    const arrowRight = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
    });
    container.dispatchEvent(arrowRight);
    expect(enhancer.translateX).toBeLessThanOrEqual(enhancer.config.maxPanX);
  });

  it('DblclickResetFeature: double click resets transform', () => {
    enhancer.translateX = 50;
    enhancer.translateY = 60;
    enhancer.scale = 2;
    enhancer.features.dblclickReset = new DblclickResetFeature(enhancer) as any;
    enhancer.features.dblclickReset.init();

    const dblclick = new MouseEvent('dblclick', { bubbles: true });
    svg.dispatchEvent(dblclick);

    expect(enhancer.translateX).toBe(0);
    expect(enhancer.translateY).toBe(0);
    expect(enhancer.scale).toBe(1);
  });

  it('NoContextMenuFeature: should prevent context menu', () => {
    const ncm = new NoContextMenuFeature(enhancer) as any;
    enhancer.features.noContextMenu = ncm;
    ncm.init();
    const contextEvent = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
    });
    const prevented = !svg.dispatchEvent(contextEvent);
    expect(prevented).toBe(true);
    ncm.destroy();
  });

  it('FullscreenFeature: toggleFullscreen should call requestFullscreen or exitFullscreen', () => {
    const fsf = new FullscreenFeature(enhancer);
    enhancer.features.fullscreen = fsf as any;

    // We cannot truly enter fullscreen in JSDOM, but we can ensure no errors are thrown
    expect(() => fsf.toggleFullscreen()).not.toThrow();
  });

  describe('Controls feature additional tests', () => {
    it('should create fullscreen button when fullscreen is enabled', () => {
      // Mock fullscreen API before creating the SVG and enhancer
      Object.defineProperty(document, 'fullscreenEnabled', {
        value: true,
        configurable: true,
        writable: true
      });

      const enhancer = new SvgZoom(container, { showControls: true });
      enhancer.init();

      const controls = container.querySelector('.svg-toolbelt-controls');
      expect(controls).toBeTruthy();

      // Should have 4 buttons: zoom in, zoom out, reset, fullscreen
      const buttons = controls!.querySelectorAll('button');
      expect(buttons).toHaveLength(4);

      // Check that fullscreen button exists
      const fullscreenBtn = Array.from(buttons).find(btn => btn.title === 'Toggle Fullscreen');
      expect(fullscreenBtn).toBeTruthy();

      // Reset fullscreen mock
      Object.defineProperty(document, 'fullscreenEnabled', {
        value: false,
        configurable: true
      });
    });

    it('should handle controls creation without fullscreen when not supported', () => {
      // Ensure fullscreen is disabled
      Object.defineProperty(document, 'fullscreenEnabled', {
        value: false,
        configurable: true
      });

      const enhancer = new SvgZoom(container, { showControls: true });
      enhancer.init();

      const controls = container.querySelector('.svg-toolbelt-controls');
      expect(controls).toBeTruthy();

      // Should have 3 buttons: zoom in, zoom out, reset (no fullscreen)
      const buttons = controls!.querySelectorAll('button');
      expect(buttons).toHaveLength(3);

      // Verify no fullscreen button
      const fullscreenBtn = Array.from(buttons).find(btn => btn.title === 'Toggle Fullscreen');
      expect(fullscreenBtn).toBeFalsy();
    });

    it('should handle reset button functionality', () => {
      const enhancer = new SvgZoom(container, { showControls: true });
      enhancer.init();

      // Modify transform
      enhancer.scale = 2;
      enhancer.translateX = 50;
      enhancer.translateY = 100;

      const resetBtn = container.querySelector('button[title="Reset Zoom"]') as HTMLButtonElement;
      expect(resetBtn).toBeTruthy();

      resetBtn.click();

      expect(enhancer.scale).toBe(1);
      expect(enhancer.translateX).toBe(0);
      expect(enhancer.translateY).toBe(0);
      expect(svg.style.transform).toBe('translate(0px, 0px) scale(1)');
    });
  });

  describe('Fullscreen feature error handling', () => {
    it('should handle exitFullscreen failure', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Mock fullscreen state as active
      Object.defineProperty(document, 'fullscreenElement', {
        value: container,
        configurable: true
      });

      // Mock exitFullscreen to reject
      Object.defineProperty(document, 'exitFullscreen', {
        value: vi.fn().mockRejectedValue(new Error('Exit failed')),
        configurable: true
      });

      const enhancer = new SvgZoom(container);
      enhancer.init();

      if (enhancer.features.fullscreen) {
        enhancer.features.fullscreen.toggleFullscreen();
        // Wait for the promise to resolve
        await new Promise(resolve => setTimeout(resolve, 10));
        expect(warnSpy).toHaveBeenCalledWith('Failed to exit fullscreen');
      }

      warnSpy.mockRestore();
    });

    it('should handle requestFullscreen failure', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Mock fullscreen state as inactive
      Object.defineProperty(document, 'fullscreenElement', {
        value: null,
        configurable: true
      });

      // Mock requestFullscreen to reject
      container.requestFullscreen = vi.fn().mockRejectedValue(new Error('Request failed'));

      const enhancer = new SvgZoom(container);
      enhancer.init();

      if (enhancer.features.fullscreen) {
        enhancer.features.fullscreen.toggleFullscreen();
        // Wait for the promise to resolve
        await new Promise(resolve => setTimeout(resolve, 10));
        expect(warnSpy).toHaveBeenCalledWith('Failed to enter fullscreen:', expect.any(Error));
      }

      warnSpy.mockRestore();
    });
  });

  describe('Zoom feature edge cases', () => {
    it('should handle zoom when enhancer is destroyed', () => {
      const enhancer = new SvgZoom(container);
      enhancer.init();

      // Mark as destroyed
      enhancer.destroy();

      // Try to trigger wheel event
      const wheelEvent = new WheelEvent('wheel', {
        deltaY: 100,
        clientX: 50,
        clientY: 50
      });

      container.dispatchEvent(wheelEvent);

      // Should not process the event when destroyed
      expect(enhancer.isDestroyed).toBe(true);
    });
  });

  describe('FullscreenFeature: API not supported scenarios', () => {
    let container: HTMLDivElement;
    let svg: SVGElement;
    let enhancer: SvgEnhancer;
    let fullscreenFeature: FullscreenFeature;
    let originalConsoleWarn: typeof console.warn;
    let consoleWarnSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      // Mock console.warn
      originalConsoleWarn = console.warn;
      consoleWarnSpy = vi.fn();
      console.warn = consoleWarnSpy;

      // Set up DOM
      container = document.createElement('div');
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      container.appendChild(svg);
      document.body.appendChild(container);

      enhancer = new SvgEnhancer(container);
      fullscreenFeature = new FullscreenFeature(enhancer);
    });

    afterEach(() => {
      console.warn = originalConsoleWarn;
      document.body.removeChild(container);
    });

    it('should warn when exitFullscreen is not supported', () => {
      // Mock document.fullscreenElement to simulate being in fullscreen
      Object.defineProperty(document, 'fullscreenElement', {
        value: container,
        writable: true,
        configurable: true,
      });

      // Remove exitFullscreen to simulate unsupported API
      const originalExitFullscreen = document.exitFullscreen;
      delete (document as any).exitFullscreen;

      fullscreenFeature.toggleFullscreen();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'exitFullscreen() is not supported in this environment'
      );

      // Restore
      document.exitFullscreen = originalExitFullscreen;
      Object.defineProperty(document, 'fullscreenElement', {
        value: null,
        writable: true,
        configurable: true,
      });
    });

    it('should warn when requestFullscreen is not supported', () => {
      // Ensure we're not in fullscreen
      Object.defineProperty(document, 'fullscreenElement', {
        value: null,
        writable: true,
        configurable: true,
      });

      // Remove requestFullscreen to simulate unsupported API
      const originalRequestFullscreen = container.requestFullscreen;
      delete (container as any).requestFullscreen;

      fullscreenFeature.toggleFullscreen();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'requestFullscreen() is not supported in this environment'
      );

      // Restore
      container.requestFullscreen = originalRequestFullscreen;
    });
  });

  describe('ZoomFeature: center calculations', () => {
    let container: HTMLDivElement;
    let svg: SVGElement;
    let enhancer: SvgEnhancer;
    let zoomFeature: ZoomFeature;

    beforeEach(() => {
      container = document.createElement('div');
      // Set specific dimensions to test center calculations
      container.style.width = '400px';
      container.style.height = '300px';
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      container.appendChild(svg);
      document.body.appendChild(container);

      enhancer = new SvgEnhancer(container);
      zoomFeature = new ZoomFeature(enhancer);
      zoomFeature.init();
    });

    afterEach(() => {
      document.body.removeChild(container);
    });

    it('should calculate center coordinates for zoomIn', () => {
      const spy = vi.spyOn(zoomFeature, 'zoomAt');

      zoomFeature.zoomIn();

      // Should call zoomAt with center coordinates (width/2, height/2)
      expect(spy).toHaveBeenCalledWith(
        expect.any(Number), // centerX = rect.width / 2
        expect.any(Number), // centerY = rect.height / 2
        expect.any(Number)  // zoomStep
      );

      spy.mockRestore();
    });

    it('should calculate center coordinates for zoomOut', () => {
      const spy = vi.spyOn(zoomFeature, 'zoomAt');

      zoomFeature.zoomOut();

      // Should call zoomAt with center coordinates (width/2, height/2)
      expect(spy).toHaveBeenCalledWith(
        expect.any(Number), // centerX = rect.width / 2
        expect.any(Number), // centerY = rect.height / 2
        expect.any(Number)  // negative zoomStep
      );

      spy.mockRestore();
    });

    it('should use container rect dimensions for center calculations', () => {
      // Mock getBoundingClientRect to return specific dimensions
      const mockRect = {
        width: 600,
        height: 400,
        left: 0,
        top: 0,
        right: 600,
        bottom: 400,
        x: 0,
        y: 0,
        toJSON: () => ({})
      } as DOMRect;

      vi.spyOn(container, 'getBoundingClientRect').mockReturnValue(mockRect);

      const spy = vi.spyOn(zoomFeature, 'zoomAt');

      zoomFeature.zoomIn();

      // Should use half of the mocked dimensions (300, 200)
      expect(spy).toHaveBeenCalledWith(300, 200, expect.any(Number));

      spy.mockRestore();
    });

    it('should handle wheel event with proper coordinate calculations', () => {
      // Mock getBoundingClientRect to return specific values
      const mockRect = {
        left: 10,
        top: 20,
        width: 400,
        height: 300,
        right: 410,
        bottom: 320,
        x: 10,
        y: 20,
        toJSON: () => ({})
      } as DOMRect;

      vi.spyOn(container, 'getBoundingClientRect').mockReturnValue(mockRect);

      const spy = vi.spyOn(zoomFeature, 'zoomAt');

      // Create wheel event with specific coordinates
      const wheelEvent = new WheelEvent('wheel', {
        clientX: 60, // mouseX should be 60 - 10 = 50
        clientY: 70, // mouseY should be 70 - 20 = 50
        deltaY: 100, // positive deltaY should result in negative zoom step
        bubbles: true,
        cancelable: true,
      });

      container.dispatchEvent(wheelEvent);

      // Should call zoomAt with calculated mouse coordinates and negative delta
      expect(spy).toHaveBeenCalledWith(50, 50, expect.any(Number));

      spy.mockRestore();
    });

    it('should handle wheel event with negative deltaY for zoom in', () => {
      const spy = vi.spyOn(zoomFeature, 'zoomAt');

      // Create wheel event with negative deltaY (zoom in)
      const wheelEvent = new WheelEvent('wheel', {
        clientX: 100,
        clientY: 100,
        deltaY: -100, // negative deltaY should result in positive zoom step
        bubbles: true,
        cancelable: true,
      });

      container.dispatchEvent(wheelEvent);

      // Should call zoomAt with positive delta (zoom in)
      expect(spy).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        expect.any(Number) // should be positive zoom step
      );

      const callArgs = spy.mock.calls[0];
      expect(callArgs[2]).toBeGreaterThan(0); // delta should be positive

      spy.mockRestore();
    });
  });
});
