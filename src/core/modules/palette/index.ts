import type { Injector } from 'didi'

import { resolveReadonlyStore } from '@/core/modules/readonly'
import type { ReadonlyStore } from '@/core/modules/readonly'
import type { PaletteEntries } from '@/types'

/**
 * 必须低于内置 PaletteProvider 的 1000：diagram-js 按优先级从高到低依次跑 provider，
 * 我们要拿到内置条目**之后**的结果才能过滤。
 */
const FILTER_PRIORITY = 500

interface Palette {
  registerProvider: (priority: number, provider: PaletteFilterProvider) => void
}

interface PaletteFilterConfig {
  items?: string[]
}

/** 过滤后可能出现开头/结尾/连续的分隔符，清掉，否则 palette 上会留下空白竖条。 */
function dropDanglingSeparators(entries: PaletteEntries): PaletteEntries {
  const ids = Object.keys(entries)
  const result: PaletteEntries = {}
  let lastWasSeparator = true // 置 true 以便丢弃开头的分隔符

  for (const id of ids) {
    const isSeparator = Boolean(entries[id]?.separator)
    if (isSeparator && lastWasSeparator) continue

    result[id] = entries[id]
    lastWasSeparator = isSeparator
  }

  const remaining = Object.keys(result)
  const last = remaining[remaining.length - 1]
  if (last && result[last]?.separator) delete result[last]

  return result
}

/**
 * 按白名单裁剪 palette。
 *
 * 不重写内置 PaletteProvider，而是利用 diagram-js 的约定：provider 的 getPaletteEntries()
 * 返回**函数**时会被当成 updater 调用，入参是已累积的条目（见 Palette.js 的 addPaletteEntries）。
 */
export default class PaletteFilterProvider {
  static $inject = ['palette', 'injector', 'config.paletteFilter']

  private readonly items?: string[]
  private readonly readonlyStore?: ReadonlyStore

  constructor(palette: Palette, injector: Injector, config?: PaletteFilterConfig) {
    this.items = config?.items
    this.readonlyStore = resolveReadonlyStore(injector)
    palette.registerProvider(FILTER_PRIORITY, this)
  }

  getPaletteEntries(): (entries: PaletteEntries) => PaletteEntries {
    return (entries) => {
      // 只读下整条清空。palette 靠 i18n.changed 重渲染，见 setModelerReadonly
      if (this.readonlyStore?.readonly) return {}

      const { items } = this
      // 默认不裁剪，保留 bpmn-js 的全部内置条目
      if (!items?.length) return entries

      const allowed = new Set(items)
      const kept: PaletteEntries = {}

      for (const id of Object.keys(entries)) {
        if (allowed.has(id) || entries[id]?.separator) kept[id] = entries[id]
      }

      return dropDanglingSeparators(kept)
    }
  }
}

export const PaletteFilterModule = {
  __init__: ['paletteFilterProvider'],
  paletteFilterProvider: ['type', PaletteFilterProvider],
}
