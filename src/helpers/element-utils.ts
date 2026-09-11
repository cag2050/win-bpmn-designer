import type { BpmnElement, ModdleElement } from '@/types'

/** 判断图元是否为（或继承自）指定的 BPMN 类型，等价于 bpmn-js 的 `is()`。 */
export function is(element: BpmnElement | ModdleElement | undefined, type: string): boolean {
  const bo = getBusinessObject(element)
  if (!bo) return false

  const $instanceOf = (bo as { $instanceOf?: (t: string) => boolean }).$instanceOf
  if (typeof $instanceOf === 'function') {
    return $instanceOf.call(bo, type)
  }
  return bo.$type === type
}

/** 取图元背后的 moddle 业务对象；传入 moddle 对象时原样返回。 */
export function getBusinessObject(
  element: BpmnElement | ModdleElement | undefined,
): ModdleElement | undefined {
  if (!element) return undefined
  return ((element as BpmnElement).businessObject ?? element) as ModdleElement
}

/** 判断图元是否为画布根（bpmn:Process / bpmn:Collaboration）。 */
export function isRoot(element: BpmnElement | undefined): boolean {
  return is(element, 'bpmn:Process') || is(element, 'bpmn:Collaboration')
}

/**
 * 取当前画布对应的 bpmn:Process 业务对象。
 * 选中根节点时 businessObject 就是 Process；选中普通节点时需要沿 $parent 往上找。
 */
export function getProcessElement(element: BpmnElement | undefined): ModdleElement | undefined {
  let bo = getBusinessObject(element)
  while (bo) {
    if (bo.$type === 'bpmn:Process') return bo
    bo = bo.$parent
  }
  return undefined
}
