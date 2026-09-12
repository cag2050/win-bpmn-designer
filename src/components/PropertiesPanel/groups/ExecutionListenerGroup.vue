<script setup lang="ts">
import { computed } from 'vue'

import { translate } from '@/locales'
import type { BpmnElement, LocaleName } from '@/types'

import ListenerCollection from './ListenerCollection.vue'
import { executionListenerEvents } from './listener-options'

defineOptions({ name: 'ExecutionListenerGroup' })

const props = defineProps<{ element: BpmnElement; locale: LocaleName }>()

const t = (key: string): string => translate(props.locale, key)
const events = computed(() => executionListenerEvents(t))
</script>

<template>
  <div class="win-bpmn-panel__group">
    <ListenerCollection
      :element="props.element"
      :locale="props.locale"
      type="flowable:ExecutionListener"
      :label="t('designer.panel.executionListener')"
      :event-options="events"
      default-event="start"
    />
  </div>
</template>
