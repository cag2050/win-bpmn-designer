<script setup lang="ts">
import { ElButton, ElDialog, ElMessage, ElSwitch } from 'element-plus'
import { ref, useTemplateRef } from 'vue'

import BpmnDesigner from '@/components/BpmnDesigner.vue'
import { version } from '@/index'
import type { DesignerResolvers, LocaleName, ValidationResult } from '@/types'

import { registerPropertyGroup } from '@/components/PropertiesPanel/registry'
import { is } from '@/helpers/element-utils'

import DemoGroup from './DemoGroup.vue'
import UserPicker from './UserPicker.vue'
import sampleXml from '../test/fixtures/approval-full.bpmn?raw'

const designerRef = useTemplateRef<InstanceType<typeof BpmnDesigner>>('designer')

const xmlVisible = ref(false)
const xmlPreview = ref('')
const locale = ref<LocaleName>('zh-CN')
const readonly = ref(false)
const selected = ref('—')

// 只接了选人一项，其余（表单、表达式、Java 类）留空以验证「未传即降级」
const resolvers: DesignerResolvers = { userPicker: UserPicker, groupPicker: UserPicker }

// 演示核心扩展点：注册一个业务方自己的属性组（order 35 插在内置组中间）
registerPropertyGroup({
  id: 'demo-extra',
  order: 35,
  match: (el) => is(el, 'bpmn:UserTask'),
  component: DemoGroup,
})

// 与单测快照同一份样例，playground 顺便充当人工回归入口
async function loadSample(): Promise<void> {
  await designerRef.value?.importXML(sampleXml)
  ElMessage.success('已载入示例流程')
}

async function showXML(): Promise<void> {
  xmlPreview.value = (await designerRef.value?.exportXML()) ?? ''
  xmlVisible.value = true
}

function runValidate(): void {
  const result: ValidationResult | undefined = designerRef.value?.validate()
  if (!result) return

  if (result.issues.length === 0) {
    ElMessage.success('校验通过，未发现问题')
    return
  }

  const text = result.issues.map((issue) => `[${issue.severity}] ${issue.message}`).join('\n')
  ElMessage({ message: text, type: result.valid ? 'warning' : 'error', duration: 6000 })
}

function onReady(): void {
  ElMessage.success('画布已就绪')
  // 方便在浏览器控制台里直接把玩原生 modeler
  ;(window as unknown as { modeler?: unknown }).modeler = designerRef.value?.getModeler()
}

function onElementSelect(payload: { element?: { id: string; type: string } }): void {
  selected.value = payload.element ? `${payload.element.type} · ${payload.element.id}` : '—'
}
</script>

<template>
  <div class="pg-layout">
    <header class="pg-header">
      <span class="pg-title">win-bpmn-designer</span>
      <span class="pg-version">v{{ version }}</span>
      <span class="pg-selected">{{ selected }}</span>
      <span class="pg-spacer" />
      <ElSwitch v-model="readonly" active-text="只读" />
      <ElSwitch
        v-model="locale"
        active-value="en-US"
        inactive-value="zh-CN"
        active-text="EN"
        inactive-text="中"
      />
      <ElButton size="small" @click="loadSample">载入示例</ElButton>
      <ElButton size="small" @click="runValidate">校验</ElButton>
      <ElButton size="small" type="primary" @click="showXML">查看 XML</ElButton>
    </header>

    <main class="pg-main">
      <BpmnDesigner
        ref="designer"
        :locale="locale"
        :readonly="readonly"
        :resolvers="resolvers"
        @ready="onReady"
        @element-select="onElementSelect"
      />
    </main>

    <ElDialog v-model="xmlVisible" title="流程 XML" width="72%">
      <pre class="pg-xml">{{ xmlPreview }}</pre>
    </ElDialog>
  </div>
</template>
