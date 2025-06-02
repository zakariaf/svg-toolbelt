/**
 * Calculate distance between two touch points.
 */
export function getTouchDistance(touch1: Touch, touch2: Touch): number {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate center point between two touches.
 */
export function getTouchCenter(touch1: Touch, touch2: Touch): { x: number; y: number } {
  return {
    x: (touch1.clientX + touch2.clientX) / 2,
    y: (touch1.clientY + touch2.clientY) / 2,
  };
}

/**
 * Create a simple HTML button for controls.
 */
export function createControlButton(
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

/**
 * Get the bounding box of an <svg> element, falling back to viewBox or getBoundingClientRect.
 */
export function getSVGBoundingBox(
  svg: SVGSVGElement
): { x: number; y: number; width: number; height: number } | null {
  try {
    const bbox = svg.getBBox();
    if (bbox.width === 0 || bbox.height === 0) {
      console.warn("SVG has zero dimensions");
      return null;
    }
    return {
      x: bbox.x,
      y: bbox.y,
      width: bbox.width,
      height: bbox.height,
    };
  } catch {
    // Fallback: use viewBox if available
    try {
      const viewBox = (svg as any).viewBox.baseVal;
      if (viewBox.width > 0 && viewBox.height > 0) {
        return {
          x: viewBox.x,
          y: viewBox.y,
          width: viewBox.width,
          height: viewBox.height,
        };
      }
    } catch {
      // Last resort: getBoundingClientRect
      const rect = svg.getBoundingClientRect();
      return {
        x: 0,
        y: 0,
        width: rect.width,
        height: rect.height,
      };
    }
  }
  return null;
}
