import { ref, watch } from 'vue'
import type { Ref } from 'vue'

import { useModeler } from '@/composables/useModeler'

interface CommandStack {
  canUndo: () => boolean
  canRedo: () => boolean
  undo: () => void
  redo: () => void
}

interface EventBus {
  on: (events: string[], callback: () => void) => void
  off: (events: string[], callback: () => void) => void
}

/** 撤销 / 重做的可用态与触发。供工具栏按钮读取禁用状态。 */
export function useCommandStack(): {
  canUndo: Ref<boolean>
  canRedo: Ref<boolean>
  undo: () => void
  redo: () => void
} {
  const modeler = useModeler()

  const canUndo = ref(false)
  const canRedo = ref(false)

  // importXML 内部会 clear() 画布，连带清空撤销栈，所以 import.done 也要重新取值，
  // 否则导入一份新流程后按钮还停留在上一份图的可用态。
  const EVENTS = ['commandStack.changed', 'import.done']

  watch(
    modeler,
    (instance, _previous, onCleanup) => {
      canUndo.value = false
      canRedo.value = false
      if (!instance) return

      const commandStack = instance.get<CommandStack>('commandStack')
      const eventBus = instance.get<EventBus>('eventBus')

      function sync(): void {
        canUndo.value = commandStack.canUndo()
        canRedo.value = commandStack.canRedo()
      }

      eventBus.on(EVENTS, sync)
      sync()

      onCleanup(() => eventBus.off(EVENTS, sync))
    },
    { immediate: true },
  )

  function undo(): void {
    modeler.value?.get<CommandStack>('commandStack').undo()
  }

  function redo(): void {
    modeler.value?.get<CommandStack>('commandStack').redo()
  }

  return { canUndo, canRedo, undo, redo }
}
