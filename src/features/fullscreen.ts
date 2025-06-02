/**
 * Fullscreen Feature - extracted from original code
 */

import { SvgEnhancer } from '../core/base';

export class FullscreenFeature {
  private enhancer: SvgEnhancer;

  constructor(enhancer: SvgEnhancer) {
    this.enhancer = enhancer;
  }

  public toggleFullscreen(): void {
    if (this.enhancer.isDestroyed) return;

    // If we're already in fullscreen, try to exit
    if (document.fullscreenElement) {
      if (typeof document.exitFullscreen === 'function') {
        document.exitFullscreen().catch(() => {
          console.warn('Failed to exit fullscreen');
        });
      } else {
        // API not supported
        console.warn('exitFullscreen() is not supported in this environment');
      }
    } else {
      // Otherwise, try to enter fullscreen
      const containerEl = this.enhancer.container;
      if (typeof containerEl.requestFullscreen === 'function') {
        containerEl.requestFullscreen().catch(err => {
          console.warn('Failed to enter fullscreen:', err);
        });
      } else {
        // API not supported
        console.warn(
          'requestFullscreen() is not supported in this environment'
        );
      }
    }
  }

  public destroy(): void {
    // No listeners to remove here
  }
}
