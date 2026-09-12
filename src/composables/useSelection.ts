import { computed, markRaw, shallowRef, watch } from 'vue'
import type { ComputedRef, ShallowRef } from 'vue'

import { useModeler } from '@/composables/useModeler'
import type { BpmnElement } from '@/types'

interface SelectionChangedEvent {
  newSelection: BpmnElement[]
}

interface Selection {
  get: () => BpmnElement[]
}

interface EventBus {
  on: (event: string, callback: (e: SelectionChangedEvent) => void) => void
  off: (event: string, callback: (e: SelectionChangedEvent) => void) => void
}

/**
 * 把 bpmn-js 的选中态桥接成 Vue 响应式。
 *
 * 图元一律 shallowRef + markRaw：bpmn-js 内部大量依赖引用相等（===）判断，
 * 被深度响应式 Proxy 包裹后比较会失败，渲染随即错乱（见方案 §4.2）。
 */
export function useSelection(): {
  selection: ShallowRef<readonly BpmnElement[]>
  selected: ShallowRef<BpmnElement | undefined>
  count: ComputedRef<number>
} {
  const modeler = useModeler()

  const selection = shallowRef<readonly BpmnElement[]>([])
  const selected = shallowRef<BpmnElement | undefined>(undefined)

  function apply(elements: BpmnElement[]): void {
    const next = elements.map((element) => markRaw(element))
    selection.value = next
    // 单选便捷值：多选时为 undefined，属性面板（M2）只在单选时渲染
    selected.value = next.length === 1 ? next[0] : undefined
  }

  watch(
    modeler,
    (instance, _previous, onCleanup) => {
      apply([])
      if (!instance) return

      const eventBus = instance.get<EventBus>('eventBus')

      function onSelectionChanged(event: SelectionChangedEvent): void {
        apply(event.newSelection)
      }

      eventBus.on('selection.changed', onSelectionChanged)
      apply(instance.get<Selection>('selection').get())

      onCleanup(() => eventBus.off('selection.changed', onSelectionChanged))
    },
    { immediate: true },
  )

  const count = computed(() => selection.value.length)

  return { selection, selected, count }
}
