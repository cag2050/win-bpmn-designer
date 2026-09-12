import { computed, inject, provide } from 'vue'
import type { ComputedRef, InjectionKey } from 'vue'

export const READONLY_KEY: InjectionKey<ComputedRef<boolean>> =
  Symbol('win-bpmn-designer:readonly')

export function provideReadonly(source: ComputedRef<boolean>): void {
  provide(READONLY_KEY, source)
}

const NOT_READONLY = computed(() => false)

/**
 * 只读态。与 useModeler 刻意不同 —— 缺失时回落到 false 而不是抛错，
 * 这样单独拿 widget 出去用（不套 <BpmnDesigner>）也不会炸。
 */
export function useReadonly(): ComputedRef<boolean> {
  return inject(READONLY_KEY, NOT_READONLY)
}
