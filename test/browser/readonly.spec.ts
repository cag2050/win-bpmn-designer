import { afterEach, describe, expect, it } from 'vitest'

import { createShape, element, get } from './helpers'
import { mountDesigner } from './mount'
import type { Mounted } from './mount'

let designer: Mounted | undefined
afterEach(() => designer?.unmount())

interface Rules {
  allowed: (rule: string, context?: unknown) => unknown
}

interface EventBus {
  fire: (event: string, data?: unknown) => unknown
}

interface Canvas {
  viewbox: () => { x: number; y: number }
}

/** 用真实鼠标事件拖一段距离 —— 这是只读实现的核心断言，必须走真事件而不是调 API。 */
async function dragBy(id: string, dx: number, dy: number): Promise<void> {
  const node = document.querySelector(`.djs-element[data-element-id="${id}"] .djs-hit`)
  if (!node) throw new Error(`找不到图元 ${id}`)

  const box = node.getBoundingClientRect()
  const from = { x: box.x + box.width / 2, y: box.y + box.height / 2 }

  const fire = (type: string, x: number, y: number): void => {
    node.dispatchEvent(
      new MouseEvent(type, { clientX: x, clientY: y, bubbles: true, cancelable: true, buttons: 1 }),
    )
  }

  fire('mousedown', from.x, from.y)
  // diagram-js 有拖拽启动阈值，必须分多步移动
  for (let step = 1; step <= 5; step += 1) {
    fire('mousemove', from.x + (dx * step) / 5, from.y + (dy * step) / 5)
    await new Promise((r) => setTimeout(r, 16))
  }
  fire('mouseup', from.x + dx, from.y + dy)

  await new Promise((r) => setTimeout(r, 120))
}

describe('只读模式', () => {
  it('可编辑时拖得动，只读时拖不动，关掉后又拖得动', async () => {
    designer = await mountDesigner()
    const task = createShape(designer.modeler, 'bpmn:UserTask', { x: 400, y: 300 })

    const before = { x: task.x, y: task.y }
    await dragBy(task.id, 120, 60)
    const afterEditable = { x: element(designer.modeler, task.id).x, y: element(designer.modeler, task.id).y }
    expect(afterEditable).not.toEqual(before)

    await designer.setReadonly(true)
    await dragBy(task.id, 120, 60)
    const afterReadonly = { x: element(designer.modeler, task.id).x, y: element(designer.modeler, task.id).y }
    // 核心断言：同一个拖动动作，只读下坐标必须一动不动
    expect(afterReadonly).toEqual(afterEditable)

    await designer.setReadonly(false)
    await dragBy(task.id, -80, -40)
    const afterToggleOff = { x: element(designer.modeler, task.id).x }
    expect(afterToggleOff.x).not.toBe(afterReadonly.x)
  })

  it('规则层否决编辑类命令', async () => {
    designer = await mountDesigner({ readonly: true })
    const rules = get<Rules>(designer.modeler, 'rules')

    for (const rule of ['shape.create', 'elements.move', 'elements.delete', 'connection.create']) {
      expect(rules.allowed(rule, {}), rule).toBe(false)
    }
  })

  it('拖拽总闸拦住 init，但放过手型与框选', async () => {
    designer = await mountDesigner({ readonly: true })
    const eventBus = get<EventBus>(designer.modeler, 'eventBus')

    // ConnectionSegmentMove 与 SpaceTool 不查 rules，只能靠这条拦
    for (const event of ['shape.move.init', 'connectionSegment.move.init', 'spaceTool.init']) {
      expect(eventBus.fire(event, {}), event).toBe(false)
    }

    // 浏览与框选必须保留。这里不能直接 fire —— 缺少拖拽上下文会让 ToolManager 自己抛错，
    // 所以改为检查监听器链上没有我们那个高优先级（2000）的守卫。
    // diagram-js 自己的 ToolManager 也挂在这些事件上（默认 1000），不能一概断言为空。
    type Listener = { priority: number; next?: Listener }
    const chain = eventBus as unknown as { _listeners: Record<string, Listener | undefined> }

    for (const event of ['hand.init', 'hand.move.init', 'lasso.init', 'lasso.selection.init']) {
      const priorities: number[] = []
      for (let node = chain._listeners[event]; node; node = node.next) priorities.push(node.priority)

      expect(priorities, `${event} 不应被只读守卫拦住`).not.toContain(2000)
    }
  })

  it('editorActions 拦破坏性动作但放行浏览类', async () => {
    designer = await mountDesigner({ readonly: true })
    const eventBus = get<EventBus>(designer.modeler, 'eventBus')

    expect(eventBus.fire('editorActions.allowed', { action: 'removeSelection' })).toBe(false)
    expect(eventBus.fire('editorActions.allowed', { action: 'undo' })).toBe(false)
    expect(eventBus.fire('editorActions.allowed', { action: 'zoom' })).not.toBe(false)
    expect(eventBus.fire('editorActions.allowed', { action: 'moveCanvas' })).not.toBe(false)
  })

  it('context-pad 与内联改名都被否决', async () => {
    designer = await mountDesigner({ readonly: true })
    const eventBus = get<EventBus>(designer.modeler, 'eventBus')

    expect(eventBus.fire('contextPad.open.allowed', {})).toBe(false)
    expect(eventBus.fire('directEditing.activate.allowed', {})).toBe(false)
  })

  it('只读下仍可平移画布', async () => {
    designer = await mountDesigner({ readonly: true })
    const canvas = get<Canvas>(designer.modeler, 'canvas')

    const before = canvas.viewbox().x
    get<{ scroll: (delta: { dx: number; dy: number }) => void }>(designer.modeler, 'canvas').scroll({
      dx: -120,
      dy: 0,
    })
    await new Promise((r) => setTimeout(r, 80))

    expect(canvas.viewbox().x).not.toBe(before)
  })

  it('只读下 palette 被清空', async () => {
    designer = await mountDesigner({ readonly: true })

    const entries = document.querySelectorAll('.djs-palette .entry')
    expect(entries.length).toBe(0)
  })
})
