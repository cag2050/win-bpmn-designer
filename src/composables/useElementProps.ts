import { computed, ref, watch } from 'vue'
import type { ComputedRef, Ref, ShallowRef, WritableComputedRef } from 'vue'

import { useModeler } from '@/composables/useModeler'
import { getBusinessObject } from '@/helpers/element-utils'
import type { BpmnElement, ModdleElement } from '@/types'

interface Modeling {
  updateProperties: (element: BpmnElement, properties: Record<string, unknown>) => void
  updateModdleProperties: (
    element: BpmnElement,
    moddleElement: ModdleElement,
    properties: Record<string, unknown>,
  ) => void
}

interface ElementChangedEvent {
  element: BpmnElement
}

interface BpmnFactory {
  create: (type: string, attrs?: Record<string, unknown>) => ModdleElement
}

interface EventBus {
  on: (event: string, callback: (e: ElementChangedEvent) => void) => void
  off: (event: string, callback: (e: ElementChangedEvent) => void) => void
}

/** bo 现在只用于对外暴露，读值走 get() —— 见 get() 里关于 revision 的注释。 */

export interface ElementProps {
  bo: ComputedRef<ModdleElement | undefined>
  /** 每次当前元素发生变更时自增，供 computed 建立依赖 */
  revision: Ref<number>
  get: <T = unknown>(key: string) => T | undefined
  set: (key: string, value: unknown) => void
  /** 一次写多个属性，合成一条撤销记录。切换互斥字段时必须用它，否则会留下半旧半新的中间态 */
  setMany: (properties: Record<string, unknown>) => void
  setModdle: (target: ModdleElement, key: string, value: unknown) => void
  /** 建 moddle 元素（如 bpmn:Documentation / bpmn:FormalExpression），会自动补 id */
  create: (type: string, attrs?: Record<string, unknown>) => ModdleElement | undefined
}

/**
 * 单个元素的属性读写桥接。
 *
 * 读：订阅 element.changed，只在事件指向当前元素时自增 revision 触发重算。
 * 写：一律走 modeling，绝不直接给 businessObject 赋值 —— 否则撤销/重做、
 * 脏标记与 XML 序列化会全线失效（方案 §4.2 第 3 条）。
 */
export function useElementProps(element: ShallowRef<BpmnElement | undefined>): ElementProps {
  const modeler = useModeler()
  const revision = ref(0)

  const bo = computed(() => {
    // 建立依赖：元素内容变了但引用没变时也要重算
    void revision.value
    return getBusinessObject(element.value)
  })

  watch(
    modeler,
    (instance, _previous, onCleanup) => {
      if (!instance) return

      const eventBus = instance.get<EventBus>('eventBus')

      function onElementChanged(event: ElementChangedEvent): void {
        if (event.element === element.value) revision.value += 1
      }

      // 根元素（Process）改属性时 element.changed 不一定带上它，
      // 补一条 commandStack.changed 兜底，代价只是多算几次 computed。
      function onCommandStackChanged(): void {
        revision.value += 1
      }

      eventBus.on('element.changed', onElementChanged)
      eventBus.on('commandStack.changed', onCommandStackChanged)

      onCleanup(() => {
        eventBus.off('element.changed', onElementChanged)
        eventBus.off('commandStack.changed', onCommandStackChanged)
      })
    },
    { immediate: true },
  )

  // 切换选中元素时也要让依赖 revision 的 computed 重算
  watch(element, () => {
    revision.value += 1
  })

  function get<T = unknown>(key: string): T | undefined {
    // 显式依赖 revision：businessObject 是同一个对象引用，属性变了引用不变，
    // 不碰 revision 的话 computed 会一直吃缓存，面板永远显示旧值。
    void revision.value
    return getBusinessObject(element.value)?.[key] as T | undefined
  }

  function set(key: string, value: unknown): void {
    setMany({ [key]: value })
  }

  function setMany(properties: Record<string, unknown>): void {
    const target = element.value
    if (!target || !modeler.value) return

    modeler.value.get<Modeling>('modeling').updateProperties(target, properties)
  }

  function setModdle(target: ModdleElement, key: string, value: unknown): void {
    const host = element.value
    if (!host || !modeler.value) return

    modeler.value
      .get<Modeling>('modeling')
      .updateModdleProperties(host, target, { [key]: value })
  }

  function create(type: string, attrs: Record<string, unknown> = {}): ModdleElement | undefined {
    return modeler.value?.get<BpmnFactory>('bpmnFactory').create(type, attrs)
  }

  return { bo, revision, get, set, setMany, setModdle, create }
}

/**
 * 把单个属性包成可 v-model 的 computed。
 *
 * 空串归一成 undefined：moddle 对 undefined 是删除属性、对 '' 是照写，
 * 后者会在 XML 里留下 flowable:assignee="" 这种脏属性。
 */
export function useProperty<T = string>(
  props: ElementProps,
  key: string,
): WritableComputedRef<T | undefined> {
  return computed({
    get: () => props.get<T>(key),
    set: (value) => props.set(key, value === '' ? undefined : value),
  })
}
