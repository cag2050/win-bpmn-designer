import { computed, inject, provide } from 'vue'
import type { ComputedRef, InjectionKey } from 'vue'

import type { DesignerResolver, DesignerResolverName, DesignerResolvers } from '@/types'

export const RESOLVERS_KEY: InjectionKey<ComputedRef<DesignerResolvers>> =
  Symbol('win-bpmn-designer:resolvers')

export function provideResolvers(source: ComputedRef<DesignerResolvers>): void {
  provide(RESOLVERS_KEY, source)
}

const NO_RESOLVERS = computed<DesignerResolvers>(() => ({}))

/**
 * 业务扩展点。用 provide/inject 而不是逐层透传 ——
 * 否则 13 个属性组都要加一个自己根本不关心的 prop。
 */
export function useResolvers(): ComputedRef<DesignerResolvers> {
  return inject(RESOLVERS_KEY, NO_RESOLVERS)
}

export function useResolver(
  name: DesignerResolverName,
): ComputedRef<DesignerResolver | undefined> {
  const resolvers = useResolvers()
  return computed(() => resolvers.value[name])
}
