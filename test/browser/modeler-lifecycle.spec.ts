import { afterEach, describe, expect, it } from 'vitest'

import { assertParses } from './helpers'
import { mountDesigner } from './mount'
import type { Mounted } from './mount'

let designer: Mounted | undefined
afterEach(() => designer?.unmount())

describe('modeler 生命周期', () => {
  it('挂载后画布就绪且能导出可再解析的 XML', async () => {
    designer = await mountDesigner()

    expect(document.querySelector('.bjs-container svg')).not.toBeNull()

    const xml = await designer.api.exportXML()
    expect(xml).toContain('<bpmn:process')
    expect(xml).toContain('targetNamespace="http://www.flowable.org/processdef"')
    await assertParses(xml)
  })

  // 空流程没有任何 flowable 属性，moddle 会（正确地）省掉没用到的命名空间声明；
  // 一旦真的写入 flowable 属性，声明就会出现。
  it('写入 flowable 属性后命名空间声明随之出现', async () => {
    designer = await mountDesigner()
    const modeling = designer.modeler.get<{
      updateProperties: (e: unknown, p: Record<string, unknown>) => void
    }>('modeling' as never)
    const root = designer.modeler.get<{ getRootElement: () => unknown }>('canvas' as never).getRootElement()

    modeling.updateProperties(root, { candidateStarterUsers: 'admin' })

    const xml = await designer.api.exportXML()
    expect(xml).toContain('xmlns:flowable="http://flowable.org/bpmn"')
    expect(xml).toContain('flowable:candidateStarterUsers="admin"')
    await assertParses(xml)
  })

  it('导出 SVG', async () => {
    designer = await mountDesigner()

    const svg = await designer.api.exportSVG()
    expect(svg).toContain('<svg')
  })

  it('新建流程的默认名字跟随语言', async () => {
    designer = await mountDesigner({ locale: 'en-US' })
    await designer.api.createNew()

    const xml = await designer.api.exportXML()
    // M5 修的 bug：以前这里写死中文，en-US 下也会导出「新建流程」
    expect(xml).toContain('name="New process"')
    expect(xml).not.toContain('新建流程')
  })

  it('卸载不抛错', async () => {
    const instance = await mountDesigner()
    expect(() => instance.unmount()).not.toThrow()
    designer = undefined
  })
})
