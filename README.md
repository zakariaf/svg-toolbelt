# 🧰 svg-toolbelt

[![npm version](https://badge.fury.io/js/svg-toolbelt.svg)](https://badge.fury.io/js/svg-toolbelt)
[![Build Status](https://github.com/zakariaf/svg-toolbelt/actions/workflows/ci.yml/badge.svg)](https://github.com/zakariaf/svg-toolbelt/actions)
[![Coverage Status](https://coveralls.io/repos/github/zakariaf/svg-toolbelt/badge.svg?branch=main)](https://coveralls.io/github/zakariaf/svg-toolbelt?branch=main)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**A comprehensive, zero-dependency toolkit for SVG interaction: smooth zoom, pan, touch, keyboard controls, fullscreen, export, and more.**

Transform any static SVG (Mermaid diagrams, D3 visualizations, static illustrations) into an interactive, zoomable, and pannable experience—fully accessible, mobile-first, and production-ready.

---

## ✨ Features (v0.1.0)

- 🔍 **Smooth zoom & pan**
  - Mouse-wheel zoom (zoom-to-cursor)
  - Click-and-drag pan (desktop)
  - Pinch-to-zoom & touch-drag (mobile)
  - Keyboard shortcuts: `+`, `-`, `0` (reset), and arrow keys (pan)

- 🎛️ **On-screen controls**
  - Fully customizable buttons: zoom in, zoom out, reset, fullscreen, export
  - Four corner positions (`top-right`, `top-left`, `bottom-right`, `bottom-left`)

- 🖥️ **Fullscreen support**
  - Toggle fullscreen on the SVG container (if browser API available)

- 🔄 **Double-click reset**
  - Double-click inside the SVG resets zoom/pan to default

- ♿ **Accessibility champion**
  - Full keyboard navigation (WCAG 2.1 AA compatible)
  - Screen-reader–friendly controls (buttons have `title` attributes)

- 🪶 **Lightweight & zero dependencies**
  - ~5 KB minified (gzip)
  - No external libraries required

- 🎨 **Framework agnostic**
  - Works with React, Vue, Angular, or plain JavaScript
  - TypeScript definitions included (100% type coverage)

- 📘 **Full documentation & examples**
  - API reference, config options, usage snippets, and framework integrations

---

## 🚀 Quick Start

### 1. Installation

```bash
# npm
npm install svg-toolbelt

# yarn
yarn add svg-toolbelt

# pnpm
pnpm add svg-toolbelt
````

### 2. Import Styles

```css
/* In your main CSS or JS/TS entry, import the bundled CSS */
@import "svg-toolbelt/dist/svg-zoom.css";
```

Or, if using JavaScript/TypeScript:

```js
import "svg-toolbelt/dist/svg-zoom.css";
```

### 3. Initialize on Any SVG Container

#### Auto-initialize (all matching selectors)

```ts
import { initializeSvgZoom } from "svg-toolbelt";

/**
 * Finds every element matching the selector (e.g. ".zoomable-svg")
 * and wraps it to enable zoom/pan/etc.
 */
initializeSvgZoom(".zoomable-svg");
```

#### Manual instantiation

```ts
import { SvgZoom } from "svg-toolbelt";

const container = document.querySelector<HTMLElement>("#my-svg-container")!;
const zoomInstance = new SvgZoom(container, {
  minScale: 0.2,
  maxScale: 8,
  showControls: true,
  controlsPosition: "bottom-left",
  enableTouch: true,
  enableKeyboard: true,
  showExportSvg: true,
});
zoomInstance.init();

// Later, you can call:
zoomInstance.zoomIn();
zoomInstance.zoomOut();
zoomInstance.destroy();
```

---

## 📖 Documentation

### API Reference

#### `SvgZoom` class

```ts
constructor(container: HTMLElement, config?: Partial<SvgEnhancerConfig>);
```

* **Parameters**

  * `container: HTMLElement`
    A wrapper element that contains exactly one `<svg>`.
  * `config?: Partial<SvgEnhancerConfig>`
    Optional overrides of default behavior (see **Configuration Options** below).

* **Methods**

  * `init(): void`
    Initializes all features (zoom, pan, touch, keyboard, controls, fullscreen, double-click reset, no-context-menu, export).
  * `zoomIn(): void`
    Programmatic zoom-in by one `zoomStep`.
  * `zoomOut(): void`
    Programmatic zoom-out by one `zoomStep`.
  * `destroy(): void`
    Removes event listeners, UI elements, and restores the container to its original state.

```ts
// Example:
const zoomer = new SvgZoom(containerEl, { showControls: false });
zoomer.init();
```

#### `initializeSvgZoom`

```ts
function initializeSvgZoom(
  selectorOrElements: string | HTMLElement | HTMLElement[],
  config?: Partial<SvgEnhancerConfig>
): void;
```

* **`selectorOrElements`**:

  * `string`: A CSS selector (e.g., `".zoomable-svg"`). All matching elements will be wrapped and initialized.
  * `HTMLElement`: A single container to initialize.
  * `HTMLElement[]`: An array of container elements to initialize.

* **`config`**:

  * A partial set of config overrides, applied to each new `SvgZoom` instance.

**Returns**: `void`. Containers already initialized (wrapped with `.svg-zoom-wrapper`) are skipped.

```ts
// Example:
initializeSvgZoom(["#chart1", "#chart2"], { enableTouch: false });
```

---

### Configuration Options

All options are optional and extend sensible defaults:

```ts
interface SvgEnhancerConfig {
  // Zoom settings
  minScale: number;           // Default: 0.1
  maxScale: number;           // Default: 10
  zoomStep: number;           // Default: 0.1

  // Pan constraints (absolute pixels)
  maxPanX: number;            // Default: 1000
  maxPanY: number;            // Default: 1000

  // Transition/animation
  transitionDuration: number; // Default: 200 (ms)

  // UI Controls
  showControls: boolean;      // Default: true
  controlsPosition:          // Default: "top-right"
    | "top-right"
    | "top-left"
    | "bottom-right"
    | "bottom-left";

  // Interaction toggles
  enableTouch: boolean;       // Default: true
  enableKeyboard: boolean;    // Default: true
  showExportSvg: boolean;     // Default: true
}
```

---

### Keyboard Shortcuts

| Key          | Action                                 |
| ------------ | -------------------------------------- |
| `+` or `=`   | Zoom in (by `zoomStep`)                |
| `-`          | Zoom out (by `zoomStep`)               |
| `0`          | Reset zoom & pan to default (1×, 0, 0) |
| `ArrowUp`    | Pan up (by 20 px)                      |
| `ArrowDown`  | Pan down (by 20 px)                    |
| `ArrowLeft`  | Pan left (by 20 px)                    |
| `ArrowRight` | Pan right (by 20 px)                   |

---

### Touch Gestures

| Gesture             | Action                        |
| ------------------- | ----------------------------- |
| Pinch (two fingers) | Zoom in/out at gesture center |
| Drag (one finger)   | Pan (move)                    |
| Double-tap          | Reset zoom & pan to default   |

---

## 🎨 Styling

By default, the package ships with a CSS file:

```css
/* Import via JS/TS */
import "svg-toolbelt/dist/svg-zoom.css";

/* Or include via <link> tag */
<link rel="stylesheet" href="node_modules/svg-toolbelt/dist/svg-zoom.css" />
```

You can override these styles in your own stylesheet:

```css
/* Example: customize controls container */
.svg-zoom-controls {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Example: larger buttons */
.svg-zoom-controls button {
  width: 36px;
  height: 36px;
  border-radius: 6px;
}

/* Example: container wrapper override */
.svg-zoom-wrapper {
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
```

---

## 🎯 Framework Integrations

### React

```tsx
import React, { useEffect, useRef } from 'react';
import { SvgZoom } from 'svg-toolbelt';
import 'svg-toolbelt/dist/svg-zoom.css';

function InteractiveSvg({ children, config }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<SvgZoom | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      zoomRef.current = new SvgZoom(containerRef.current, config);
      zoomRef.current.init();
    }
    return () => {
      zoomRef.current?.destroy();
    };
  }, [config]);

  return <div ref={containerRef} className="svg-zoom-container">{children}</div>;
}
```

### Vue 3

```vue
<template>
  <div ref="containerRef" class="svg-zoom-container">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { SvgZoom } from 'svg-toolbelt';
import 'svg-toolbelt/dist/svg-zoom.css';

const props = defineProps<{ config?: Partial<SvgEnhancerConfig> }>();
const containerRef = ref<HTMLElement | null>(null);
let zoomInstance: SvgZoom | null = null;

onMounted(() => {
  if (containerRef.value) {
    zoomInstance = new SvgZoom(containerRef.value, props.config);
    zoomInstance.init();
  }
});

onUnmounted(() => {
  zoomInstance?.destroy();
});
</script>

<style scoped>
/* Optionally override CSS here */
</style>
```

### Angular

```ts
import { Component, ElementRef, Input, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
import { SvgZoom, SvgEnhancerConfig } from 'svg-toolbelt';
import 'svg-toolbelt/dist/svg-zoom.css';

@Component({
  selector: 'app-interactive-svg',
  template: '<div #container class="svg-zoom-container"><ng-content /></div>',
})
export class InteractiveSvgComponent implements AfterViewInit, OnDestroy {
  @ViewChild('container', { static: true }) containerRef!: ElementRef<HTMLElement>;
  @Input() config?: Partial<SvgEnhancerConfig>;
  private zoomInstance: SvgZoom | null = null;

  ngAfterViewInit() {
    this.zoomInstance = new SvgZoom(this.containerRef.nativeElement, this.config);
    this.zoomInstance.init();
  }

  ngOnDestroy() {
    this.zoomInstance?.destroy();
  }
}
```

---

## 🗺️ Use Cases

Perfect for:

* 📊 **Mermaid diagrams** in documentation sites (GitLab, GitHub, Confluence).
* 🗺️ **System architecture** diagrams and network topologies.
* 📈 **Data visualizations** (D3, Chart.js SVG exports).
* 🌳 **Mind maps** and hierarchical flowcharts.
* 📱 **Mobile documentation** where pinch-to-zoom is essential.
* ♿ **Accessible applications** requiring keyboard-driven navigation.
* 🖼️ **Static SVG illustrations** that need seamless zoom/pan.

---

## 🗺️ Browser Support

* ✅ Chrome 60+
* ✅ Firefox 55+
* ✅ Safari 12+
* ✅ Edge 79+
* ✅ iOS Safari 12+
* ✅ Chrome Mobile 60+
* ✅ Samsung Internet 8+

*For older browsers (IE11 or below), a polyfill is required (e.g., for `Promise`, `classList`, or fullscreen APIs).*

---

## 🛠️ Development & Testing

```bash
# Clone the repository
git clone https://github.com/zakariaf/svg-toolbelt.git
cd svg-toolbelt

# Install dependencies
npm install

# Development watch mode
npm start

# Run unit & integration tests
npm test

# View coverage report
npm run test:coverage

# Build for production (CJS, ESM, UMD)
npm run build

# Check bundle size
npm run size
```

* **Unit tests** use Jest + JSDOM + @testing-library/dom (≥95 % coverage).
* **Linting**: ESLint + Prettier + Husky (pre-commit hook).
* **Build pipeline**: TSDX (produces `dist/` with `.cjs.js`, `.esm.js`, `.umd.js`, and `index.d.ts`).

---

## 📄 License

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.

---

## 🎉 Acknowledgments & Inspiration

* Built with [TSDX](https://tsdx.io/) for robust TypeScript development.
* Inspired by the need for better SVG interaction in documentation platforms (Mermaid, D3, static diagrams).
* Thanks to the open source community for feedback, issues, and contributions.

---

**Made with ❤️ for the developer community.**
*If svg-toolbelt helped you, consider giving it a ⭐ on GitHub!*
