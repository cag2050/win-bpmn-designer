import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { BpmnModdle } from 'bpmn-moddle'
import { describe, expect, it } from 'vitest'

import { FlowableModdleDescriptor } from '@/core/createModeler'

const FIXTURES = new URL('../fixtures', import.meta.url).pathname

/**
 * 直接用 bpmn-moddle 而不起 Modeler：往返一致性是纯解析/序列化问题，
 * 不需要 DOM 也不需要几何，这条路比启动画布快一个数量级。
 */
function createModdle(): BpmnModdle {
  return new BpmnModdle({ flowable: FlowableModdleDescriptor })
}

const files = readdirSync(FIXTURES).filter((name) => name.endsWith('.bpmn'))

describe('XML 往返一致性', () => {
  it('至少有一份样例', () => {
    expect(files.length).toBeGreaterThan(0)
  })

  for (const name of files) {
    describe(name, () => {
      const xml = readFileSync(join(FIXTURES, name), 'utf8')

      it('导入零 warning —— descriptor 覆盖了样例里的每个属性与元素', async () => {
        const { warnings } = await createModdle().fromXML(xml)
        expect(warnings.map(String)).toEqual([])
      })

      it('导出结果稳定（快照）', async () => {
        const { rootElement } = await createModdle().fromXML(xml)
        const { xml: out } = await createModdle().toXML(rootElement, { format: true })

        await expect(out).toMatchFileSnapshot(join(FIXTURES, '__snapshots__', `${name}.snap`))
      })

      it('再导入导出一次完全幂等', async () => {
        const first = await createModdle().fromXML(xml)
        const { xml: once } = await createModdle().toXML(first.rootElement, { format: true })

        const second = await createModdle().fromXML(once!)
        expect(second.warnings.map(String)).toEqual([])

        const { xml: twice } = await createModdle().toXML(second.rootElement, { format: true })
        expect(twice).toBe(once)
      })
    })
  }
})
