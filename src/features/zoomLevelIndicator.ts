import { SvgEnhancer } from '../core/base';

/**
 * ZoomLevelIndicatorFeature
 *
 * Displays a transient badge (e.g. "150%") whenever the zoom level changes.
 * The badge appears in the top-left corner by default and fades out after a delay.
 */
export class ZoomLevelIndicatorFeature {
  private enhancer: SvgEnhancer;
  private badge: HTMLDivElement;
  private hideTimeout: number | null = null;
  private onZoom: (event: any) => void;

  constructor(enhancer: SvgEnhancer) {
    this.enhancer = enhancer;
    this.onZoom = this._onZoom.bind(this);

    // Create the DOM element that will show the percentage
    this.badge = document.createElement('div');
    this.badge.className = 'svg-toolbelt-zoom-indicator';
    this.badge.style.opacity = '0'; // start hidden
    this.badge.setAttribute('aria-live', 'polite'); // For screen readers
    this.badge.setAttribute('aria-label', 'Current zoom level');
  }

  public init(): void {
    // Append the badge to the container
    this.enhancer.container.appendChild(this.badge);

    // Listen for "zoom" events from ZoomFeature
    this.enhancer.on('zoom', this.onZoom);
  }

  private _onZoom(event: { scale: number; translateX: number; translateY: number }): void {
    if (this.enhancer.isDestroyed) return;

    // Convert scale (e.g. 1.5) to percent string "150%"
    const percent = `${Math.round(event.scale * 100)}%`;
    this.badge.textContent = percent;

    // Show the badge
    this.badge.style.opacity = '1';

    // Clear any existing timeout
    if (this.hideTimeout) {
      window.clearTimeout(this.hideTimeout);
    }

    // After a short delay (1.5s), fade out
    this.hideTimeout = window.setTimeout(() => {
      if (!this.enhancer.isDestroyed) {
        this.badge.style.opacity = '0';
      }
    }, 1500);
  }

  public destroy(): void {
    // Remove listener and badge
    this.enhancer.off('zoom', this.onZoom);

    if (this.hideTimeout) {
      window.clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    if (this.badge.parentNode) {
      this.badge.parentNode.removeChild(this.badge);
    }
  }
}
