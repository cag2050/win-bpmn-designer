<script setup lang="ts">
import { computed } from 'vue'

import { useElementProps, useProperty } from '@/composables/useElementProps'
import { translate } from '@/locales'
import type { BpmnElement, LocaleName, ModdleElement } from '@/types'

import PropSwitch from '../widgets/PropSwitch.vue'

defineOptions({ name: 'BoundaryEventGroup' })

const props = defineProps<{ element: BpmnElement; locale: LocaleName }>()

const elementRef = computed(() => props.element)
const bag = useElementProps(elementRef)

const t = (key: string): string => translate(props.locale, key)

// 缺省为 true（中断型），所以关掉时要显式写 false 而不是删属性
const cancelActivity = useProperty<boolean>(bag, 'cancelActivity')

const attachedTo = computed<string>(() => {
  void bag.revision.value
  const ref = bag.get<ModdleElement>('attachedToRef')
  return (ref?.id as string | undefined) ?? '—'
})
</script>

<template>
  <div class="win-bpmn-panel__group">
    <PropSwitch
      :label="t('designer.panel.cancelActivity')"
      :hint="t('designer.panel.hint.cancelActivity')"
      :model-value="cancelActivity"
      :default-value="true"
      @update:model-value="cancelActivity = $event"
    />

    <div class="win-bpmn-panel__row">
      <label class="win-bpmn-panel__label">{{ t('designer.panel.attachedTo') }}</label>
      <p class="win-bpmn-panel__readonly">{{ attachedTo }}</p>
    </div>
  </div>
</template>
