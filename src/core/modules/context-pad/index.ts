import type { Injector } from 'didi'

import { resolveReadonlyStore } from '@/core/modules/readonly'
import type { ReadonlyStore } from '@/core/modules/readonly'
import type { ContextPadEntries } from '@/types'

/**
 * 必须低于内置 ContextPadProvider（1000）**和** AlignElementsContextPadProvider（900），
 * 否则看不到对齐入口，过滤会漏掉它。
 */
const FILTER_PRIORITY = 500

interface ContextPad {
  registerProvider: (priority: number, provider: ContextPadFilterProvider) => void
}

interface ContextPadFilterConfig {
  items?: string[]
}

/** 按白名单裁剪右键快捷操作，机制与 PaletteFilterProvider 相同（返回 updater 函数）。 */
export default class ContextPadFilterProvider {
  static $inject = ['contextPad', 'injector', 'config.contextPadFilter']

  private readonly items?: string[]
  private readonly readonlyStore?: ReadonlyStore

  constructor(contextPad: ContextPad, injector: Injector, config?: ContextPadFilterConfig) {
    this.items = config?.items
    this.readonlyStore = resolveReadonlyStore(injector)
    contextPad.registerProvider(FILTER_PRIORITY, this)
  }

  private filter(): (entries: ContextPadEntries) => ContextPadEntries {
    return (entries) => {
      // 只读下整条清空（另有 contextPad.open.allowed 的否决兜底）
      if (this.readonlyStore?.readonly) return {}

      const { items } = this
      // 默认不裁剪
      if (!items?.length) return entries

      const allowed = new Set(items)
      const kept: ContextPadEntries = {}

      for (const id of Object.keys(entries)) {
        if (allowed.has(id)) kept[id] = entries[id]
      }

      return kept
    }
  }

  getContextPadEntries(): (entries: ContextPadEntries) => ContextPadEntries {
    return this.filter()
  }

  getMultiElementContextPadEntries(): (entries: ContextPadEntries) => ContextPadEntries {
    return this.filter()
  }
}

export const ContextPadFilterModule = {
  __init__: ['contextPadFilterProvider'],
  contextPadFilterProvider: ['type', ContextPadFilterProvider],
}
