# win-bpmn-designer

基于 Vue 3 + bpmn-js 的 **Flowable 流程设计器组件库**。

完整技术方案见 [`doc/方案.md`](./doc/方案.md)。

> 当前进度：**M4 已完成**（脚手架、三套构建、Modeler 封装、工具栏、全量汉化、
> Flowable moddle 扩展、13 个内置属性组、resolvers / 具名 slot / 只读预览 / validate）。
> 业务方已可接入自己的选人组件；i18n 完善、单测、发布 CI 在 M5 落地。

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
| `validate()` | 基础建模校验，返回 `{ valid, issues }` |
| `save()` | 导出并派发 `save` 事件 |
| `getModeler()` | 逃生舱：拿到原生 bpmn-js Modeler |

### 组件 props

| prop | 默认 | 说明 |
| --- | --- | --- |
| `v-model:xml` | — | 流程 XML，内容变更后 300ms 防抖回写 |
| `locale` | 取全局配置 | `zh-CN` / `en-US`，支持运行时切换 |
| `toolbar` | `true` | 是否渲染内置工具栏；传入 `#toolbar` slot 时整条替换 |
| `panel` | `true` | 是否渲染内置属性面板；传入 `#panel` slot 时整块替换 |
| `readonly` | `false` | 只读预览：可平移/缩放/选中查看，但改不动 |
| `resolvers` | — | 业务扩展点，见下文「接入自己的选人组件」 |
| `options.paletteItems` | 全部显示 | palette 白名单，填内置条目 id（如 `create.task`） |
| `options.contextPadItems` | 全部显示 | context-pad 白名单（如 `append.end-event`、`connect`） |

内置工具栏含：新建、导入、导出 XML / SVG、撤销 / 重做、缩放与适应画布、6 种对齐与 2 种均匀分布。

### 属性面板与自定义属性组

内置 13 组，覆盖常见审批流的建模需求。所有写操作经 `modeling`，因此完整支持撤销/重做；
字段清空时属性会从 XML 中移除，不会残留 `flowable:assignee=""`。

内置属性组（按 `order` 排列，业务方可插在中间）：

| order | 组 | 覆盖内容 |
| --- | --- | --- |
| 10 / 20 | 流程 / 常规 | 候选发起人组；标识、名称、描述、异步、排他 |
| 30 / 40 | 用户任务 / 流转条件 | 办理人、候选人组、到期时间、表单标识；条件表达式 |
| 50 / 60 | 服务任务 / 多实例 | 四种实现方式互斥切换；串行·并行会签、集合、元素变量、循环基数、完成条件 |
| 70 / 75 | 子流程 / 调用活动 | 事件子流程；被调用流程、业务键、变量继承 |
| 80 / 85 | 边界事件 / 事件配置 | 中断开关；定时器三种形态、错误·信号·消息·升级引用 |
| 90 | 表单属性 | 类型、变量、默认值、必填读写，`enum` 时可配枚举值 |
| 100 / 110 | 执行 / 任务监听器 | 事件类型、三种实现方式、可嵌套注入字段 |

监听器与表单属性这类一对多集合用内联可展开列表编辑，支持嵌套（监听器 → 注入字段、
表单属性 → 枚举值）。删掉最后一条时会连 `<bpmn:extensionElements>` 一起移除，不留空标签。

```ts
import { registerPropertyGroup, is } from 'win-bpmn-designer'

registerPropertyGroup({
  id: 'my-service-task',
  order: 35,
  match: (el) => is(el, 'bpmn:ServiceTask'),
  component: MyServiceTaskGroup,
})
```

组内可直接复用 `useElementProps` / `useProperty` 读写属性；一对多集合用
`useExtensionCollection`（extensionElements 直接子元素）与 `useModdleCollection`（嵌套 isMany 属性），
底层是 `extension-elements.ts` 里的一组 helper。

### 接入自己的选人组件（resolvers）

真实项目里 `assignee` 从来不是手填字符串。传 `resolvers` 即可用宿主自己的组件替换对应字段，
**未传的项自动降级为普通输入框**，不影响其他字段。

```vue
<BpmnDesigner :resolvers="{ userPicker: UserPicker, groupPicker: GroupPicker }" />
```

宿主组件只需是个受控组件，无需了解 Flowable 的存储细节：

```ts
props:  { modelValue, multiple?, label?, disabled?, element? }
emits:  update:modelValue
```

`multiple` 为真时收发 `string[]`，否则收发 `string | undefined` —— XML 里的逗号分隔串
由库内负责拆拼。清空时提交 `undefined`，属性会从 XML 中移除。

| resolver | 接管的字段 |
| --- | --- |
| `userPicker` | 办理人、拥有者、候选人、候选发起人 |
| `groupPicker` | 候选组、候选发起组 |
| `formPicker` | 表单标识 |
| `expressionEditor` | 流转条件、跳过表达式、集合、完成条件等表达式类字段 |
| `classPicker` | 服务任务与监听器的类 / 委托表达式 |

### 具名 slot

| slot | 说明 |
| --- | --- |
| `#toolbar` | 整条替换工具栏（`slotProps: { dirty, save }`） |
| `#panel` | 整块替换属性面板 |
| `#panel-header` | 只替换面板标题栏（`slotProps: { element }`） |
| `#group-<id>` | 替换某一个属性组，如 `#group-user-task`（`slotProps: { element, locale }`） |

### 只读预览

`:readonly` 为真时禁止一切修改（拖拽、连线、缩放手柄、右键菜单、双击改名、删除快捷键
与撤销重做），但**平移、缩放、选中查看照常可用**，适合「流程详情」这类预览场景。
可运行时来回切换，不会丢失当前图与撤销栈。

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
