import { defineComponent, h } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'

import { createShape, select } from './helpers'
import { mountDesigner } from './mount'
import type { Mounted } from './mount'

let designer: Mounted | undefined
afterEach(() => designer?.unmount())

async function settle(): Promise<void> {
  await new Promise((r) => setTimeout(r, 200))
}

/** 一个最小的宿主组件：只需受控，不必了解 Flowable 的逗号语义。 */
const StubPicker = defineComponent({
  name: 'StubPicker',
  props: {
    modelValue: { type: [String, Array], default: undefined },
    multiple: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () =>
      h('button', {
        class: 'stub-picker',
        'data-multiple': String(props.multiple),
        'data-disabled': String(props.disabled),
        'data-value': JSON.stringify(props.modelValue ?? null),
        onClick: () => emit('update:modelValue', props.multiple ? ['hr', 'finance'] : 'kermit'),
      })
  },
})

describe('resolvers', () => {
  it('传入 resolver 后渲染宿主组件，未传的字段仍是内置控件', async () => {
    designer = await mountDesigner({ resolvers: { userPicker: StubPicker } })
    const task = createShape(designer.modeler, 'bpmn:UserTask', { x: 400, y: 300 })
    select(designer.modeler, task.id)
    await settle()

    expect(document.querySelectorAll('.stub-picker').length).toBeGreaterThan(0)

    // 到期时间没有对应 resolver，必须保持普通输入框
    const rows = [...document.querySelectorAll('.win-bpmn-panel__row')]
    const dueDate = rows.find((r) => r.querySelector('label')?.textContent?.trim() === '到期时间')
    expect(dueDate?.querySelector('.stub-picker')).toBeNull()
    expect(dueDate?.querySelector('input')).not.toBeNull()
  })

  it('单值 resolver 回写裸字符串', async () => {
    designer = await mountDesigner({ resolvers: { userPicker: StubPicker } })
    const task = createShape(designer.modeler, 'bpmn:UserTask', { x: 400, y: 300 })
    select(designer.modeler, task.id)
    await settle()

    const single = [...document.querySelectorAll('.stub-picker')].find(
      (node) => node.getAttribute('data-multiple') === 'false',
    ) as HTMLElement
    single.click()
    await settle()

    expect(await designer.api.exportXML()).toContain('flowable:assignee="kermit"')
  })

  it('多值 resolver 收发数组，库内负责拼成逗号串', async () => {
    designer = await mountDesigner({ resolvers: { userPicker: StubPicker } })
    const task = createShape(designer.modeler, 'bpmn:UserTask', { x: 400, y: 300 })
    select(designer.modeler, task.id)
    await settle()

    const multi = [...document.querySelectorAll('.stub-picker')].find(
      (node) => node.getAttribute('data-multiple') === 'true',
    ) as HTMLElement
    multi.click()
    await settle()

    expect(await designer.api.exportXML()).toContain('flowable:candidateUsers="hr,finance"')
  })

  it('只读态透传给宿主组件', async () => {
    designer = await mountDesigner({ resolvers: { userPicker: StubPicker } })
    const task = createShape(designer.modeler, 'bpmn:UserTask', { x: 400, y: 300 })
    select(designer.modeler, task.id)
    await settle()
    await designer.setReadonly(true)
    await settle()

    const pickers = [...document.querySelectorAll('.stub-picker')]
    expect(pickers.length).toBeGreaterThan(0)
    expect(pickers.every((node) => node.getAttribute('data-disabled') === 'true')).toBe(true)
  })
})
