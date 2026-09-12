<script setup lang="ts">
import { computed } from 'vue'

import { useElementProps, useProperty } from '@/composables/useElementProps'
import { translate } from '@/locales'
import type { BpmnElement, LocaleName } from '@/types'

import PropSwitch from '../widgets/PropSwitch.vue'
import PropText from '../widgets/PropText.vue'

defineOptions({ name: 'CallActivityGroup' })

const props = defineProps<{ element: BpmnElement; locale: LocaleName }>()

const elementRef = computed(() => props.element)
const bag = useElementProps(elementRef)

const t = (key: string): string => translate(props.locale, key)

const calledElement = useProperty<string>(bag, 'calledElement')
const businessKey = useProperty<string>(bag, 'businessKey')
const inheritVariables = useProperty<boolean>(bag, 'inheritVariables')
const inheritBusinessKey = useProperty<boolean>(bag, 'inheritBusinessKey')
const sameDeployment = useProperty<boolean>(bag, 'sameDeployment')
</script>

<template>
  <div class="win-bpmn-panel__group">
    <PropText
      :label="t('designer.panel.calledElement')"
      :hint="t('designer.panel.hint.calledElement')"
      :model-value="calledElement"
      @update:model-value="calledElement = $event"
    />
    <PropText
      :label="t('designer.panel.businessKey')"
      :model-value="businessKey"
      @update:model-value="businessKey = $event"
    />
    <PropSwitch
      :label="t('designer.panel.inheritVariables')"
      :model-value="inheritVariables"
      @update:model-value="inheritVariables = $event"
    />
    <PropSwitch
      :label="t('designer.panel.inheritBusinessKey')"
      :model-value="inheritBusinessKey"
      @update:model-value="inheritBusinessKey = $event"
    />
    <PropSwitch
      :label="t('designer.panel.sameDeployment')"
      :model-value="sameDeployment"
      @update:model-value="sameDeployment = $event"
    />
  </div>
</template>
