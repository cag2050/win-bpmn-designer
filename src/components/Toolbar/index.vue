<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { useCommandStack } from '@/composables/useCommandStack'
import { useModeler } from '@/composables/useModeler'
import { useSelection } from '@/composables/useSelection'
import { DEFAULT_LOCALE, translate } from '@/locales'
import type { LocaleName } from '@/types'

import {
  alignElements,
  distributeElements,
  fitViewport,
  MIN_ALIGN_COUNT,
  MIN_DISTRIBUTE_COUNT,
  zoomIn,
  zoomOut,
} from './actions'
import type { Alignment, Distribution } from './actions'
import { icons } from './icons'

defineOptions({ name: 'BpmnToolbar' })

const props = withDefaults(defineProps<{ locale?: LocaleName }>(), { locale: DEFAULT_LOCALE })

const emit = defineEmits<{
  new: []
  import: [xml: string]
  exportXml: []
  exportSvg: []
}>()

const modeler = useModeler()
const { canUndo, canRedo, undo, redo } = useCommandStack()
const { count } = useSelection()

const t = (key: string): string => translate(props.locale, key)

const canAlign = computed(() => count.value >= MIN_ALIGN_COUNT)
const canDistribute = computed(() => count.value >= MIN_DISTRIBUTE_COUNT)

const ALIGNMENTS: { value: Alignment; icon: keyof typeof icons; label: string }[] = [
  { value: 'left', icon: 'alignLeft', label: 'designer.toolbar.alignLeft' },
  { value: 'center', icon: 'alignCenter', label: 'designer.toolbar.alignCenter' },
  { value: 'right', icon: 'alignRight', label: 'designer.toolbar.alignRight' },
  { value: 'top', icon: 'alignTop', label: 'designer.toolbar.alignTop' },
  { value: 'middle', icon: 'alignMiddle', label: 'designer.toolbar.alignMiddle' },
  { value: 'bottom', icon: 'alignBottom', label: 'designer.toolbar.alignBottom' },
]

const DISTRIBUTIONS: { value: Distribution; icon: keyof typeof icons; label: string }[] = [
  {
    value: 'horizontal',
    icon: 'distributeHorizontally',
    label: 'designer.toolbar.distributeHorizontally',
  },
  {
    value: 'vertical',
    icon: 'distributeVertically',
    label: 'designer.toolbar.distributeVertically',
  },
]

// 缩放比例跟随画布视口变化，不轮询
const zoomPercent = ref(100)

watch(
  modeler,
  (instance, _previous, onCleanup) => {
    if (!instance) return

    const eventBus = instance.get<{
      on: (e: string, cb: (event: { viewbox: { scale: number } }) => void) => void
      off: (e: string, cb: (event: { viewbox: { scale: number } }) => void) => void
    }>('eventBus')

    function onViewboxChanged(event: { viewbox: { scale: number } }): void {
      zoomPercent.value = Math.round(event.viewbox.scale * 100)
    }

    eventBus.on('canvas.viewbox.changed', onViewboxChanged)
    onCleanup(() => eventBus.off('canvas.viewbox.changed', onViewboxChanged))
  },
  { immediate: true },
)

const fileInput = ref<HTMLInputElement>()

function pickFile(): void {
  fileInput.value?.click()
}

function onFileChange(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => emit('import', String(reader.result))
  reader.readAsText(file)

  // 置空才能连续两次选同一个文件（否则 change 不触发）
  input.value = ''
}

function withModeler(run: (instance: NonNullable<typeof modeler.value>) => void): void {
  const instance = modeler.value
  if (instance) run(instance)
}
</script>

<template>
  <div class="win-bpmn-toolbar">
    <div class="win-bpmn-toolbar__group">
      <button
        type="button"
        class="win-bpmn-toolbar__btn"
        :title="t('designer.toolbar.new')"
        @click="emit('new')"
        v-html="icons.new"
      />
    </div>

    <div class="win-bpmn-toolbar__group">
      <button
        type="button"
        class="win-bpmn-toolbar__btn"
        :title="t('designer.toolbar.import')"
        @click="pickFile"
        v-html="icons.import"
      />
      <button
        type="button"
        class="win-bpmn-toolbar__btn"
        :title="t('designer.toolbar.exportXml')"
        @click="emit('exportXml')"
        v-html="icons.exportXml"
      />
      <button
        type="button"
        class="win-bpmn-toolbar__btn"
        :title="t('designer.toolbar.exportSvg')"
        @click="emit('exportSvg')"
        v-html="icons.exportSvg"
      />
    </div>

    <div class="win-bpmn-toolbar__group">
      <button
        type="button"
        class="win-bpmn-toolbar__btn"
        :title="t('designer.toolbar.undo')"
        :disabled="!canUndo"
        @click="undo"
        v-html="icons.undo"
      />
      <button
        type="button"
        class="win-bpmn-toolbar__btn"
        :title="t('designer.toolbar.redo')"
        :disabled="!canRedo"
        @click="redo"
        v-html="icons.redo"
      />
    </div>

    <div class="win-bpmn-toolbar__group">
      <button
        type="button"
        class="win-bpmn-toolbar__btn"
        :title="t('designer.toolbar.zoomOut')"
        @click="withModeler(zoomOut)"
        v-html="icons.zoomOut"
      />
      <span class="win-bpmn-toolbar__zoom">{{ zoomPercent }}%</span>
      <button
        type="button"
        class="win-bpmn-toolbar__btn"
        :title="t('designer.toolbar.zoomIn')"
        @click="withModeler(zoomIn)"
        v-html="icons.zoomIn"
      />
      <button
        type="button"
        class="win-bpmn-toolbar__btn"
        :title="t('designer.toolbar.fit')"
        @click="withModeler(fitViewport)"
        v-html="icons.fit"
      />
    </div>

    <div class="win-bpmn-toolbar__group">
      <button
        v-for="item in ALIGNMENTS"
        :key="item.value"
        type="button"
        class="win-bpmn-toolbar__btn"
        :title="t(item.label)"
        :disabled="!canAlign"
        @click="withModeler((m) => alignElements(m, item.value))"
        v-html="icons[item.icon]"
      />
      <button
        v-for="item in DISTRIBUTIONS"
        :key="item.value"
        type="button"
        class="win-bpmn-toolbar__btn"
        :title="t(item.label)"
        :disabled="!canDistribute"
        @click="withModeler((m) => distributeElements(m, item.value))"
        v-html="icons[item.icon]"
      />
    </div>

    <input
      ref="fileInput"
      type="file"
      accept=".bpmn,.xml"
      class="win-bpmn-toolbar__file"
      @change="onFileChange"
    />
  </div>
</template>
