import Modeler from 'bpmn-js/lib/Modeler'

import { ContextPadFilterModule } from '@/core/modules/context-pad'
import { PaletteFilterModule } from '@/core/modules/palette'
import { createTranslateModule } from '@/core/modules/translate'
import type { BpmnModeler, LocaleStore, ModelerOptions } from '@/types'

export interface CreateModelerParams extends ModelerOptions {
  /** 画布挂载容器，必须已在 DOM 中且有确定的宽高 */
  container: HTMLElement
  /** 词条容器，切换语言时改写它再触发 i18n.changed 即可 */
  localeStore: LocaleStore
}

/**
 * Modeler 工厂。
 *
 * 自定义模块走 additionalModules：didi 后注册的同名 key 覆盖先注册的，
 * 所以重新声明 `translate` 就能整体替换 diagram-js 的内置实现。
 * paletteFilter / contextPadFilter 挂在 options 顶层，由 didi 的点号嵌套解析
 * 以 `config.paletteFilter` 的形式注入给对应 provider。
 */
export function createModeler(params: CreateModelerParams): BpmnModeler {
  const {
    container,
    localeStore,
    additionalModules = [],
    moddleExtensions = {},
    paletteItems,
    contextPadItems,
  } = params

  return new Modeler({
    container,
    additionalModules: [
      createTranslateModule(localeStore),
      PaletteFilterModule,
      ContextPadFilterModule,
      // 用户模块放最后，可以覆盖本库的任何一个
      ...additionalModules,
    ],
    paletteFilter: { items: paletteItems },
    contextPadFilter: { items: contextPadItems },
    // TODO(M2): 合并内置 flowable moddle 扩展
    moddleExtensions: moddleExtensions as Record<string, never>,
  })
}
