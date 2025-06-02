/**
 * Default configuration for SvgEnhancer.
 * Provides zoom/pan limits, UI controls, touch/keyboard support, etc.
 */
export interface SvgEnhancerConfig {
  // Zoom limits
  minScale: number;
  maxScale: number;
  zoomStep: number;

  // Pan limits (prevent panning too far)
  maxPanX: number;
  maxPanY: number;

  // Animation duration in milliseconds
  transitionDuration: number;

  // Controls: whether to show on-screen buttons
  showControls: boolean;

  // Position of controls: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  controlsPosition: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

  // Touch support
  enableTouch: boolean;

  // Keyboard support
  enableKeyboard: boolean;
}

export const DEFAULT_SVG_ENHANCER_CONFIG: Readonly<SvgEnhancerConfig> = Object.freeze(
  {
    minScale: 0.1,
    maxScale: 10,
    zoomStep: 0.1,
    maxPanX: 1000,
    maxPanY: 1000,
    transitionDuration: 200,
    showControls: true,
    controlsPosition: 'top-right',
    enableTouch: true,
    enableKeyboard: true,
  }
);
