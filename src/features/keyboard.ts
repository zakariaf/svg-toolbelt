/**
 * Keyboard Feature
 */

import { SvgEnhancer } from '../core/base';

export class KeyboardFeature {
  private enhancer: SvgEnhancer;
  private handleKeyDown: (e: KeyboardEvent) => void;

  constructor(enhancer: SvgEnhancer) {
    this.enhancer = enhancer;
    this.handleKeyDown = this._handleKeyDown.bind(this);
  }

  public init(): void {
    this.enhancer.container.setAttribute('tabindex', '0');
    this.enhancer.container.addEventListener('keydown', this.handleKeyDown);
  }

  private _handleKeyDown(e: KeyboardEvent): void {
    if (this.enhancer.isDestroyed) return;
    const step = 20;

    switch (true) {
      case e.key === '+' || e.key === '=':
        e.preventDefault();
        this.enhancer.features.zoom.zoomIn();
        break;
      case e.key === '-':
        e.preventDefault();
        this.enhancer.features.zoom.zoomOut();
        break;
      case e.key === '0':
        e.preventDefault();
        this.enhancer.scale = 1;
        this.enhancer.translateX = 0;
        this.enhancer.translateY = 0;
        this.enhancer.svg!.style.transform = `translate(0px, 0px) scale(1)`;
        break;
      case e.key === 'ArrowUp':
        e.preventDefault();
        this.enhancer.translateY += step;
        this.enhancer.constrainPan();
        this.enhancer.svg!.style.transform = `translate(${this.enhancer.translateX}px, ${this.enhancer.translateY}px) scale(${this.enhancer.scale})`;
        break;
      case e.key === 'ArrowDown':
        e.preventDefault();
        this.enhancer.translateY -= step;
        this.enhancer.constrainPan();
        this.enhancer.svg!.style.transform = `translate(${this.enhancer.translateX}px, ${this.enhancer.translateY}px) scale(${this.enhancer.scale})`;
        break;
      case e.key === 'ArrowLeft':
        e.preventDefault();
        this.enhancer.translateX += step;
        this.enhancer.constrainPan();
        this.enhancer.svg!.style.transform = `translate(${this.enhancer.translateX}px, ${this.enhancer.translateY}px) scale(${this.enhancer.scale})`;
        break;
      case e.key === 'ArrowRight':
        e.preventDefault();
        this.enhancer.translateX -= step;
        this.enhancer.constrainPan();
        this.enhancer.svg!.style.transform = `translate(${this.enhancer.translateX}px, ${this.enhancer.translateY}px) scale(${this.enhancer.scale})`;
        break;
      default:
        // Let other keys bubble
        break;
    }
  }

  public destroy(): void {
    this.enhancer.container.removeEventListener('keydown', this.handleKeyDown);
  }
}
