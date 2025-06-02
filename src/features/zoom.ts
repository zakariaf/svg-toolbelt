/*
 * Zoom Feature for SVG Enhancer
 */

import { SvgEnhancer } from '../core/base';

export class ZoomFeature {
  private enhancer: SvgEnhancer;
  private handleWheel: (e: WheelEvent) => void;

  constructor(enhancer: SvgEnhancer) {
    this.enhancer = enhancer;
    this.handleWheel = this._handleWheel.bind(this);
  }

  public init(): void {
    this.enhancer.container.addEventListener('wheel', this.handleWheel, {
      passive: false,
    });
  }

  private _handleWheel(e: WheelEvent): void {
    if (this.enhancer.isDestroyed) return;
    e.preventDefault();

    const rect = this.enhancer.containerRect;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta =
      e.deltaY > 0
        ? -this.enhancer.config.zoomStep
        : this.enhancer.config.zoomStep;
    this.zoomAt(mouseX, mouseY, delta);
  }

  public zoomIn(): void {
    const rect = this.enhancer.containerRect;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    this.zoomAt(centerX, centerY, this.enhancer.config.zoomStep);
  }

  public zoomOut(): void {
    const rect = this.enhancer.containerRect;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    this.zoomAt(centerX, centerY, -this.enhancer.config.zoomStep);
  }

  public zoomAt(x: number, y: number, delta: number): void {
    if (this.enhancer.isDestroyed) return;

    const newScale = Math.max(
      this.enhancer.config.minScale,
      Math.min(this.enhancer.config.maxScale, this.enhancer.scale + delta)
    );
    if (newScale === this.enhancer.scale) return;

    const svgX = (x - this.enhancer.translateX) / this.enhancer.scale;
    const svgY = (y - this.enhancer.translateY) / this.enhancer.scale;

    this.enhancer.scale = newScale;
    this.enhancer.translateX = x - svgX * this.enhancer.scale;
    this.enhancer.translateY = y - svgY * this.enhancer.scale;

    this.enhancer.constrainPan();
    this.enhancer.emit('zoom', {
      translateX: this.enhancer.translateX,
      translateY: this.enhancer.translateY,
      scale: this.enhancer.scale,
    });
    this.enhancer.svg!.style.transform = `translate(${this.enhancer.translateX}px, ${this.enhancer.translateY}px) scale(${this.enhancer.scale})`;
  }

  public destroy(): void {
    this.enhancer.container.removeEventListener('wheel', this.handleWheel);
  }
}
