import type { ModuleDeclaration } from 'didi'

import type Modeler from 'bpmn-js/lib/Modeler'

/** bpmn-js Modeler 实例。业务方可通过 `designerRef.getModeler()` 拿到，作为逃生舱使用。 */
export type BpmnModeler = Modeler

/** diagram-js 的图元（shape / connection / label / root）。 */
export interface BpmnElement {
  id: string
  type: string
  businessObject: ModdleElement
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
 * 业务集成扩展点（M4）。
 * 未传时对应字段降级为普通输入框；传入时渲染宿主自己的选择器组件。
 */
export interface DesignerResolvers {
  /** 办理人 / 候选人选择器 */
  userPicker?: unknown
  /** 候选组（角色、部门）选择器 */
  groupPicker?: unknown
  /** 表单 key 选择器 */
  formPicker?: unknown
  /** 表达式编辑器 */
  expressionEditor?: unknown
  /** Java 类 / delegate 选择器 */
  classPicker?: unknown
}

/** 传给 bpmn-js Modeler 的透传配置。 */
export interface ModelerOptions {
  /** 追加的 diagram-js 模块 */
  additionalModules?: ModuleDeclaration[]
  /** 追加的 moddle 扩展（会与内置的 flowable 扩展合并） */
  moddleExtensions?: Record<string, unknown>
  /** palette 白名单，填内置条目 id（如 create.task、hand-tool）；不传则显示全部 */
  paletteItems?: string[]
  /** context-pad 白名单，填内置条目 id（如 append.end-event、connect、delete）；不传则显示全部 */
  contextPadItems?: string[]
}

/** 新建空流程时的初始参数。 */
export interface CreateProcessOptions {
  processId?: string
  processName?: string
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
  /** 逃生舱：拿到原生 modeler，做本库未覆盖的操作 */
  getModeler: () => BpmnModeler | undefined
}
