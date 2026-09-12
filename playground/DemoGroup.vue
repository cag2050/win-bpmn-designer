<script setup lang="ts">
import { computed } from 'vue'

import PropText from '@/components/PropertiesPanel/widgets/PropText.vue'
import { useElementProps, useProperty } from '@/composables/useElementProps'
import type { PropertyGroupProps } from '@/types'

/**
 * 业务方自定义属性组的最小示例。
 *
 * 要点：props 直接用库导出的 PropertyGroupProps；读写走 useElementProps /
 * useProperty，撤销重做与「清空即删属性」的语义全都自动继承；
 * 复用库的 widget 就能拿到只读态置灰。
 */
defineOptions({ name: 'DemoGroup' })

const props = defineProps<PropertyGroupProps>()

const elementRef = computed(() => props.element)
const bag = useElementProps(elementRef)

// 随便挂一个自有命名空间外的属性，演示扩展位置
const owner = useProperty<string>(bag, 'owner')
</script>

<template>
  <div class="win-bpmn-panel__group">
    <PropText
      label="业务扩展字段（示例）"
      hint="来自 playground/DemoGroup.vue，演示 registerPropertyGroup"
      :model-value="owner"
      @update:model-value="owner = $event"
    />
  </div>
</template>
