import type { SelectOption } from '@/types'

/** 监听器的实现方式。三者互斥，切换时要把另外两个清掉。 */
export const LISTENER_IMPL_KEYS = ['class', 'expression', 'delegateExpression'] as const

export type ListenerImplKey = (typeof LISTENER_IMPL_KEYS)[number]

export function listenerImplOptions(t: (key: string) => string): SelectOption[] {
  return [
    { label: t('designer.panel.option.impl.class'), value: 'class' },
    { label: t('designer.panel.option.impl.expression'), value: 'expression' },
    { label: t('designer.panel.option.impl.delegateExpression'), value: 'delegateExpression' },
  ]
}

export function executionListenerEvents(t: (key: string) => string): SelectOption[] {
  return [
    { label: t('designer.panel.option.event.start'), value: 'start' },
    { label: t('designer.panel.option.event.end'), value: 'end' },
    { label: t('designer.panel.option.event.take'), value: 'take' },
  ]
}

export function taskListenerEvents(t: (key: string) => string): SelectOption[] {
  return [
    { label: t('designer.panel.option.event.create'), value: 'create' },
    { label: t('designer.panel.option.event.assignment'), value: 'assignment' },
    { label: t('designer.panel.option.event.complete'), value: 'complete' },
    { label: t('designer.panel.option.event.delete'), value: 'delete' },
    { label: t('designer.panel.option.event.all'), value: 'all' },
  ]
}

/** 字段值的两种形态，用属性形式（stringValue / expression）而非子元素形式。 */
export function fieldValueTypes(t: (key: string) => string): SelectOption[] {
  return [
    { label: t('designer.panel.option.fieldValue.string'), value: 'stringValue' },
    { label: t('designer.panel.option.fieldValue.expression'), value: 'expression' },
  ]
}
