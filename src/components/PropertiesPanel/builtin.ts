import { is, isRoot } from '@/helpers/element-utils'
import type { BpmnElement } from '@/types'

import BaseGroup from './groups/BaseGroup.vue'
import ConditionGroup from './groups/ConditionGroup.vue'
import ProcessGroup from './groups/ProcessGroup.vue'
import UserTaskGroup from './groups/UserTaskGroup.vue'
import { registerPropertyGroup } from './registry'

/**
 * 内置属性组。order 用 10/20/30/40 并留出间隔，M3 的监听器、多实例、
 * 表单属性等可以插在中间而不必重排。
 *
 * 业务方用同一个 id 调 registerPropertyGroup 即可替换掉其中任意一组。
 */
export function registerBuiltinGroups(): void {
  registerPropertyGroup({
    id: 'process',
    order: 10,
    match: (element: BpmnElement) => isRoot(element),
    component: ProcessGroup,
  })

  registerPropertyGroup({
    id: 'base',
    order: 20,
    // 根元素的 id/name 由 process 组负责，这里只管普通图元
    match: (element: BpmnElement) => !isRoot(element),
    component: BaseGroup,
  })

  registerPropertyGroup({
    id: 'user-task',
    order: 30,
    match: (element: BpmnElement) => is(element, 'bpmn:UserTask'),
    component: UserTaskGroup,
  })

  registerPropertyGroup({
    id: 'condition',
    order: 40,
    match: (element: BpmnElement) => is(element, 'bpmn:SequenceFlow'),
    component: ConditionGroup,
  })
}
