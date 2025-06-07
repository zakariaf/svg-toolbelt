// src/core/base.ts

import { DEFAULT_SVG_ENHANCER_CONFIG, SvgEnhancerConfig } from './config';
import { EventEmitter } from './events';

// Constants for fallback SVG dimensions when getBBox/viewBox are unavailable
const DEFAULT_FALLBACK_SVG_WIDTH = 400;
const DEFAULT_FALLBACK_SVG_HEIGHT = 300;

// Pan constraint behavior constants
const CONTENT_SMALLER_THRESHOLD_FACTOR = 0.9; // Content considered "small" when < 90% of container
const VISIBLE_CONTENT_FRACTION = 0.1; // Allow panning until only 10% of content remains visible

export interface SvgEnhancerFeatures {
  zoom: any; // we'll type these in feature modules
  pan: any;
  touch: any | null;
  keyboard: any | null;
  controls: any | null;
  fullscreen: any | null;
  dblclickReset: any;
  noContextMenu: any;
  zoomLevelIndicator: any | null;
}

/**
 * Base class to provide core zoom/pan functionality to any <svg> element.
 * All features (zoom, pan, touch, keyboard, controls, fullscreen, etc.) are added as needed.
 */
export class SvgEnhancer extends EventEmitter {
  public container: HTMLElement;
  public svg: SVGSVGElement | null;
  public config: SvgEnhancerConfig;
  public isDestroyed: boolean = false;
  public scale: number = 1;
  public translateX: number = 0;
  public translateY: number = 0;
  public features: SvgEnhancerFeatures = {} as any;

  constructor(container: HTMLElement, config: Partial<SvgEnhancerConfig> = {}) {
    super();
    this.container = container;
    this.config = { ...DEFAULT_SVG_ENHANCER_CONFIG, ...config };
    this.svg = container.querySelector<SVGSVGElement>('svg') || null;

    if (!this.svg) {
      this.isDestroyed = true;
      console.warn('SvgEnhancer: No <svg> found in container');
      return;
    }
  }

  /**
   * Initialize the container (e.g., add CSS classes), and then features will hook in.
   */
  public init(): void {
    if (this.isDestroyed) return;
    this.setupContainer();
  }

  protected setupContainer(): void {
    this.container.classList.add('svg-toolbelt-container');
    this.svg!.classList.add('svg-toolbelt-svg');
  }

  /**
   * Ensure panning does not exceed reasonable limits based on content and zoom level.
   * Allows panning until only 10% of content remains visible.
   */
  public constrainPan(): void {
    if (!this.svg) return;

    const containerRect = this.containerRect;
    const svgBounds = this._getSvgBounds();

    // Calculate scaled dimensions
    const scaledWidth = svgBounds.width * this.scale;
    const scaledHeight = svgBounds.height * this.scale;

    // Calculate constraints for X-axis
    let maxTranslateX: number;
    if (scaledWidth < containerRect.width * CONTENT_SMALLER_THRESHOLD_FACTOR) {
      // Small content: allow panning anywhere within container bounds
      // User should be able to move small content to any edge of the container
      maxTranslateX = containerRect.width;
    } else {
      // Large content: allow panning until only 10% remains visible
      // Maximum positive translation: can pan left until only 10% of right edge is visible
      // Maximum negative translation: can pan right until only 10% of left edge is visible
      const minVisibleWidth = scaledWidth * VISIBLE_CONTENT_FRACTION;
      maxTranslateX = scaledWidth - minVisibleWidth;
    }

    // Calculate constraints for Y-axis
    let maxTranslateY: number;
    if (scaledHeight < containerRect.height * CONTENT_SMALLER_THRESHOLD_FACTOR) {
      // Small content: allow panning anywhere within container bounds
      // User should be able to move small content to any edge of the container
      maxTranslateY = containerRect.height;
    } else {
      // Large content: allow panning until only 10% remains visible
      // Maximum positive translation: can pan up until only 10% of bottom edge is visible
      // Maximum negative translation: can pan down until only 10% of top edge is visible
      const minVisibleHeight = scaledHeight * VISIBLE_CONTENT_FRACTION;
      maxTranslateY = scaledHeight - minVisibleHeight;
    }

    // Apply constraints
    this.translateX = Math.max(-maxTranslateX, Math.min(maxTranslateX, this.translateX));
    this.translateY = Math.max(-maxTranslateY, Math.min(maxTranslateY, this.translateY));
  }

  /**
   * Destroy all features and remove listeners.
   */
  public destroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    // Destroy all feature instances
    Object.values(this.features).forEach((feature: unknown) => {
      if (typeof (feature as any)?.destroy === 'function') {
        (feature as any).destroy();
      }
    });

    this.removeAllListeners();
    this.features = {} as SvgEnhancerFeatures;
  }

  /**
   * Convenience getter for the container's bounding rect.
   */
  public get containerRect(): DOMRect {
    return this.container.getBoundingClientRect();
  }

  /**
   * Reset the SVG to its default scale and position with transition animation.
   */
  public reset(): void {
    if (this.isDestroyed || !this.svg) return;

    this.scale = 1;
    this.translateX = 0;
    this.translateY = 0;
    this.applyTransformWithTransition();
    this.emit("reset", {
      translateX: this.translateX,
      translateY: this.translateY,
      scale: this.scale,
    });
  }

  /**
   * Apply the current transform to the SVG without transition animation.
   */
  public applyTransform(): void {
    if (this.isDestroyed || !this.svg) return;

    this.svg.style.transition = "none";
    this.svg.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
  }

  /**
   * Apply the current transform to the SVG with transition animation.
   */
  public applyTransformWithTransition(): void {
    if (this.isDestroyed || !this.svg) return;

    this.svg.style.transition = `transform ${this.config.transitionDuration}ms ease-out`;
    this.svg.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;

    setTimeout(() => {
      if (!this.isDestroyed && this.svg) {
        this.svg.style.transition = "none";
      }
    }, this.config.transitionDuration);
  }

  /**
   * Try to get SVG bounds using getBBox method (works in real browsers)
   */
  private _tryGetBoundsFromBBox(): { width: number; height: number } | null {
    try {
      if (typeof this.svg!.getBBox === 'function') {
        const bbox = this.svg!.getBBox();
        return { width: bbox.width, height: bbox.height };
      }
    } catch {
      // getBBox failed
    }
    return null;
  }

  /**
   * Try to get SVG bounds from viewBox attribute
   */
  private _tryGetBoundsFromViewBox(): { width: number; height: number } | null {
    try {
      const viewBox = this.svg!.viewBox?.baseVal;
      if (viewBox &&
          typeof viewBox.width === 'number' &&
          typeof viewBox.height === 'number' &&
          !isNaN(viewBox.width) &&
          !isNaN(viewBox.height) &&
          viewBox.width > 0 &&
          viewBox.height > 0) {
        return { width: viewBox.width, height: viewBox.height };
      }
    } catch {
      // viewBox parsing failed
    }
    return null;
  }

  /**
   * Get SVG bounds from width/height attributes or fallback to defaults
   */
  private _getBoundsFromAttributesOrDefault(): { width: number; height: number } {
    const svgWidthAttr = this.svg!.getAttribute('width');
    const svgHeightAttr = this.svg!.getAttribute('height');

    // Parse dimensions more robustly, handling edge cases
    let w = NaN;
    let h = NaN;

    if (svgWidthAttr) {
      const parsedWidth = parseFloat(svgWidthAttr);
      w = !isNaN(parsedWidth) && parsedWidth > 0 ? parsedWidth : NaN;
    }

    if (svgHeightAttr) {
      const parsedHeight = parseFloat(svgHeightAttr);
      h = !isNaN(parsedHeight) && parsedHeight > 0 ? parsedHeight : NaN;
    }

    return {
      width: isNaN(w) ? DEFAULT_FALLBACK_SVG_WIDTH : w,
      height: isNaN(h) ? DEFAULT_FALLBACK_SVG_HEIGHT : h,
    };
  }

  /**
   * Get SVG bounds using fallback chain: getBBox -> viewBox -> attributes -> defaults
   */
  private _getSvgBounds(): { width: number; height: number } {
    // Try getBBox first (real browser)
    let bounds = this._tryGetBoundsFromBBox();
    if (bounds) return bounds;

    // Try viewBox (JSDOM compatibility)
    bounds = this._tryGetBoundsFromViewBox();
    if (bounds) return bounds;

    // Final fallback to attributes or defaults
    return this._getBoundsFromAttributesOrDefault();
  }
}
