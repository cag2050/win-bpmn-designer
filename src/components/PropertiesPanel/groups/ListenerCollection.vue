<script setup lang="ts">
import { computed } from 'vue'

import { useElementProps } from '@/composables/useElementProps'
import { useExtensionCollection } from '@/composables/useExtensionCollection'
import { translate } from '@/locales'
import type { BpmnElement, LocaleName, ModdleElement, SelectOption } from '@/types'

import PropCollection from '../widgets/PropCollection.vue'
import PropSelect from '../widgets/PropSelect.vue'
import PropText from '../widgets/PropText.vue'

import ListenerFields from './ListenerFields.vue'
import { LISTENER_IMPL_KEYS, listenerImplOptions } from './listener-options'
import type { ListenerImplKey } from './listener-options'

defineOptions({ name: 'ListenerCollection' })

const props = defineProps<{
  element: BpmnElement
  locale: LocaleName
  /** flowable:ExecutionListener 或 flowable:TaskListener */
  type: string
  label: string
  eventOptions: SelectOption[]
  defaultEvent: string
}>()

const elementRef = computed(() => props.element)
const bag = useElementProps(elementRef)
const listeners = useExtensionCollection(elementRef, props.type)

const t = (key: string): string => translate(props.locale, key)
const implOptions = computed(() => listenerImplOptions(t))

/**
 * 取值统一经由 read()，它显式依赖 revision：
 * moddle 子元素改属性时父引用不变，不建立这层依赖面板会一直显示旧值。
 * 这些函数都在本组的渲染作用域里被调用（包括插槽内容），所以能正确重算。
 */
function read(item: ModdleElement, key: string): string | undefined {
  void bag.revision.value
  return item[key] as string | undefined
}

function implKeyOf(item: ModdleElement): ListenerImplKey {
  void bag.revision.value
  return LISTENER_IMPL_KEYS.find((key) => item[key] !== undefined) ?? 'class'
}

/** 三种实现方式互斥，切换时把另外两个清掉，一次写完合成一条撤销记录 */
function setImplKind(item: ModdleElement, next: string | undefined): void {
  if (!next) return
  const value = read(item, implKeyOf(item))

  listeners.update(item, {
    class: undefined,
    expression: undefined,
    delegateExpression: undefined,
    [next]: value,
  })
}

function summaryOf(item: ModdleElement): string {
  const event = read(item, 'event') ?? ''
  const value = read(item, implKeyOf(item)) ?? ''
  return [event, value].filter(Boolean).join(' · ') || t('designer.panel.collection.untitled')
}
</script>

<template>
  <PropCollection
    :label="props.label"
    :items="listeners.items.value"
    :add-label="t('designer.panel.collection.add')"
    :empty-text="t('designer.panel.collection.empty')"
    @add="listeners.add({ event: props.defaultEvent })"
    @remove="(item: ModdleElement) => listeners.remove(item)"
  >
    <template #summary="{ item }">{{ summaryOf(item) }}</template>

    <template #default="{ item }">
      <PropSelect
        :label="t('designer.panel.event')"
        :options="props.eventOptions"
        :model-value="read(item, 'event')"
        @update:model-value="listeners.update(item, { event: $event })"
      />
      <PropSelect
        :label="t('designer.panel.listenerType')"
        :options="implOptions"
        :model-value="implKeyOf(item)"
        @update:model-value="setImplKind(item, $event)"
      />
      <PropText
        :label="t('designer.panel.listenerValue')"
        :model-value="read(item, implKeyOf(item))"
        @update:model-value="listeners.update(item, { [implKeyOf(item)]: $event })"
      />

      <ListenerFields :element="props.element" :locale="props.locale" :owner="item" />
    </template>
  </PropCollection>
</template>
