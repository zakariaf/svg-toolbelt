/**
 * Controls Feature
 */

import { SvgEnhancer } from "../core/base";
import { createControlButton } from "../core/utils";

export class ControlsFeature {
  private enhancer: SvgEnhancer;
  private controlsContainer: HTMLDivElement | null = null;

  constructor(enhancer: SvgEnhancer) {
    this.enhancer = enhancer;
  }

  public init(): void {
    this.createControls();
  }

  private createControls(): void {
    const container = document.createElement("div");
    container.className = `svg-zoom-controls position-${this.enhancer.config.controlsPosition}`;

    // Zoom In
    const zoomInBtn = createControlButton("+", "Zoom In", () =>
      this.enhancer.features.zoom.zoomIn()
    );
    // Zoom Out
    const zoomOutBtn = createControlButton("−", "Zoom Out", () =>
      this.enhancer.features.zoom.zoomOut()
    );
    // Reset
    const resetBtn = createControlButton("⌂", "Reset Zoom", () => {
      this.enhancer.scale = 1;
      this.enhancer.translateX = 0;
      this.enhancer.translateY = 0;
      this.enhancer.svg!.style.transform = `translate(0px, 0px) scale(1)`;
    });

    // Fullscreen (if supported)
    if (document.fullscreenEnabled && this.enhancer.features.fullscreen) {
      const fsBtn = createControlButton("⛶", "Toggle Fullscreen", () =>
        this.enhancer.features.fullscreen.toggleFullscreen()
      );
      container.appendChild(fsBtn);
    }

    container.appendChild(zoomInBtn);
    container.appendChild(zoomOutBtn);
    container.appendChild(resetBtn);

    this.enhancer.container.appendChild(container);
    this.controlsContainer = container;
  }

  public destroy(): void {
    if (this.controlsContainer) {
      this.controlsContainer.remove();
      this.controlsContainer = null;
    }
  }
}
