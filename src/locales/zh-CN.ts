import type { LocaleMessages } from '@/types'

/**
 * 词条表同时服务两处：
 * 1. diagram-js 的 translate 模块（key 为 diagram-js/bpmn-js 内置英文原文）
 * 2. 本库自己的工具栏与属性面板文案（key 以 `designer.` 开头）
 *
 * M1 起补齐 palette / context-pad 的英文原文映射。
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
  'designer.panel.title': '属性配置',
  'designer.panel.empty': '请选择一个节点',
}

export default zhCN
