/**
 * Fullscreen Feature - extracted from original code
 */

import { SvgEnhancer } from "../core/base";

export class FullscreenFeature {
  private enhancer: SvgEnhancer;

  constructor(enhancer: SvgEnhancer) {
    this.enhancer = enhancer;
  }

  public toggleFullscreen(): void {
    if (this.enhancer.isDestroyed) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {
        console.warn("Failed to exit fullscreen");
      });
    } else {
      this.enhancer.container.requestFullscreen().catch((err) => {
        console.warn("Failed to enter fullscreen:", err);
      });
    }
  }

  public destroy(): void {
    // No listeners to remove here
  }
}
