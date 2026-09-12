import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { debounce } from '@/helpers/debounce'

describe('debounce', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('只在静默期结束后触发一次', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 300)

    debounced()
    debounced()
    debounced()
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(300)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('取最后一次的入参', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced('first')
    debounced('last')
    vi.advanceTimersByTime(100)

    expect(fn).toHaveBeenCalledWith('last')
  })

  // 组件卸载与重新导入前都要能取消，否则旧结果会迟到并覆盖新状态
  it('cancel() 能阻止待执行的调用', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 200)

    debounced()
    debounced.cancel()
    vi.advanceTimersByTime(500)

    expect(fn).not.toHaveBeenCalled()
  })

  it('已触发后再 cancel() 不报错也不重复触发', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 50)

    debounced()
    vi.advanceTimersByTime(50)
    debounced.cancel()
    vi.advanceTimersByTime(500)

    expect(fn).toHaveBeenCalledTimes(1)
  })
})
