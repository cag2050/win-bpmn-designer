// 引入样式是为了让它进入构建图、产出 dist/style.css。
// lib 模式下 cssCodeSplit 关闭，Vite 会把 CSS 抽成独立文件而不注入 JS，
// 因此消费方仍需显式 `import 'win-bpmn-designer/style.css'`。
import '@/styles'

import BpmnCanvas from '@/components/BpmnCanvas.vue'
import BpmnDesigner from '@/components/BpmnDesigner.vue'
import BpmnToolbar from '@/components/Toolbar/index.vue'

export { BpmnCanvas, BpmnDesigner, BpmnToolbar }

export {
  alignElements,
  distributeElements,
  downloadFile,
  fitViewport,
  zoomBy,
  zoomIn,
  zoomOut,
} from '@/components/Toolbar/actions'
export type { Alignment, Distribution } from '@/components/Toolbar/actions'

export { useModeler, provideModeler, MODELER_KEY } from '@/composables/useModeler'
export { useCommandStack } from '@/composables/useCommandStack'
export { useSelection } from '@/composables/useSelection'
export { createModeler } from '@/core/createModeler'
export type { CreateModelerParams } from '@/core/createModeler'

export { ContextPadFilterModule } from '@/core/modules/context-pad'
export { PaletteFilterModule } from '@/core/modules/palette'
export { createTranslate, createTranslateModule } from '@/core/modules/translate'

export {
  getBusinessObject,
  getProcessElement,
  is,
  isRoot,
} from '@/helpers/element-utils'
export { debounce } from '@/helpers/debounce'
export {
  createEmptyDiagram,
  FLOWABLE_NAMESPACE,
  FLOWABLE_PREFIX,
  FLOWABLE_TARGET_NAMESPACE,
} from '@/helpers/xml-templates'

export { DEFAULT_LOCALE, locales, translate } from '@/locales'
export { GLOBAL_OPTIONS_KEY } from '@/options'
export type { WinBpmnDesignerOptions } from '@/options'
export { install } from '@/install'
export { default } from '@/install'

export type * from '@/types'

export const version: string = __LIB_VERSION__
