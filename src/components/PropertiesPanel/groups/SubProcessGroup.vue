<script setup lang="ts">
import { computed } from 'vue'

import { useElementProps, useProperty } from '@/composables/useElementProps'
import { translate } from '@/locales'
import type { BpmnElement, LocaleName } from '@/types'

import PropSwitch from '../widgets/PropSwitch.vue'

defineOptions({ name: 'SubProcessGroup' })

const props = defineProps<{ element: BpmnElement; locale: LocaleName }>()

const elementRef = computed(() => props.element)
const bag = useElementProps(elementRef)

const t = (key: string): string => translate(props.locale, key)

const triggeredByEvent = useProperty<boolean>(bag, 'triggeredByEvent')
</script>

<template>
  <div class="win-bpmn-panel__group">
    <PropSwitch
      :label="t('designer.panel.triggeredByEvent')"
      :hint="t('designer.panel.hint.triggeredByEvent')"
      :model-value="triggeredByEvent"
      @update:model-value="triggeredByEvent = $event"
    />
  </div>
</template>
