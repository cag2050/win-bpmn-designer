import Modeler from 'bpmn-js/lib/Modeler'

import type { BpmnModeler, ModelerOptions } from '@/types'

export interface CreateModelerParams extends ModelerOptions {
  /** 画布挂载容器，必须已在 DOM 中且有确定的宽高 */
  container: HTMLElement
}

/**
 * Modeler 工厂。
 *
 * M1 起会在这里聚合自定义 palette / context-pad / renderer / translate 模块，
 * M2 起会合并内置的 Flowable moddle 扩展（core/moddle/flowable.json）。
 * 目前先保证「能起一个原生 modeler」，把构建与挂载链路打通。
 */
export function createModeler(params: CreateModelerParams): BpmnModeler {
  const { container, additionalModules = [], moddleExtensions = {} } = params

  return new Modeler({
    container,
    // TODO(M1): 追加自定义 palette / context-pad / renderer / translate
    additionalModules: additionalModules as never[],
    // TODO(M2): 合并内置 flowable moddle 扩展
    moddleExtensions: moddleExtensions as Record<string, never>,
  })
}
