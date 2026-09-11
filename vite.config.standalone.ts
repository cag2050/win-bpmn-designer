import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

import pkg from './package.json' with { type: 'json' }

/**
 * standalone：独立可嵌入页面，供非 Vue 的老后台系统用 <iframe> 集成，
 * 通过 postMessage 与宿主通信（协议见 standalone/bridge.ts）。
 *
 * base 用相对路径，产物可以直接丢到任意子目录下部署。
 */
export default defineConfig({
  root: fileURLToPath(new URL('./standalone', import.meta.url)),
  base: './',
  // 嵌入页不需要额外静态资源，关掉 publicDir 避免误拷贝
  publicDir: false,

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

  optimizeDeps: {
    include: ['bpmn-js/lib/Modeler', 'bpmn-moddle', 'diagram-js', 'min-dash', 'min-dom'],
  },

  server: {
    port: 5274,
  },

  build: {
    outDir: fileURLToPath(new URL('./dist-standalone', import.meta.url)),
    emptyOutDir: true,
    // 嵌入方通常拿不到 sourcemap 服务，关掉减小体积
    sourcemap: false,
    assetsInlineLimit: 0,
  },
})
