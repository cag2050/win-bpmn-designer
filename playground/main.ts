import ElementPlus from 'element-plus'
import { createApp } from 'vue'

import 'element-plus/dist/index.css'
// 库样式：发布后消费方写 `import 'win-bpmn-designer/style.css'`，
// playground 直连源码，所以走 @ 别名
import '@/styles'

import WinBpmnDesigner from '@/index'

import App from './App.vue'
import './playground.css'

createApp(App).use(ElementPlus).use(WinBpmnDesigner, { locale: 'zh-CN' }).mount('#app')
