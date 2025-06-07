import { SvgEnhancer } from '../core/base';
import { getTouchDistance, getTouchCenter } from '../core/utils';

export class TouchFeature {
  private enhancer: SvgEnhancer;
  private isDragging: boolean = false;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;
  private lastTouchDistance: number = 0;

  private handleTouchStart: (e: TouchEvent) => void;
  private handleTouchMove: (e: TouchEvent) => void;
  private handleTouchEnd: (e: TouchEvent) => void;

  constructor(enhancer: SvgEnhancer) {
    this.enhancer = enhancer;
    this.handleTouchStart = this._handleTouchStart.bind(this);
    this.handleTouchMove = this._handleTouchMove.bind(this);
    this.handleTouchEnd = this._handleTouchEnd.bind(this);
  }

  public init(): void {
    const svgEl = this.enhancer.svg!;
    svgEl.addEventListener('touchstart', this.handleTouchStart, {
      passive: false,
    });
    svgEl.addEventListener('touchmove', this.handleTouchMove, {
      passive: false,
    });
    svgEl.addEventListener('touchend', this.handleTouchEnd);
  }

  private _handleTouchStart(e: TouchEvent): void {
    if (this.enhancer.isDestroyed) return;
    e.preventDefault();

    // Defensive check for malformed events
    if (!e.touches || typeof e.touches.length !== 'number') {
      return;
    }

    if (e.touches.length === 1) {
      this.isDragging = true;
      this.lastMouseX = e.touches[0].clientX;
      this.lastMouseY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      this.isDragging = false;
      const [t1, t2] = [e.touches[0], e.touches[1]];
      this.lastTouchDistance = getTouchDistance(t1, t2);
    }
  }

  private _handleTouchMove(e: TouchEvent): void {
    if (this.enhancer.isDestroyed) return;
    e.preventDefault();

    // Defensive check for malformed events
    if (!e.touches || typeof e.touches.length !== 'number') {
      return;
    }

    if (e.touches.length === 1 && this.isDragging) {
      const touch = e.touches[0];
      const deltaX = touch.clientX - this.lastMouseX;
      const deltaY = touch.clientY - this.lastMouseY;

      this.enhancer.translateX += deltaX;
      this.enhancer.translateY += deltaY;

      this.lastMouseX = touch.clientX;
      this.lastMouseY = touch.clientY;

      this.enhancer.constrainPan();
      this.enhancer.svg!.style.transform = `translate(${this.enhancer.translateX}px, ${this.enhancer.translateY}px) scale(${this.enhancer.scale})`;
    } else if (e.touches.length === 2) {
      const [t1, t2] = [e.touches[0], e.touches[1]];
      const distance = getTouchDistance(t1, t2);
      const center = getTouchCenter(t1, t2);

      if (this.lastTouchDistance > 0) {
        const scaleDelta =
          (distance / this.lastTouchDistance - 1) * this.enhancer.scale;
        const rect = this.enhancer.containerRect;
        const centerX = center.x - rect.left;
        const centerY = center.y - rect.top;

        // Delegate to ZoomFeature
        this.enhancer.features.zoom.zoomAt(centerX, centerY, scaleDelta);
      }

      this.lastTouchDistance = distance;
    }
  }

  private _handleTouchEnd(_event: TouchEvent): void {
    // Stop panning on touch end
    this.isDragging = false;
  }

  public destroy(): void {
    const svgEl = this.enhancer.svg!;
    svgEl.removeEventListener('touchstart', this.handleTouchStart);
    svgEl.removeEventListener('touchmove', this.handleTouchMove);
    svgEl.removeEventListener('touchend', this.handleTouchEnd);
  }
}
