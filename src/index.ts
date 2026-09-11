// 引入样式是为了让它进入构建图、产出 dist/style.css。
// lib 模式下 cssCodeSplit 关闭，Vite 会把 CSS 抽成独立文件而不注入 JS，
// 因此消费方仍需显式 `import 'win-bpmn-designer/style.css'`。
import '@/styles'

import BpmnCanvas from '@/components/BpmnCanvas.vue'
import BpmnDesigner from '@/components/BpmnDesigner.vue'

export { BpmnCanvas, BpmnDesigner }

export { useModeler, provideModeler, MODELER_KEY } from '@/composables/useModeler'
export { createModeler } from '@/core/createModeler'
export type { CreateModelerParams } from '@/core/createModeler'

export {
  getBusinessObject,
  getProcessElement,
  is,
  isRoot,
} from '@/helpers/element-utils'
export {
  createEmptyDiagram,
  FLOWABLE_NAMESPACE,
  FLOWABLE_PREFIX,
  FLOWABLE_TARGET_NAMESPACE,
} from '@/helpers/xml-templates'

export { DEFAULT_LOCALE, locales, translate } from '@/locales'

export { GLOBAL_OPTIONS_KEY, install } from '@/install'
export type { WinBpmnDesignerOptions } from '@/install'
export { default } from '@/install'

export type * from '@/types'

export const version: string = __LIB_VERSION__
