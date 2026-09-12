/**
 * 填充 `{name}` 占位符。
 *
 * 词条表查询（locales/index.ts）与 diagram-js translate 模块（core/modules/translate）
 * 都要用同一套插值规则，抽在这里避免两处各写一遍正则而慢慢走偏。
 * 缺对应 replacement 时保留原样的 `{name}`，与 diagram-js 的行为一致。
 */
export function interpolate(template: string, replacements?: Record<string, string>): string {
  return template.replace(/{([^}]+)}/g, (_, name: string) => replacements?.[name] ?? `{${name}}`)
}
