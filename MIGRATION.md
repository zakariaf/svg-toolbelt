# Migration from TSDX to Vite

## Changes Made

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
