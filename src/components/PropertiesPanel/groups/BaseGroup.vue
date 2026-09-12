<script setup lang="ts">
import { computed } from 'vue'

import { useElementProps, useProperty } from '@/composables/useElementProps'
import { is } from '@/helpers/element-utils'
import { translate } from '@/locales'
import type { BpmnElement, LocaleName, ModdleElement } from '@/types'

import PropSwitch from '../widgets/PropSwitch.vue'
import PropText from '../widgets/PropText.vue'

defineOptions({ name: 'BaseGroup' })

const props = defineProps<{ element: BpmnElement; locale: LocaleName }>()

const elementRef = computed(() => props.element)
const bag = useElementProps(elementRef)

const t = (key: string): string => translate(props.locale, key)

const id = useProperty<string>(bag, 'id')
const name = useProperty<string>(bag, 'name')
const async = useProperty<boolean>(bag, 'async')
const exclusive = useProperty<boolean>(bag, 'exclusive')

// FlowNode 才有 async/exclusive；根元素与连线上没有这组属性
const isFlowNode = computed(() => is(props.element, 'bpmn:FlowNode'))

// documentation 是 bpmn:Documentation 元素数组，文本存在 text 里
const documentation = computed<string | undefined>({
  get: () => {
    const docs = bag.get<ModdleElement[]>('documentation')
    return docs?.[0]?.text as string | undefined
  },
  set: (value) => {
    if (!value) {
      bag.set('documentation', undefined)
      return
    }

    const docs = bag.get<ModdleElement[]>('documentation')
    const existing = docs?.[0]
    if (existing) {
      bag.setModdle(existing, 'text', value)
      return
    }

    const created = bag.create('bpmn:Documentation', { text: value })
    if (created) bag.set('documentation', [created])
  },
})
</script>

<template>
  <div class="win-bpmn-panel__group">
    <PropText :label="t('designer.panel.id')" :model-value="id" @update:model-value="id = $event" />
    <PropText
      :label="t('designer.panel.name')"
      :model-value="name"
      @update:model-value="name = $event"
    />
    <PropText
      :label="t('designer.panel.documentation')"
      type="textarea"
      :model-value="documentation"
      @update:model-value="documentation = $event"
    />

    <template v-if="isFlowNode">
      <PropSwitch
        :label="t('designer.panel.async')"
        :model-value="async"
        @update:model-value="async = $event"
      />
      <PropSwitch
        v-if="async"
        :label="t('designer.panel.exclusive')"
        :model-value="exclusive"
        :default-value="true"
        @update:model-value="exclusive = $event"
      />
    </template>
  </div>
</template>
