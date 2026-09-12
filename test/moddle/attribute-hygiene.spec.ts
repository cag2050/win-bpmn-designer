import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { BpmnModdle } from 'bpmn-moddle'
import { describe, expect, it } from 'vitest'

import { FlowableModdleDescriptor } from '@/core/createModeler'

const FIXTURES = new URL('../fixtures', import.meta.url).pathname

function createModdle(): BpmnModdle {
  return new BpmnModdle({ flowable: FlowableModdleDescriptor })
}

async function roundTrip(xml: string): Promise<string> {
  const { rootElement } = await createModdle().fromXML(xml)
  const { xml: out } = await createModdle().toXML(rootElement, { format: true })
  return out ?? ''
}

describe('属性卫生', () => {
  it('所有样例往返后都不含空属性', async () => {
    for (const name of readdirSync(FIXTURES).filter((f) => f.endsWith('.bpmn'))) {
      const out = await roundTrip(readFileSync(join(FIXTURES, name), 'utf8'))
      const empties = out.match(/[\w:]+=""/g) ?? []
      expect(empties, `${name} 出现空属性`).toEqual([])
    }
  })

  /**
   * 这是整个库反复踩的坑：面板清空字段时若写 '' 而不是 undefined，
   * 导出的 XML 会留下 flowable:assignee="" —— Flowable 会把它当成「指派给空用户」。
   */
  it('只有 undefined 能删掉属性，空串会被照原样写出', async () => {
    const moddle = createModdle()
    const { rootElement } = await moddle.fromXML(
      `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:flowable="http://flowable.org/bpmn" id="D" targetNamespace="x">
  <bpmn:process id="P"><bpmn:userTask id="T" flowable:assignee="kermit" /></bpmn:process>
</bpmn:definitions>`,
    )

    type Task = { id?: string; set: (key: string, value: unknown) => void }
    const processes = (rootElement.rootElements ?? []) as { flowElements?: Task[] }[]
    const task = processes.flatMap((proc) => proc.flowElements ?? []).find((e) => e.id === 'T')!

    task.set('assignee', '')
    const withEmpty = (await moddle.toXML(rootElement, { format: true })).xml ?? ''
    expect(withEmpty).toContain('flowable:assignee=""')

    task.set('assignee', undefined)
    const withUndefined = (await moddle.toXML(rootElement, { format: true })).xml ?? ''
    expect(withUndefined).not.toContain('flowable:assignee')
  })
})
