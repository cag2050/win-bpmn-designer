export interface Debounced<A extends unknown[]> {
  (...args: A): void
  cancel: () => void
}

/** trailing 防抖，附带 cancel —— 组件卸载和重新导入前必须能取消，否则旧结果会迟到覆盖新状态。 */
export function debounce<A extends unknown[]>(fn: (...args: A) => void, wait: number): Debounced<A> {
  let timer: ReturnType<typeof setTimeout> | undefined

  const debounced = (...args: A): void => {
    if (timer !== undefined) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = undefined
      fn(...args)
    }, wait)
  }

  debounced.cancel = (): void => {
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
  }

  return debounced
}
