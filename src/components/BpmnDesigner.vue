<script setup lang="ts">
import { computed, inject, onBeforeUnmount, ref, shallowRef, useSlots, useTemplateRef } from 'vue'

import { provideModeler } from '@/composables/useModeler'
import { provideReadonly } from '@/composables/useReadonly'
import { provideResolvers } from '@/composables/useResolvers'
import { validateDiagram } from '@/core/validate'
import { debounce } from '@/helpers/debounce'
import { GLOBAL_OPTIONS_KEY } from '@/options'
import { DEFAULT_LOCALE } from '@/locales'
import type {
  BpmnDesignerExpose,
  BpmnElement,
  BpmnModeler,
  CreateProcessOptions,
  DesignerResolvers,
  LocaleName,
  ModelerOptions,
  ValidationResult,
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
    /** 只读预览模式：可平移缩放选中，但改不动；palette 与 context-pad 隐藏 */
    readonly?: boolean
    /** 不传则回落到 install() 的全局配置 */
    locale?: LocaleName
    /** 是否渲染内置工具栏；传入 #toolbar slot 时本 prop 无效 */
    toolbar?: boolean
    /** 是否渲染内置属性面板；传入 #panel slot 时本 prop 无效 */
    panel?: boolean
    /** 业务集成扩展点：传入宿主自己的选人/表单/表达式组件 */
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
  'element-select': [payload: { element?: BpmnElement; elements: BpmnElement[] }]
}>()

const canvasRef = useTemplateRef<InstanceType<typeof BpmnCanvas>>('canvas')

// 工具栏是画布的兄弟节点，provide 只对后代生效，所以 modeler 必须由这一层提供
const modeler = shallowRef<BpmnModeler | undefined>(undefined)
provideModeler(modeler)

const globalOptions = inject(GLOBAL_OPTIONS_KEY, undefined)
const locale = computed(() => props.locale ?? globalOptions?.locale ?? DEFAULT_LOCALE)

provideReadonly(computed(() => props.readonly))

// 全局 install() 里的 resolvers 作为默认值，单个实例的 prop 可覆盖同名项
provideResolvers(computed(() => ({ ...globalOptions?.resolvers, ...props.resolvers })))

// 只转发宿主真的传了的 slot：直接无条件写 <slot> 会让空插槽吃掉内置回退内容
const slots = useSlots()
const forwardedPanelSlots = computed(() =>
  Object.keys(slots).filter((name) => name === 'panel-header' || name.startsWith('group-')),
)

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

function validate(): ValidationResult {
  const instance = modeler.value
  if (!instance) return { valid: false, issues: [] }

  return validateDiagram(instance, locale.value)
}

function onSelect(elements: BpmnElement[]): void {
  emit('element-select', { element: elements.length === 1 ? elements[0] : undefined, elements })
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
  validate,
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
        :readonly="props.readonly"
        @ready="onReady"
        @change="onChange"
        @select="onSelect"
        @error="(error: unknown) => emit('error', error)"
      />

      <!-- slot 的回退内容即默认面板：传入 #panel 时整块被替换 -->
      <div v-if="props.panel || $slots.panel" class="win-bpmn-designer__panel">
        <slot name="panel">
          <BpmnPropertiesPanel :locale="locale">
            <!-- 把宿主传进来的 panel-header / group-* 继续往下转发 -->
            <template
              v-for="name in forwardedPanelSlots"
              #[name]="slotProps"
              :key="name"
            >
              <slot :name="name" v-bind="slotProps" />
            </template>
          </BpmnPropertiesPanel>
        </slot>
      </div>
    </div>
  </div>
</template>
