<script setup lang="ts">
import { ElOption, ElSelect } from 'element-plus'
import { computed } from 'vue'

/**
 * 一个最小的「宿主自己的选人组件」示例：只需是受控组件即可。
 * 真实项目里这里会是个弹窗 + 组织架构树 + 远程搜索。
 */
defineOptions({ name: 'UserPicker' })

const props = withDefaults(
  defineProps<{
    modelValue?: string | string[]
    multiple?: boolean
    label?: string
    disabled?: boolean
  }>(),
  { modelValue: undefined, multiple: false, label: undefined, disabled: false },
)

const emit = defineEmits<{ 'update:modelValue': [value: string | string[] | undefined] }>()

const USERS = [
  { label: '张三（研发）', value: 'zhangsan' },
  { label: '李四（财务）', value: 'lisi' },
  { label: '王五（HR）', value: 'wangwu' },
  { label: '发起人变量', value: '${initiator}' },
]

// 多值时库内给的是数组，单值时是裸字符串 —— 逗号语义由库负责，这里不用管
const value = computed({
  get: () => props.modelValue ?? (props.multiple ? [] : undefined),
  set: (next) => emit('update:modelValue', next),
})
</script>

<template>
  <ElSelect
    v-model="value"
    :multiple="props.multiple"
    :disabled="props.disabled"
    clearable
    filterable
    allow-create
    placeholder="选择人员"
    size="small"
  >
    <ElOption v-for="user in USERS" :key="user.value" :label="user.label" :value="user.value" />
  </ElSelect>
</template>
