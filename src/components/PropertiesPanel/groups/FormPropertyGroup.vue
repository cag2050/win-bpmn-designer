<script setup lang="ts">
import { computed } from 'vue'

import { useElementProps } from '@/composables/useElementProps'
import { useExtensionCollection } from '@/composables/useExtensionCollection'
import { translate } from '@/locales'
import type { BpmnElement, LocaleName, ModdleElement } from '@/types'

import PropCollection from '../widgets/PropCollection.vue'
import PropSelect from '../widgets/PropSelect.vue'
import PropSwitch from '../widgets/PropSwitch.vue'
import PropText from '../widgets/PropText.vue'

import FormPropertyValues from './FormPropertyValues.vue'

defineOptions({ name: 'FormPropertyGroup' })

const props = defineProps<{ element: BpmnElement; locale: LocaleName }>()

const elementRef = computed(() => props.element)
const bag = useElementProps(elementRef)
const properties = useExtensionCollection(elementRef, 'flowable:FormProperty')

const t = (key: string): string => translate(props.locale, key)

const TYPES = ['string', 'long', 'boolean', 'date', 'enum']
const typeOptions = computed(() => TYPES.map((value) => ({ label: value, value })))

function read(item: ModdleElement, key: string): string | undefined {
  void bag.revision.value
  return item[key] as string | undefined
}

function readBool(item: ModdleElement, key: string): boolean | undefined {
  void bag.revision.value
  return item[key] as boolean | undefined
}

function summaryOf(item: ModdleElement): string {
  const id = read(item, 'id') ?? ''
  const name = read(item, 'name') ?? ''
  return [id, name].filter(Boolean).join(' · ') || t('designer.panel.collection.untitled')
}
</script>

<template>
  <div class="win-bpmn-panel__group">
    <PropCollection
      :label="t('designer.panel.formProperty')"
      :items="properties.items.value"
      :add-label="t('designer.panel.collection.add')"
      :empty-text="t('designer.panel.collection.empty')"
      @add="properties.add({ type: 'string' })"
      @remove="(item: ModdleElement) => properties.remove(item)"
    >
      <template #summary="{ item }">{{ summaryOf(item) }}</template>

      <template #default="{ item }">
        <PropText
          :label="t('designer.panel.id')"
          :model-value="read(item, 'id')"
          @update:model-value="properties.update(item, { id: $event })"
        />
        <PropText
          :label="t('designer.panel.name')"
          :model-value="read(item, 'name')"
          @update:model-value="properties.update(item, { name: $event })"
        />
        <PropSelect
          :label="t('designer.panel.propertyType')"
          :options="typeOptions"
          :model-value="read(item, 'type')"
          @update:model-value="properties.update(item, { type: $event })"
        />
        <PropText
          :label="t('designer.panel.variable')"
          :model-value="read(item, 'variable')"
          @update:model-value="properties.update(item, { variable: $event })"
        />
        <PropText
          :label="t('designer.panel.expression')"
          :placeholder="t('designer.panel.placeholder.expression')"
          :model-value="read(item, 'expression')"
          @update:model-value="properties.update(item, { expression: $event })"
        />
        <PropText
          :label="t('designer.panel.defaultValue')"
          :model-value="read(item, 'default')"
          @update:model-value="properties.update(item, { default: $event })"
        />
        <PropText
          v-if="read(item, 'type') === 'date'"
          :label="t('designer.panel.datePattern')"
          :model-value="read(item, 'datePattern')"
          @update:model-value="properties.update(item, { datePattern: $event })"
        />
        <PropSwitch
          :label="t('designer.panel.required')"
          :model-value="readBool(item, 'required')"
          @update:model-value="properties.update(item, { required: $event })"
        />
        <PropSwitch
          :label="t('designer.panel.readable')"
          :model-value="readBool(item, 'readable')"
          :default-value="true"
          @update:model-value="properties.update(item, { readable: $event })"
        />
        <PropSwitch
          :label="t('designer.panel.writable')"
          :model-value="readBool(item, 'writable')"
          :default-value="true"
          @update:model-value="properties.update(item, { writable: $event })"
        />

        <FormPropertyValues
          v-if="read(item, 'type') === 'enum'"
          :element="props.element"
          :locale="props.locale"
          :owner="item"
        />
      </template>
    </PropCollection>
  </div>
</template>
