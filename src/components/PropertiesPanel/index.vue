<script setup lang="ts">
import { ElCollapse, ElCollapseItem } from 'element-plus'
import { computed, markRaw, ref, shallowRef, watch } from 'vue'

import { useModeler } from '@/composables/useModeler'
import { useSelection } from '@/composables/useSelection'
import { DEFAULT_LOCALE, translate } from '@/locales'
import type { BpmnElement, LocaleName } from '@/types'

import { registerBuiltinGroups } from './builtin'
import { getPropertyGroups } from './registry'

defineOptions({ name: 'BpmnPropertiesPanel' })

const props = withDefaults(
  defineProps<{
    locale?: LocaleName
    /** 按 id 隐藏某些组，用于同页面多个设计器需要不同组集合的场景 */
    hiddenGroups?: string[]
  }>(),
  { locale: DEFAULT_LOCALE, hiddenGroups: () => [] },
)

registerBuiltinGroups()

const modeler = useModeler()
const { selection, selected } = useSelection()

const t = (key: string): string => translate(props.locale, key)

// 画布根元素。没选中任何东西时回落到它，否则用户没有入口配置流程级属性。
// 必须 shallowRef + markRaw：普通 ref 会把图元深度响应式化，bpmn-js 内部的
// 引用相等判断随即失效（表现为 "'get' on proxy: property 'labels'..." 报错）。
const root = shallowRef<BpmnElement | undefined>(undefined)

watch(
  modeler,
  (instance, _previous, onCleanup) => {
    root.value = undefined
    if (!instance) return

    const eventBus = instance.get<{
      on: (e: string, cb: () => void) => void
      off: (e: string, cb: () => void) => void
    }>('eventBus')

    function syncRoot(): void {
      const element = instance
        ?.get<{ getRootElement: () => BpmnElement }>('canvas')
        .getRootElement()
      root.value = element ? markRaw(element) : undefined
    }

    eventBus.on('import.done', syncRoot)
    eventBus.on('root.set', syncRoot)
    syncRoot()

    onCleanup(() => {
      eventBus.off('import.done', syncRoot)
      eventBus.off('root.set', syncRoot)
    })
  },
  { immediate: true },
)

const isMultiSelect = computed(() => selection.value.length > 1)

/** 单选时是该元素，无选中时是画布根（Process） */
const target = computed<BpmnElement | undefined>(() =>
  isMultiSelect.value ? undefined : (selected.value ?? root.value),
)

const groups = computed(() => {
  const element = target.value
  if (!element) return []

  return getPropertyGroups(element).filter((group) => !props.hiddenGroups.includes(group.id))
})

// 默认全部展开；切换元素时按新的组集合重算
const active = ref<string[]>([])

watch(
  groups,
  (next) => {
    active.value = next.map((group) => group.id)
  },
  { immediate: true },
)
</script>

<template>
  <div class="win-bpmn-panel">
    <header class="win-bpmn-panel__header">{{ t('designer.panel.title') }}</header>

    <p v-if="!target" class="win-bpmn-panel__empty">{{ t('designer.panel.empty') }}</p>

    <ElCollapse v-else v-model="active">
      <ElCollapseItem
        v-for="group in groups"
        :key="group.id"
        :name="group.id"
        :title="t(`designer.panel.group.${group.id}`)"
      >
        <component :is="group.component" :element="target" :locale="props.locale" />
      </ElCollapseItem>
    </ElCollapse>
  </div>
</template>
