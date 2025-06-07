// src/core/base.ts

import { DEFAULT_SVG_ENHANCER_CONFIG, SvgEnhancerConfig } from './config';
import { EventEmitter } from './events';

// Constants for fallback SVG dimensions when getBBox/viewBox are unavailable
const DEFAULT_FALLBACK_SVG_WIDTH = 400;
const DEFAULT_FALLBACK_SVG_HEIGHT = 300;

// Padding around pan constraints to ensure some content remains visible
const PAN_CONSTRAINT_PADDING = 50;

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
      }      } catch {
        // Fallback for JSDOM and other environments
        try {
          // Try viewBox with better compatibility and validation
          const viewBox = this.svg.viewBox?.baseVal;
          if (viewBox && 
              typeof viewBox.width === 'number' && 
              typeof viewBox.height === 'number' &&
              !isNaN(viewBox.width) && 
              !isNaN(viewBox.height) &&
              viewBox.width > 0 && 
              viewBox.height > 0) {
            svgBounds = { width: viewBox.width, height: viewBox.height };
          } else {
            throw new Error('viewBox not available or invalid');
          }
        } catch {
        // Final fallback to attributes or defaults with robust parsing
        const svgWidthAttr = this.svg.getAttribute('width');
        const svgHeightAttr = this.svg.getAttribute('height');

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

        svgBounds = {
          width: isNaN(w) ? DEFAULT_FALLBACK_SVG_WIDTH : w,
          height: isNaN(h) ? DEFAULT_FALLBACK_SVG_HEIGHT : h,
        };
      }
    }

    // Calculate scaled dimensions
    const scaledWidth = svgBounds.width * this.scale;
    const scaledHeight = svgBounds.height * this.scale;

    // For very small content, ensure a minimum visible area
    const minVisibleArea = Math.min(PAN_CONSTRAINT_PADDING, scaledWidth * 0.3, scaledHeight * 0.3);
    const effectivePadding = Math.max(minVisibleArea, PAN_CONSTRAINT_PADDING);

    // Calculate maximum allowed translation to keep some content visible
    // We subtract padding to ensure at least that much content remains visible
    const maxTranslateX = Math.max(
      containerCenterX,
      scaledWidth - containerCenterX
    ) - effectivePadding;
    const maxTranslateY = Math.max(
      containerCenterY,
      scaledHeight - containerCenterY
    ) - effectivePadding;

    // Apply constraints to keep content partially visible
    this.translateX = Math.max(
      -maxTranslateX,
      Math.min(maxTranslateX, this.translateX)
    );
    this.translateY = Math.max(
      -maxTranslateY,
      Math.min(maxTranslateY, this.translateY)
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
      if (feature && typeof (feature as { destroy?: () => void }).destroy === 'function') {
        (feature as { destroy: () => void }).destroy();
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
