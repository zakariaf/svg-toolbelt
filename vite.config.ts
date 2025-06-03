import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      include: ['src/**/*'],
      exclude: ['src/**/*.test.ts', 'test/**/*'],
      rollupTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'SvgToolbelt',
      formats: ['es', 'cjs', 'umd'],
      fileName: (format) => {
        switch (format) {
          case 'es':
            return 'svg-toolbelt.esm.js';
          case 'cjs':
            return 'index.js';
          case 'umd':
            return 'svg-toolbelt.cjs.production.min.js';
          default:
            return `svg-toolbelt.${format}.js`;
        }
      },
    },
    rollupOptions: {
      external: [],
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'svg-toolbelt.css';
          return assetInfo.name || 'assets/[name].[ext]';
        },
      },
    },
    minify: 'terser',
    sourcemap: true,
    cssCodeSplit: false,
    cssMinify: true,
    emptyOutDir: true,
  },
  css: {
    preprocessorOptions: {},
  },
});
