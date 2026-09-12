import { describe, expect, it } from 'vitest'

import { DEFAULT_LOCALE, locales, translate } from '@/locales'
import { interpolate } from '@/locales/interpolate'

describe('interpolate', () => {
  it('填充占位符', () => {
    expect(interpolate('打开 {name}', { name: '任务' })).toBe('打开 任务')
  })

  it('缺 replacement 时保留原样，便于一眼看出漏传', () => {
    expect(interpolate('打开 {name}')).toBe('打开 {name}')
    expect(interpolate('{a} 与 {b}', { a: 'X' })).toBe('X 与 {b}')
  })

  it('没有占位符时原样返回', () => {
    expect(interpolate('删除')).toBe('删除')
  })
})

describe('translate', () => {
  it('命中词条', () => {
    expect(translate('zh-CN', 'designer.toolbar.undo')).toBe('撤销')
    expect(translate('en-US', 'designer.toolbar.undo')).toBe('Undo')
  })

  it('缺 key 时回落 key 本身（diagram-js 的约定）', () => {
    expect(translate('zh-CN', 'designer.nope.missing')).toBe('designer.nope.missing')
  })

  it('支持插值', () => {
    const message = translate('zh-CN', 'designer.validate.orphanNode', { name: '审批' })
    expect(message).toContain('审批')
    expect(message).not.toContain('{name}')
  })

  it('中文表合并了 bpmn-js 内置文案', () => {
    expect(translate('zh-CN', 'Create task')).toBe('创建任务')
    // 英文原文本身就是 key，无需翻译
    expect(translate('en-US', 'Create task')).toBe('Create task')
  })

  it('默认语言是中文', () => {
    expect(DEFAULT_LOCALE).toBe('zh-CN')
    expect(Object.keys(locales)).toEqual(['zh-CN', 'en-US'])
  })
})
