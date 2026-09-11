/// <reference types="vite/client" />

/** 由 vite config 的 define 注入，值取自 package.json 的 version */
declare const __LIB_VERSION__: string

declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}
