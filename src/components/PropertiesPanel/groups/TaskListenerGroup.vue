<script setup lang="ts">
import { computed } from 'vue'

import { translate } from '@/locales'
import type { BpmnElement, LocaleName } from '@/types'

import ListenerCollection from './ListenerCollection.vue'
import { taskListenerEvents } from './listener-options'

defineOptions({ name: 'TaskListenerGroup' })

const props = defineProps<{ element: BpmnElement; locale: LocaleName }>()

const t = (key: string): string => translate(props.locale, key)
const events = computed(() => taskListenerEvents(t))
</script>

<template>
  <div class="win-bpmn-panel__group">
    <ListenerCollection
      :element="props.element"
      :locale="props.locale"
      type="flowable:TaskListener"
      :label="t('designer.panel.taskListener')"
      :event-options="events"
      default-event="create"
    />
  </div>
</template>
