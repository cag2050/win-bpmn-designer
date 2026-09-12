import { afterEach, describe, expect, it } from 'vitest'

import { createShape, get } from './helpers'
import { mountDesigner } from './mount'
import type { Mounted } from './mount'

let designer: Mounted | undefined
afterEach(() => designer?.unmount())

function paletteLabels(): string[] {
  return [...document.querySelectorAll('.djs-palette .entry')]
    .map((node) => node.getAttribute('aria-label') ?? '')
    .filter(Boolean)
}

describe('运行时切换语言', () => {
  /**
   * 切语言不能重建 modeler —— 重建会清空撤销栈并丢掉当前图。
   * 这条用例就是盯着这一点：文案变了，但实例与撤销栈都还是原来那份。
   */
  it('palette 文案跟着切换，且撤销栈与图都保留', async () => {
    designer = await mountDesigner({ locale: 'zh-CN' })
    const task = createShape(designer.modeler, 'bpmn:UserTask', { x: 400, y: 300 })

    const instanceBefore = designer.modeler
    const commandStack = get<{ canUndo: () => boolean }>(designer.modeler, 'commandStack')
    expect(commandStack.canUndo()).toBe(true)
    expect(paletteLabels().some((label) => label.includes('创建'))).toBe(true)

    await designer.setLocale('en-US')

    expect(paletteLabels().some((label) => label.startsWith('Create'))).toBe(true)
    expect(paletteLabels().some((label) => label.includes('创建'))).toBe(false)

    // 同一个实例、撤销栈未被清空、图元还在
    expect(designer.modeler).toBe(instanceBefore)
    expect(commandStack.canUndo()).toBe(true)
    expect(get<{ get: (id: string) => unknown }>(designer.modeler, 'elementRegistry').get(task.id)).toBeTruthy()
  })

  it('切回中文也能恢复', async () => {
    designer = await mountDesigner({ locale: 'en-US' })
    await designer.setLocale('zh-CN')

    expect(paletteLabels().some((label) => label.includes('创建'))).toBe(true)
  })
})
