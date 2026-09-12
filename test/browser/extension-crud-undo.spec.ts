import { afterEach, describe, expect, it } from 'vitest'

import {
  addExtensionElement,
  createExtensionElement,
  getExtensionsOfType,
  removeExtensionElement,
} from '@/helpers/extension-elements'

import { assertParses, createShape, get } from './helpers'
import { mountDesigner } from './mount'
import type { Mounted } from './mount'

let designer: Mounted | undefined
afterEach(() => designer?.unmount())

interface CommandStack {
  undo: () => void
  redo: () => void
  canUndo: () => boolean
}

describe('extensionElements 增删改与撤销', () => {
  it('加两个监听器 → 删一个 → 删到空后不留空标签', async () => {
    designer = await mountDesigner()
    const { modeler } = designer
    const task = createShape(modeler, 'bpmn:UserTask', { x: 400, y: 300 })

    for (const event of ['create', 'assignment']) {
      addExtensionElement(
        modeler,
        task,
        createExtensionElement(modeler, 'flowable:TaskListener', {
          event,
          class: `com.acme.${event}`,
        }),
      )
    }

    let xml = await designer.api.exportXML()
    expect(xml.match(/<flowable:taskListener/g)).toHaveLength(2)
    await assertParses(xml)

    const listeners = getExtensionsOfType(task, 'flowable:TaskListener')
    removeExtensionElement(modeler, task, listeners[0])

    xml = await designer.api.exportXML()
    expect(xml.match(/<flowable:taskListener/g)).toHaveLength(1)

    removeExtensionElement(modeler, task, getExtensionsOfType(task, 'flowable:TaskListener')[0])

    xml = await designer.api.exportXML()
    expect(xml).not.toContain('taskListener')
    // 删空后必须把整个容器也删掉，不能留 <bpmn:extensionElements />
    expect(xml).not.toContain('extensionElements')
  })

  it('连续撤销后导出与变更前逐字节一致，redo 能恢复', async () => {
    designer = await mountDesigner()
    const { modeler } = designer
    const task = createShape(modeler, 'bpmn:UserTask', { x: 400, y: 300 })

    const baseline = await designer.api.exportXML()

    addExtensionElement(
      modeler,
      task,
      createExtensionElement(modeler, 'flowable:TaskListener', { event: 'create', class: 'com.acme.A' }),
    )
    const mutated = await designer.api.exportXML()
    expect(mutated).not.toBe(baseline)

    // 只回退「加监听器」这一步 —— 再往前会把建节点也撤掉，就不是同一个基线了。
    // addExtensionElement 内部是两条命令：建容器 + 写 values。
    const commandStack = get<CommandStack>(modeler, 'commandStack')
    commandStack.undo()
    commandStack.undo()

    expect(await designer.api.exportXML()).toBe(baseline)

    commandStack.redo()
    expect(await designer.api.exportXML()).not.toBe(baseline)
  })

  it('嵌套字段（listener → field）也能往返', async () => {
    designer = await mountDesigner()
    const { modeler } = designer
    const task = createShape(modeler, 'bpmn:UserTask', { x: 400, y: 300 })

    const listener = createExtensionElement(modeler, 'flowable:TaskListener', {
      event: 'create',
      class: 'com.acme.Notify',
    })
    addExtensionElement(modeler, task, listener)

    const field = createExtensionElement(modeler, 'flowable:Field', {
      name: 'template',
      stringValue: 'welcome',
    })
    field.$parent = listener
    get<{
      updateModdleProperties: (e: unknown, t: unknown, p: Record<string, unknown>) => void
    }>(modeler, 'modeling').updateModdleProperties(task, listener, { fields: [field] })

    const xml = await designer.api.exportXML()
    expect(xml).toContain('<flowable:field name="template" stringValue="welcome"')
    await assertParses(xml)
  })
})
