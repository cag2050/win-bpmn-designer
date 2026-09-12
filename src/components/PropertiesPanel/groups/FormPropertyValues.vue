<script setup lang="ts">
import { computed } from 'vue'

import { useElementProps } from '@/composables/useElementProps'
import { useModdleCollection } from '@/composables/useExtensionCollection'
import { translate } from '@/locales'
import type { BpmnElement, LocaleName, ModdleElement } from '@/types'

import PropCollection from '../widgets/PropCollection.vue'
import PropText from '../widgets/PropText.vue'

defineOptions({ name: 'FormPropertyValues' })

const props = defineProps<{
  element: BpmnElement
  locale: LocaleName
  /** 所属的 formProperty */
  owner: ModdleElement
}>()

const elementRef = computed(() => props.element)
const bag = useElementProps(elementRef)
const values = useModdleCollection(elementRef, () => props.owner, 'values', 'flowable:Value')

const t = (key: string): string => translate(props.locale, key)

function read(item: ModdleElement, key: string): string | undefined {
  void bag.revision.value
  return item[key] as string | undefined
}

function summaryOf(item: ModdleElement): string {
  const id = read(item, 'id') ?? ''
  const name = read(item, 'name') ?? ''
  return [id, name].filter(Boolean).join(' · ') || t('designer.panel.collection.untitled')
}
</script>

<template>
  <div class="win-bpmn-panel__collection-nested">
    <PropCollection
      :label="t('designer.panel.enumValues')"
      :items="values.items.value"
      :add-label="t('designer.panel.collection.add')"
      :empty-text="t('designer.panel.collection.empty')"
      @add="values.add()"
      @remove="(item: ModdleElement) => values.remove(item)"
    >
      <template #summary="{ item }">{{ summaryOf(item) }}</template>

      <template #default="{ item }">
        <PropText
          :label="t('designer.panel.id')"
          :model-value="read(item, 'id')"
          @update:model-value="values.update(item, { id: $event })"
        />
        <PropText
          :label="t('designer.panel.name')"
          :model-value="read(item, 'name')"
          @update:model-value="values.update(item, { name: $event })"
        />
      </template>
    </PropCollection>
  </div>
</template>
