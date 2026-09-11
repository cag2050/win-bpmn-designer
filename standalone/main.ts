import ElementPlus from 'element-plus'
import { createApp } from 'vue'

import 'element-plus/dist/index.css'
import '@/styles'

import WinBpmnDesigner from '@/index'

import App from './App.vue'

createApp(App).use(ElementPlus).use(WinBpmnDesigner, { locale: 'zh-CN' }).mount('#app')
