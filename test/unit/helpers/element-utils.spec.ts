import { describe, expect, it } from 'vitest'

import { getBusinessObject, getProcessElement, is, isRoot } from '@/helpers/element-utils'
import type { BpmnElement, ModdleElement } from '@/types'

function bo(type: string, extra: Partial<ModdleElement> = {}): ModdleElement {
  return { $type: type, ...extra }
}

function element(type: string, businessObject: ModdleElement): BpmnElement {
  return { id: 'x', type, businessObject }
}

describe('is', () => {
  // moddle 元素带 $instanceOf 时要走它，才能识别继承关系（UserTask 也是 FlowNode）
  it('优先使用 $instanceOf 以识别继承链', () => {
    const withInstanceOf = bo('bpmn:UserTask', {
      $instanceOf: (type: string) => type === 'bpmn:FlowNode',
    })

    expect(is(element('bpmn:UserTask', withInstanceOf), 'bpmn:FlowNode')).toBe(true)
  })

  it('没有 $instanceOf 时退回 $type 精确比较', () => {
    expect(is(element('bpmn:Task', bo('bpmn:Task')), 'bpmn:Task')).toBe(true)
    expect(is(element('bpmn:Task', bo('bpmn:Task')), 'bpmn:FlowNode')).toBe(false)
  })

  it('传 undefined 不抛错', () => {
    expect(is(undefined, 'bpmn:Task')).toBe(false)
  })
})

describe('getBusinessObject', () => {
  it('图元取 businessObject，moddle 对象原样返回', () => {
    const target = bo('bpmn:Task')
    expect(getBusinessObject(element('bpmn:Task', target))).toBe(target)
    expect(getBusinessObject(target)).toBe(target)
    expect(getBusinessObject(undefined)).toBeUndefined()
  })
})

describe('isRoot', () => {
  it('Process 与 Collaboration 都算根', () => {
    expect(isRoot(element('bpmn:Process', bo('bpmn:Process')))).toBe(true)
    expect(isRoot(element('bpmn:Collaboration', bo('bpmn:Collaboration')))).toBe(true)
    expect(isRoot(element('bpmn:Task', bo('bpmn:Task')))).toBe(false)
  })
})

describe('getProcessElement', () => {
  it('沿 $parent 一路上溯到 Process', () => {
    const process = bo('bpmn:Process', { id: 'P1' })
    const sub = bo('bpmn:SubProcess', { $parent: process })
    const task = bo('bpmn:UserTask', { $parent: sub })

    expect(getProcessElement(element('bpmn:UserTask', task))).toBe(process)
  })

  it('链上没有 Process 时返回 undefined', () => {
    expect(getProcessElement(element('bpmn:Task', bo('bpmn:Task')))).toBeUndefined()
  })
})
