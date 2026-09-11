import type { App, InjectionKey, Plugin } from 'vue'

import BpmnCanvas from '@/components/BpmnCanvas.vue'
import BpmnDesigner from '@/components/BpmnDesigner.vue'
import { DEFAULT_LOCALE } from '@/locales'
import type { DesignerResolvers, LocaleName } from '@/types'

export interface WinBpmnDesignerOptions {
  locale?: LocaleName
  /** 全局默认的业务扩展点，可被单个 <BpmnDesigner> 的同名 prop 覆盖 */
  resolvers?: DesignerResolvers
  /** 追加的 moddle 扩展，会与内置 flowable 扩展合并 */
  moddleExtensions?: Record<string, unknown>
}

export const GLOBAL_OPTIONS_KEY: InjectionKey<Required<Pick<WinBpmnDesignerOptions, 'locale'>> &
  WinBpmnDesignerOptions> = Symbol('win-bpmn-designer:options')

export function install(app: App, options: WinBpmnDesignerOptions = {}): void {
  app.provide(GLOBAL_OPTIONS_KEY, { locale: DEFAULT_LOCALE, ...options })

  app.component('BpmnDesigner', BpmnDesigner)
  app.component('BpmnCanvas', BpmnCanvas)
}

const plugin: Plugin = { install }

export default plugin
