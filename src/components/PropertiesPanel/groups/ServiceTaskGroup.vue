<script setup lang="ts">
import { computed } from 'vue'

import { useElementProps, useProperty } from '@/composables/useElementProps'
import { translate } from '@/locales'
import type { BpmnElement, LocaleName } from '@/types'

import PropResolver from '../widgets/PropResolver.vue'
import PropSelect from '../widgets/PropSelect.vue'
import PropSwitch from '../widgets/PropSwitch.vue'
import PropText from '../widgets/PropText.vue'

defineOptions({ name: 'ServiceTaskGroup' })

const props = defineProps<{ element: BpmnElement; locale: LocaleName }>()

const elementRef = computed(() => props.element)
const bag = useElementProps(elementRef)

const t = (key: string): string => translate(props.locale, key)

/** 四种实现方式互斥 */
const IMPL_KEYS = ['class', 'expression', 'delegateExpression', 'type'] as const

const implOptions = computed(() => [
  { label: t('designer.panel.option.impl.class'), value: 'class' },
  { label: t('designer.panel.option.impl.expression'), value: 'expression' },
  { label: t('designer.panel.option.impl.delegateExpression'), value: 'delegateExpression' },
  { label: t('designer.panel.option.impl.type'), value: 'type' },
])

const SERVICE_TYPES = [
  'mail',
  'http',
  'dmn',
  'shell',
  'camel',
  'case',
  'send-event',
  'external-worker',
]

const typeOptions = computed(() => SERVICE_TYPES.map((value) => ({ label: value, value })))

const implKey = computed<string>(() => {
  void bag.revision.value
  return IMPL_KEYS.find((key) => bag.get(key) !== undefined) ?? 'class'
})

const implValue = computed<string | undefined>(() => bag.get<string>(implKey.value))

/**
 * 类/委托表达式交给 classPicker，普通表达式交给 expressionEditor。
 * 必须自带 revision 依赖：上游 implKey 读的是 moddle，返回的又是同一个引用，
 * 不这样写变更传不到这里（M3 已经踩过一次链式 computed 的坑）。
 */
const implResolver = computed<'classPicker' | 'expressionEditor'>(() => {
  void bag.revision.value
  return implKey.value === 'expression' ? 'expressionEditor' : 'classPicker'
})

/** 切换实现方式：把另外三个键清掉，一次写完合成一条撤销记录 */
function setImplKind(next: string | undefined): void {
  if (!next) return
  const value = next === 'type' ? undefined : implValue.value

  bag.setMany({
    class: undefined,
    expression: undefined,
    delegateExpression: undefined,
    type: undefined,
    [next]: value,
  })
}

const resultVariable = useProperty<string>(bag, 'resultVariable')
const skipExpression = useProperty<string>(bag, 'skipExpression')
const triggerable = useProperty<boolean>(bag, 'triggerable')
const useLocalScope = useProperty<boolean>(bag, 'useLocalScopeForResultVariable')
</script>

<template>
  <div class="win-bpmn-panel__group">
    <PropSelect
      :label="t('designer.panel.implementation')"
      :options="implOptions"
      :model-value="implKey"
      @update:model-value="setImplKind($event)"
    />

    <PropSelect
      v-if="implKey === 'type'"
      :label="t('designer.panel.serviceTaskType')"
      :options="typeOptions"
      :model-value="implValue"
      @update:model-value="bag.set('type', $event)"
    />
    <PropResolver
      v-else
      :label="t('designer.panel.implementationValue')"
      :name="implResolver"
      :element="props.element"
      :model-value="implValue"
      @update:model-value="bag.set(implKey, $event)"
    />

    <PropText
      :label="t('designer.panel.resultVariable')"
      :model-value="resultVariable"
      @update:model-value="resultVariable = $event"
    />
    <PropResolver
      :label="t('designer.panel.skipExpression')"
      name="expressionEditor"
      :element="props.element"
      :placeholder="t('designer.panel.placeholder.expression')"
      :model-value="skipExpression"
      @update:model-value="skipExpression = $event"
    />
    <PropSwitch
      :label="t('designer.panel.triggerable')"
      :model-value="triggerable"
      @update:model-value="triggerable = $event"
    />
    <PropSwitch
      :label="t('designer.panel.useLocalScopeForResultVariable')"
      :model-value="useLocalScope"
      @update:model-value="useLocalScope = $event"
    />
  </div>
</template>
