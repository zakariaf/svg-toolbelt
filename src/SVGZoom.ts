/**
 * svg-toolbelt: Zoom and Pan for Any SVG
 * @version 0.1.0
 *
 * Roadmap:
 * - 0.1.0: Initial port (zoom/pan/controls)
 * - 0.2.0: Download PNG/SVG export
 * - 0.3.0: Find & highlight
 * - 0.4.0: Rotate
 * - 1.0.0: API freeze after feedback
 */

export interface SVGZoomConfig {
  minScale?: number;
  maxScale?: number;
  zoomStep?: number;
  maxPanX?: number;
  maxPanY?: number;
  transitionDuration?: number;
  showControls?: boolean;
  controlsPosition?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  enableTouch?: boolean;
  enableKeyboard?: boolean;
}

export const DEFAULT_SVG_ZOOM_CONFIG: Required<SVGZoomConfig> = {
  minScale: 0.1,
  maxScale: 10,
  zoomStep: 0.1,
  maxPanX: 1000,
  maxPanY: 1000,
  transitionDuration: 200,
  showControls: true,
  controlsPosition: "top-right",
  enableTouch: true,
  enableKeyboard: true,
};

type SVGZoomEventHandler = (e: Event | KeyboardEvent | MouseEvent | TouchEvent) => void;

export class SVGZoom {
  private container: HTMLElement;
  private svg: SVGSVGElement;
  private config: Required<SVGZoomConfig>;

  private scale = 1;
  private translateX = 0;
  private translateY = 0;
  private isDragging = false;
  private lastMouseX = 0;
  private lastMouseY = 0;
  private isDestroyed = false;

  private lastTouchDistance = 0;
  private lastTouchCenterX = 0;
  private lastTouchCenterY = 0;

  private controlsContainer?: HTMLElement;
  private boundHandlers: { [key: string]: SVGZoomEventHandler };

  /**
   * Create a new SVGZoom instance for a container holding an SVG.
   * @param container DOM element containing a <svg>
   * @param config Optional configuration overrides
   */
  constructor(container: HTMLElement, config: SVGZoomConfig = {}) {
    this.container = container;
    this.config = { ...DEFAULT_SVG_ZOOM_CONFIG, ...config };
    const svg = container.querySelector("svg");
    if (!svg) {
      this.isDestroyed = true;
      // eslint-disable-next-line no-console
      console.warn("SVGZoom: No SVG found in container");
      throw new Error("SVGZoom: No SVG found in container");
    }
    this.svg = svg as SVGSVGElement;
    this.boundHandlers = {
      wheel: this.handleWheel.bind(this),
      mouseDown: this.handleMouseDown.bind(this),
      mouseMove: this.handleMouseMove.bind(this),
      mouseUp: this.handleMouseUp.bind(this),
      touchStart: this.handleTouchStart.bind(this),
      touchMove: this.handleTouchMove.bind(this),
      touchEnd: this.handleTouchEnd.bind(this),
      keyDown: this.handleKeyDown.bind(this),
      reset: this.reset.bind(this),
      contextMenu: (e) => e.preventDefault(),
    };
    this.init();
  }

  /**
   * Initialize zoom and pan functionality.
   */
  private init(): void {
    if (this.isDestroyed) return;
    this.setupContainer();
    this.setupEventListeners();
    if (this.config.showControls) {
      this.createControls();
    }
    this.applyTransform();
  }

  /**
   * Set up container and SVG styles.
   */
  private setupContainer(): void {
    this.container.classList.add("svg-zoom-container");
    this.svg.classList.add("svg-zoom-svg");
  }

  /**
   * Attach all event listeners.
   */
  private setupEventListeners(): void {
    this.container.addEventListener("wheel", this.boundHandlers.wheel, { passive: false });
    this.svg.addEventListener("mousedown", this.boundHandlers.mouseDown);
    document.addEventListener("mousemove", this.boundHandlers.mouseMove);
    document.addEventListener("mouseup", this.boundHandlers.mouseUp);

    if (this.config.enableTouch) {
      this.svg.addEventListener("touchstart", this.boundHandlers.touchStart, { passive: false });
      this.svg.addEventListener("touchmove", this.boundHandlers.touchMove, { passive: false });
      this.svg.addEventListener("touchend", this.boundHandlers.touchEnd);
    }
    if (this.config.enableKeyboard) {
      this.container.setAttribute("tabindex", "0");
      this.container.addEventListener("keydown", this.boundHandlers.keyDown);
    }
    this.svg.addEventListener("dblclick", this.boundHandlers.reset);
    this.container.addEventListener("contextmenu", this.boundHandlers.contextMenu);
  }

  /**
   * Create zoom/pan control buttons.
   */
  private createControls(): void {
    const controlsContainer = document.createElement("div");
    controlsContainer.className = `svg-zoom-controls position-${this.config.controlsPosition}`;
    // Zoom In button
    const zoomInBtn = SVGZoom.createControlButton("+", "Zoom In", () => this.zoomIn());
    // Zoom Out button
    const zoomOutBtn = SVGZoom.createControlButton("−", "Zoom Out", () => this.zoomOut());
    // Reset button
    const resetBtn = SVGZoom.createControlButton("⌂", "Reset Zoom", () => this.reset());
    // Fullscreen toggle (if supported)
    if (document.fullscreenEnabled) {
      const fullscreenBtn = SVGZoom.createControlButton("⛶", "Toggle Fullscreen", () => this.toggleFullscreen());
      controlsContainer.appendChild(fullscreenBtn);
    }
    controlsContainer.appendChild(zoomInBtn);
    controlsContainer.appendChild(zoomOutBtn);
    controlsContainer.appendChild(resetBtn);

    this.container.appendChild(controlsContainer);
    this.controlsContainer = controlsContainer;
  }

  private static createControlButton(
    text: string,
    title: string,
    onClick: () => void
  ): HTMLButtonElement {
    const button = document.createElement("button");
    button.textContent = text;
    button.title = title;
    button.className = "svg-zoom-btn";
    button.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    });
    return button;
  }

  private handleWheel(e: WheelEvent): void {
    if (this.isDestroyed) return;
    e.preventDefault();
    const rect = this.container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? -this.config.zoomStep : this.config.zoomStep;
    this.zoomAt(mouseX, mouseY, delta);
  }

  private handleMouseDown(e: MouseEvent): void {
    if (this.isDestroyed || e.button !== 0) return;
    e.preventDefault();
    this.isDragging = true;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
    this.svg.style.cursor = "grabbing";
  }

  private handleMouseMove(e: MouseEvent): void {
    if (this.isDestroyed || !this.isDragging) return;
    e.preventDefault();
    const deltaX = e.clientX - this.lastMouseX;
    const deltaY = e.clientY - this.lastMouseY;
    this.translateX += deltaX;
    this.translateY += deltaY;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
    this.constrainPan();
    this.applyTransform();
  }

  private handleMouseUp(): void {
    if (this.isDestroyed || !this.isDragging) return;
    this.isDragging = false;
    this.svg.style.cursor = "grab";
  }

  private handleTouchStart(e: TouchEvent): void {
    if (this.isDestroyed) return;
    e.preventDefault();
    if (e.touches.length === 1) {
      this.isDragging = true;
      this.lastMouseX = e.touches[0].clientX;
      this.lastMouseY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      this.isDragging = false;
      const [touch1, touch2] = e.touches;
      this.lastTouchDistance = SVGZoom.getTouchDistance(touch1, touch2);
      const center = SVGZoom.getTouchCenter(touch1, touch2);
      this.lastTouchCenterX = center.x;
      this.lastTouchCenterY = center.y;
    }
  }

  private handleTouchMove(e: TouchEvent): void {
    if (this.isDestroyed) return;
    e.preventDefault();
    if (e.touches.length === 1 && this.isDragging) {
      const touch = e.touches[0];
      const deltaX = touch.clientX - this.lastMouseX;
      const deltaY = touch.clientY - this.lastMouseY;
      this.translateX += deltaX;
      this.translateY += deltaY;
      this.lastMouseX = touch.clientX;
      this.lastMouseY = touch.clientY;
      this.constrainPan();
      this.applyTransform();
    } else if (e.touches.length === 2) {
      const [touch1, touch2] = e.touches;
      const distance = SVGZoom.getTouchDistance(touch1, touch2);
      const center = SVGZoom.getTouchCenter(touch1, touch2);
      if (this.lastTouchDistance > 0) {
        const scale = distance / this.lastTouchDistance;
        const rect = this.container.getBoundingClientRect();
        const centerX = center.x - rect.left;
        const centerY = center.y - rect.top;
        this.zoomAt(centerX, centerY, (scale - 1) * this.scale);
      }
      this.lastTouchDistance = distance;
      this.lastTouchCenterX = center.x;
      this.lastTouchCenterY = center.y;
    }
  }

  private handleTouchEnd(): void {
    if (this.isDestroyed) return;
    this.isDragging = false;
    this.lastTouchDistance = 0;
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (this.isDestroyed) return;
    const step = 20;
    switch (e.key) {
      case "+":
      case "=":
        e.preventDefault();
        this.zoomIn();
        break;
      case "-":
        e.preventDefault();
        this.zoomOut();
        break;
      case "0":
        e.preventDefault();
        this.reset();
        break;
      case "ArrowUp":
        e.preventDefault();
        this.translateY += step;
        this.constrainPan();
        this.applyTransform();
        break;
      case "ArrowDown":
        e.preventDefault();
        this.translateY -= step;
        this.constrainPan();
        this.applyTransform();
        break;
      case "ArrowLeft":
        e.preventDefault();
        this.translateX += step;
        this.constrainPan();
        this.applyTransform();
        break;
      case "ArrowRight":
        e.preventDefault();
        this.translateX -= step;
        this.constrainPan();
        this.applyTransform();
        break;
      default:
        break;
    }
  }

  private static getTouchDistance(touch1: Touch, touch2: Touch): number {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private static getTouchCenter(touch1: Touch, touch2: Touch): { x: number; y: number } {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  }

  /** Zoom in centered */
  public zoomIn(): void {
    if (this.isDestroyed) return;
    const rect = this.container.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    this.zoomAt(centerX, centerY, this.config.zoomStep);
  }

  /** Zoom out centered */
  public zoomOut(): void {
    if (this.isDestroyed) return;
    const rect = this.container.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    this.zoomAt(centerX, centerY, -this.config.zoomStep);
  }

  /** Zoom at a point (mouse, touch, or center) */
  public zoomAt(x: number, y: number, delta: number): void {
    if (this.isDestroyed) return;
    const newScale = Math.max(
      this.config.minScale,
      Math.min(this.config.maxScale, this.scale + delta)
    );
    if (newScale === this.scale) return;
    const svgX = (x - this.translateX) / this.scale;
    const svgY = (y - this.translateY) / this.scale;
    this.scale = newScale;
    this.translateX = x - svgX * this.scale;
    this.translateY = y - svgY * this.scale;
    this.constrainPan();
    this.applyTransform();
  }

  /** Limit pan to config bounds */
  private constrainPan(): void {
    const limitX = this.config.maxPanX;
    const limitY = this.config.maxPanY;
    this.translateX = Math.max(-limitX, Math.min(limitX, this.translateX));
    this.translateY = Math.max(-limitY, Math.min(limitY, this.translateY));
  }

  /** Reset zoom and pan to defaults */
  public reset(): void {
    if (this.isDestroyed) return;
    this.scale = 1;
    this.translateX = 0;
    this.translateY = 0;
    this.applyTransformWithTransition();
  }

  /** Apply CSS transform to SVG instantly */
  private applyTransform(): void {
    if (this.isDestroyed) return;
    this.svg.style.transition = "none";
    this.svg.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
  }

  /** Apply CSS transform to SVG with animation */
  private applyTransformWithTransition(): void {
    if (this.isDestroyed) return;
    this.svg.style.transition = `transform ${this.config.transitionDuration}ms ease-out`;
    this.svg.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
    setTimeout(() => {
      if (!this.isDestroyed) {
        this.svg.style.transition = "none";
      }
    }, this.config.transitionDuration);
  }

  /** Toggle fullscreen on container */
  public toggleFullscreen(): void {
    if (this.isDestroyed) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      this.container.requestFullscreen().catch((err) => {
        // eslint-disable-next-line no-console
        console.warn("SVGZoom: Failed to enter fullscreen:", err);
      });
    }
  }

  /** Clean up listeners and DOM */
  public destroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;
    this.container.removeEventListener("wheel", this.boundHandlers.wheel);
    this.svg.removeEventListener("mousedown", this.boundHandlers.mouseDown);
    document.removeEventListener("mousemove", this.boundHandlers.mouseMove);
    document.removeEventListener("mouseup", this.boundHandlers.mouseUp);
    if (this.config.enableTouch) {
      this.svg.removeEventListener("touchstart", this.boundHandlers.touchStart);
      this.svg.removeEventListener("touchmove", this.boundHandlers.touchMove);
      this.svg.removeEventListener("touchend", this.boundHandlers.touchEnd);
    }
    if (this.config.enableKeyboard) {
      this.container.removeEventListener("keydown", this.boundHandlers.keyDown);
    }
    this.svg.removeEventListener("dblclick", this.boundHandlers.reset);
    this.container.removeEventListener("contextmenu", this.boundHandlers.contextMenu);
    if (this.controlsContainer) {
      this.controlsContainer.remove();
    }
  }
}

/**
 * Initialize SVG zoom functionality for all containers matching selector.
 * @param selector CSS selector for containers
 * @param config Optional SVGZoomConfig
 */
export function initializeSVGZoom(selector: string, config: SVGZoomConfig = {}): void {
  const containers = document.querySelectorAll<HTMLElement>(selector);
  containers.forEach((container) => {
    if (container.querySelector("svg")) {
      new SVGZoom(container, config);
    }
  });
}
