<script setup lang="ts">
import { ElOption, ElSelect } from 'element-plus'
import { computed, ref, watch } from 'vue'

import { useReadonly } from '@/composables/useReadonly'
import { joinCsv, parseCsv } from '@/helpers/csv'

defineOptions({ name: 'PropList' })

const props = withDefaults(
  defineProps<{ label: string; modelValue?: string; placeholder?: string; hint?: string }>(),
  { modelValue: undefined, placeholder: undefined, hint: undefined },
)

const emit = defineEmits<{ 'update:modelValue': [value: string | undefined] }>()

const readonly = useReadonly()

// Flowable 的 candidateUsers / candidateGroups 在 XML 里是逗号分隔的单个字符串，
// 这里用多选 tag 呈现，提交时再拼回去（拆拼见 helpers/csv.ts）。
const items = ref<string[]>(parseCsv(props.modelValue))

watch(
  () => props.modelValue,
  (next) => {
    items.value = parseCsv(next)
  },
)

// 候选项与已选值分开维护：直接拿 items 当 options 会让 allow-create 的新建项
// 在下一次渲染里被自己覆盖掉，表现为只留下最后输入的一个值。
const options = computed(() => items.value)

function onChange(value: unknown): void {
  emit('update:modelValue', joinCsv(value as string[]))
}
</script>

<template>
  <div class="win-bpmn-panel__row">
    <label class="win-bpmn-panel__label">{{ props.label }}</label>
    <ElSelect
      v-model="items"
      multiple
      filterable
      allow-create
      default-first-option
      :reserve-keyword="false"
      :placeholder="props.placeholder"
      :disabled="readonly"
      size="small"
      @change="onChange"
    >
      <ElOption v-for="item in options" :key="item" :label="item" :value="item" />
    </ElSelect>
    <p v-if="props.hint" class="win-bpmn-panel__hint">{{ props.hint }}</p>
  </div>
</template>
