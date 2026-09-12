import { createApp, h, ref } from 'vue'
import type { App } from 'vue'

import BpmnDesigner from '@/components/BpmnDesigner.vue'
import type { BpmnDesignerExpose, BpmnModeler, DesignerResolvers, LocaleName } from '@/types'

import { createHost } from './helpers'

export interface Mounted {
  modeler: BpmnModeler
  api: BpmnDesignerExpose
  setReadonly: (value: boolean) => Promise<void>
  setLocale: (value: LocaleName) => Promise<void>
  unmount: () => void
}

/**
 * 挂载一个真实的 <BpmnDesigner> 并等到画布就绪。
 *
 * 必须在真浏览器里跑：happy-dom / jsdom 都没实现 SVG 的 getBBox / createSVGPoint，
 * bpmn-js 的 Modeler 在那两个环境里起不来。
 */
export async function mountDesigner(
  options: { readonly?: boolean; locale?: LocaleName; resolvers?: DesignerResolvers } = {},
): Promise<Mounted> {
  const host = createHost()
  const readonly = ref(options.readonly ?? false)
  const locale = ref<LocaleName>(options.locale ?? 'zh-CN')

  let app: App | undefined
  let api: BpmnDesignerExpose | undefined

  const modeler = await new Promise<BpmnModeler>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('画布 30s 内没有就绪')), 30_000)

    app = createApp({
      setup() {
        const designer = ref<BpmnDesignerExpose>()

        return () =>
          h(BpmnDesigner, {
            ref: designer,
            readonly: readonly.value,
            locale: locale.value,
            resolvers: options.resolvers,
            onReady: (instance: BpmnModeler) => {
              clearTimeout(timer)
              api = designer.value
              resolve(instance)
            },
          })
      },
    })

    app.mount(host)
  })

  // 让 prop 变更走完一轮渲染 + bpmn-js 的同步重绘
  const settle = async (): Promise<void> => {
    await new Promise((r) => setTimeout(r, 120))
  }

  return {
    modeler,
    api: api!,
    setReadonly: async (value) => {
      readonly.value = value
      await settle()
    },
    setLocale: async (value) => {
      locale.value = value
      await settle()
    },
    unmount: () => {
      app?.unmount()
      host.remove()
    },
  }
}
