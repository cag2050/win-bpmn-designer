<script setup lang="ts">
import { ElOption, ElSelect } from 'element-plus'

import type { SelectOption } from '@/types'

defineOptions({ name: 'PropSelect' })

const props = withDefaults(
  defineProps<{
    label: string
    options: SelectOption[]
    modelValue?: string
    placeholder?: string
    hint?: string
    clearable?: boolean
  }>(),
  { modelValue: undefined, placeholder: undefined, hint: undefined, clearable: false },
)

const emit = defineEmits<{ 'update:modelValue': [value: string | undefined] }>()

// 下拉是原子提交，不需要 PropText 那种本地草稿镜像
function onChange(value: unknown): void {
  emit('update:modelValue', value === '' || value == null ? undefined : String(value))
}
</script>

<template>
  <div class="win-bpmn-panel__row">
    <label class="win-bpmn-panel__label">{{ props.label }}</label>
    <ElSelect
      :model-value="props.modelValue"
      :placeholder="props.placeholder"
      :clearable="props.clearable"
      size="small"
      @change="onChange"
      @clear="onChange(undefined)"
    >
      <ElOption
        v-for="option in props.options"
        :key="option.value"
        :label="option.label"
        :value="option.value"
      />
    </ElSelect>
    <p v-if="props.hint" class="win-bpmn-panel__hint">{{ props.hint }}</p>
  </div>
</template>
