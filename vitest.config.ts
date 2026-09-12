import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

import pkg from './package.json' with { type: 'json' }

const alias = { '@': fileURLToPath(new URL('./src', import.meta.url)) }

// src/index.ts 引用了这个常量，不注入的话被测模块会在导入期就炸
const define = { __LIB_VERSION__: JSON.stringify(pkg.version) }

/**
 * 两套 project，判定规则：只有「必须起一个真 Modeler」的用例才进 browser。
 *
 * 为什么不用 happy-dom / jsdom：两者都没实现 SVG 的 getBBox / createSVGPoint /
 * createSVGMatrix，完整的 bpmn-js Modeler 根本起不来；给它们打桩等于测自己的桩，
 * 几何值全是假的，拖拽与只读这类行为压根测不到。
 */
export default defineConfig({
  test: {
    projects: [
      {
        plugins: [vue()],
        resolve: { alias },
        define,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['test/unit/**/*.spec.ts', 'test/moddle/**/*.spec.ts'],
        },
      },
      {
        plugins: [vue()],
        resolve: { alias },
        define,
        // bpmn-js 生态部分包是 CJS，显式列出避免预构建抖动（与 playground 保持一致）
        optimizeDeps: {
          include: ['bpmn-js/lib/Modeler', 'bpmn-moddle', 'diagram-js', 'min-dash', 'min-dom'],
        },
        test: {
          name: 'browser',
          include: ['test/browser/**/*.spec.ts'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({
              // 用系统装好的 Chrome，不依赖 playwright 自己下载的 chromium —— CI 里
              // 由 `npx playwright install --with-deps chromium` 提供，本地无网也能跑。
              launchOptions: process.env.CI ? {} : { channel: 'chrome' },
            }),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
})
