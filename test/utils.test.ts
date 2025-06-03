/**
 * Tests for utility functions
 */
import { describe, it, expect, vi } from 'vitest';
import {
  getSVGBoundingBox,
  getTouchDistance,
  getTouchCenter,
  createControlButton
} from '../src/core/utils';

describe('Utility Functions', () => {
  describe('getSVGBoundingBox', () => {
    it('should handle zero dimensions and return null', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

      // Mock getBBox to return zero dimensions
      svg.getBBox = vi.fn().mockReturnValue({
        x: 0,
        y: 0,
        width: 0,
        height: 0
      });

      const result = getSVGBoundingBox(svg);

      expect(warnSpy).toHaveBeenCalledWith('SVG has zero dimensions');
      expect(result).toBeNull();

      warnSpy.mockRestore();
    });

    it('should fallback to viewBox when getBBox fails', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

      // Mock getBBox to throw an error
      svg.getBBox = vi.fn().mockImplementation(() => {
        throw new Error('getBBox failed');
      });

      // Mock viewBox
      Object.defineProperty(svg, 'viewBox', {
        value: {
          baseVal: {
            x: 10,
            y: 20,
            width: 100,
            height: 200
          }
        },
        configurable: true
      });

      const result = getSVGBoundingBox(svg);

      expect(result).toEqual({
        x: 10,
        y: 20,
        width: 100,
        height: 200
      });
    });

    it('should fallback to getBoundingClientRect as last resort', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

      // Mock getBBox to throw an error
      svg.getBBox = vi.fn().mockImplementation(() => {
        throw new Error('getBBox failed');
      });

      // Mock viewBox to also fail
      Object.defineProperty(svg, 'viewBox', {
        get: () => {
          throw new Error('viewBox failed');
        },
        configurable: true
      });

      // Mock getBoundingClientRect
      svg.getBoundingClientRect = vi.fn().mockReturnValue({
        width: 300,
        height: 400,
        top: 0,
        left: 0,
        right: 300,
        bottom: 400
      });

      const result = getSVGBoundingBox(svg);

      expect(result).toEqual({
        x: 0,
        y: 0,
        width: 300,
        height: 400
      });
    });

    it('should return null when viewBox has zero dimensions', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

      // Mock getBBox to throw an error
      svg.getBBox = vi.fn().mockImplementation(() => {
        throw new Error('getBBox failed');
      });

      // Mock viewBox with zero width/height
      Object.defineProperty(svg, 'viewBox', {
        value: {
          baseVal: {
            x: 10,
            y: 20,
            width: 0, // zero width
            height: 100
          }
        },
        configurable: true
      });

      const result = getSVGBoundingBox(svg);

      expect(result).toBeNull();
    });

    it('should return null when all fallback methods fail', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

      // Mock getBBox to throw an error
      svg.getBBox = vi.fn().mockImplementation(() => {
        throw new Error('getBBox failed');
      });

      // Mock viewBox to fail
      Object.defineProperty(svg, 'viewBox', {
        get: () => {
          throw new Error('viewBox failed');
        },
        configurable: true
      });

      // Mock getBoundingClientRect to return zero dimensions
      svg.getBoundingClientRect = vi.fn().mockReturnValue({
        width: 0,
        height: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      });

      const result = getSVGBoundingBox(svg);

      expect(result).toEqual({
        x: 0,
        y: 0,
        width: 0,
        height: 0
      });
    });

    it('should return valid bbox when getBBox succeeds', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

      // Mock getBBox to return valid dimensions
      svg.getBBox = vi.fn().mockReturnValue({
        x: 5,
        y: 10,
        width: 50,
        height: 100
      });

      const result = getSVGBoundingBox(svg);

      expect(result).toEqual({
        x: 5,
        y: 10,
        width: 50,
        height: 100
      });
    });
  });

  describe('getTouchDistance', () => {
    it('should calculate distance between two touch points', () => {
      const touch1 = { clientX: 0, clientY: 0 } as Touch;
      const touch2 = { clientX: 3, clientY: 4 } as Touch;

      const distance = getTouchDistance(touch1, touch2);

      // Distance should be sqrt(3^2 + 4^2) = 5
      expect(distance).toBe(5);
    });

    it('should calculate distance for identical touch points', () => {
      const touch1 = { clientX: 10, clientY: 20 } as Touch;
      const touch2 = { clientX: 10, clientY: 20 } as Touch;

      const distance = getTouchDistance(touch1, touch2);

      expect(distance).toBe(0);
    });

    it('should handle negative coordinates', () => {
      const touch1 = { clientX: -5, clientY: -5 } as Touch;
      const touch2 = { clientX: 5, clientY: 5 } as Touch;

      const distance = getTouchDistance(touch1, touch2);

      // Distance should be sqrt(10^2 + 10^2) = sqrt(200) ≈ 14.14
      expect(distance).toBeCloseTo(14.142135623730951, 5);
    });
  });

  describe('getTouchCenter', () => {
    it('should calculate center point between two touches', () => {
      const touch1 = { clientX: 0, clientY: 0 } as Touch;
      const touch2 = { clientX: 10, clientY: 20 } as Touch;

      const center = getTouchCenter(touch1, touch2);

      expect(center).toEqual({ x: 5, y: 10 });
    });

    it('should handle negative coordinates', () => {
      const touch1 = { clientX: -10, clientY: -20 } as Touch;
      const touch2 = { clientX: 10, clientY: 20 } as Touch;

      const center = getTouchCenter(touch1, touch2);

      expect(center).toEqual({ x: 0, y: 0 });
    });

    it('should handle identical touch points', () => {
      const touch1 = { clientX: 15, clientY: 25 } as Touch;
      const touch2 = { clientX: 15, clientY: 25 } as Touch;

      const center = getTouchCenter(touch1, touch2);

      expect(center).toEqual({ x: 15, y: 25 });
    });
  });

  describe('createControlButton', () => {
    it('should create button with correct properties', () => {
      const mockOnClick = vi.fn();
      const button = createControlButton('Test', 'Test Button', mockOnClick);

      expect(button.textContent).toBe('Test');
      expect(button.title).toBe('Test Button');
      expect(button.className).toBe('svg-toolbelt-btn');
      expect(button.tagName).toBe('BUTTON');
    });

    it('should call onClick when button is clicked', () => {
      const mockOnClick = vi.fn();
      const button = createControlButton('Click Me', 'Clickable', mockOnClick);

      button.click();

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should prevent default and stop propagation on click', () => {
      const mockOnClick = vi.fn();
      const button = createControlButton('Test', 'Test', mockOnClick);

      // Create a mock event
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true
      });

      const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');
      const stopPropagationSpy = vi.spyOn(clickEvent, 'stopPropagation');

      button.dispatchEvent(clickEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(stopPropagationSpy).toHaveBeenCalled();
      expect(mockOnClick).toHaveBeenCalled();
    });
  });
});
