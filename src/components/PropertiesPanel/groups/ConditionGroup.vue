<script setup lang="ts">
import { computed } from 'vue'

import { useElementProps } from '@/composables/useElementProps'
import { translate } from '@/locales'
import type { BpmnElement, LocaleName, ModdleElement } from '@/types'

import PropResolver from '../widgets/PropResolver.vue'

defineOptions({ name: 'ConditionGroup' })

const props = defineProps<{ element: BpmnElement; locale: LocaleName }>()

const elementRef = computed(() => props.element)
const bag = useElementProps(elementRef)

const t = (key: string): string => translate(props.locale, key)

/**
 * 条件是标准 BPMN 的 conditionExpression（bpmn:FormalExpression），不是 flowable 扩展。
 * 写操作必须走 updateProperties：bpmn-js 的 ReplaceConnectionBehavior 挂在这条命令上，
 * 会在设置条件时自动清掉源节点的 default 标记。直接改 businessObject 则不会触发。
 */
const condition = computed<string | undefined>({
  get: () => {
    const expression = bag.get<ModdleElement>('conditionExpression')
    return expression?.body as string | undefined
  },
  set: (value) => {
    if (!value) {
      bag.set('conditionExpression', undefined)
      return
    }

    const existing = bag.get<ModdleElement>('conditionExpression')
    if (existing) {
      bag.setModdle(existing, 'body', value)
      return
    }

    const created = bag.create('bpmn:FormalExpression', { body: value })
    if (created) bag.set('conditionExpression', created)
  },
})
</script>

<template>
  <div class="win-bpmn-panel__group">
    <PropResolver
      :label="t('designer.panel.conditionExpression')"
      name="expressionEditor"
      :element="props.element"
      :placeholder="t('designer.panel.placeholder.condition')"
      :hint="t('designer.panel.hint.condition')"
      :model-value="condition"
      @update:model-value="condition = $event"
    />
  </div>
</template>
