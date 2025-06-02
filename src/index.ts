import { SvgEnhancer } from "./core/base";
import { SvgEnhancerConfig } from "./core/config";
import { ZoomFeature } from "./features/zoom";
import { PanFeature } from "./features/pan";
import { TouchFeature } from "./features/touch";
import { KeyboardFeature } from "./features/keyboard";
import { ControlsFeature } from "./features/controls";
import { FullscreenFeature } from "./features/fullscreen";
import { DblclickResetFeature } from "./features/dblclickReset";
import { NoContextMenuFeature } from "./features/noContextMenu";

/**
 * SvgZoom class: a high-level wrapper that sets up all features on the container:
 *  - zoom (mouse wheel)
 *  - pan (click & drag)
 *  - touch (pinch & drag)
 *  - keyboard (arrows / + / - / 0)
 *  - on-screen controls (zoom in/out/reset, fullscreen)
 *  - double-click to reset
 *  - disable context menu
 */
export class SvgZoom extends SvgEnhancer {
  constructor(container: HTMLElement, config?: Partial<SvgEnhancerConfig>) {
    super(container, config);
    if (this.isDestroyed) return;

    this.features = {
      zoom: new ZoomFeature(this),
      pan: new PanFeature(this),
      dblclickReset: new DblclickResetFeature(this),
      noContextMenu: new NoContextMenuFeature(this),
      touch: this.config.enableTouch ? new TouchFeature(this) : null,
      keyboard: this.config.enableKeyboard ? new KeyboardFeature(this) : null,
      controls: this.config.showControls ? new ControlsFeature(this) : null,
      fullscreen: document.fullscreenEnabled ? new FullscreenFeature(this) : null,
    } as any;
  }

  /**
   * Initialize all features, then apply any initial transforms.
   */
  public init(): void {
    super.init();
    Object.values(this.features).forEach((feature: any) => {
      if (feature && typeof feature.init === "function") {
        feature.init();
      }
    });
    // Apply any initial transform (none by default)
    this.svg!.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
  }

  /** Zoom in 1 step via public API */
  public zoomIn(): void {
    this.features.zoom.zoomIn();
  }

  /** Zoom out 1 step via public API */
  public zoomOut(): void {
    this.features.zoom.zoomOut();
  }
}

/**
 * Convenience function: auto-initialize zoom on all matching containers.
 *
 * @param selectorOrElements
 *   - If string: CSS selector to find containers holding an <svg> (e.g. ".zoomable-svg")
 *   - If HTMLElement[]: list of containers to initialize
 *   - If HTMLElement: single container
 * @param config Partial config overrides
 */
export function initializeSvgZoom(
  selectorOrElements: string | HTMLElement | HTMLElement[],
  config: Partial<SvgEnhancerConfig> = {}
): void {
  let containers: HTMLElement[] = [];

  if (typeof selectorOrElements === "string") {
    containers = Array.from(document.querySelectorAll<HTMLElement>(selectorOrElements));
  } else if (selectorOrElements instanceof HTMLElement) {
    containers = [selectorOrElements];
  } else if (Array.isArray(selectorOrElements)) {
    containers = selectorOrElements;
  }

  if (containers.length === 0) {
    console.info("SvgZoom: No containers found to initialize");
    return;
  }

  containers.forEach((container, idx) => {
    if (container.closest(".svg-zoom-wrapper")) {
      // Already initialized
      return;
    }

    try {
      const svg = container.querySelector<SVGSVGElement>("svg");
      if (svg) {
        // Wrap container to preserve layout
        const wrapper = document.createElement("div");
        wrapper.className = "svg-zoom-wrapper";

        container.parentNode!.insertBefore(wrapper, container);
        wrapper.appendChild(container);

        const zoomInstance = new SvgZoom(wrapper, config);
        zoomInstance.init();
        wrapper.setAttribute("data-svg-zoom-initialized", "true");
        // Store instance for potential future references
        (wrapper as any).svgZoomInstance = zoomInstance;
        console.info(`SvgZoom: Initialized zoom for container #${idx + 1}`);
      } else {
        console.warn(`SvgZoom: No <svg> found in container #${idx + 1}`);
      }
    } catch (error) {
      console.error(`SvgZoom: Failed to initialize #${idx + 1}:`, error);
    }
  });
}
