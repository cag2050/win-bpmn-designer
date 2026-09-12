// 引入样式是为了让它进入构建图、产出 dist/style.css。
// lib 模式下 cssCodeSplit 关闭，Vite 会把 CSS 抽成独立文件而不注入 JS，
// 因此消费方仍需显式 `import 'win-bpmn-designer/style.css'`。
import '@/styles'

import BpmnCanvas from '@/components/BpmnCanvas.vue'
import BpmnDesigner from '@/components/BpmnDesigner.vue'
import BpmnPropertiesPanel from '@/components/PropertiesPanel/index.vue'
import BpmnToolbar from '@/components/Toolbar/index.vue'

export { BpmnCanvas, BpmnDesigner, BpmnPropertiesPanel, BpmnToolbar }

export {
  getPropertyGroups,
  registerPropertyGroup,
  unregisterPropertyGroup,
} from '@/components/PropertiesPanel/registry'
export { registerBuiltinGroups } from '@/components/PropertiesPanel/builtin'
export { default as BaseGroup } from '@/components/PropertiesPanel/groups/BaseGroup.vue'
export { default as BoundaryEventGroup } from '@/components/PropertiesPanel/groups/BoundaryEventGroup.vue'
export { default as CallActivityGroup } from '@/components/PropertiesPanel/groups/CallActivityGroup.vue'
export { default as ConditionGroup } from '@/components/PropertiesPanel/groups/ConditionGroup.vue'
export { default as EventDefinitionGroup } from '@/components/PropertiesPanel/groups/EventDefinitionGroup.vue'
export { default as ExecutionListenerGroup } from '@/components/PropertiesPanel/groups/ExecutionListenerGroup.vue'
export { default as FormPropertyGroup } from '@/components/PropertiesPanel/groups/FormPropertyGroup.vue'
export { default as MultiInstanceGroup } from '@/components/PropertiesPanel/groups/MultiInstanceGroup.vue'
export { default as ProcessGroup } from '@/components/PropertiesPanel/groups/ProcessGroup.vue'
export { default as ServiceTaskGroup } from '@/components/PropertiesPanel/groups/ServiceTaskGroup.vue'
export { default as SubProcessGroup } from '@/components/PropertiesPanel/groups/SubProcessGroup.vue'
export { default as TaskListenerGroup } from '@/components/PropertiesPanel/groups/TaskListenerGroup.vue'
export { default as UserTaskGroup } from '@/components/PropertiesPanel/groups/UserTaskGroup.vue'
export { default as PropCollection } from '@/components/PropertiesPanel/widgets/PropCollection.vue'
export { default as PropList } from '@/components/PropertiesPanel/widgets/PropList.vue'
export { default as PropSelect } from '@/components/PropertiesPanel/widgets/PropSelect.vue'
export { default as PropSwitch } from '@/components/PropertiesPanel/widgets/PropSwitch.vue'
export { default as PropText } from '@/components/PropertiesPanel/widgets/PropText.vue'

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
export { useElementProps, useProperty } from '@/composables/useElementProps'
export type { ElementProps } from '@/composables/useElementProps'
export { useExtensionCollection, useModdleCollection } from '@/composables/useExtensionCollection'
export type { ModdleCollection } from '@/composables/useExtensionCollection'
export { useSelection } from '@/composables/useSelection'
export { createModeler, FlowableModdleDescriptor } from '@/core/createModeler'
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
  addExtensionElement,
  createExtensionElement,
  ensureExtensionElements,
  getExtensionElements,
  getExtensionsOfType,
  removeExtensionElement,
  updateExtensionElement,
} from '@/helpers/extension-elements'
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
