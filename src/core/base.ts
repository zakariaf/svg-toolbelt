// src/core/base.ts

import { DEFAULT_SVG_ENHANCER_CONFIG, SvgEnhancerConfig } from './config';
import { EventEmitter } from './events';

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
   */
  public constrainPan(): void {
    if (!this.svg) return;

    const containerRect = this.containerRect;
    const containerCenterX = containerRect.width / 2;
    const containerCenterY = containerRect.height / 2;

    // Get SVG bounds with better JSDOM compatibility
    let svgBounds: { width: number; height: number };
    try {
      // Try getBBox first (real browser)
      if (typeof this.svg.getBBox === 'function') {
        const bbox = this.svg.getBBox();
        svgBounds = { width: bbox.width, height: bbox.height };
      } else {
        throw new Error('getBBox not available');
      }
    } catch {
      // Fallback for JSDOM and other environments
      try {
        // Try viewBox with better compatibility check
        const viewBox = this.svg.viewBox?.baseVal;
        if (viewBox && viewBox.width > 0 && viewBox.height > 0) {
          svgBounds = { width: viewBox.width, height: viewBox.height };
        } else {
          throw new Error('viewBox not available');
        }
      } catch {
        // Final fallback to attributes or defaults
        const width = parseFloat(this.svg.getAttribute('width') || '400');
        const height = parseFloat(this.svg.getAttribute('height') || '300');
        svgBounds = { width, height };
      }
    }

    // Calculate scaled dimensions
    const scaledWidth = svgBounds.width * this.scale;
    const scaledHeight = svgBounds.height * this.scale;

    // Calculate maximum allowed translation to keep some content visible
    const maxTranslateX = Math.max(
      containerCenterX,
      scaledWidth - containerCenterX
    );
    const maxTranslateY = Math.max(
      containerCenterY,
      scaledHeight - containerCenterY
    );

    // Apply constraints with some padding
    const padding = 50; // pixels of padding
    this.translateX = Math.max(
      -maxTranslateX - padding,
      Math.min(maxTranslateX + padding, this.translateX)
    );
    this.translateY = Math.max(
      -maxTranslateY - padding,
      Math.min(maxTranslateY + padding, this.translateY)
    );
  }

  /**
   * Destroy all features and remove listeners.
   */
  public destroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    // Destroy all feature instances
    Object.values(this.features).forEach((feature: unknown) => {
      if (feature && typeof (feature as any).destroy === 'function') {
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
}
