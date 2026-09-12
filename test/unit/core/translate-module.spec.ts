import { describe, expect, it } from 'vitest'

import { createTranslate } from '@/core/modules/translate'
import type { LocaleMessages } from '@/types'

describe('createTranslate', () => {
  // 顺序反了就坏：'Open {element}' 若先填占位符变成 'Open Task_1'，就再也查不到表
  it('先查表再插值', () => {
    const messages: LocaleMessages = { 'Open {element}': '打开 {element}' }
    const translate = createTranslate(() => messages)

    expect(translate('Open {element}', { element: '任务A' })).toBe('打开 任务A')
  })

  it('缺 key 时回落原文并仍然插值', () => {
    const translate = createTranslate(() => ({}))
    expect(translate('Open {element}', { element: 'X' })).toBe('Open X')
  })

  it('缺 replacement 时保留占位符原样', () => {
    const translate = createTranslate(() => ({}))
    expect(translate('Open {element}')).toBe('Open {element}')
  })

  // 切语言靠改写 store.messages，不重建 modeler —— getMessages 必须每次实时读
  it('词条表被替换后立即生效', () => {
    const store = { messages: { Delete: '删除' } as LocaleMessages }
    const translate = createTranslate(() => store.messages)

    expect(translate('Delete')).toBe('删除')
    store.messages = { Delete: 'Delete' }
    expect(translate('Delete')).toBe('Delete')
  })
})
