import type { Injector } from 'didi'

import type { BpmnModeler } from '@/types'

/**
 * 只读标志容器。
 *
 * 与 LocaleStore 同理：普通可变对象，绝不能是 ref —— 它会被 didi 持有并传进
 * bpmn-js 内部，带上 Vue 的响应式 Proxy 会破坏引用相等判断（见方案 §4.2）。
 */
export interface ReadonlyStore {
  readonly: boolean
}

/**
 * 编辑类规则。命中时返回 false，把整条命令否掉。
 *
 * 优先级必须高于 BpmnRules（它注册在默认的 1000），否则压不住。
 */
const BLOCKED_RULES = [
  'shape.create',
  'shape.resize',
  'shape.attach',
  'shape.replace',
  'elements.create',
  'elements.move',
  'elements.delete',
  'elements.align',
  'elements.distribute',
  'element.copy',
  'connection.create',
  'connection.reconnect',
  'connection.start',
  'connection.updateWaypoints',
]

/**
 * 拖拽总闸。Dragging 在 init 阶段拿到 false 就整体取消（Dragging.js 的
 * `if (fire('init') === false) { cancel(); return false }`）。
 *
 * 这一组不能省：ConnectionSegmentMove 根本没有 rules 依赖（直接调
 * modeling.updateWaypoints），SpaceTool 的 makeSpace 同样没有，只靠规则拦不住。
 *
 * 刻意不含 hand.* 与 lasso.* —— 平移和框选在只读下必须保留。
 */
const BLOCKED_DRAG_INITS = [
  'shape.move.init',
  'resize.init',
  'connect.init',
  'global-connect.init',
  'bendpoint.move.init',
  'connectionSegment.move.init',
  'create.init',
  'spaceTool.init',
  'spaceTool.selection.init',
]

/** 只读下仍允许的 editorActions，其余（含 undo/redo）一概拦掉。 */
const ALLOWED_EDITOR_ACTIONS = new Set([
  'zoom',
  'stepZoom',
  'moveCanvas',
  'find',
  'selectElements',
])

const VETO_PRIORITY = 2000

interface EventBus {
  on: (
    events: string | string[],
    priority: number,
    callback: (event: unknown) => unknown,
  ) => void
  fire: (event: string, data?: unknown) => unknown
}

interface ReadonlyGuardDeps {
  eventBus: EventBus
  store: ReadonlyStore
}

function registerGuards({ eventBus, store }: ReadonlyGuardDeps): void {
  // 只读时返回 false；可编辑时返回 undefined —— Rules.allowed 会把 undefined
  // 映射成 true，正好是「不干预」的透传语义。
  const veto = (): unknown => (store.readonly ? false : undefined)

  for (const rule of BLOCKED_RULES) {
    eventBus.on(`commandStack.${rule}.canExecute`, VETO_PRIORITY, veto)
  }

  eventBus.on(BLOCKED_DRAG_INITS, VETO_PRIORITY, veto)

  // context-pad 与内联改名都不查 rules，必须各自单独拦
  eventBus.on('contextPad.open.allowed', VETO_PRIORITY, veto)
  eventBus.on('directEditing.activate.allowed', VETO_PRIORITY, veto)

  eventBus.on('editorActions.allowed', VETO_PRIORITY, (event: unknown) => {
    if (!store.readonly) return undefined

    const action = (event as { action?: string }).action
    return action && ALLOWED_EDITOR_ACTIONS.has(action) ? undefined : false
  })
}

/** 供 createModeler 挂进 additionalModules。store 同时以 value 注入，便于过滤器读取。 */
export function createReadonlyModule(store: ReadonlyStore) {
  function ReadonlyGuard(eventBus: EventBus): void {
    registerGuards({ eventBus, store })
  }

  ReadonlyGuard.$inject = ['eventBus']

  return {
    __init__: ['readonlyGuard'],
    readonlyStore: ['value', store],
    readonlyGuard: ['type', ReadonlyGuard],
  }
}

/** palette / context-pad 过滤器用它取 store；Viewer 等没挂本模块的场景返回 undefined。 */
export function resolveReadonlyStore(injector: Injector): ReadonlyStore | undefined {
  return injector.get<ReadonlyStore>('readonlyStore', false) ?? undefined
}

/**
 * 切换只读。
 *
 * 除了翻标志，还要收掉已经打开的浮层，并补发 i18n.changed ——
 * palette 监听着这个事件重渲染（Palette.js 的 `eventBus.on('i18n.changed')`），
 * 这是让它在只读下清空、恢复时重现的唯一触发点。
 */
export function setModelerReadonly(
  modeler: BpmnModeler,
  store: ReadonlyStore,
  next: boolean,
): void {
  store.readonly = next

  modeler.get<{ close: () => void }>('contextPad', false)?.close()
  modeler.get<{ cancel: () => void }>('dragging', false)?.cancel()
  modeler.get<EventBus>('eventBus').fire('i18n.changed')
}
