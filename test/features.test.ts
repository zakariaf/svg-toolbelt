/**
 * Tests for individual feature modules, simulating minimal DOM events.
 */

import { SvgEnhancer } from '../src/core/base';
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
});
