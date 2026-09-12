<script setup lang="ts">
import { computed } from 'vue'

import { useElementProps } from '@/composables/useElementProps'
import { useModdleCollection } from '@/composables/useExtensionCollection'
import { translate } from '@/locales'
import type { BpmnElement, LocaleName, ModdleElement } from '@/types'

import PropCollection from '../widgets/PropCollection.vue'
import PropSelect from '../widgets/PropSelect.vue'
import PropText from '../widgets/PropText.vue'

import { fieldValueTypes } from './listener-options'

defineOptions({ name: 'ListenerFields' })

const props = defineProps<{
  element: BpmnElement
  locale: LocaleName
  /** 所属的监听器 */
  owner: ModdleElement
}>()

const elementRef = computed(() => props.element)
const bag = useElementProps(elementRef)

// owner 用取值函数传入：监听器条目可能被替换，每次求值时重新取才不会抓着旧引用
const fields = useModdleCollection(elementRef, () => props.owner, 'fields', 'flowable:Field')

const t = (key: string): string => translate(props.locale, key)
const valueTypes = computed(() => fieldValueTypes(t))

function read(item: ModdleElement, key: string): string | undefined {
  void bag.revision.value
  return item[key] as string | undefined
}

/** 字段值只用属性形式：expression 优先，否则按 stringValue 处理 */
function valueKey(field: ModdleElement): string {
  void bag.revision.value
  return field.expression !== undefined ? 'expression' : 'stringValue'
}

function setValueKind(field: ModdleElement, next: string | undefined): void {
  if (!next) return
  const value = read(field, valueKey(field))
  fields.update(field, { stringValue: undefined, expression: undefined, [next]: value })
}

function summaryOf(field: ModdleElement): string {
  const name = read(field, 'name') ?? ''
  const value = read(field, valueKey(field)) ?? ''
  return [name, value].filter(Boolean).join(' · ') || t('designer.panel.collection.untitled')
}
</script>

<template>
  <div class="win-bpmn-panel__collection-nested">
    <PropCollection
      :label="t('designer.panel.fields')"
      :items="fields.items.value"
      :add-label="t('designer.panel.collection.add')"
      :empty-text="t('designer.panel.collection.empty')"
      @add="fields.add()"
      @remove="(item) => fields.remove(item)"
    >
      <template #summary="{ item }">{{ summaryOf(item) }}</template>

      <template #default="{ item }">
        <PropText
          :label="t('designer.panel.fieldName')"
          :model-value="read(item, 'name')"
          @update:model-value="fields.update(item, { name: $event })"
        />
        <PropSelect
          :label="t('designer.panel.fieldValueType')"
          :options="valueTypes"
          :model-value="valueKey(item)"
          @update:model-value="setValueKind(item, $event)"
        />
        <PropText
          :label="t('designer.panel.fieldValue')"
          :model-value="read(item, valueKey(item))"
          @update:model-value="fields.update(item, { [valueKey(item)]: $event })"
        />
      </template>
    </PropCollection>
  </div>
</template>
