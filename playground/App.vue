<script setup lang="ts">
import { ElButton, ElDialog, ElMessage, ElSwitch } from 'element-plus'
import { ref, useTemplateRef } from 'vue'

import BpmnDesigner from '@/components/BpmnDesigner.vue'
import { version } from '@/index'
import type { LocaleName } from '@/types'

const designerRef = useTemplateRef<InstanceType<typeof BpmnDesigner>>('designer')

const xmlVisible = ref(false)
const xmlPreview = ref('')
const locale = ref<LocaleName>('zh-CN')

async function showXML(): Promise<void> {
  xmlPreview.value = (await designerRef.value?.exportXML()) ?? ''
  xmlVisible.value = true
}

function onReady(): void {
  ElMessage.success('画布已就绪')
  // 方便在浏览器控制台里直接把玩原生 modeler
  ;(window as unknown as { modeler?: unknown }).modeler = designerRef.value?.getModeler()
}
</script>

<template>
  <div class="pg-layout">
    <header class="pg-header">
      <span class="pg-title">win-bpmn-designer</span>
      <span class="pg-version">v{{ version }}</span>
      <span class="pg-spacer" />
      <ElSwitch
        v-model="locale"
        active-value="en-US"
        inactive-value="zh-CN"
        active-text="EN"
        inactive-text="中"
      />
      <ElButton size="small" type="primary" @click="showXML">查看 XML</ElButton>
    </header>

    <main class="pg-main">
      <BpmnDesigner ref="designer" :locale="locale" @ready="onReady" />
    </main>

    <ElDialog v-model="xmlVisible" title="流程 XML" width="72%">
      <pre class="pg-xml">{{ xmlPreview }}</pre>
    </ElDialog>
  </div>
</template>
