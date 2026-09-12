import type { LocaleMessages, LocaleName } from '@/types'

import enUS from './en-US'
import zhCN from './zh-CN'
import zhCNBpmn from './zh-CN.bpmn'

/**
 * bpmn-js 内置文案与本库自有文案合并成一张扁平表：
 * diagram-js 的 translate 只有 `translate(原文)` 一种查法，做不了命名空间。
 * 源文件拆开只是为了让上百条英文原文 key 不淹没 `designer.*`。
 * 英文无需翻译 —— 英文原文本身就是 key。
 */
export const locales: Record<LocaleName, LocaleMessages> = {
  'zh-CN': { ...zhCNBpmn, ...zhCN },
  'en-US': enUS,
}

export const DEFAULT_LOCALE: LocaleName = 'zh-CN'

/**
 * 取词条；缺失时回落到 key 本身，符合 diagram-js translate 的约定。
 * replacements 用于填 `{id}` 这类占位符（校验提示要用）。
 */
export function translate(
  locale: LocaleName,
  key: string,
  replacements?: Record<string, string>,
): string {
  const template = locales[locale]?.[key] ?? key

  return template.replace(/{([^}]+)}/g, (_, name: string) => replacements?.[name] ?? `{${name}}`)
}

export { enUS, zhCN, zhCNBpmn }
