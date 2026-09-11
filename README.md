# win-bpmn-designer

基于 Vue 3 + bpmn-js 的 **Flowable 流程设计器组件库**。

完整技术方案见 [`doc/方案.md`](./doc/方案.md)。

> 当前进度：**M0 已完成**（TS 化脚手架、三套构建配置、目录骨架）。
> 画布已能起来并导出合法 BPMN XML，属性面板与 Flowable 扩展在 M1 / M2 落地。

## 安装

```bash
npm i win-bpmn-designer
```

`vue` 与 `element-plus` 是 peerDependency，需要宿主项目自行安装。

## 使用

```ts
// main.ts
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import WinBpmnDesigner from 'win-bpmn-designer'
import 'win-bpmn-designer/style.css'

createApp(App).use(ElementPlus).use(WinBpmnDesigner, { locale: 'zh-CN' }).mount('#app')
```

```vue
<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { BpmnDesigner } from 'win-bpmn-designer'

const xml = ref('')
const designer = useTemplateRef<InstanceType<typeof BpmnDesigner>>('designer')

async function submit() {
  console.log(await designer.value?.exportXML())
}
</script>

<template>
  <!-- 容器必须有确定高度，bpmn-js 不会自己撑开 -->
  <div style="height: 600px">
    <BpmnDesigner ref="designer" v-model:xml="xml" @save="({ xml, svg }) => {}" />
  </div>
</template>
```

### 命令式 API

通过组件 ref 调用：

| 方法 | 说明 |
| --- | --- |
| `importXML(xml)` | 导入流程 |
| `createNew(options?)` | 新建空流程 |
| `exportXML({ format })` | 导出 XML |
| `exportSVG()` | 导出 SVG |
| `undo()` / `redo()` | 撤销 / 重做 |
| `zoom(step)` / `fitViewport()` | 缩放 / 适应画布 |
| `save()` | 导出并派发 `save` 事件 |
| `getModeler()` | 逃生舱：拿到原生 bpmn-js Modeler |

### iframe 集成（非 Vue 宿主）

`npm run build:standalone` 产出 `dist-standalone/`，用 `<iframe>` 嵌入并通过 postMessage 通信，
协议定义见 [`standalone/bridge.ts`](./standalone/bridge.ts)。

```js
iframe.contentWindow.postMessage(
  { type: 'designer:load', payload: { xml } },
  'https://designer.example.com',
)
```

嵌入时建议用 `?origin=<宿主 origin>` 指定白名单，未指定则退化为 `*`（仅适合内网/开发环境）。

## 开发

```bash
npm run dev              # playground 调试站  http://localhost:5273
npm run dev:standalone   # 独立嵌入页        http://localhost:5274
npm run typecheck        # vue-tsc 类型检查
npm run build            # lib + playground + standalone 全量构建
npm run build:lib        # 仅构建 npm 库产物到 dist/
```

### 构建产物

| 路径 | 说明 |
| --- | --- |
| `dist/win-bpmn-designer.mjs` | ES 产物，`vue` / `element-plus` / `bpmn-js` 系列均为 external |
| `dist/win-bpmn-designer.umd.cjs` | UMD 产物，内联 bpmn-js，`<script>` 场景可直接用 |
| `dist/style.css` | 画布 + 图标字体（base64 内联）+ 本库样式 |
| `dist/types/` | 类型声明 |
| `dist-playground/` | 示例站 |
| `dist-standalone/` | 可嵌入页面 |

ES / UMD 的 external 策略不同，rollup 无法按 format 区分，因此 `build:lib` 通过
`LIB_FORMAT` 环境变量跑两遍 `vite.config.lib.ts`。

## 目录约定

```
src/          库源码（唯一的真实来源）
playground/   开发调试 + 在线演示
standalone/   iframe 可嵌入页
doc/          技术方案
```
