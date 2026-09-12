import { describe, expect, it } from 'vitest'

import { joinCsv, parseCsv } from '@/helpers/csv'

describe('parseCsv', () => {
  it('拆分并去掉空白与空项', () => {
    expect(parseCsv('a, b ,,c')).toEqual(['a', 'b', 'c'])
  })

  it('undefined 与空串都得到空数组', () => {
    expect(parseCsv(undefined)).toEqual([])
    expect(parseCsv('')).toEqual([])
  })
})

describe('joinCsv', () => {
  it('拼成逗号串', () => {
    expect(joinCsv(['a', 'b'])).toBe('a,b')
  })

  // 关键：必须是 undefined 而不是 ''，否则 moddle 会写出 flowable:x="" 这种脏属性
  it('空集合与全空白都返回 undefined 而非空串', () => {
    expect(joinCsv([])).toBeUndefined()
    expect(joinCsv([' ', ''])).toBeUndefined()
  })

  it('与 parseCsv 往返一致', () => {
    expect(joinCsv(parseCsv('hr, finance'))).toBe('hr,finance')
  })
})
