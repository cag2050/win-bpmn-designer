<script setup lang="ts">
import { computed, inject, onBeforeUnmount, ref, shallowRef, useTemplateRef } from 'vue'

import { provideModeler } from '@/composables/useModeler'
import { debounce } from '@/helpers/debounce'
import { GLOBAL_OPTIONS_KEY } from '@/options'
import { DEFAULT_LOCALE } from '@/locales'
import type {
  BpmnDesignerExpose,
  BpmnModeler,
  CreateProcessOptions,
  DesignerResolvers,
  LocaleName,
  ModelerOptions,
} from '@/types'

import BpmnCanvas from './BpmnCanvas.vue'
import BpmnPropertiesPanel from './PropertiesPanel/index.vue'
import BpmnToolbar from './Toolbar/index.vue'
import { downloadFile } from './Toolbar/actions'

defineOptions({ name: 'BpmnDesigner' })

const props = withDefaults(
  defineProps<{
    /** 流程 XML，支持 v-model:xml */
    xml?: string
    options?: ModelerOptions
    /** 只读预览模式（M4 实现：禁用 palette、context-pad 与拖拽） */
    readonly?: boolean
    /** 不传则回落到 install() 的全局配置 */
    locale?: LocaleName
    /** 是否渲染内置工具栏；传入 #toolbar slot 时本 prop 无效 */
    toolbar?: boolean
    /** 是否渲染内置属性面板；传入 #panel slot 时本 prop 无效 */
    panel?: boolean
    /** 业务集成扩展点（M4） */
    resolvers?: DesignerResolvers
  }>(),
  {
    xml: undefined,
    options: undefined,
    readonly: false,
    locale: undefined,
    toolbar: true,
    panel: true,
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

// 工具栏是画布的兄弟节点，provide 只对后代生效，所以 modeler 必须由这一层提供
const modeler = shallowRef<BpmnModeler | undefined>(undefined)
provideModeler(modeler)

const globalOptions = inject(GLOBAL_OPTIONS_KEY, undefined)
const locale = computed(() => props.locale ?? globalOptions?.locale ?? DEFAULT_LOCALE)

/** 相对上次导入/保存是否有未提交的改动 */
const dirty = ref(false)

function requireCanvas(): NonNullable<typeof canvasRef.value> {
  const canvas = canvasRef.value
  if (!canvas) throw new Error('[win-bpmn-designer] 画布尚未挂载')
  return canvas
}

async function importXML(xml: string): Promise<void> {
  // 取消在途的序列化，否则导入完成后旧 XML 会迟到并把 v-model 覆盖回去
  syncXml.cancel()
  await requireCanvas().importXML(xml)
  dirty.value = false
}

async function createNew(options?: CreateProcessOptions): Promise<void> {
  syncXml.cancel()
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
  return modeler.value
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

// 每次 commandStack 变更都全量序列化一遍并不便宜，拖动节点时会连续触发，故防抖。
// generation 用来丢弃「序列化期间又发生了新改动」的过期结果。
let generation = 0

const syncXml = debounce(() => {
  const current = ++generation
  exportXML()
    .then((xml) => {
      if (current === generation) emit('update:xml', xml)
    })
    .catch((error: unknown) => emit('error', error))
}, 300)

function onChange(): void {
  // 脏标记与 change 事件要立刻生效，只有序列化值得防抖
  dirty.value = true
  emit('change')
  syncXml()
}

onBeforeUnmount(() => syncXml.cancel())

function onReady(instance: BpmnModeler): void {
  modeler.value = instance
  emit('ready', instance)
}

async function onExportXml(): Promise<void> {
  downloadFile(await exportXML(), 'process.bpmn20.xml', 'application/xml')
}

async function onExportSvg(): Promise<void> {
  downloadFile(await exportSVG(), 'process.svg', 'image/svg+xml')
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
  <div class="win-bpmn-designer" :data-readonly="props.readonly" :data-locale="locale">
    <!-- slot 的回退内容即默认工具栏：传入 #toolbar 时整条被替换 -->
    <slot name="toolbar" :dirty="dirty" :save="save">
      <BpmnToolbar
        v-if="props.toolbar"
        :locale="locale"
        @new="createNew()"
        @import="importXML"
        @export-xml="onExportXml"
        @export-svg="onExportSvg"
      />
    </slot>

    <div class="win-bpmn-designer__body">
      <BpmnCanvas
        ref="canvas"
        :xml="props.xml"
        :options="props.options"
        :locale="locale"
        @ready="onReady"
        @change="onChange"
        @error="(error: unknown) => emit('error', error)"
      />

      <!-- slot 的回退内容即默认面板：传入 #panel 时整块被替换 -->
      <div v-if="props.panel || $slots.panel" class="win-bpmn-designer__panel">
        <slot name="panel">
          <BpmnPropertiesPanel :locale="locale" />
        </slot>
      </div>
    </div>
  </div>
</template>
