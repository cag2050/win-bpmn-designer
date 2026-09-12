import type { App, Plugin } from 'vue'

import BpmnCanvas from '@/components/BpmnCanvas.vue'
import BpmnDesigner from '@/components/BpmnDesigner.vue'
import BpmnToolbar from '@/components/Toolbar/index.vue'
import { DEFAULT_LOCALE } from '@/locales'
import { GLOBAL_OPTIONS_KEY } from '@/options'
import type { WinBpmnDesignerOptions } from '@/options'

export function install(app: App, options: WinBpmnDesignerOptions = {}): void {
  app.provide(GLOBAL_OPTIONS_KEY, { locale: DEFAULT_LOCALE, ...options })

  app.component('BpmnDesigner', BpmnDesigner)
  app.component('BpmnCanvas', BpmnCanvas)
  app.component('BpmnToolbar', BpmnToolbar)
}

const plugin: Plugin = { install }

export default plugin
