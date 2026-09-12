import { describe, expect, it, vi } from 'vitest'

import {
  addExtensionElement,
  ensureExtensionElements,
  getExtensionsOfType,
  removeExtensionElement,
} from '@/helpers/extension-elements'
import type { BpmnElement, BpmnModeler, ModdleElement } from '@/types'

/** 极小的假 modeler：extension-elements 只用到 modeling 与 bpmnFactory 两个服务 */
function fakeModeler() {
  const updateProperties = vi.fn((element: BpmnElement, props: Record<string, unknown>) => {
    Object.assign(element.businessObject, props)
  })

  const updateModdleProperties = vi.fn(
    (_element: BpmnElement, target: ModdleElement, props: Record<string, unknown>) => {
      Object.assign(target, props)
    },
  )

  const create = vi.fn(
    (type: string, attrs: Record<string, unknown> = {}) => ({ $type: type, ...attrs }) as ModdleElement,
  )

  const services: Record<string, unknown> = {
    modeling: { updateProperties, updateModdleProperties },
    bpmnFactory: { create },
  }

  const modeler = { get: (name: string) => services[name] } as unknown as BpmnModeler

  return { modeler, updateProperties, updateModdleProperties, create }
}

function taskElement(businessObject: Partial<ModdleElement> = {}): BpmnElement {
  return { id: 'T1', type: 'bpmn:UserTask', businessObject: { $type: 'bpmn:UserTask', ...businessObject } }
}

describe('ensureExtensionElements', () => {
  it('缺失时新建，并把 $parent 接到 businessObject 上', () => {
    const { modeler, updateProperties } = fakeModeler()
    const element = taskElement()

    const container = ensureExtensionElements(modeler, element)

    expect(container.$type).toBe('bpmn:ExtensionElements')
    // $parent 不接好的话，序列化时这棵子树会被当成游离节点丢掉
    expect(container.$parent).toBe(element.businessObject)
    expect(updateProperties).toHaveBeenCalledWith(element, { extensionElements: container })
  })

  it('已存在时直接复用，不再新建', () => {
    const { modeler, updateProperties } = fakeModeler()
    const existing: ModdleElement = { $type: 'bpmn:ExtensionElements', values: [] }
    const element = taskElement({ extensionElements: existing })

    expect(ensureExtensionElements(modeler, element)).toBe(existing)
    expect(updateProperties).not.toHaveBeenCalled()
  })
})

describe('addExtensionElement', () => {
  it('写入的是新数组而不是原地 push', () => {
    const { modeler, updateModdleProperties } = fakeModeler()
    const original: ModdleElement[] = []
    const container: ModdleElement = { $type: 'bpmn:ExtensionElements', values: original }
    const element = taskElement({ extensionElements: container })

    addExtensionElement(modeler, element, { $type: 'flowable:TaskListener' })

    const written = updateModdleProperties.mock.calls[0][2].values as ModdleElement[]
    // 撤销依赖不可变：原地 push 会让 oldProperties 与 new 指向同一个数组
    expect(written).not.toBe(original)
    expect(written).toHaveLength(1)
  })
})

describe('removeExtensionElement', () => {
  it('还有剩余时只更新 values', () => {
    const { modeler, updateModdleProperties, updateProperties } = fakeModeler()
    const a: ModdleElement = { $type: 'flowable:TaskListener', id: 'a' }
    const b: ModdleElement = { $type: 'flowable:TaskListener', id: 'b' }
    const container: ModdleElement = { $type: 'bpmn:ExtensionElements', values: [a, b] }
    const element = taskElement({ extensionElements: container })

    removeExtensionElement(modeler, element, a)

    expect(updateModdleProperties).toHaveBeenCalledWith(element, container, { values: [b] })
    expect(updateProperties).not.toHaveBeenCalled()
  })

  // 关键：删到空必须把整个 extensionElements 写成 undefined，
  // 否则导出的 XML 里会留下一个空的 <bpmn:extensionElements/>
  it('删掉最后一个时把 extensionElements 整体置为字面 undefined', () => {
    const { modeler, updateProperties } = fakeModeler()
    const only: ModdleElement = { $type: 'flowable:TaskListener', id: 'a' }
    const container: ModdleElement = { $type: 'bpmn:ExtensionElements', values: [only] }
    const element = taskElement({ extensionElements: container })

    removeExtensionElement(modeler, element, only)

    expect(updateProperties).toHaveBeenCalledTimes(1)
    const written = updateProperties.mock.calls[0][1]
    expect(written).toHaveProperty('extensionElements')
    expect(written.extensionElements).toBeUndefined()
    // 空数组或 null 都不行，moddle 只对 undefined 执行删除
    expect(written.extensionElements).not.toEqual([])
    expect(written.extensionElements).not.toBeNull()
  })
})

describe('getExtensionsOfType', () => {
  it('按 $type 过滤，没有容器时返回空数组', () => {
    const listener: ModdleElement = { $type: 'flowable:TaskListener' }
    const field: ModdleElement = { $type: 'flowable:Field' }
    const element = taskElement({
      extensionElements: { $type: 'bpmn:ExtensionElements', values: [listener, field] },
    })

    expect(getExtensionsOfType(element, 'flowable:TaskListener')).toEqual([listener])
    expect(getExtensionsOfType(taskElement(), 'flowable:TaskListener')).toEqual([])
  })
})
