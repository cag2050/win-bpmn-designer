import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

import pkg from './package.json' with { type: 'json' }

/**
 * playground：本地开发调试用，同时可 build 成在线演示站。
 * 直接引用 src 源码（而非 dist），改动即时生效。
 */
export default defineConfig({
  root: fileURLToPath(new URL('./playground', import.meta.url)),
  base: './',
  // 静态资源仍放在仓库根的 public/，而不是 playground/public/
  publicDir: fileURLToPath(new URL('./public', import.meta.url)),

  define: {
    __LIB_VERSION__: JSON.stringify(pkg.version),
  },

  plugins: [vue()],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'win-bpmn-designer': fileURLToPath(new URL('./src/index.ts', import.meta.url)),
    },
  },

  // bpmn-js 生态中部分包为 CJS，显式预构建避免 dev 期反复抖动
  optimizeDeps: {
    include: ['bpmn-js/lib/Modeler', 'bpmn-moddle', 'diagram-js', 'min-dash', 'min-dom'],
  },

  server: {
    port: 5273,
  },

  build: {
    outDir: fileURLToPath(new URL('./dist-playground', import.meta.url)),
    emptyOutDir: true,
    sourcemap: true,
  },
})
