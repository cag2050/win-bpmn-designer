<script setup lang="ts">
import { computed } from 'vue'

import { useElementProps, useProperty } from '@/composables/useElementProps'
import { translate } from '@/locales'
import type { BpmnElement, LocaleName } from '@/types'

import PropList from '../widgets/PropList.vue'
import PropSwitch from '../widgets/PropSwitch.vue'
import PropText from '../widgets/PropText.vue'

defineOptions({ name: 'UserTaskGroup' })

const props = defineProps<{ element: BpmnElement; locale: LocaleName }>()

const elementRef = computed(() => props.element)
const bag = useElementProps(elementRef)

const t = (key: string): string => translate(props.locale, key)

const assignee = useProperty<string>(bag, 'assignee')
const owner = useProperty<string>(bag, 'owner')
const candidateUsers = useProperty<string>(bag, 'candidateUsers')
const candidateGroups = useProperty<string>(bag, 'candidateGroups')
const dueDate = useProperty<string>(bag, 'dueDate')
const formKey = useProperty<string>(bag, 'formKey')
const priority = useProperty<string>(bag, 'priority')
const skipExpression = useProperty<string>(bag, 'skipExpression')
const category = useProperty<string>(bag, 'category')
const formFieldValidation = useProperty<boolean>(bag, 'formFieldValidation')
</script>

<template>
  <div class="win-bpmn-panel__group">
    <PropText
      :label="t('designer.panel.assignee')"
      :placeholder="t('designer.panel.placeholder.expression')"
      :model-value="assignee"
      @update:model-value="assignee = $event"
    />
    <PropText
      :label="t('designer.panel.owner')"
      :model-value="owner"
      @update:model-value="owner = $event"
    />
    <PropList
      :label="t('designer.panel.candidateUsers')"
      :hint="t('designer.panel.hint.commaSeparated')"
      :model-value="candidateUsers"
      @update:model-value="candidateUsers = $event"
    />
    <PropList
      :label="t('designer.panel.candidateGroups')"
      :hint="t('designer.panel.hint.commaSeparated')"
      :model-value="candidateGroups"
      @update:model-value="candidateGroups = $event"
    />
    <PropText
      :label="t('designer.panel.dueDate')"
      :hint="t('designer.panel.hint.dueDate')"
      :model-value="dueDate"
      @update:model-value="dueDate = $event"
    />
    <PropText
      :label="t('designer.panel.formKey')"
      :model-value="formKey"
      @update:model-value="formKey = $event"
    />
    <PropText
      :label="t('designer.panel.priority')"
      :model-value="priority"
      @update:model-value="priority = $event"
    />
    <PropText
      :label="t('designer.panel.skipExpression')"
      :placeholder="t('designer.panel.placeholder.expression')"
      :model-value="skipExpression"
      @update:model-value="skipExpression = $event"
    />
    <PropText
      :label="t('designer.panel.category')"
      :model-value="category"
      @update:model-value="category = $event"
    />
    <PropSwitch
      :label="t('designer.panel.formFieldValidation')"
      :model-value="formFieldValidation"
      @update:model-value="formFieldValidation = $event"
    />
  </div>
</template>
