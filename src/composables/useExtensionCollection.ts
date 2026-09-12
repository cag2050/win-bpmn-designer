import { computed, markRaw } from 'vue'
import type { ComputedRef, ShallowRef } from 'vue'

import { useElementProps } from '@/composables/useElementProps'
import { useModeler } from '@/composables/useModeler'
import {
  addExtensionElement,
  createExtensionElement,
  getExtensionsOfType,
  removeExtensionElement,
  updateExtensionElement,
} from '@/helpers/extension-elements'
import type { BpmnElement, ModdleElement } from '@/types'

export interface ModdleCollection {
  items: ComputedRef<ModdleElement[]>
  add: (attrs?: Record<string, unknown>) => void
  remove: (item: ModdleElement) => void
  update: (item: ModdleElement, properties: Record<string, unknown>) => void
}

/**
 * <bpmn:extensionElements> 下某一类直接子元素的集合，
 * 如 flowable:ExecutionListener / TaskListener / FormProperty。
 *
 * items 必须显式依赖 revision：moddle 子元素改属性时，父元素的引用不变，
 * 不建立这层依赖的话 computed 会一直吃缓存、面板永远显示旧值（M2 已踩过）。
 */
export function useExtensionCollection(
  element: ShallowRef<BpmnElement | undefined>,
  type: string,
): ModdleCollection {
  const modeler = useModeler()
  const bag = useElementProps(element)

  const items = computed<ModdleElement[]>(() => {
    void bag.revision.value
    const host = element.value
    if (!host) return []

    // markRaw：moddle 对象绝不能进深度响应式，否则 bpmn-js 的引用相等判断会失效
    return getExtensionsOfType(host, type).map((item) => markRaw(item))
  })

  function add(attrs: Record<string, unknown> = {}): void {
    const host = element.value
    if (!host || !modeler.value) return

    addExtensionElement(modeler.value, host, createExtensionElement(modeler.value, type, attrs))
  }

  function remove(item: ModdleElement): void {
    const host = element.value
    if (!host || !modeler.value) return

    removeExtensionElement(modeler.value, host, item)
  }

  function update(item: ModdleElement, properties: Record<string, unknown>): void {
    const host = element.value
    if (!host || !modeler.value) return

    updateExtensionElement(modeler.value, host, item, properties)
  }

  return { items, add, remove, update }
}

/**
 * 嵌套在某个 moddle 元素上的 isMany 属性集合，如 listener.fields、formProperty.values。
 *
 * owner 用取值函数而非直接传对象：拥有者本身可能刚被新建或替换，
 * 每次求值时重新取才不会抓着一个已经被换掉的旧引用。
 */
export function useModdleCollection(
  element: ShallowRef<BpmnElement | undefined>,
  owner: () => ModdleElement | undefined,
  key: string,
  type: string,
): ModdleCollection {
  const modeler = useModeler()
  const bag = useElementProps(element)

  const items = computed<ModdleElement[]>(() => {
    void bag.revision.value
    const values = owner()?.[key] as ModdleElement[] | undefined
    return values?.map((item) => markRaw(item)) ?? []
  })

  function write(next: ModdleElement[]): void {
    const host = element.value
    const target = owner()
    if (!host || !target || !modeler.value) return

    // 空集合写 undefined 而不是 []，否则会导出 <flowable:field/> 这类空标签
    updateExtensionElement(modeler.value, host, target, {
      [key]: next.length > 0 ? next : undefined,
    })
  }

  function add(attrs: Record<string, unknown> = {}): void {
    const target = owner()
    if (!target || !modeler.value) return

    const child = createExtensionElement(modeler.value, type, attrs)
    child.$parent = target

    write([...((target[key] as ModdleElement[] | undefined) ?? []), child])
  }

  function remove(item: ModdleElement): void {
    const current = (owner()?.[key] as ModdleElement[] | undefined) ?? []
    write(current.filter((value) => value !== item))
  }

  function update(item: ModdleElement, properties: Record<string, unknown>): void {
    const host = element.value
    if (!host || !modeler.value) return

    updateExtensionElement(modeler.value, host, item, properties)
  }

  return { items, add, remove, update }
}
