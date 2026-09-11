<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'

import type {
  BpmnDesignerExpose,
  BpmnModeler,
  CreateProcessOptions,
  DesignerResolvers,
  LocaleName,
  ModelerOptions,
} from '@/types'

import BpmnCanvas from './BpmnCanvas.vue'

defineOptions({ name: 'BpmnDesigner' })

const props = withDefaults(
  defineProps<{
    /** 流程 XML，支持 v-model:xml */
    xml?: string
    options?: ModelerOptions
    /** 只读预览模式（M4 实现：禁用 palette、context-pad 与拖拽） */
    readonly?: boolean
    locale?: LocaleName
    /** 业务集成扩展点（M4） */
    resolvers?: DesignerResolvers
  }>(),
  {
    xml: undefined,
    options: undefined,
    readonly: false,
    locale: 'zh-CN',
    resolvers: undefined,
  },
)

const emit = defineEmits<{
  'update:xml': [xml: string]
  ready: [modeler: BpmnModeler]
  change: []
  error: [error: unknown]
  save: [payload: { xml: string; svg: string }]
}>()

const canvasRef = useTemplateRef<InstanceType<typeof BpmnCanvas>>('canvas')

/** 相对上次导入/保存是否有未提交的改动 */
const dirty = ref(false)

function requireCanvas(): NonNullable<typeof canvasRef.value> {
  const canvas = canvasRef.value
  if (!canvas) throw new Error('[win-bpmn-designer] 画布尚未挂载')
  return canvas
}

async function importXML(xml: string): Promise<void> {
  await requireCanvas().importXML(xml)
  dirty.value = false
}

async function createNew(options?: CreateProcessOptions): Promise<void> {
  await requireCanvas().createNew(options)
  dirty.value = false
}

function exportXML(options?: { format?: boolean }): Promise<string> {
  return requireCanvas().exportXML(options)
}

function exportSVG(): Promise<string> {
  return requireCanvas().exportSVG()
}

function getModeler(): BpmnModeler | undefined {
  return canvasRef.value?.getModeler()
}

function withService<T>(name: string): T | undefined {
  return getModeler()?.get<T>(name as never)
}

function undo(): void {
  withService<{ undo: () => void }>('commandStack')?.undo()
}

function redo(): void {
  withService<{ redo: () => void }>('commandStack')?.redo()
}

function zoom(step: number): void {
  const canvas = withService<{ zoom: (v?: number | string) => number }>('canvas')
  if (!canvas) return
  canvas.zoom(canvas.zoom() + step)
}

function fitViewport(): void {
  withService<{ zoom: (v: string) => void }>('canvas')?.zoom('fit-viewport')
}

/** 导出当前流程并派发 save 事件，供工具栏的「保存」按钮调用 */
async function save(): Promise<void> {
  const [xml, svg] = await Promise.all([exportXML(), exportSVG()])
  dirty.value = false
  emit('save', { xml, svg })
}

async function onChange(): Promise<void> {
  dirty.value = true
  emit('change')
  // v-model:xml 需要拿到最新内容；序列化不算便宜，M1 会在这里加防抖
  try {
    emit('update:xml', await exportXML())
  } catch (error) {
    emit('error', error)
  }
}

defineExpose<BpmnDesignerExpose & { save: () => Promise<void>; dirty: typeof dirty }>({
  importXML,
  createNew,
  exportXML,
  exportSVG,
  undo,
  redo,
  zoom,
  fitViewport,
  getModeler,
  save,
  dirty,
})
</script>

<template>
  <div class="win-bpmn-designer" :data-readonly="props.readonly" :data-locale="props.locale">
    <!-- M1: Toolbar -->
    <slot name="toolbar" :dirty="dirty" :save="save" />

    <div class="win-bpmn-designer__body">
      <BpmnCanvas
        ref="canvas"
        :xml="props.xml"
        :options="props.options"
        @ready="(modeler: BpmnModeler) => emit('ready', modeler)"
        @change="onChange"
        @error="(error: unknown) => emit('error', error)"
      />

      <!-- M2: PropertiesPanel -->
      <slot name="panel" />
    </div>
  </div>
</template>
