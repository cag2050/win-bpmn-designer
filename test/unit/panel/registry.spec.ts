import { afterEach, describe, expect, it } from 'vitest'

import {
  getPropertyGroups,
  registerPropertyGroup,
  unregisterPropertyGroup,
} from '@/components/PropertiesPanel/registry'
import type { BpmnElement, PropertyGroup } from '@/types'

// 刻意只用合成的假组件：import builtin.ts 会把 Element Plus 拖进 node 环境
const stub = { name: 'stub' }

function group(id: string, order: number, match: PropertyGroup['match'] = () => true): PropertyGroup {
  return { id, order, match, component: stub }
}

const element = { id: 'T1', type: 'bpmn:UserTask', businessObject: { $type: 'bpmn:UserTask' } } as BpmnElement

const REGISTERED = ['a', 'b', 'c', 'dup', 'hidden']

afterEach(() => REGISTERED.forEach(unregisterPropertyGroup))

describe('属性组注册表', () => {
  it('按 order 升序返回', () => {
    registerPropertyGroup(group('c', 30))
    registerPropertyGroup(group('a', 10))
    registerPropertyGroup(group('b', 20))

    expect(getPropertyGroups(element).map((g) => g.id)).toEqual(['a', 'b', 'c'])
  })

  it('order 相同时按 id 保证顺序稳定', () => {
    registerPropertyGroup(group('b', 10))
    registerPropertyGroup(group('a', 10))

    expect(getPropertyGroups(element).map((g) => g.id)).toEqual(['a', 'b'])
  })

  // 业务方用同一个 id 覆盖内置组是核心扩展点，不能产生重复项
  it('同 id 覆盖而非追加', () => {
    const replacement = { name: 'replacement' }
    registerPropertyGroup(group('dup', 10))
    registerPropertyGroup({ ...group('dup', 10), component: replacement })

    const matched = getPropertyGroups(element).filter((g) => g.id === 'dup')
    expect(matched).toHaveLength(1)
    expect(matched[0].component).toBe(replacement)
  })

  it('match 为 false 的组被过滤掉', () => {
    registerPropertyGroup(group('a', 10))
    registerPropertyGroup(group('hidden', 20, () => false))

    expect(getPropertyGroups(element).map((g) => g.id)).toEqual(['a'])
  })

  it('unregister 后不再出现', () => {
    registerPropertyGroup(group('a', 10))
    unregisterPropertyGroup('a')

    expect(getPropertyGroups(element).map((g) => g.id)).not.toContain('a')
  })
})
