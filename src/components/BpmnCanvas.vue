<script setup lang="ts">
import { markRaw, onBeforeUnmount, onMounted, shallowRef, useTemplateRef, watch } from 'vue'

import { provideModeler } from '@/composables/useModeler'
import { createModeler } from '@/core/createModeler'
import { createEmptyDiagram } from '@/helpers/xml-templates'
import { DEFAULT_LOCALE, locales } from '@/locales'
import type {
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
  }>(),
  { xml: undefined, options: undefined, locale: DEFAULT_LOCALE },
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

// 普通可变对象，绝不能是 ref —— 它会被 didi 持有并传进 bpmn-js 内部
const localeStore: LocaleStore = { messages: locales[props.locale] }

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
    localeStore,
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

defineExpose({ importXML, createNew, exportXML, exportSVG, getModeler: () => modeler.value })
</script>

<template>
  <div ref="container" class="win-bpmn-designer__canvas" />
</template>
