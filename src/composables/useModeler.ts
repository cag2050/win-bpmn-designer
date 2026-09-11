import { inject, provide } from 'vue'
import type { InjectionKey, ShallowRef } from 'vue'

import type { BpmnModeler } from '@/types'

/**
 * modeler 实例在组件树里共享。
 *
 * 注意：容器侧必须用 `shallowRef` + `markRaw` 存放实例。bpmn-js 内部大量依赖对象引用
 * 相等（===）判断，一旦被 Vue 的深度响应式 Proxy 包裹，比较会失败并导致渲染错乱。
 */
export const MODELER_KEY: InjectionKey<ShallowRef<BpmnModeler | undefined>> =
  Symbol('win-bpmn-designer:modeler')

export function provideModeler(modeler: ShallowRef<BpmnModeler | undefined>): void {
  provide(MODELER_KEY, modeler)
}

/**
 * 在 `<BpmnDesigner>` 子树内取 modeler。
 * 返回的是 ref，因为画布挂载是异步的，取用时实例可能还没建好。
 */
export function useModeler(): ShallowRef<BpmnModeler | undefined> {
  const modeler = inject(MODELER_KEY, undefined)

  if (!modeler) {
    throw new Error('[win-bpmn-designer] useModeler() 必须在 <BpmnDesigner> 组件树内调用')
  }

  return modeler
}
