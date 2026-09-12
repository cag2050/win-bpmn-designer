<script setup lang="ts">
import { computed } from 'vue'

import { useElementProps } from '@/composables/useElementProps'
import { useModeler } from '@/composables/useModeler'
import { translate } from '@/locales'
import type { BpmnElement, LocaleName, ModdleElement } from '@/types'

import PropSelect from '../widgets/PropSelect.vue'
import PropResolver from '../widgets/PropResolver.vue'
import PropText from '../widgets/PropText.vue'

defineOptions({ name: 'MultiInstanceGroup' })

const props = defineProps<{ element: BpmnElement; locale: LocaleName }>()

const elementRef = computed(() => props.element)
const bag = useElementProps(elementRef)
const modeler = useModeler()

const t = (key: string): string => translate(props.locale, key)

const MI_TYPE = 'bpmn:MultiInstanceLoopCharacteristics'

const loopCharacteristics = computed<ModdleElement | undefined>(() => {
  void bag.revision.value
  return bag.get<ModdleElement>('loopCharacteristics')
})

/** '' 无 / 'sequential' 串行会签 / 'parallel' 并行会签 */
const kind = computed<string>(() => {
  // 必须自己依赖 revision：上游 loopCharacteristics 返回的是同一个对象引用，
  // 改 isSequential 时它的「值」没变，Vue 不会把变更传播到下游 computed。
  void bag.revision.value

  const lc = loopCharacteristics.value
  if (!lc || lc.$type !== MI_TYPE) return ''
  return lc.isSequential === true ? 'sequential' : 'parallel'
})

const kindOptions = computed(() => [
  { label: t('designer.panel.option.multiInstance.none'), value: '' },
  { label: t('designer.panel.option.multiInstance.sequential'), value: 'sequential' },
  { label: t('designer.panel.option.multiInstance.parallel'), value: 'parallel' },
])

/**
 * 切换逻辑照抄 bpmn-js 替换菜单（ReplaceMenuProvider._getLoopCharacteristicsHeaderEntries），
 * 这样面板与画布上的扭手菜单改的是同一份状态，两边互相同步。
 */
function setKind(next: string | undefined): void {
  if (next === undefined || next === '') {
    bag.set('loopCharacteristics', undefined)
    return
  }

  const isSequential = next === 'sequential'
  const existing = loopCharacteristics.value

  if (existing && existing.$type === MI_TYPE) {
    bag.setModdle(existing, 'isSequential', isSequential)
    return
  }

  const created = bag.create(MI_TYPE, { isSequential })
  if (created) bag.set('loopCharacteristics', created)
}

const collection = computed({
  get: () => {
    void bag.revision.value
    return loopCharacteristics.value?.collection as string | undefined
  },
  set: (value) => writeLoop('collection', value),
})

const elementVariable = computed({
  get: () => {
    void bag.revision.value
    return loopCharacteristics.value?.elementVariable as string | undefined
  },
  set: (value) => writeLoop('elementVariable', value),
})

const elementIndexVariable = computed({
  get: () => {
    void bag.revision.value
    return loopCharacteristics.value?.elementIndexVariable as string | undefined
  },
  set: (value) => writeLoop('elementIndexVariable', value),
})

function writeLoop(key: string, value: unknown): void {
  const lc = loopCharacteristics.value
  if (lc) bag.setModdle(lc, key, value)
}

/** loopCardinality / completionCondition 都是 bpmn:Expression，值放在 body 里 */
function expressionBody(key: string): string | undefined {
  void bag.revision.value
  return (loopCharacteristics.value?.[key] as ModdleElement | undefined)?.body as string | undefined
}

function setExpression(key: string, value: string | undefined): void {
  const lc = loopCharacteristics.value
  if (!lc || !modeler.value) return

  if (!value) {
    bag.setModdle(lc, key, undefined)
    return
  }

  const existing = lc[key] as ModdleElement | undefined
  if (existing) {
    bag.setModdle(existing, 'body', value)
    return
  }

  const created = bag.create('bpmn:Expression', { body: value })
  if (created) {
    created.$parent = lc
    bag.setModdle(lc, key, created)
  }
}
</script>

<template>
  <div class="win-bpmn-panel__group">
    <PropSelect
      :label="t('designer.panel.multiInstanceType')"
      :options="kindOptions"
      :model-value="kind"
      @update:model-value="setKind($event)"
    />

    <template v-if="kind">
      <PropResolver
        :label="t('designer.panel.collectionExpression')"
        name="expressionEditor"
        :element="props.element"
        :placeholder="t('designer.panel.placeholder.expression')"
        :model-value="collection"
        @update:model-value="collection = $event"
      />
      <PropText
        :label="t('designer.panel.elementVariable')"
        :model-value="elementVariable"
        @update:model-value="elementVariable = $event"
      />
      <PropText
        :label="t('designer.panel.elementIndexVariable')"
        :model-value="elementIndexVariable"
        @update:model-value="elementIndexVariable = $event"
      />
      <PropText
        :label="t('designer.panel.loopCardinality')"
        :model-value="expressionBody('loopCardinality')"
        @update:model-value="setExpression('loopCardinality', $event)"
      />
      <PropResolver
        :label="t('designer.panel.completionCondition')"
        name="expressionEditor"
        :element="props.element"
        :placeholder="t('designer.panel.placeholder.expression')"
        :model-value="expressionBody('completionCondition')"
        @update:model-value="setExpression('completionCondition', $event)"
      />
    </template>
  </div>
</template>
