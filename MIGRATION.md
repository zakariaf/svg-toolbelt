# Migration Guide

## Version 0.7.0 (Breaking Change)

### 🚀 Renaming: `SvgZoom` to `SvgToolbelt`

To improve clarity and better reflect the library's capabilities, we've renamed the main class and initialization function:

- `SvgZoom` class is now `SvgToolbelt`
- `initializeSvgZoom` function is now `initializeSvgToolbelt`

**Why this change?**

"SvgToolbelt" more accurately describes the library as a comprehensive set of tools for SVG manipulation, not just zooming. This change aims to make the library's purpose clearer to new users and align the naming with its broader feature set.

**How to Migrate:**

1. **Update Imports:**
   Change your import statements:

   ```javascript
   // Before
   import { SvgZoom, initializeSvgZoom } from 'svg-toolbelt';

   // After
   import { SvgToolbelt, initializeSvgToolbelt } from 'svg-toolbelt';
   ```

2. **Update Class Instantiation:**
   If you are instantiating the class directly:

   ```javascript
   // Before
   const instance = new SvgZoom(element, options);

   // After
   const instance = new SvgToolbelt(element, options);
   ```

3. **Update Function Calls:**
   If you are using the initialization function:

   ```javascript
   // Before
   const instance = initializeSvgZoom(element, options);

   // After
   const instance = initializeSvgToolbelt(element, options);
   ```

4. **Global Scope (UMD/IIFE builds):**
   If you are using the UMD build directly in a browser via a `<script>` tag, the global object has changed:

   ```html
   <!-- Before -->
   <script src="path/to/svg-toolbelt.umd.js"></script>
   <script>
     var instance = new window.SvgZoom(document.getElementById('my-svg'));
     // or
     var SvgZoomClass = window.SvgZoom.SvgZoom; // if library exposes itself as an object
     var instance = new SvgZoomClass(document.getElementById('my-svg'));
   </script>

   <!-- After -->
   <script src="path/to/svg-toolbelt.umd.js"></script>
   <script>
     var instance = new window.SvgToolbelt.SvgToolbelt(document.getElementById('my-svg'));
     // or using the initializer (if applicable and exposed)
     // var instance = window.SvgToolbelt.initializeSvgToolbelt(document.getElementById('my-svg'));
   </script>
   ```

   *Note: The exact global variable structure (`window.SvgToolbelt.SvgToolbelt` vs `window.SvgToolbelt`) depends on your UMD build configuration. Please check the `library.name` and `library.type` in your `vite.config.ts` if you are unsure. For this project, it's `window.SvgToolbelt.SvgToolbelt` for the class and `window.SvgToolbelt.initializeSvgToolbelt` for the function.*

**Backward Compatibility:**

For a smoother transition, deprecated aliases `SvgZoom` and `initializeSvgZoom` are still available. They will work as before but will log a console warning encouraging you to update to the new names. These aliases will be removed in a future major version.

```javascript
// This will still work but show a deprecation warning in the console
import { SvgZoom } from 'svg-toolbelt';
const oldInstance = new SvgZoom(element);
```

We recommend updating to the new names (`SvgToolbelt` and `initializeSvgToolbelt`) at your earliest convenience to avoid issues when the deprecated aliases are removed.

---

## Migration from TSDX to Vite

### Changes Made

### 1. **Dependencies Updated**

- Removed: `tsdx`, `tslib`
- Added: `vite`, `vite-plugin-dts`, `vitest`, `jsdom`, `@eslint/js`, `globals`
- Updated: ESLint and TypeScript related packages

### 2. **Build System**

- **Old (TSDX)**: Used Rollup internally with limited CSS support
- **New (Vite)**: Modern build tool with excellent CSS handling
- **CSS Benefits**:
  - Automatic CSS minification (CSS file: 4.66 kB → 1.43 kB gzipped)
  - Better tree-shaking
  - Faster builds
  - Better source maps

### 3. **Configuration Files**

- Added: `vite.config.ts` - Main build configuration
- Added: `vitest.config.ts` - Test configuration
- Updated: `tsconfig.json` - Modern TypeScript setup
- Updated: `eslint.config.js` - ESLint flat config

### 4. **Scripts Updated**

```json
{
  "dev": "vite build --watch",
  "build": "vite build",
  "test": "vitest",
  "lint": "eslint src --ext .ts,.tsx",
  "lint:fix": "eslint src --ext .ts,.tsx --fix",
  "type-check": "tsc --noEmit"
}
```

### 5. **CSS Processing**

- CSS is now imported directly in `src/index.ts`
- Vite automatically:
  - Minifies CSS
  - Generates separate CSS file (`svg-toolbelt.css`)
  - Creates source maps
  - Handles CSS imports in library bundles

### 6. **Output Files**

All previous output formats maintained:

- `dist/index.js` (CommonJS)
- `dist/svg-toolbelt.esm.js` (ES Modules)
- `dist/svg-toolbelt.cjs.production.min.js` (UMD)
- `dist/svg-toolbelt.css` (Minified CSS)
- `dist/index.d.ts` (TypeScript declarations)

### 7. **Testing**

- Switched from Jest (via TSDX) to Vitest
- All tests pass with updated imports
- Faster test execution

## Benefits of Migration

1. **Better CSS Support**: CSS is now properly minified and tree-shaken
2. **Faster Builds**: Vite's optimized bundling is significantly faster
3. **Modern Tooling**: Up-to-date dependencies and build system
4. **Better Development Experience**: Hot module replacement, better error messages
5. **Future-Proof**: Vite is actively maintained and evolving

## Usage Remains the Same

The library API and usage patterns remain exactly the same. Users can continue to:

```javascript
import { SvgZoom, initializeSvgZoom } from 'svg-toolbelt';
import 'svg-toolbelt/dist/svg-toolbelt.css'; // Still works!
```

The migration is completely transparent to end users.
