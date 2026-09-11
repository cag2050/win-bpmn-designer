import type { LocaleMessages, LocaleName } from '@/types'

import enUS from './en-US'
import zhCN from './zh-CN'

export const locales: Record<LocaleName, LocaleMessages> = {
  'zh-CN': zhCN,
  'en-US': enUS,
}

export const DEFAULT_LOCALE: LocaleName = 'zh-CN'

/** 取词条；缺失时回落到 key 本身，符合 diagram-js translate 的约定。 */
export function translate(locale: LocaleName, key: string): string {
  return locales[locale]?.[key] ?? key
}

export { enUS, zhCN }
