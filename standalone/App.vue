<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'

import BpmnDesigner from '@/components/BpmnDesigner.vue'
import { version } from '@/index'

import { listenHost, postToHost, resolveAllowedOrigin } from './bridge'

const designerRef = useTemplateRef<InstanceType<typeof BpmnDesigner>>('designer')

const allowedOrigin = resolveAllowedOrigin()
const readonly = ref(false)

let stopListening: (() => void) | undefined

async function handleSave(): Promise<void> {
  try {
    const [xml, svg] = await Promise.all([
      designerRef.value?.exportXML() ?? Promise.resolve(''),
      designerRef.value?.exportSVG() ?? Promise.resolve(''),
    ])
    postToHost('designer:saved', { xml, svg }, allowedOrigin)
  } catch (error) {
    postToHost('designer:error', { message: String(error) }, allowedOrigin)
  }
}

onMounted(() => {
  stopListening = listenHost(allowedOrigin, (message) => {
    switch (message.type) {
      case 'designer:load':
        void designerRef.value?.importXML(message.payload.xml)
        break
      case 'designer:request-save':
        void handleSave()
        break
      case 'designer:set-readonly':
        readonly.value = message.payload.readonly
        break
    }
  })
})

onBeforeUnmount(() => stopListening?.())

function onReady(): void {
  postToHost('designer:ready', { version }, allowedOrigin)
}

function onChange(): void {
  postToHost('designer:change', { dirty: true }, allowedOrigin)
}

function onError(error: unknown): void {
  postToHost('designer:error', { message: String(error) }, allowedOrigin)
}
</script>

<template>
  <BpmnDesigner
    ref="designer"
    :readonly="readonly"
    @ready="onReady"
    @change="onChange"
    @error="onError"
  />
</template>
