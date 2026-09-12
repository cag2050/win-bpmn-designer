<script setup lang="ts">
import { ElSwitch } from 'element-plus'
import { computed } from 'vue'

import { useReadonly } from '@/composables/useReadonly'

defineOptions({ name: 'PropSwitch' })

const props = withDefaults(
  defineProps<{
    label: string
    modelValue?: boolean
    hint?: string
    /**
     * 该属性在 XML 中缺省时引擎所采用的值。等于它时写 undefined 把属性删掉，避免噪音。
     * 注意 Flowable 的 exclusive 缺省为 true，所以它要传 true —— 若也按 false 处理，
     * 用户关掉「排他」时属性会被删掉，语义正好反过来。
     */
    defaultValue?: boolean
  }>(),
  { modelValue: undefined, hint: undefined, defaultValue: false },
)

const readonly = useReadonly()

const emit = defineEmits<{ 'update:modelValue': [value: boolean | undefined] }>()

const checked = computed(() => props.modelValue ?? props.defaultValue)

function onChange(value: boolean | string | number): void {
  const next = value === true
  emit('update:modelValue', next === props.defaultValue ? undefined : next)
}
</script>

<template>
  <div class="win-bpmn-panel__row win-bpmn-panel__row--inline">
    <label class="win-bpmn-panel__label">{{ props.label }}</label>
    <ElSwitch :model-value="checked" :disabled="readonly" size="small" @change="onChange" />
    <p v-if="props.hint" class="win-bpmn-panel__hint">{{ props.hint }}</p>
  </div>
</template>
