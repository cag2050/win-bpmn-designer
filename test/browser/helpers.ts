import { BpmnModdle } from 'bpmn-moddle'

import BpmnDesigner from '@/components/BpmnDesigner.vue'
import { FlowableModdleDescriptor } from '@/core/createModeler'
import type { BpmnElement, BpmnModeler } from '@/types'

/** 在 body 上挂一个有确定尺寸的容器 —— bpmn-js 不会自己撑开。 */
export function createHost(): HTMLElement {
  const host = document.createElement('div')
  host.style.width = '900px'
  host.style.height = '600px'
  document.body.appendChild(host)
  return host
}

export interface Designer {
  modeler: BpmnModeler
  exposed: InstanceType<typeof BpmnDesigner>
  destroy: () => void
}

export function get<T>(modeler: BpmnModeler, service: string): T {
  return modeler.get<T>(service as never)
}

export function element(modeler: BpmnModeler, id: string): BpmnElement {
  return get<{ get: (id: string) => BpmnElement }>(modeler, 'elementRegistry').get(id)
}

export function select(modeler: BpmnModeler, id: string): void {
  get<{ select: (e: BpmnElement) => void }>(modeler, 'selection').select(element(modeler, id))
}

/** 用一个真 Modeler 建节点，省掉靠 UI 一步步点出来的脆弱操作。 */
export function createShape(
  modeler: BpmnModeler,
  type: string,
  position: { x: number; y: number },
  attrs: Record<string, unknown> = {},
): BpmnElement {
  const modeling = get<{
    createShape: (s: unknown, p: unknown, parent: unknown) => BpmnElement
  }>(modeler, 'modeling')
  const factory = get<{ createShape: (a: Record<string, unknown>) => unknown }>(
    modeler,
    'elementFactory',
  )
  const canvas = get<{ getRootElement: () => BpmnElement }>(modeler, 'canvas')

  return modeling.createShape(factory.createShape({ type, ...attrs }), position, canvas.getRootElement())
}

/** 导出的 XML 必须能被 moddle 零 warning 地再解析回来。 */
export async function assertParses(xml: string): Promise<void> {
  const moddle = new BpmnModdle({ flowable: FlowableModdleDescriptor })
  const { warnings } = await moddle.fromXML(xml)
  if (warnings.length) throw new Error(`导出的 XML 有 warning: ${warnings.map(String).join(', ')}`)
}
