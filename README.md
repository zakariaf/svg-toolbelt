# 🧰 svg-toolbelt

[![Build Status](https://github.com/zakariaf/svg-toolbelt/actions/workflows/main.yml/badge.svg)](https://github.com/zakariaf/svg-toolbelt/actions)
[![Coverage Status](https://coveralls.io/repos/github/zakariaf/svg-toolbelt/badge.svg?branch=main)](https://coveralls.io/github/zakariaf/svg-toolbelt?branch=main)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**A lightweight, zero-dependency library to add smooth zoom, pan, touch, keyboard controls and fullscreen support to any SVG.**

Transform any static SVG (Mermaid diagrams, D3 visualizations, technical drawings) into an interactive, zoomable, and pannable experience—fully accessible, mobile-first, and production-ready.

---

## 🎯 Origin Story

This library was born from a real need at **GitLab** - making large Mermaid diagrams more accessible in documentation. When complex system architecture diagrams and flowcharts became impossible to read on mobile devices or for users with visual impairments, we knew we needed a better solution.

**The challenge**: Most existing solutions were either too heavy (requiring entire libraries like D3.js just for zoom/pan), too basic (missing accessibility features), or didn't work well on mobile devices.

**Our solution**: A lightweight, modular, accessibility-first toolkit that works with any SVG - not just Mermaid diagrams.

---

## ✨ Features

- 🔍 **Smooth zoom & pan**
  - Mouse-wheel zoom with zoom-to-cursor precision
  - Click-and-drag panning (desktop)
  - Pinch-to-zoom & touch-drag (mobile)
  - Keyboard shortcuts: `+`/`-` (zoom), `0` (reset), arrows (pan)

- 🎛️ **Smart on-screen controls**
  - Zoom in/out, reset, and fullscreen buttons
  - Export functionality for saving SVG content
  - Four positioning options: any corner of the container
  - Fully customizable styling and behavior

- 📊 **Visual feedback**
  - Transient zoom level indicator showing current zoom percentage
  - Appears briefly when zoom level changes (e.g., "150%")
  - Accessible with screen reader support
  - Auto-fades after 1.5 seconds

- 📱 **Mobile-first design**
  - Optimized touch interactions with proper gesture recognition
  - Responsive UI that adapts to screen size
  - Touch-friendly button sizes (44px minimum)

- ♿ **Accessibility champion**
  - WCAG 2.1 AA compliant with full keyboard navigation
  - Screen reader compatible with proper ARIA labels
  - High contrast mode and reduced motion support

- 🏗️ **Modular architecture**
  - Use only the features you need (tree-shakeable)
  - Feature-based design: zoom, pan, touch, keyboard, controls, fullscreen
  - Easy to extend with custom features

- 🪶 **Lightweight & zero dependencies**
  - Under 5KB minified + gzipped for both ESM and CJS builds
  - No external libraries required
  - Built with modern TypeScript

- 🎨 **Framework agnostic**
  - Works with React, Vue, Angular, or vanilla JavaScript
  - Complete TypeScript definitions included
  - Clean, predictable API

---

## 🚀 Quick Start

### 1. Installation

**Via npm/yarn/pnpm:**

```bash
npm install svg-toolbelt
# or
yarn add svg-toolbelt
# or
pnpm add svg-toolbelt
```

**Via CDN (unpkg):**

```html
<!-- Include the library -->
<script src="https://unpkg.com/svg-toolbelt@latest/dist/svg-toolbelt.cjs.production.min.js"></script>
<!-- Include the styles -->
<link rel="stylesheet" href="https://unpkg.com/svg-toolbelt@latest/dist/svg-toolbelt.css">
```

**For ES modules:**

```html
<script type="module">
  import { initializeSvgZoom } from 'https://unpkg.com/svg-toolbelt@latest/dist/svg-toolbelt.esm.js';
  // Your code here
</script>
```

**Requirements:**

- Node.js ≥18 (for development)
- Modern browsers with ES2020+ support

### 2. Try the Demo

**Online demo:** [zakariaf.github.io/svg-toolbelt](https://zakariaf.github.io/svg-toolbelt)

**Local development demo:** Available in the `/demo` directory with Node.js server

### 3. Import Styles

```typescript
// Import the CSS in your main entry file
import 'svg-toolbelt/dist/svg-toolbelt.css';
```

### 4. Basic Usage

#### Auto-initialize (recommended for most cases)

```typescript
import { initializeSvgZoom } from 'svg-toolbelt';

// Initialize all elements with the class 'zoomable'
initializeSvgZoom('.zoomable');
```

```html
<!-- Your HTML -->
<div class="zoomable">
  <svg viewBox="0 0 800 600">
    <!-- Your SVG content (Mermaid, D3, hand-drawn, etc.) -->
  </svg>
</div>
```

#### Manual instantiation (for more control)

```typescript
import { SvgZoom } from 'svg-toolbelt';

const container = document.querySelector('#my-diagram');
const enhancer = new SvgZoom(container, {
  minScale: 0.2,
  maxScale: 8,
  zoomStep: 0.15,
  showControls: true,
  controlsPosition: 'top-right',
  enableTouch: true,
  enableKeyboard: true
});

enhancer.init();

// Programmatic control
enhancer.zoomIn();
enhancer.zoomOut();

// Cleanup when done
enhancer.destroy();
```

---

## 📖 API Reference

### `SvgZoom` Class

The main class that provides all zoom/pan functionality.

```typescript
constructor(container: HTMLElement, config?: Partial<SvgEnhancerConfig>)
```

**Parameters:**

- `container` - HTMLElement that contains exactly one `<svg>` element
- `config` - Optional configuration overrides (see Configuration section)

**Methods:**

- `init()` - Initialize all features and event listeners
- `zoomIn()` - Zoom in by one step
- `zoomOut()` - Zoom out by one step
- `destroy()` - Clean up all event listeners and UI elements

**Events:**

```typescript
enhancer.on('zoom', ({ scale, translateX, translateY }) => {
  console.log(`Zoomed to ${scale}x at (${translateX}, ${translateY})`);
});

enhancer.on('pan', ({ translateX, translateY }) => {
  console.log(`Panned to (${translateX}, ${translateY})`);
});
```

### `initializeSvgZoom` Function

Convenience function for batch initialization.

```typescript
function initializeSvgZoom(
  selectorOrElements: string | HTMLElement | HTMLElement[],
  config?: Partial<SvgEnhancerConfig>
): void
```

**Parameters:**

- `selectorOrElements` - CSS selector string, single element, or array of elements
- `config` - Configuration applied to all instances

**Examples:**

```typescript
// CSS selector
initializeSvgZoom('.diagram');

// Single element
const chart = document.querySelector('#chart');
initializeSvgZoom(chart);

// Array of elements
const diagrams = document.querySelectorAll('.svg-container');
initializeSvgZoom(Array.from(diagrams));

// With custom config
initializeSvgZoom('.large-diagrams', {
  minScale: 0.1,
  maxScale: 20,
  controlsPosition: 'bottom-right'
});
```

---

## ⚙️ Configuration Options

All options are optional with sensible defaults:

```typescript
interface SvgEnhancerConfig {
  // Zoom settings
  minScale: number;           // Default: 0.1 (10%)
  maxScale: number;           // Default: 10 (1000%)
  zoomStep: number;           // Default: 0.1 (10% per step)

  // Pan constraints (pixels)
  maxPanX: number;            // Default: 1000
  maxPanY: number;            // Default: 1000

  // Animation
  transitionDuration: number; // Default: 200 (milliseconds)

  // UI Controls
  showControls: boolean;      // Default: true
  controlsPosition:           // Default: 'top-right'
    | 'top-right'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-left';

  // Feature toggles
  enableTouch: boolean;       // Default: true
  enableKeyboard: boolean;    // Default: true
  showZoomLevelIndicator: boolean; // Default: true
}
```

**Example configurations:**

```typescript
// Minimal zoom-only setup
const minimal = new SvgZoom(container, {
  showControls: false,
  enableKeyboard: false,
  enableTouch: false,
  showZoomLevelIndicator: false  // Hide zoom percentage indicator
});

// Large diagram optimized
const largeDiagram = new SvgZoom(container, {
  minScale: 0.05,
  maxScale: 50,
  zoomStep: 0.2,
  controlsPosition: 'bottom-left'
});

// Mobile-optimized
const mobile = new SvgZoom(container, {
  zoomStep: 0.25,  // Bigger steps for touch
  transitionDuration: 150,  // Faster animations
  enableKeyboard: false     // Focus on touch
});
```

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `+` or `=` | Zoom in by one step |
| `-` | Zoom out by one step |
| `0` | Reset zoom and pan to defaults |
| `↑` `↓` `←` `→` | Pan in the respective direction |
| **Double-click** | Reset zoom and pan |

**Note:** The container must have focus for keyboard shortcuts to work. Click on the diagram or tab to it.

---

## 👆 Touch Gestures

| Gesture | Action |
|---------|--------|
| **Pinch** (two fingers) | Zoom in/out centered on gesture |
| **Drag** (one finger) | Pan around the diagram |
| **Double-tap** | Reset zoom and pan to defaults |

All touch interactions are optimized for smooth 60fps performance.

---

## 🎨 Styling & Customization

### Default Styles

The package includes a complete CSS file:

```typescript
import 'svg-toolbelt/dist/svg-toolbelt.css';
```

### Custom Styling

Override default styles in your CSS:

```css
/* Container styling */
.svg-toolbelt-wrapper {
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  background: #ffffff;
}

/* Controls styling */
.svg-toolbelt-controls {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(8px);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Button styling */
.svg-toolbelt-controls button {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  font-size: 18px;
  transition: all 0.2s ease;
}

/* Dark theme */
.dark .svg-toolbelt-wrapper {
  background: #1f2937;
  border-color: #374151;
}

.dark .svg-toolbelt-controls {
  background: rgba(31, 41, 55, 0.95);
  border-color: #374151;
}
```

### Responsive Design

Built-in responsive breakpoints:

```css
/* Mobile optimizations (automatically applied) */
@media (max-width: 768px) {
  .svg-toolbelt-controls button {
    width: 44px;   /* Larger touch targets */
    height: 44px;
    font-size: 16px;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .svg-toolbelt-controls {
    border: 2px solid #000;
    background: #fff;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .svg-toolbelt-wrapper * {
    transition: none !important;
  }
}
```

---

## 🛠️ Framework Integration

### React

```tsx
import React, { useEffect, useRef } from 'react';
import { SvgZoom, SvgEnhancerConfig } from 'svg-toolbelt';
import 'svg-toolbelt/dist/svg-toolbelt.css';

interface ZoomableSvgProps {
  children: React.ReactNode;
  config?: Partial<SvgEnhancerConfig>;
  className?: string;
}

export function ZoomableSvg({ children, config, className }: ZoomableSvgProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const enhancerRef = useRef<SvgZoom>();

  useEffect(() => {
    if (containerRef.current) {
      enhancerRef.current = new SvgZoom(containerRef.current, config);
      enhancerRef.current.init();
    }

    return () => {
      enhancerRef.current?.destroy();
    };
  }, [config]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}

// Usage
function MyComponent() {
  return (
    <ZoomableSvg config={{ minScale: 0.5, maxScale: 4 }}>
      <svg viewBox="0 0 400 300">
        {/* Your SVG content */}
      </svg>
    </ZoomableSvg>
  );
}
```

### Vue 3

```vue
<template>
  <div ref="containerRef" :class="className">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { SvgZoom, SvgEnhancerConfig } from 'svg-toolbelt';
import 'svg-toolbelt/dist/svg-toolbelt.css';

interface Props {
  config?: Partial<SvgEnhancerConfig>;
  className?: string;
}

const props = defineProps<Props>();
const containerRef = ref<HTMLElement>();
let enhancer: SvgZoom;

onMounted(() => {
  if (containerRef.value) {
    enhancer = new SvgZoom(containerRef.value, props.config);
    enhancer.init();
  }
});

onUnmounted(() => {
  enhancer?.destroy();
});
</script>
```

### Angular

```typescript
import { Component, ElementRef, Input, OnInit, OnDestroy } from '@angular/core';
import { SvgZoom, SvgEnhancerConfig } from 'svg-toolbelt';
import 'svg-toolbelt/dist/svg-toolbelt.css';

@Component({
  selector: 'app-zoomable-svg',
  template: '<ng-content></ng-content>',
  styleUrls: ['./zoomable-svg.component.css']
})
export class ZoomableSvgComponent implements OnInit, OnDestroy {
  @Input() config?: Partial<SvgEnhancerConfig>;

  private enhancer?: SvgZoom;

  constructor(private elementRef: ElementRef<HTMLElement>) {}

  ngOnInit() {
    this.enhancer = new SvgZoom(this.elementRef.nativeElement, this.config);
    this.enhancer.init();
  }

  ngOnDestroy() {
    this.enhancer?.destroy();
  }
}
```

---

## 🎯 Real-World Use Cases

### Mermaid Diagrams (GitLab-style)

```typescript
// Wait for Mermaid to render, then enhance
document.addEventListener('DOMContentLoaded', () => {
  // Mermaid renders asynchronously
  setTimeout(() => {
    initializeSvgZoom('.mermaid', {
      minScale: 0.2,
      maxScale: 6,
      controlsPosition: 'top-right',
      zoomStep: 0.15
    });
  }, 100);
});
```

### Large System Architecture Diagrams

```typescript
initializeSvgZoom('.architecture-diagram', {
  minScale: 0.1,    // Zoom way out to see the big picture
  maxScale: 20,     // Zoom way in to read details
  zoomStep: 0.2,    // Bigger steps for faster navigation
  controlsPosition: 'bottom-right'
});
```

### Data Visualizations

```typescript
// After D3 or Chart.js renders your SVG
const chartContainer = d3.select('#chart').node().parentElement;
const enhancer = new SvgZoom(chartContainer, {
  enableKeyboard: false,  // Let your chart handle keyboard events
  showControls: false,    // Use your own UI
  enableTouch: true       // Keep touch for mobile users
});
enhancer.init();
```

### Mobile Documentation

```typescript
// Mobile-optimized configuration
initializeSvgZoom('.mobile-diagram', {
  zoomStep: 0.25,           // Larger steps for touch
  transitionDuration: 100,  // Faster transitions
  controlsPosition: 'bottom-right',
  minScale: 0.3,           // Don't zoom too far out on small screens
  maxScale: 5              // Don't need extreme zoom on mobile
});
```

---

## 🌐 Browser Support

- ✅ **Chrome 60+** (including Android)
- ✅ **Firefox 55+**
- ✅ **Safari 12+** (including iOS)
- ✅ **Edge 79+** (Chromium-based)
- ✅ **Samsung Internet 8+**

**Legacy Support:**

- For older browsers, ensure these APIs are available (via polyfills if needed):
  - `addEventListener`
  - `querySelector` / `querySelectorAll`
  - `getBoundingClientRect`
  - `transform` CSS property

---

## 🛠️ Development & Testing

### Getting Started

```bash
# Clone and setup
git clone https://github.com/zakariaf/svg-toolbelt.git
cd svg-toolbelt
npm install

# Development
npm run dev        # Watch mode build (vite build --watch)
npm run build      # Production build

# Local development demo
npm run demo       # Build and serve demo on http://localhost:8080 (Node.js server)
# or
npm run serve      # Start server only (if already built)

# Development with live reload
npm run dev        # Watch mode build (in one terminal)
npm run serve      # Start server (in another terminal)

# Testing
npm test           # Run tests with vitest (watch mode)
npm test -- --run  # Run tests once (no watch mode)
npm test -- --coverage  # Run tests with coverage report

# Quality
npm run lint       # ESLint check
npm run lint:fix   # ESLint with auto-fix
npm run type-check # TypeScript type checking

# Bundle analysis
npm run size       # Check bundle size against limits (10KB)
npm run analyze    # Detailed bundle analysis with size-limit --why

# Release (creates git tags and pushes)
npm run release:patch  # 0.2.0 -> 0.2.1
npm run release:minor  # 0.2.0 -> 0.3.0
npm run release:major  # 0.2.0 -> 1.0.0
```

### Test Coverage

- **Unit tests**: Individual features and core logic (>98% coverage)
- **Integration tests**: End-to-end scenarios and real DOM interactions
- **Accessibility tests**: Keyboard navigation and screen reader compatibility
- **Performance tests**: Memory leaks and smooth operation under load

---

## 📄 License

**MIT License** - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **GitLab Engineering Team** - For the original requirement and use case
- **Mermaid.js Community** - For inspiring better diagram accessibility
- **TSDX** - For excellent TypeScript tooling
- **Open Source Community** - For feedback, testing, and contributions

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for:

- 🐛 **Bug reports** and fixes
- ✨ **Feature requests** and implementations
- 📖 **Documentation** improvements
- 🧪 **Test coverage** enhancements
- 🎨 **Accessibility** improvements

### Quick Start for Contributors

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes with tests: `npm test`
4. Ensure quality: `npm run lint && npm run typecheck`
5. Submit a pull request

---

**Made with ❤️ for better documentation everywhere**

If svg-toolbelt helps your project, please consider starring the repository! ⭐

---

### 📞 Support

- 📖 **Documentation**: [Complete API docs and examples](https://zakariaf.github.io/svg-toolbelt)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/zakariaf/svg-toolbelt/discussions)
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/zakariaf/svg-toolbelt/issues)
