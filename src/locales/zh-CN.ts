import type { LocaleMessages } from '@/types'

/**
 * 本库自有文案（工具栏、属性面板）。
 * bpmn-js / diagram-js 内置文案的汉化在 ./zh-CN.bpmn.ts，两张表在 index.ts 合并。
 */
const zhCN: LocaleMessages = {
  'designer.toolbar.new': '新建',
  'designer.toolbar.import': '导入',
  'designer.toolbar.exportXml': '导出 XML',
  'designer.toolbar.exportSvg': '导出 SVG',
  'designer.toolbar.undo': '撤销',
  'designer.toolbar.redo': '重做',
  'designer.toolbar.zoomIn': '放大',
  'designer.toolbar.zoomOut': '缩小',
  'designer.toolbar.fit': '适应画布',
  'designer.toolbar.alignLeft': '左对齐',
  'designer.toolbar.alignCenter': '水平居中',
  'designer.toolbar.alignRight': '右对齐',
  'designer.toolbar.alignTop': '顶部对齐',
  'designer.toolbar.alignMiddle': '垂直居中',
  'designer.toolbar.alignBottom': '底部对齐',
  'designer.toolbar.distributeHorizontally': '水平均匀分布',
  'designer.toolbar.distributeVertically': '垂直均匀分布',
  'designer.panel.title': '属性配置',
  'designer.panel.empty': '请选择一个节点',
}

export default zhCN
