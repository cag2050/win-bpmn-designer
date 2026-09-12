import { afterEach, describe, expect, it } from 'vitest'

import { createShape, select } from './helpers'
import { mountDesigner } from './mount'
import type { Mounted } from './mount'

let designer: Mounted | undefined
afterEach(() => designer?.unmount())

/** 等面板渲染完（选中后是异步重渲染的）。 */
async function settle(): Promise<void> {
  await new Promise((r) => setTimeout(r, 200))
}

function row(label: string): HTMLElement {
  const rows = [...document.querySelectorAll('.win-bpmn-panel__row')]
  const found = rows.find((node) => node.querySelector('label')?.textContent?.trim() === label)
  if (!found) throw new Error(`面板里找不到「${label}」字段`)
  return found as HTMLElement
}

/** 模拟真实输入：填值后触发 change/blur —— widget 刻意只在失焦时提交。 */
async function fill(label: string, value: string): Promise<void> {
  const input = row(label).querySelector('input') as HTMLInputElement
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
  input.dispatchEvent(new Event('change', { bubbles: true }))
  input.dispatchEvent(new Event('blur', { bubbles: true }))
  await settle()
}

describe('属性面板写入路径', () => {
  it('填 assignee 后写进 XML，清空后属性整个消失', async () => {
    designer = await mountDesigner()
    const task = createShape(designer.modeler, 'bpmn:UserTask', { x: 400, y: 300 })
    select(designer.modeler, task.id)
    await settle()

    await fill('办理人', '${initiator}')
    expect(await designer.api.exportXML()).toContain('flowable:assignee="${initiator}"')

    await fill('办理人', '')
    const cleared = await designer.api.exportXML()
    // 绝不能留下 flowable:assignee=""，Flowable 会当成「指派给空用户」
    expect(cleared).not.toContain('flowable:assignee')
  })

  /**
   * Flowable 的 exclusive 缺省为 true，所以「关掉」要写出 false、「打开」反而要删属性。
   * 按 false 当缺省处理的话语义正好反过来。
   */
  it('排他开关遵循缺省 true 的反转语义', async () => {
    designer = await mountDesigner()
    const task = createShape(designer.modeler, 'bpmn:UserTask', { x: 400, y: 300 })
    select(designer.modeler, task.id)
    await settle()

    const toggle = (label: string): void => {
      const node = row(label).querySelector('.el-switch') as HTMLElement
      node.click()
    }

    toggle('异步执行')
    await settle()
    expect(await designer.api.exportXML()).toContain('flowable:async="true"')

    toggle('排他')
    await settle()
    expect(await designer.api.exportXML()).toContain('flowable:exclusive="false"')

    toggle('排他')
    await settle()
    expect(await designer.api.exportXML()).not.toContain('flowable:exclusive')
  })

  it('只读时面板字段全部禁用但值仍可读', async () => {
    designer = await mountDesigner()
    const task = createShape(designer.modeler, 'bpmn:UserTask', { x: 400, y: 300 })
    select(designer.modeler, task.id)
    await settle()

    await fill('办理人', 'kermit')
    await designer.setReadonly(true)
    await settle()

    const inputs = [...document.querySelectorAll('.win-bpmn-panel input')] as HTMLInputElement[]
    expect(inputs.length).toBeGreaterThan(0)
    expect(inputs.every((input) => input.disabled)).toBe(true)

    // 预览场景的关键：禁用但看得见
    expect((row('办理人').querySelector('input') as HTMLInputElement).value).toBe('kermit')
    expect(document.querySelectorAll('.win-bpmn-panel__collection-add').length).toBe(0)
  })
})
