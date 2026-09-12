<script setup lang="ts">
import { ElInput } from 'element-plus'
import { ref, watch } from 'vue'

defineOptions({ name: 'PropText' })

const props = withDefaults(
  defineProps<{
    label: string
    modelValue?: string
    placeholder?: string
    hint?: string
    type?: 'text' | 'textarea'
    rows?: number
  }>(),
  { modelValue: undefined, placeholder: undefined, hint: undefined, type: 'text', rows: 3 },
)

const emit = defineEmits<{ 'update:modelValue': [value: string | undefined] }>()

// 本地镜像：只在失焦/回车时提交。绑 @input 会让每个按键都进撤销栈，
// 且 element.changed 回读会把正在输入的内容冲掉。
const draft = ref(props.modelValue ?? '')

watch(
  () => props.modelValue,
  (next) => {
    draft.value = next ?? ''
  },
)

function commit(): void {
  const next = draft.value.trim()
  if (next === (props.modelValue ?? '')) return
  emit('update:modelValue', next === '' ? undefined : next)
}
</script>

<template>
  <div class="win-bpmn-panel__row">
    <label class="win-bpmn-panel__label">{{ props.label }}</label>
    <ElInput
      v-model="draft"
      :type="props.type"
      :rows="props.rows"
      :placeholder="props.placeholder"
      size="small"
      @change="commit"
      @blur="commit"
    />
    <p v-if="props.hint" class="win-bpmn-panel__hint">{{ props.hint }}</p>
  </div>
</template>
