# win-bpmn-designer

基于 Vue 3 + bpmn-js 的 **Flowable 流程设计器组件库**。

完整技术方案见 [`doc/方案.md`](./doc/方案.md)。

> 当前进度：**M2 已完成**（TS 化脚手架、三套构建配置、Modeler 封装、内置工具栏、
> palette / context-pad / 替换菜单汉化、Flowable moddle 扩展、属性面板框架与基础属性组）。
> 画出的图已带 Flowable 属性，可部署到引擎；监听器、多实例、表单属性等在 M3 落地。

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

### 组件 props

| prop | 默认 | 说明 |
| --- | --- | --- |
| `v-model:xml` | — | 流程 XML，内容变更后 300ms 防抖回写 |
| `locale` | 取全局配置 | `zh-CN` / `en-US`，支持运行时切换 |
| `toolbar` | `true` | 是否渲染内置工具栏；传入 `#toolbar` slot 时整条替换 |
| `panel` | `true` | 是否渲染内置属性面板；传入 `#panel` slot 时整块替换 |
| `options.paletteItems` | 全部显示 | palette 白名单，填内置条目 id（如 `create.task`） |
| `options.contextPadItems` | 全部显示 | context-pad 白名单（如 `append.end-event`、`connect`） |

内置工具栏含：新建、导入、导出 XML / SVG、撤销 / 重做、缩放与适应画布、6 种对齐与 2 种均匀分布。

### 属性面板与自定义属性组

内置四组：流程（候选发起人/组）、常规（标识/名称/描述/异步/排他）、用户任务（办理人、候选人组、
到期时间、表单标识等）、流转条件。所有写操作经 `modeling`，因此完整支持撤销/重做；
字段清空时属性会从 XML 中移除，不会残留 `flowable:assignee=""`。

业务方可注册自己的属性组，或用同一个 `id` 覆盖内置组：

```ts
import { registerPropertyGroup, is } from 'win-bpmn-designer'

registerPropertyGroup({
  id: 'my-service-task',
  order: 35,
  match: (el) => is(el, 'bpmn:ServiceTask'),
  component: MyServiceTaskGroup,
})
```

组内可直接复用 `useElementProps` / `useProperty` 读写属性，用 `extension-elements.ts`
里的一组 helper 操作 `<bpmn:extensionElements>`。

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
