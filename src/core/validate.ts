import { getBusinessObject, is } from '@/helpers/element-utils'
import { translate } from '@/locales'
import type {
  BpmnElement,
  BpmnModeler,
  LocaleName,
  ModdleElement,
  ValidationIssue,
  ValidationResult,
} from '@/types'

interface ElementRegistry {
  getAll: () => BpmnElement[]
}

/** 开始/边界事件天然没有入线，结束事件天然没有出线，不算孤立。 */
function isIncomingExempt(element: BpmnElement): boolean {
  return is(element, 'bpmn:StartEvent') || is(element, 'bpmn:BoundaryEvent')
}

function isOutgoingExempt(element: BpmnElement): boolean {
  return is(element, 'bpmn:EndEvent')
}

/**
 * 参与连通性检查的节点；泳道、分组、注释等不算。
 *
 * 必须排掉 label：外置标签（如 StartEvent_1_label）在 elementRegistry 里是独立条目，
 * 却共用宿主的 businessObject，不排掉会让同一个节点被报两次。
 */
function isFlowNode(element: BpmnElement): boolean {
  return !element.labelTarget && is(element, 'bpmn:FlowNode')
}

function labelOf(element: BpmnElement): string {
  const bo = getBusinessObject(element)
  return (bo?.name as string | undefined) ?? element.id
}

/**
 * 基础建模校验。
 *
 * 纯函数：只读 elementRegistry，不进 Vue、不订阅事件、不改模型。
 * 只覆盖「一定是错」的情形，宁可漏报也不误报 —— 误报会让业务方直接把校验关掉。
 */
export function validateDiagram(modeler: BpmnModeler, locale: LocaleName): ValidationResult {
  const t = (key: string, replacements?: Record<string, string>): string =>
    translate(locale, `designer.validate.${key}`, replacements)

  const issues: ValidationIssue[] = []
  const elements = modeler.get<ElementRegistry>('elementRegistry').getAll()
  const nodes = elements.filter(isFlowNode)

  if (nodes.length === 0) {
    issues.push({ code: 'empty-process', severity: 'error', message: t('emptyProcess') })
    return { valid: false, issues }
  }

  if (!nodes.some((element) => is(element, 'bpmn:StartEvent'))) {
    issues.push({ code: 'missing-start-event', severity: 'error', message: t('missingStartEvent') })
  }

  if (!nodes.some((element) => is(element, 'bpmn:EndEvent'))) {
    issues.push({ code: 'missing-end-event', severity: 'error', message: t('missingEndEvent') })
  }

  for (const element of nodes) {
    const incoming = (element.incoming as BpmnElement[] | undefined) ?? []
    const outgoing = (element.outgoing as BpmnElement[] | undefined) ?? []

    const missingIncoming = incoming.length === 0 && !isIncomingExempt(element)
    const missingOutgoing = outgoing.length === 0 && !isOutgoingExempt(element)

    if (missingIncoming || missingOutgoing) {
      issues.push({
        code: 'orphan-node',
        severity: 'warning',
        message: t('orphanNode', { name: labelOf(element) }),
        elementId: element.id,
        elementName: labelOf(element),
      })
    }

    // 排他/包容网关多出线时，除默认流外每条都该带条件，否则运行期走向不确定
    const isBranching =
      is(element, 'bpmn:ExclusiveGateway') || is(element, 'bpmn:InclusiveGateway')

    if (isBranching && outgoing.length > 1) {
      const defaultFlow = getBusinessObject(element)?.default as ModdleElement | undefined

      const unconditioned = outgoing.filter((flow) => {
        const bo = getBusinessObject(flow)
        if (!bo) return false
        return !bo.conditionExpression && bo !== defaultFlow
      })

      if (unconditioned.length > 0) {
        issues.push({
          code: 'gateway-missing-condition',
          severity: 'warning',
          message: t('gatewayMissingCondition', { name: labelOf(element) }),
          elementId: element.id,
          elementName: labelOf(element),
        })
      }
    }
  }

  return { valid: !issues.some((issue) => issue.severity === 'error'), issues }
}
