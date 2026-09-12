import type { InjectionKey } from 'vue'

import type { DesignerResolvers, LocaleName } from '@/types'

export interface WinBpmnDesignerOptions {
  locale?: LocaleName
  /** 全局默认的业务扩展点，可被单个 <BpmnDesigner> 的同名 prop 覆盖 */
  resolvers?: DesignerResolvers
  /** 追加的 moddle 扩展，会与内置 flowable 扩展合并 */
  moddleExtensions?: Record<string, unknown>
}

/**
 * 单独成文件而不是放在 install.ts：组件要注入这个 key，而 install.ts 要导入组件，
 * 放一起会形成循环依赖。
 */
export const GLOBAL_OPTIONS_KEY: InjectionKey<
  Required<Pick<WinBpmnDesignerOptions, 'locale'>> & WinBpmnDesignerOptions
> = Symbol('win-bpmn-designer:options')
