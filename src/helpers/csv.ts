/**
 * Flowable 的 candidateUsers / candidateGroups 等字段在 XML 里是逗号分隔的单个字符串，
 * 面板上却按多值呈现。拆拼逻辑集中在这里，PropList 与 PropResolver 共用。
 */
export function parseCsv(value?: string): string[] {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

/** 拼回逗号串；空集合返回 undefined，让调用方把属性整个删掉而不是写成空串。 */
export function joinCsv(items: readonly string[]): string | undefined {
  const joined = items
    .map((item) => item.trim())
    .filter(Boolean)
    .join(',')

  return joined === '' ? undefined : joined
}
