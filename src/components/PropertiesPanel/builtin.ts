import { getBusinessObject, is, isRoot } from '@/helpers/element-utils'
import type { BpmnElement, ModdleElement } from '@/types'

import BaseGroup from './groups/BaseGroup.vue'
import BoundaryEventGroup from './groups/BoundaryEventGroup.vue'
import CallActivityGroup from './groups/CallActivityGroup.vue'
import ConditionGroup from './groups/ConditionGroup.vue'
import EventDefinitionGroup from './groups/EventDefinitionGroup.vue'
import ExecutionListenerGroup from './groups/ExecutionListenerGroup.vue'
import FormPropertyGroup from './groups/FormPropertyGroup.vue'
import MultiInstanceGroup from './groups/MultiInstanceGroup.vue'
import ProcessGroup from './groups/ProcessGroup.vue'
import ServiceTaskGroup from './groups/ServiceTaskGroup.vue'
import SubProcessGroup from './groups/SubProcessGroup.vue'
import TaskListenerGroup from './groups/TaskListenerGroup.vue'
import UserTaskGroup from './groups/UserTaskGroup.vue'
import { registerPropertyGroup } from './registry'

function hasEventDefinition(element: BpmnElement): boolean {
  const definitions = getBusinessObject(element)?.eventDefinitions as ModdleElement[] | undefined
  return Boolean(definitions?.length)
}

/**
 * 内置属性组。order 之间留有间隔，业务方可以插在中间而不必重排；
 * 用同一个 id 调 registerPropertyGroup 即可替换掉其中任意一组。
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

  // bpmn:SendTask 与 ServiceTask 是兄弟类而非子类，不会被这条误命中
  registerPropertyGroup({
    id: 'service-task',
    order: 50,
    match: (element: BpmnElement) => is(element, 'bpmn:ServiceTask'),
    component: ServiceTaskGroup,
  })

  registerPropertyGroup({
    id: 'multi-instance',
    order: 60,
    match: (element: BpmnElement) => is(element, 'bpmn:Activity'),
    component: MultiInstanceGroup,
  })

  registerPropertyGroup({
    id: 'sub-process',
    order: 70,
    match: (element: BpmnElement) => is(element, 'bpmn:SubProcess'),
    component: SubProcessGroup,
  })

  registerPropertyGroup({
    id: 'call-activity',
    order: 75,
    match: (element: BpmnElement) => is(element, 'bpmn:CallActivity'),
    component: CallActivityGroup,
  })

  registerPropertyGroup({
    id: 'boundary-event',
    order: 80,
    match: (element: BpmnElement) => is(element, 'bpmn:BoundaryEvent'),
    component: BoundaryEventGroup,
  })

  // 开始/中间/结束/边界事件通吃，按 eventDefinitions[0] 的类型分支
  registerPropertyGroup({
    id: 'event-definition',
    order: 85,
    match: hasEventDefinition,
    component: EventDefinitionGroup,
  })

  registerPropertyGroup({
    id: 'form-property',
    order: 90,
    match: (element: BpmnElement) =>
      is(element, 'bpmn:UserTask') || is(element, 'bpmn:StartEvent'),
    component: FormPropertyGroup,
  })

  registerPropertyGroup({
    id: 'execution-listener',
    order: 100,
    match: (element: BpmnElement) =>
      is(element, 'bpmn:FlowNode') || is(element, 'bpmn:SequenceFlow') || isRoot(element),
    component: ExecutionListenerGroup,
  })

  registerPropertyGroup({
    id: 'task-listener',
    order: 110,
    match: (element: BpmnElement) => is(element, 'bpmn:UserTask'),
    component: TaskListenerGroup,
  })
}
