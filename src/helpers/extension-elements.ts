import type { BpmnElement, BpmnModeler, ModdleElement } from '@/types'

import { getBusinessObject } from './element-utils'

interface Modeling {
  updateProperties: (element: BpmnElement, properties: Record<string, unknown>) => void
  updateModdleProperties: (
    element: BpmnElement,
    moddleElement: ModdleElement,
    properties: Record<string, unknown>,
  ) => void
}

interface BpmnFactory {
  create: (type: string, attrs?: Record<string, unknown>) => ModdleElement
}

function getModeling(modeler: BpmnModeler): Modeling {
  return modeler.get<Modeling>('modeling')
}

function getFactory(modeler: BpmnModeler): BpmnFactory {
  return modeler.get<BpmnFactory>('bpmnFactory')
}

/** 取 <bpmn:extensionElements> 容器，没有则返回 undefined。 */
export function getExtensionElements(element: BpmnElement): ModdleElement | undefined {
  return getBusinessObject(element)?.extensionElements as ModdleElement | undefined
}

/** 取容器里指定 $type 的子元素，如 'flowable:TaskListener'。 */
export function getExtensionsOfType(element: BpmnElement, type: string): ModdleElement[] {
  const values = getExtensionElements(element)?.values as ModdleElement[] | undefined
  return values?.filter((value) => value.$type === type) ?? []
}

/** 建一个扩展子元素。走 bpmnFactory 而非 moddle.create，前者会补上 id。 */
export function createExtensionElement(
  modeler: BpmnModeler,
  type: string,
  attrs: Record<string, unknown> = {},
): ModdleElement {
  return getFactory(modeler).create(type, attrs)
}

/**
 * 取 <bpmn:extensionElements>，没有就建一个并挂到元素上。
 * $parent 必须手动接好，否则序列化时这棵子树会被当成游离节点丢掉。
 */
export function ensureExtensionElements(
  modeler: BpmnModeler,
  element: BpmnElement,
): ModdleElement {
  const existing = getExtensionElements(element)
  if (existing) return existing

  const bo = getBusinessObject(element)
  const created = getFactory(modeler).create('bpmn:ExtensionElements', { values: [] })
  created.$parent = bo

  getModeling(modeler).updateProperties(element, { extensionElements: created })

  return created
}

export function addExtensionElement(
  modeler: BpmnModeler,
  element: BpmnElement,
  child: ModdleElement,
): void {
  const container = ensureExtensionElements(modeler, element)
  child.$parent = container

  const values = (container.values as ModdleElement[] | undefined) ?? []
  getModeling(modeler).updateModdleProperties(element, container, { values: [...values, child] })
}

/** 移除子元素；移空后把整个 extensionElements 删掉，避免导出空的 <extensionElements/>。 */
export function removeExtensionElement(
  modeler: BpmnModeler,
  element: BpmnElement,
  child: ModdleElement,
): void {
  const container = getExtensionElements(element)
  if (!container) return

  const values = (container.values as ModdleElement[] | undefined) ?? []
  const next = values.filter((value) => value !== child)

  if (next.length === 0) {
    getModeling(modeler).updateProperties(element, { extensionElements: undefined })
    return
  }

  getModeling(modeler).updateModdleProperties(element, container, { values: next })
}

/** 改子元素的属性。传 undefined 即删除该属性（moddle 的语义）。 */
export function updateExtensionElement(
  modeler: BpmnModeler,
  element: BpmnElement,
  child: ModdleElement,
  properties: Record<string, unknown>,
): void {
  getModeling(modeler).updateModdleProperties(element, child, properties)
}
