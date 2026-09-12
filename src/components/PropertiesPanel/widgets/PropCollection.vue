<script setup lang="ts">
import { shallowRef, watch } from 'vue'

import type { ModdleElement } from '@/types'

defineOptions({ name: 'PropCollection' })

const props = withDefaults(
  defineProps<{
    label: string
    items: ModdleElement[]
    addLabel?: string
    emptyText?: string
  }>(),
  { addLabel: '+', emptyText: undefined },
)

const emit = defineEmits<{ add: []; remove: [item: ModdleElement, index: number] }>()

// shallowRef：这里存的是 moddle 对象，绝不能进深度响应式
const expanded = shallowRef<ModdleElement[]>([])

// 条目被删掉后要把它的展开态一并清掉，否则集合里出现同一位置的新条目时会误判为已展开
watch(
  () => props.items,
  (next) => {
    expanded.value = expanded.value.filter((item) => next.includes(item))
  },
)

function isExpanded(item: ModdleElement): boolean {
  return expanded.value.includes(item)
}

function toggle(item: ModdleElement): void {
  expanded.value = isExpanded(item)
    ? expanded.value.filter((value) => value !== item)
    : [...expanded.value, item]
}
</script>

<template>
  <div class="win-bpmn-panel__collection">
    <div class="win-bpmn-panel__collection-head">
      <label class="win-bpmn-panel__label">{{ props.label }}</label>
      <button type="button" class="win-bpmn-panel__collection-add" @click="emit('add')">
        {{ props.addLabel }}
      </button>
    </div>

    <p v-if="!props.items.length" class="win-bpmn-panel__collection-empty">
      {{ props.emptyText }}
    </p>

    <div
      v-for="(item, index) in props.items"
      :key="(item.id as string) ?? index"
      class="win-bpmn-panel__collection-item"
    >
      <div class="win-bpmn-panel__collection-summary">
        <button
          type="button"
          class="win-bpmn-panel__collection-toggle"
          :aria-expanded="isExpanded(item)"
          @click="toggle(item)"
        >
          <span class="win-bpmn-panel__collection-caret">{{ isExpanded(item) ? '▾' : '▸' }}</span>
          <!-- 摘要在「组」的渲染作用域里求值，才能随 revision 重算 -->
          <span class="win-bpmn-panel__collection-title">
            <slot name="summary" :item="item" :index="index" />
          </span>
        </button>
        <button
          type="button"
          class="win-bpmn-panel__collection-remove"
          @click="emit('remove', item, index)"
        >
          ✕
        </button>
      </div>

      <div v-if="isExpanded(item)" class="win-bpmn-panel__collection-body">
        <slot :item="item" :index="index" />
      </div>
    </div>
  </div>
</template>
