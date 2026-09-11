<script setup lang="ts">
import { markRaw, onBeforeUnmount, onMounted, shallowRef, useTemplateRef, watch } from 'vue'

import { provideModeler } from '@/composables/useModeler'
import { createModeler } from '@/core/createModeler'
import { createEmptyDiagram } from '@/helpers/xml-templates'
import type { BpmnModeler, CreateProcessOptions, ModelerOptions } from '@/types'

defineOptions({ name: 'BpmnCanvas' })

const props = withDefaults(
  defineProps<{
    /** 初始 XML，不传则新建一份只含开始节点的空流程 */
    xml?: string
    options?: ModelerOptions
  }>(),
  { xml: undefined, options: undefined },
)

const emit = defineEmits<{
  ready: [modeler: BpmnModeler]
  change: []
  error: [error: unknown]
}>()

const containerRef = useTemplateRef<HTMLDivElement>('container')

// markRaw + shallowRef：modeler 内部依赖对象引用相等判断，不能被响应式 Proxy 包裹
const modeler = shallowRef<BpmnModeler | undefined>(undefined)
provideModeler(modeler)

async function importXML(xml: string): Promise<void> {
  const instance = modeler.value
  if (!instance) return

  try {
    await instance.importXML(xml)
    instance.get<{ zoom: (v: string) => void }>('canvas').zoom('fit-viewport')
  } catch (error) {
    emit('error', error)
    throw error
  }
}

async function createNew(options?: CreateProcessOptions): Promise<void> {
  await importXML(createEmptyDiagram(options))
}

async function exportXML(options: { format?: boolean } = {}): Promise<string> {
  const instance = modeler.value
  if (!instance) throw new Error('[win-bpmn-designer] modeler 尚未初始化')

  const { xml } = await instance.saveXML({ format: options.format ?? true })
  return xml ?? ''
}

async function exportSVG(): Promise<string> {
  const instance = modeler.value
  if (!instance) throw new Error('[win-bpmn-designer] modeler 尚未初始化')

  const { svg } = await instance.saveSVG()
  return svg ?? ''
}

onMounted(async () => {
  if (!containerRef.value) return

  const instance = createModeler({
    container: containerRef.value,
    ...props.options,
  })
  modeler.value = markRaw(instance)

  // 所有变更都经过 commandStack，监听它即可覆盖增删改与撤销重做
  instance.get<{ on: (e: string, cb: () => void) => void }>('eventBus').on('commandStack.changed', () => {
    emit('change')
  })

  await (props.xml ? importXML(props.xml) : createNew())
  emit('ready', instance)
})

onBeforeUnmount(() => {
  modeler.value?.destroy()
  modeler.value = undefined
})

// 外部换了一份 XML（比如切换流程定义）时重新导入
watch(
  () => props.xml,
  (next) => {
    if (next && modeler.value) void importXML(next)
  },
)

defineExpose({ importXML, createNew, exportXML, exportSVG, getModeler: () => modeler.value })
</script>

<template>
  <div ref="container" class="win-bpmn-designer__canvas" />
</template>
