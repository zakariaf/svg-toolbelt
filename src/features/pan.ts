/**
 * Pan Feature - extracted from original code
 */

import { SvgEnhancer } from '../core/base';

export class PanFeature {
  private enhancer: SvgEnhancer;
  private isDragging: boolean = false;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;

  private handleMouseDown: (e: MouseEvent) => void;
  private handleMouseMove: (e: MouseEvent) => void;
  private handleMouseUp: (e: MouseEvent) => void;

  constructor(enhancer: SvgEnhancer) {
    this.enhancer = enhancer;
    this.handleMouseDown = this._handleMouseDown.bind(this);
    this.handleMouseMove = this._handleMouseMove.bind(this);
    this.handleMouseUp = this._handleMouseUp.bind(this);
  }

  public init(): void {
    this.enhancer.svg!.addEventListener('mousedown', this.handleMouseDown);
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);
  }

  private _handleMouseDown(e: MouseEvent): void {
    if (this.enhancer.isDestroyed || e.button !== 0) return;
    e.preventDefault();
    this.isDragging = true;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
  }

  private _handleMouseMove(e: MouseEvent): void {
    if (this.enhancer.isDestroyed || !this.isDragging) return;
    e.preventDefault();

    const deltaX = e.clientX - this.lastMouseX;
    const deltaY = e.clientY - this.lastMouseY;

    this.enhancer.translateX += deltaX;
    this.enhancer.translateY += deltaY;

    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;

    this.enhancer.constrainPan();
    this.enhancer.emit('pan', {
      translateX: this.enhancer.translateX,
      translateY: this.enhancer.translateY,
      scale: this.enhancer.scale,
    });

    this.enhancer.svg!.style.transform = `translate(${this.enhancer.translateX}px, ${this.enhancer.translateY}px) scale(${this.enhancer.scale})`;
  }

  private _handleMouseUp(_event: MouseEvent): void {
    if (this.enhancer.isDestroyed || !this.isDragging) return;
    this.isDragging = false;
  }

  public destroy(): void {
    this.enhancer.svg!.removeEventListener('mousedown', this.handleMouseDown);
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
  }
}
