import type { BpmnElement, PropertyGroup } from '@/types'

/**
 * 属性组注册表。
 *
 * 刻意用模块级全局：注册表是「能力目录」而非状态，与 Vue 的全局组件注册同构 ——
 * 业务方在启动时注册一次，所有设计器实例都该看见。需要按实例差异化显示时，
 * 用面板的 hiddenGroups prop 过滤，不必强迫所有使用者穿一层 provider。
 */
const groups = new Map<string, PropertyGroup>()

/** 注册属性组；同 id 覆盖，业务方可借此替换内置组的实现。 */
export function registerPropertyGroup(group: PropertyGroup): void {
  groups.set(group.id, group)
}

export function unregisterPropertyGroup(id: string): void {
  groups.delete(id)
}

/** 取命中该元素的属性组，按 order 升序；order 相同则按 id 保证顺序稳定。 */
export function getPropertyGroups(element: BpmnElement): PropertyGroup[] {
  return [...groups.values()]
    .filter((group) => group.match(element))
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
}
