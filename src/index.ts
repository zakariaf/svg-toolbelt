import { SvgEnhancer } from './core/base';
import { SvgEnhancerConfig } from './core/config';
import { ZoomFeature } from './features/zoom';
import { PanFeature } from './features/pan';
import { TouchFeature } from './features/touch';
import { KeyboardFeature } from './features/keyboard';
import { ControlsFeature } from './features/controls';
import { FullscreenFeature } from './features/fullscreen';
import { DblclickResetFeature } from './features/dblclickReset';
import { NoContextMenuFeature } from './features/noContextMenu';
import { ZoomLevelIndicatorFeature } from './features/zoomLevelIndicator';

// Import CSS for Vite to process
import './styles/svg-toolbelt.css';

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
export class SvgToolbelt extends SvgEnhancer {
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
      fullscreen: document.fullscreenEnabled
        ? new FullscreenFeature(this)
        : null,
      zoomLevelIndicator: this.config.showZoomLevelIndicator
        ? new ZoomLevelIndicatorFeature(this)
        : null,
    } as any;
  }

  /**
   * Initialize all features, then apply any initial transforms.
   */
  public init(): void {
    if (this.isDestroyed || !this.svg) return;
    super.init();
    Object.values(this.features).forEach((feature: any) => {
      if (feature && typeof feature.init === 'function') {
        feature.init();
      }
    });
    // Apply any initial transform (none by default)
    this.svg.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
  }

  /** Zoom in 1 step via public API */
  public zoomIn(): void {
    if (this.isDestroyed || !this.features.zoom) return;
    this.features.zoom.zoomIn();
  }

  /** Zoom out 1 step via public API */
  public zoomOut(): void {
    if (this.isDestroyed || !this.features.zoom) return;
    this.features.zoom.zoomOut();
  }
}

/**
 * @deprecated SvgZoom is deprecated and will be removed in a future version. Use SvgToolbelt instead.
 */
export class SvgZoom extends SvgToolbelt {
  constructor(container: HTMLElement, config?: Partial<SvgEnhancerConfig>) {
    console.warn('SvgZoom is deprecated and will be removed in a future version. Use SvgToolbelt instead.');
    super(container, config);
  }
}

/**
 * Initializes an SvgToolbelt instance on the given container.
 * This is a convenience function that creates a new SvgToolbelt instance and calls init() on it.
 *
 * @param selectorOrElements
 *   - If string: CSS selector to find containers holding an <svg> (e.g. ".zoomable-svg")
 *   - If HTMLElement[]: list of containers to initialize
 *   - If HTMLElement: single container
 * @param config Partial config overrides
 */
export function initializeSvgToolbelt(
  selectorOrElements: string | HTMLElement | HTMLElement[],
  config: Partial<SvgEnhancerConfig> = {}
): void {
  let containers: HTMLElement[] = [];

  if (typeof selectorOrElements === 'string') {
    containers = Array.from(
      document.querySelectorAll<HTMLElement>(selectorOrElements)
    );
  } else if (selectorOrElements instanceof HTMLElement) {
    containers = [selectorOrElements];
  } else if (Array.isArray(selectorOrElements)) {
    containers = selectorOrElements;
  }

  if (containers.length === 0) {
    console.info('SvgToolbelt: No containers found to initialize');
    return;
  }

  containers.forEach((container, idx) => {
    if (container.closest('.svg-toolbelt-wrapper')) {
      // Already initialized
      return;
    }

    try {
      const svg = container.querySelector<SVGSVGElement>('svg');
      if (svg) {
        // Wrap container to preserve layout
        const wrapper = document.createElement('div');
        wrapper.className = 'svg-toolbelt-wrapper';

        container.parentNode!.insertBefore(wrapper, container);
        wrapper.appendChild(container);

        const toolbeltInstance = new SvgToolbelt(wrapper, config);
        toolbeltInstance.init();
        wrapper.setAttribute('data-svg-toolbelt-initialized', 'true');
        // Store instance for potential future references
        (wrapper as any).svgToolbeltInstance = toolbeltInstance;
        console.info(`SvgToolbelt: Initialized zoom for container #${idx + 1}`);
      } else {
        console.warn(`SvgToolbelt: No <svg> found in container #${idx + 1}`);
      }
    } catch (error) {
      console.error(`SvgToolbelt: Failed to initialize #${idx + 1}:`, error);
    }
  });
}

/**
 * @deprecated initializeSvgZoom is deprecated and will be removed in a future version. Use initializeSvgToolbelt instead.
 */
export function initializeSvgZoom(
  selectorOrElements: string | HTMLElement | HTMLElement[],
  config: Partial<SvgEnhancerConfig> = {}
): void {
  console.warn('initializeSvgZoom is deprecated and will be removed in a future version. Use initializeSvgToolbelt instead.');
  initializeSvgToolbelt(selectorOrElements, config);
}

// Export individual features for advanced use cases
export { SvgEnhancer } from './core/base';
export type { SvgEnhancerConfig } from './core/config';
export { ZoomFeature } from './features/zoom';
export { PanFeature } from './features/pan';
export { TouchFeature } from './features/touch';
export { KeyboardFeature } from './features/keyboard';
export { ControlsFeature } from './features/controls';
export { FullscreenFeature } from './features/fullscreen';
export { DblclickResetFeature } from './features/dblclickReset';
export { NoContextMenuFeature } from './features/noContextMenu';
export { ZoomLevelIndicatorFeature } from './features/zoomLevelIndicator';
