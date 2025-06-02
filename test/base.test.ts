/**
 * Tests for SvgEnhancer core logic (no DOM manipulation)
 */

import { SvgEnhancer } from "../src/core/base";
import { DEFAULT_SVG_ENHANCER_CONFIG } from "../src/core/config";

describe("SvgEnhancer (core)", () => {
  let container: HTMLElement;
  let svg: SVGSVGElement;

  beforeEach(() => {
    // Set up a container with an <svg> child
    container = document.createElement("div");
    svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    container.appendChild(svg);
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it("should initialize even if no <svg> found and mark as destroyed", () => {
    const emptyContainer = document.createElement("div");
    const enhancer = new SvgEnhancer(emptyContainer);
    expect(enhancer.isDestroyed).toBe(true);
  });

  it("should set up CSS classes on init", () => {
    const enhancer = new SvgEnhancer(container);
    expect(enhancer.isDestroyed).toBe(false);
    enhancer.init();
    expect(container.classList.contains("svg-zoom-container")).toBe(true);
    expect(svg.classList.contains("svg-zoom-svg")).toBe(true);
  });

  it("should constrain pan within limits", () => {
    const enhancer = new SvgEnhancer(container);
    enhancer.init();
    enhancer.translateX = 5000;
    enhancer.translateY = -5000;
    enhancer.constrainPan();
    expect(enhancer.translateX).toBe(DEFAULT_SVG_ENHANCER_CONFIG.maxPanX);
    expect(enhancer.translateY).toBe(-DEFAULT_SVG_ENHANCER_CONFIG.maxPanY);
  });

  it("destroy() should remove features and listeners", () => {
    const enhancer = new SvgEnhancer(container);
    enhancer.init();
    // Mock a dummy listener
    const cb = jest.fn();
    enhancer.on("test", cb);
    expect(enhancer.emit("test")).toBe(true);
    enhancer.destroy();
    expect(enhancer.isDestroyed).toBe(true);
    expect(enhancer.emit("test")).toBe(false);
  });
});
