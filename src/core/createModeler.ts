import Modeler from 'bpmn-js/lib/Modeler'

import flowableModdle from '@/core/moddle/flowable.json'
import { ContextPadFilterModule } from '@/core/modules/context-pad'
import { PaletteFilterModule } from '@/core/modules/palette'
import { createReadonlyModule } from '@/core/modules/readonly'
import type { ReadonlyStore } from '@/core/modules/readonly'
import { createTranslateModule } from '@/core/modules/translate'
import type { BpmnModeler, LocaleStore, ModdleDescriptor, ModelerOptions } from '@/types'

/**
 * Flowable 命名空间的 moddle descriptor，业务方可取出与自己的扩展合并。
 * 必须显式标注类型：否则 TS 会把整份 JSON 的字面量类型（2.5KB）推进 dist/types。
 */
export const FlowableModdleDescriptor: ModdleDescriptor = flowableModdle as ModdleDescriptor

export interface CreateModelerParams extends ModelerOptions {
  /** 画布挂载容器，必须已在 DOM 中且有确定的宽高 */
  container: HTMLElement
  /** 词条容器，切换语言时改写它再触发 i18n.changed 即可 */
  localeStore: LocaleStore
  /** 只读标志容器，切换时走 setModelerReadonly */
  readonlyStore: ReadonlyStore
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
    readonlyStore,
    additionalModules = [],
    moddleExtensions = {},
    paletteItems,
    contextPadItems,
  } = params

  return new Modeler({
    container,
    additionalModules: [
      createTranslateModule(localeStore),
      createReadonlyModule(readonlyStore),
      PaletteFilterModule,
      ContextPadFilterModule,
      // 用户模块放最后，可以覆盖本库的任何一个
      ...additionalModules,
    ],
    paletteFilter: { items: paletteItems },
    contextPadFilter: { items: contextPadItems },
    // 用户的扩展展开在后面：可以追加自己的命名空间；
    // 若真传了名为 flowable 的 key，则视为完全覆盖内置 descriptor 的逃生舱
    moddleExtensions: { flowable: flowableModdle, ...moddleExtensions },
  })
}
