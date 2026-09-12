import type { ModuleDeclaration } from 'didi'
import type { Component, Ref } from 'vue'

import type Modeler from 'bpmn-js/lib/Modeler'

/** bpmn-js Modeler 实例。业务方可通过 `designerRef.getModeler()` 拿到，作为逃生舱使用。 */
export type BpmnModeler = Modeler

/** diagram-js 的图元（shape / connection / label / root）。 */
export interface BpmnElement {
  id: string
  type: string
  businessObject: ModdleElement
  /** 外置标签会指回宿主图元；遍历 elementRegistry 做统计时要据此排除，否则同一节点会被数两次 */
  labelTarget?: BpmnElement
  incoming?: BpmnElement[]
  outgoing?: BpmnElement[]
  parent?: BpmnElement
  [key: string]: unknown
}

/** moddle 元素，即 BPMN XML 反序列化后的业务对象。 */
export interface ModdleElement {
  $type: string
  id?: string
  name?: string
  $attrs?: Record<string, unknown>
  $parent?: ModdleElement
  [key: string]: unknown
}

/**
 * moddle 扩展描述符（如 core/moddle/flowable.json）。
 * 刻意只约束顶层字段：types 里的结构由 moddle 自己校验，写太死反而挡住合法写法。
 */
export interface ModdleDescriptor {
  name: string
  uri: string
  prefix: string
  xml?: Record<string, unknown>
  types: Record<string, unknown>[]
  [key: string]: unknown
}

export type LocaleName = 'zh-CN' | 'en-US'

/** 词条表：diagram-js translate 模块与本库面板文案共用。 */
export type LocaleMessages = Record<string, string>

/**
 * 传给自定义 translate 模块的词条容器。
 * 刻意用普通可变对象而非 ref：它会被 didi 持有并传进 bpmn-js 内部，
 * 不能带上 Vue 的响应式 Proxy（见方案 §4.2）。切换语言时整体替换 messages 即可。
 */
export interface LocaleStore {
  messages: LocaleMessages
}

/** palette 条目。`separator` 为 true 时是分隔符而非可点击按钮。 */
export interface PaletteEntry {
  group?: string
  className?: string
  title?: string
  separator?: boolean
  [key: string]: unknown
}

export type PaletteEntries = Record<string, PaletteEntry>

/** context-pad 条目。 */
export interface ContextPadEntry {
  group?: string
  className?: string
  title?: string
  [key: string]: unknown
}

export type ContextPadEntries = Record<string, ContextPadEntry>

/**
 * 业务集成扩展点。
 * 未传时对应字段降级为普通输入框；传入时渲染宿主自己的选择器组件。
 */
export type DesignerResolverName =
  | 'userPicker'
  | 'groupPicker'
  | 'formPicker'
  | 'expressionEditor'
  | 'classPicker'

/**
 * resolver 组件收到的 props。
 * multiple 为真时 modelValue 是 string[]，否则是 string —— 逗号串的拆拼由库内完成，
 * 宿主不必关心 Flowable 的逗号语义。
 */
export interface DesignerResolverProps {
  modelValue?: string | string[]
  multiple?: boolean
  label?: string
  disabled?: boolean
  /** 当前所属图元，宿主可据此做上下文相关的取值 */
  element?: BpmnElement
}

/** 故意放宽成 Component：宿主组件的 props 类型五花八门，卡太死只会制造摩擦。 */
export type DesignerResolver = Component

export type DesignerResolvers = Partial<Record<DesignerResolverName, DesignerResolver>>

export type ValidationSeverity = 'error' | 'warning'

export interface ValidationIssue {
  code: string
  severity: ValidationSeverity
  message: string
  elementId?: string
  elementName?: string
}

export interface ValidationResult {
  /** 无 error 即为 true；warning 不影响它 */
  valid: boolean
  issues: ValidationIssue[]
}

/** 下拉选项。 */
export interface SelectOption {
  label: string
  value: string
}

/** 属性组组件收到的 props。自定义分组照这个签名写即可。 */
export interface PropertyGroupProps {
  element: BpmnElement
  locale: LocaleName
}

/**
 * 属性面板的一个分组。
 * 业务方可注册新组，或用同一个 id 覆盖内置组的实现（见 registerPropertyGroup）。
 */
export interface PropertyGroup {
  id: string
  /** 命中哪些元素 */
  match: (element: BpmnElement) => boolean
  /** 升序排列，内置组用 10/20/30/40，中间留了间隔供插入 */
  order: number
  component: Component
}

/** 传给 bpmn-js Modeler 的透传配置。 */
export interface ModelerOptions {
  /** 追加的 diagram-js 模块 */
  additionalModules?: ModuleDeclaration[]
  /** 追加的 moddle 扩展（会与内置的 flowable 扩展合并） */
  moddleExtensions?: Record<string, ModdleDescriptor>
  /** palette 白名单，填内置条目 id（如 create.task、hand-tool）；不传则显示全部 */
  paletteItems?: string[]
  /** context-pad 白名单，填内置条目 id（如 append.end-event、connect、delete）；不传则显示全部 */
  contextPadItems?: string[]
}

/** 新建空流程时的初始参数。 */
export interface CreateProcessOptions {
  processId?: string
  processName?: string
  startEventName?: string
  /** definitions 的 targetNamespace，默认 Flowable 引擎期望的值 */
  targetNamespace?: string
}

/** `<BpmnDesigner>` 通过 ref 暴露的命令式 API。 */
export interface BpmnDesignerExpose {
  importXML: (xml: string) => Promise<void>
  createNew: (options?: CreateProcessOptions) => Promise<void>
  exportXML: (options?: { format?: boolean }) => Promise<string>
  exportSVG: () => Promise<string>
  undo: () => void
  redo: () => void
  zoom: (step: number) => void
  fitViewport: () => void
  /** 基础建模校验；无 error 时 valid 为 true */
  validate: () => ValidationResult
  /** 导出当前流程并派发 save 事件 */
  save: () => Promise<void>
  /** 相对上次导入/保存是否有未提交的改动 */
  dirty: Ref<boolean>
  /** 逃生舱：拿到原生 modeler，做本库未覆盖的操作 */
  getModeler: () => BpmnModeler | undefined
}
