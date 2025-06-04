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
   * Ensure panning does not exceed configured limits.
   */
  public constrainPan(): void {
    const limitX = this.config.maxPanX;
    const limitY = this.config.maxPanY;
    this.translateX = Math.max(-limitX, Math.min(limitX, this.translateX));
    this.translateY = Math.max(-limitY, Math.min(limitY, this.translateY));
  }

  /**
   * Destroy all features and remove listeners.
   */
  public destroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    // Destroy all feature instances
    Object.values(this.features).forEach((feature: any) => {
      if (feature && typeof feature.destroy === 'function') {
        feature.destroy();
      }
    });

    this.removeAllListeners();
    this.features = {} as any;
  }

  /**
   * Convenience getter for the container's bounding rect.
   */
  public get containerRect(): DOMRect {
    return this.container.getBoundingClientRect();
  }
}
