<script setup lang="ts">
import { markRaw, onBeforeUnmount, onMounted, shallowRef, useTemplateRef, watch } from 'vue'

import { provideModeler } from '@/composables/useModeler'
import { createModeler } from '@/core/createModeler'
import { setModelerReadonly } from '@/core/modules/readonly'
import type { ReadonlyStore } from '@/core/modules/readonly'
import { createEmptyDiagram } from '@/helpers/xml-templates'
import { DEFAULT_LOCALE, locales, translate } from '@/locales'
import type {
  BpmnElement,
  BpmnModeler,
  CreateProcessOptions,
  LocaleName,
  LocaleStore,
  ModelerOptions,
} from '@/types'

defineOptions({ name: 'BpmnCanvas' })

const props = withDefaults(
  defineProps<{
    /** 初始 XML，不传则新建一份只含开始节点的空流程 */
    xml?: string
    options?: ModelerOptions
    locale?: LocaleName
    readonly?: boolean
  }>(),
  { xml: undefined, options: undefined, locale: DEFAULT_LOCALE, readonly: false },
)

const emit = defineEmits<{
  ready: [modeler: BpmnModeler]
  change: []
  error: [error: unknown]
  select: [elements: BpmnElement[]]
}>()

const containerRef = useTemplateRef<HTMLDivElement>('container')

// markRaw + shallowRef：modeler 内部依赖对象引用相等判断，不能被响应式 Proxy 包裹
const modeler = shallowRef<BpmnModeler | undefined>(undefined)
provideModeler(modeler)

// 两个 store 都是普通可变对象，绝不能是 ref —— 它们会被 didi 持有并传进 bpmn-js 内部
const localeStore: LocaleStore = { messages: locales[props.locale] }
const readonlyStore: ReadonlyStore = { readonly: props.readonly }

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
  // 名字按当前语言给默认值，createEmptyDiagram 自己不认识 locale
  await importXML(
    createEmptyDiagram({
      processName: translate(props.locale, 'designer.defaults.processName'),
      startEventName: translate(props.locale, 'designer.defaults.startEventName'),
      ...options,
    }),
  )
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
    localeStore,
    readonlyStore,
    ...props.options,
  })
  modeler.value = markRaw(instance)

  const eventBus = instance.get<{
    on: (e: string, cb: (event: { newSelection: BpmnElement[] }) => void) => void
  }>('eventBus')

  // 所有变更都经过 commandStack，监听它即可覆盖增删改与撤销重做
  eventBus.on('commandStack.changed', () => {
    emit('change')
  })

  // markRaw 后再抛给外部，避免宿主把图元塞进 reactive() 造成引用相等判断失效
  eventBus.on('selection.changed', (event) => {
    emit('select', event.newSelection.map((element) => markRaw(element)))
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

// 切语言只换词条 + 通知重渲染，不重建 modeler —— 重建会清空撤销栈并丢掉当前图。
// 直接往 eventBus 上抛 i18n.changed：bpmn-js 只注册了 translate，没有 i18n 服务，
// 而 palette 本来就监听这个事件；context-pad 与替换菜单每次打开重新求值，无需额外处理。
watch(
  () => props.locale,
  (next) => {
    localeStore.messages = locales[next]
    modeler.value?.get<{ fire: (e: string) => void }>('eventBus').fire('i18n.changed')
  },
)

// 切只读同样不重建 modeler：守卫读的是 readonlyStore 这个可变对象，翻标志即生效
watch(
  () => props.readonly,
  (next) => {
    const instance = modeler.value
    if (instance) setModelerReadonly(instance, readonlyStore, next)
  },
)

defineExpose({ importXML, createNew, exportXML, exportSVG, getModeler: () => modeler.value })
</script>

<template>
  <div ref="container" class="win-bpmn-designer__canvas" />
</template>
