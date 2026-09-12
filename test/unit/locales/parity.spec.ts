import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import enUS from '@/locales/en-US'
import zhCN from '@/locales/zh-CN'

const SRC = new URL('../../../src', import.meta.url).pathname

/**
 * 动态拼接出来的 key 前缀：源码里只出现模板串，抓不到完整字面量。
 * 这几处都在对应的 spec 或浏览器用例里另有覆盖。
 */
const DYNAMIC_PREFIXES = ['designer.validate.', 'designer.panel.group.', 'designer.panel.option.']

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) return walk(full)
    return /\.(ts|vue)$/.test(entry) ? [full] : []
  })
}

function usedKeys(): Map<string, string> {
  const found = new Map<string, string>()

  for (const file of walk(SRC)) {
    if (file.includes('/locales/')) continue

    const source = readFileSync(file, 'utf8')
    for (const match of source.matchAll(/['"`](designer\.[\w.]+)['"`]/g)) {
      found.set(match[1], file.replace(SRC, 'src'))
    }
  }

  return found
}

describe('词条表', () => {
  it('中英文 key 集合完全一致', () => {
    const zh = Object.keys(zhCN).sort()
    const en = Object.keys(enUS).sort()

    expect(zh.filter((key) => !(key in enUS))).toEqual([])
    expect(en.filter((key) => !(key in zhCN))).toEqual([])
  })

  /**
   * 真正会出错的方向：新加了一个 t('designer.xxx') 却忘了补词条 —— 界面上会直接
   * 露出原始 key。刻意不反向检查「未使用的 key」，那个太脆（动态拼接一律误报）。
   */
  it('源码里用到的每个 designer.* key 都在两张表里存在', () => {
    const missing: string[] = []

    for (const [key, file] of usedKeys()) {
      if (DYNAMIC_PREFIXES.some((prefix) => key === prefix || key.endsWith('.'))) continue
      if (!(key in zhCN)) missing.push(`${key} (zh-CN) ← ${file}`)
      if (!(key in enUS)) missing.push(`${key} (en-US) ← ${file}`)
    }

    expect(missing).toEqual([])
  })

  it('没有空词条', () => {
    expect(Object.entries(zhCN).filter(([, value]) => !value.trim())).toEqual([])
    expect(Object.entries(enUS).filter(([, value]) => !value.trim())).toEqual([])
  })
})
