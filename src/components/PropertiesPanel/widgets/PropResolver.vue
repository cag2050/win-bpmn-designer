<script setup lang="ts">
import { computed } from 'vue'

import { useReadonly } from '@/composables/useReadonly'
import { useResolver } from '@/composables/useResolvers'
import { joinCsv, parseCsv } from '@/helpers/csv'
import type { BpmnElement, DesignerResolverName } from '@/types'

import PropList from './PropList.vue'
import PropText from './PropText.vue'

defineOptions({ name: 'PropResolver' })

const props = withDefaults(
  defineProps<{
    label: string
    /** 用哪个业务扩展点；宿主没传对应组件时自动降级 */
    name: DesignerResolverName
    modelValue?: string
    /** 多值字段（如候选人、候选组），XML 里是逗号分隔串 */
    multiple?: boolean
    element?: BpmnElement
    placeholder?: string
    hint?: string
  }>(),
  {
    modelValue: undefined,
    multiple: false,
    element: undefined,
    placeholder: undefined,
    hint: undefined,
  },
)

const emit = defineEmits<{ 'update:modelValue': [value: string | undefined] }>()

const resolver = useResolver(props.name)
const readonly = useReadonly()

// 宿主拿到的是数组（多值）或裸字符串（单值），永远不用关心 Flowable 的逗号语义
const resolverValue = computed<string | string[] | undefined>(() =>
  props.multiple ? parseCsv(props.modelValue) : props.modelValue,
)

function onResolverUpdate(value: unknown): void {
  if (props.multiple) {
    emit('update:modelValue', joinCsv(Array.isArray(value) ? (value as string[]) : []))
    return
  }

  const next = typeof value === 'string' ? value.trim() : ''
  emit('update:modelValue', next === '' ? undefined : next)
}
</script>

<template>
  <!-- 有 resolver 就渲染宿主组件；没有则退回内置控件，行为与未接入时完全一致 -->
  <div v-if="resolver" class="win-bpmn-panel__row win-bpmn-panel__resolver">
    <label class="win-bpmn-panel__label">{{ props.label }}</label>
    <component
      :is="resolver"
      :model-value="resolverValue"
      :multiple="props.multiple"
      :label="props.label"
      :disabled="readonly"
      :element="props.element"
      @update:model-value="onResolverUpdate"
    />
    <p v-if="props.hint" class="win-bpmn-panel__hint">{{ props.hint }}</p>
  </div>

  <PropList
    v-else-if="props.multiple"
    :label="props.label"
    :model-value="props.modelValue"
    :placeholder="props.placeholder"
    :hint="props.hint"
    @update:model-value="emit('update:modelValue', $event)"
  />

  <PropText
    v-else
    :label="props.label"
    :model-value="props.modelValue"
    :placeholder="props.placeholder"
    :hint="props.hint"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>
