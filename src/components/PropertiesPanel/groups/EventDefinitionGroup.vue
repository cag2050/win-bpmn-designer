<script setup lang="ts">
import { computed } from 'vue'

import { useElementProps } from '@/composables/useElementProps'
import { translate } from '@/locales'
import type { BpmnElement, LocaleName, ModdleElement } from '@/types'

import PropSelect from '../widgets/PropSelect.vue'
import PropText from '../widgets/PropText.vue'

defineOptions({ name: 'EventDefinitionGroup' })

const props = defineProps<{ element: BpmnElement; locale: LocaleName }>()

const elementRef = computed(() => props.element)
const bag = useElementProps(elementRef)

const t = (key: string): string => translate(props.locale, key)

const definition = computed<ModdleElement | undefined>(() => {
  void bag.revision.value
  return (bag.get<ModdleElement[]>('eventDefinitions') ?? [])[0]
})

const kind = computed<string>(() => definition.value?.$type ?? '')

// ── 定时器：timeDate / timeCycle / timeDuration 三选一 ────────────
const TIMER_KEYS = ['timeDate', 'timeDuration', 'timeCycle'] as const

const timerOptions = computed(() =>
  TIMER_KEYS.map((value) => ({ label: t(`designer.panel.option.timer.${value}`), value })),
)

const timerKey = computed<string>(() => {
  void bag.revision.value
  const def = definition.value
  return TIMER_KEYS.find((key) => def?.[key] !== undefined) ?? 'timeDuration'
})

const timerBody = computed<string | undefined>(() => {
  void bag.revision.value
  return (definition.value?.[timerKey.value] as ModdleElement | undefined)?.body as
    | string
    | undefined
})

/** 切换定时器类型：保留当前表达式，清掉另外两个键 */
function setTimerKind(next: string | undefined): void {
  const def = definition.value
  if (!next || !def) return

  const body = timerBody.value
  const created = body ? bag.create('bpmn:FormalExpression', { body }) : undefined
  if (created) created.$parent = def

  bag.setModdle(def, timerKey.value, undefined)
  if (created) bag.setModdle(def, next, created)
}

function setTimerBody(value: string | undefined): void {
  const def = definition.value
  if (!def) return

  if (!value) {
    bag.setModdle(def, timerKey.value, undefined)
    return
  }

  const existing = def[timerKey.value] as ModdleElement | undefined
  if (existing) {
    bag.setModdle(existing, 'body', value)
    return
  }

  const created = bag.create('bpmn:FormalExpression', { body: value })
  if (created) {
    created.$parent = def
    bag.setModdle(def, timerKey.value, created)
  }
}

// ── 错误 / 信号 / 消息 / 升级：引用根元素 ───────────────────────
/** $type → [引用属性名, 根元素类型] */
const REF_KINDS: Record<string, [string, string]> = {
  'bpmn:ErrorEventDefinition': ['errorRef', 'bpmn:Error'],
  'bpmn:EscalationEventDefinition': ['escalationRef', 'bpmn:Escalation'],
  'bpmn:MessageEventDefinition': ['messageRef', 'bpmn:Message'],
  'bpmn:SignalEventDefinition': ['signalRef', 'bpmn:Signal'],
}

const refKind = computed(() => REF_KINDS[kind.value])

const referenced = computed<ModdleElement | undefined>(() => {
  void bag.revision.value
  const [key] = refKind.value ?? []
  return key ? (definition.value?.[key] as ModdleElement | undefined) : undefined
})

const refName = computed<string | undefined>(() => {
  void bag.revision.value
  return referenced.value?.name as string | undefined
})

/** bpmn:Error 独有，Flowable 按它匹配抛出的错误 */
const errorCode = computed<string | undefined>(() => {
  void bag.revision.value
  return referenced.value?.errorCode as string | undefined
})

/**
 * 写引用即可，bpmn-js 的 RootElementReferenceBehavior 会自动把根元素
 * 挂进 definitions.rootElements，撤销时自动摘除 —— 绝不能手动维护那个数组。
 *
 * 新建时属性必须在 create 的那一刻就带上：先建空对象、再 setModdle 写属性的话，
 * 那次写入发生在引用尚未挂上之前，值会丢。
 */
function writeReference(key: string, value: string | undefined): void {
  const def = definition.value
  const [refProperty, rootType] = refKind.value ?? []
  if (!def || !refProperty || !rootType) return

  const existing = referenced.value
  if (existing) {
    bag.setModdle(existing, key, value)
    return
  }

  if (!value) return

  const created = bag.create(rootType, { [key]: value })
  if (created) bag.setModdle(def, refProperty, created)
}

function setRefName(value: string | undefined): void {
  writeReference('name', value)
}

function setErrorCode(value: string | undefined): void {
  writeReference('errorCode', value)
}

// ── 条件事件 ──────────────────────────────────────────────
const conditionBody = computed<string | undefined>(() => {
  void bag.revision.value
  return (definition.value?.condition as ModdleElement | undefined)?.body as string | undefined
})

function setCondition(value: string | undefined): void {
  const def = definition.value
  if (!def) return

  if (!value) {
    bag.setModdle(def, 'condition', undefined)
    return
  }

  const existing = def.condition as ModdleElement | undefined
  if (existing) {
    bag.setModdle(existing, 'body', value)
    return
  }

  const created = bag.create('bpmn:FormalExpression', { body: value })
  if (created) {
    created.$parent = def
    bag.setModdle(def, 'condition', created)
  }
}
</script>

<template>
  <div v-if="definition" class="win-bpmn-panel__group">
    <template v-if="kind === 'bpmn:TimerEventDefinition'">
      <PropSelect
        :label="t('designer.panel.timerType')"
        :options="timerOptions"
        :model-value="timerKey"
        @update:model-value="setTimerKind($event)"
      />
      <PropText
        :label="t('designer.panel.timerValue')"
        :hint="t('designer.panel.hint.timer')"
        :model-value="timerBody"
        @update:model-value="setTimerBody($event)"
      />
    </template>

    <template v-else-if="refKind">
      <PropText
        :label="t('designer.panel.refName')"
        :model-value="refName"
        @update:model-value="setRefName($event)"
      />
      <PropText
        v-if="kind === 'bpmn:ErrorEventDefinition'"
        :label="t('designer.panel.errorCode')"
        :model-value="errorCode"
        @update:model-value="setErrorCode($event)"
      />
    </template>

    <template v-else-if="kind === 'bpmn:ConditionalEventDefinition'">
      <PropText
        :label="t('designer.panel.conditionExpression')"
        :placeholder="t('designer.panel.placeholder.condition')"
        :model-value="conditionBody"
        @update:model-value="setCondition($event)"
      />
    </template>
  </div>
</template>
