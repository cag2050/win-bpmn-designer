<script setup lang="ts">
import { ElButton, ElDialog, ElMessage } from 'element-plus'
import { ref, useTemplateRef } from 'vue'

import BpmnDesigner from '@/components/BpmnDesigner.vue'
import { version } from '@/index'

const designerRef = useTemplateRef<InstanceType<typeof BpmnDesigner>>('designer')

const xmlVisible = ref(false)
const xmlPreview = ref('')

async function showXML(): Promise<void> {
  xmlPreview.value = (await designerRef.value?.exportXML()) ?? ''
  xmlVisible.value = true
}

async function download(): Promise<void> {
  const xml = (await designerRef.value?.exportXML()) ?? ''
  const url = URL.createObjectURL(new Blob([xml], { type: 'application/xml' }))
  const a = document.createElement('a')
  a.href = url
  a.download = 'process.bpmn20.xml'
  a.click()
  URL.revokeObjectURL(url)
}

function onReady(): void {
  ElMessage.success('画布已就绪')
}
</script>

<template>
  <div class="pg-layout">
    <header class="pg-header">
      <span class="pg-title">win-bpmn-designer</span>
      <span class="pg-version">v{{ version }}</span>
      <span class="pg-spacer" />
      <ElButton size="small" @click="designerRef?.createNew()">新建</ElButton>
      <ElButton size="small" @click="designerRef?.undo()">撤销</ElButton>
      <ElButton size="small" @click="designerRef?.redo()">重做</ElButton>
      <ElButton size="small" @click="designerRef?.fitViewport()">适应画布</ElButton>
      <ElButton size="small" type="primary" @click="showXML">查看 XML</ElButton>
      <ElButton size="small" @click="download">下载</ElButton>
    </header>

    <main class="pg-main">
      <BpmnDesigner ref="designer" @ready="onReady" />
    </main>

    <ElDialog v-model="xmlVisible" title="流程 XML" width="72%">
      <pre class="pg-xml">{{ xmlPreview }}</pre>
    </ElDialog>
  </div>
</template>
