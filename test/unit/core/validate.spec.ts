import { describe, expect, it } from 'vitest'

import { validateDiagram } from '@/core/validate'
import type { BpmnElement, BpmnModeler, ModdleElement } from '@/types'

const FLOW_NODES = new Set([
  'bpmn:StartEvent',
  'bpmn:EndEvent',
  'bpmn:UserTask',
  'bpmn:BoundaryEvent',
  'bpmn:ExclusiveGateway',
  'bpmn:SequenceFlow',
])

/** $instanceOf 模拟真实的继承链：这些类型都是 FlowNode（SequenceFlow 除外）。 */
function makeBo(type: string, extra: Partial<ModdleElement> = {}): ModdleElement {
  return {
    $type: type,
    $instanceOf: (target: string) => {
      if (target === type) return true
      if (target === 'bpmn:FlowNode') return FLOW_NODES.has(type) && type !== 'bpmn:SequenceFlow'
      return false
    },
    ...extra,
  }
}

function node(
  id: string,
  type: string,
  opts: { incoming?: BpmnElement[]; outgoing?: BpmnElement[]; bo?: Partial<ModdleElement> } = {},
): BpmnElement {
  return {
    id,
    type,
    businessObject: makeBo(type, { id, ...opts.bo }),
    incoming: opts.incoming ?? [],
    outgoing: opts.outgoing ?? [],
  }
}

function fakeModeler(elements: BpmnElement[]): BpmnModeler {
  return {
    get: () => ({ getAll: () => elements }),
  } as unknown as BpmnModeler
}

const run = (elements: BpmnElement[]) => validateDiagram(fakeModeler(elements), 'zh-CN')
const codes = (elements: BpmnElement[]) => run(elements).issues.map((issue) => issue.code)

describe('validateDiagram', () => {
  it('空流程直接返回 empty-process 且不再跑其他规则', () => {
    const result = run([])
    expect(result.valid).toBe(false)
    expect(result.issues.map((i) => i.code)).toEqual(['empty-process'])
  })

  it('缺开始/结束事件都算 error', () => {
    const task = node('T1', 'bpmn:UserTask')
    const result = run([task])

    expect(result.valid).toBe(false)
    expect(result.issues.map((i) => i.code)).toContain('missing-start-event')
    expect(result.issues.map((i) => i.code)).toContain('missing-end-event')
  })

  it('开始事件无入线、结束事件无出线都不算孤立', () => {
    const flow = node('F1', 'bpmn:SequenceFlow')
    const start = node('S1', 'bpmn:StartEvent', { outgoing: [flow] })
    const end = node('E1', 'bpmn:EndEvent', { incoming: [flow] })

    expect(codes([start, end, flow])).not.toContain('orphan-node')
  })

  it('边界事件无入线不算孤立', () => {
    const flow = node('F1', 'bpmn:SequenceFlow')
    const start = node('S1', 'bpmn:StartEvent', { outgoing: [flow] })
    const end = node('E1', 'bpmn:EndEvent', { incoming: [flow] })
    const boundary = node('B1', 'bpmn:BoundaryEvent', { outgoing: [flow] })

    expect(codes([start, end, flow, boundary])).not.toContain('orphan-node')
  })

  // M4 实测出的 bug：外置标签在 elementRegistry 里是独立条目却共用宿主的
  // businessObject，不按 labelTarget 排除就会把同一个节点报两次
  it('label 伪元素不会让同一个节点被报两次', () => {
    const orphan = node('T1', 'bpmn:UserTask')
    const label: BpmnElement = {
      id: 'T1_label',
      type: 'label',
      businessObject: orphan.businessObject,
      labelTarget: orphan,
      incoming: [],
      outgoing: [],
    }

    const orphanIssues = run([orphan, label]).issues.filter((i) => i.code === 'orphan-node')
    expect(orphanIssues).toHaveLength(1)
  })

  it('网关出线都有条件或是默认流时不报警', () => {
    const condFlow = node('F1', 'bpmn:SequenceFlow', {
      bo: { conditionExpression: { $type: 'bpmn:FormalExpression', body: '${a}' } },
    })
    const defaultFlow = node('F2', 'bpmn:SequenceFlow')
    const gateway = node('G1', 'bpmn:ExclusiveGateway', {
      incoming: [condFlow],
      outgoing: [condFlow, defaultFlow],
      bo: { default: defaultFlow.businessObject },
    })

    expect(codes([gateway, condFlow, defaultFlow])).not.toContain('gateway-missing-condition')
  })

  it('网关有无条件且非默认的出线时报警', () => {
    const a = node('F1', 'bpmn:SequenceFlow')
    const b = node('F2', 'bpmn:SequenceFlow')
    const gateway = node('G1', 'bpmn:ExclusiveGateway', { incoming: [a], outgoing: [a, b] })

    expect(codes([gateway, a, b])).toContain('gateway-missing-condition')
  })

  it('只有 warning 时 valid 仍为 true', () => {
    const flow = node('F1', 'bpmn:SequenceFlow')
    const start = node('S1', 'bpmn:StartEvent', { outgoing: [flow] })
    const end = node('E1', 'bpmn:EndEvent', { incoming: [flow] })
    const orphan = node('T1', 'bpmn:UserTask')

    const result = run([start, end, flow, orphan])
    expect(result.issues.some((i) => i.severity === 'warning')).toBe(true)
    expect(result.issues.some((i) => i.severity === 'error')).toBe(false)
    expect(result.valid).toBe(true)
  })
})
