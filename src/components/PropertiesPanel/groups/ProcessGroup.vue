<script setup lang="ts">
import { computed } from 'vue'

import { useElementProps, useProperty } from '@/composables/useElementProps'
import { translate } from '@/locales'
import type { BpmnElement, LocaleName } from '@/types'

import PropResolver from '../widgets/PropResolver.vue'
import PropSwitch from '../widgets/PropSwitch.vue'
import PropText from '../widgets/PropText.vue'

defineOptions({ name: 'ProcessGroup' })

const props = defineProps<{ element: BpmnElement; locale: LocaleName }>()

const elementRef = computed(() => props.element)
const bag = useElementProps(elementRef)

const t = (key: string): string => translate(props.locale, key)

const id = useProperty<string>(bag, 'id')
const name = useProperty<string>(bag, 'name')
const isExecutable = useProperty<boolean>(bag, 'isExecutable')
const candidateStarterUsers = useProperty<string>(bag, 'candidateStarterUsers')
const candidateStarterGroups = useProperty<string>(bag, 'candidateStarterGroups')
</script>

<template>
  <div class="win-bpmn-panel__group">
    <PropText :label="t('designer.panel.id')" :model-value="id" @update:model-value="id = $event" />
    <PropText
      :label="t('designer.panel.name')"
      :model-value="name"
      @update:model-value="name = $event"
    />
    <PropSwitch
      :label="t('designer.panel.isExecutable')"
      :model-value="isExecutable"
      :default-value="true"
      @update:model-value="isExecutable = $event"
    />
    <PropResolver
      :label="t('designer.panel.candidateStarterUsers')"
      name="userPicker"
      :element="props.element"
      multiple
      :hint="t('designer.panel.hint.commaSeparated')"
      :model-value="candidateStarterUsers"
      @update:model-value="candidateStarterUsers = $event"
    />
    <PropResolver
      :label="t('designer.panel.candidateStarterGroups')"
      name="groupPicker"
      :element="props.element"
      multiple
      :hint="t('designer.panel.hint.commaSeparated')"
      :model-value="candidateStarterGroups"
      @update:model-value="candidateStarterGroups = $event"
    />
  </div>
</template>
