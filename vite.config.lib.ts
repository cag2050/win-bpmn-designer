import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

import pkg from './package.json' with { type: 'json' }

/**
 * 库构建。ES / UMD 两种格式的 external 策略不同，rollup 的 external 无法按 format 区分，
 * 因此通过 LIB_FORMAT 环境变量跑两遍 build（见 package.json 的 build:lib）。
 *
 * - ES  产物：bpmn-js 系列一并 external，交给宿主打包器去重与 tree-shake
 * - UMD 产物：bpmn-js 系列 inline，保证 <script> 场景开箱可用
 * - vue / element-plus：两种格式都 external，绝不打进产物，避免宿主出现双实例
 */
const format = (process.env.LIB_FORMAT === 'umd' ? 'umd' : 'es') as 'es' | 'umd'
const isEs = format === 'es'

const PEER_EXTERNAL = [/^vue$/, /^element-plus(\/.*)?$/]

const BPMN_EXTERNAL = [
  /^bpmn-js(\/.*)?$/,
  /^bpmn-moddle(\/.*)?$/,
  /^diagram-js(\/.*)?$/,
  /^didi$/,
  /^min-dash$/,
  /^min-dom$/,
]

/**
 * external 用函数而非数组：CSS 必须始终参与打包。
 * 我们从 `bpmn-js/dist/assets/*.css` 引入内核样式，若被上面的正则拦成 external，
 * dist/style.css 里就会缺掉画布样式。
 */
function makeExternal(patterns: RegExp[]) {
  return (id: string): boolean => {
    if (/\.(css|scss|sass|less)$/.test(id)) return false
    return patterns.some((pattern) => pattern.test(id))
  }
}

export default defineConfig({
  // 库产物里不该混进仓库根的 public/ 静态资源
  publicDir: false,

  define: {
    __LIB_VERSION__: JSON.stringify(pkg.version),
  },

  plugins: [
    vue(),
    // 类型声明只在 ES 这一趟生成，避免重复产出
    isEs &&
      dts({
        tsconfigPath: 'tsconfig.build.json',
        entryRoot: 'src',
        outDirs: 'dist/types',
        insertTypesEntry: true,
        // 刻意不开 bundleTypes：api-extractor 合并时会把 vue-tsc 生成的 __VLS_* 内部
        // 辅助类型的定义丢掉，产出的单文件里全是 TS2304 未定义名，比逐文件 emit 更糟。
        // 逐文件 emit 的代价是消费方需用 bundler 解析（见 README 的兼容性说明）。
      }),
  ].filter(Boolean),

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  build: {
    // ES 先跑并清空 dist，UMD 后跑时必须保留前一趟的产物
    emptyOutDir: isEs,
    outDir: 'dist',
    cssCodeSplit: false,
    sourcemap: true,
    // ES 产物不压缩，交给宿主打包器；UMD 面向 <script> 直接使用，用 Vite 8 默认的 oxc 压缩
    minify: !isEs,
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      name: 'WinBpmnDesigner',
      formats: [format],
      fileName: () => (isEs ? 'win-bpmn-designer.mjs' : 'win-bpmn-designer.umd.cjs'),
      cssFileName: 'style',
    },
    rollupOptions: {
      external: makeExternal(isEs ? [...PEER_EXTERNAL, ...BPMN_EXTERNAL] : PEER_EXTERNAL),
      output: {
        exports: 'named',
        globals: {
          vue: 'Vue',
          'element-plus': 'ElementPlus',
        },
      },
    },
  },
})
