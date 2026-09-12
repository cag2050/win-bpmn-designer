/**
 * 工具栏图标。
 *
 * 全部为 16px 内联 SVG：bpmn-embedded 字体只收录 BPMN 节点图形（任务、网关、事件…），
 * 没有撤销/缩放/对齐这类编辑器动作图标，而为这十几个图标新增一个图标库依赖不划算。
 * 尺寸与颜色交给 CSS（stroke 用 currentColor）。
 */
function icon(path: string): string {
  return `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`
}

export const icons = {
  new: icon('<path d="M3.5 1.5h6l3 3v10h-9z"/><path d="M9.5 1.5v3h3"/><path d="M8 7v5M5.5 9.5h5"/>'),
  import: icon('<path d="M8 10V2"/><path d="M5 7l3 3 3-3"/><path d="M2.5 11.5v2h11v-2"/>'),
  exportXml: icon('<path d="M8 2v8"/><path d="M5 5l3-3 3 3"/><path d="M2.5 11.5v2h11v-2"/>'),
  exportSvg: icon('<path d="M2.5 12.5l4-5 3 3.5 2-2.5 2 4z"/><circle cx="5.5" cy="4.5" r="1.5"/>'),
  undo: icon('<path d="M2.5 7.5h7a3.5 3.5 0 1 1 0 7H6"/><path d="M5 4l-2.5 3.5L5 11"/>'),
  redo: icon('<path d="M13.5 7.5h-7a3.5 3.5 0 1 0 0 7H10"/><path d="M11 4l2.5 3.5L11 11"/>'),
  zoomIn: icon('<circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5l3 3M7 5v4M5 7h4"/>'),
  zoomOut: icon('<circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5l3 3M5 7h4"/>'),
  fit: icon('<path d="M2 5.5V2.5h3M14 5.5V2.5h-3M2 10.5v3h3M14 10.5v3h-3"/>'),

  alignLeft: icon(
    '<path d="M2 1.5v13"/><rect x="4" y="3" width="9" height="3.5"/><rect x="4" y="9" width="6" height="3.5"/>',
  ),
  alignCenter: icon(
    '<path d="M8 1.5v13"/><rect x="3" y="3" width="10" height="3.5"/><rect x="5" y="9" width="6" height="3.5"/>',
  ),
  alignRight: icon(
    '<path d="M14 1.5v13"/><rect x="3" y="3" width="9" height="3.5"/><rect x="6" y="9" width="6" height="3.5"/>',
  ),
  alignTop: icon(
    '<path d="M1.5 2h13"/><rect x="3" y="4" width="3.5" height="9"/><rect x="9" y="4" width="3.5" height="6"/>',
  ),
  alignMiddle: icon(
    '<path d="M1.5 8h13"/><rect x="3" y="3" width="3.5" height="10"/><rect x="9" y="5" width="3.5" height="6"/>',
  ),
  alignBottom: icon(
    '<path d="M1.5 14h13"/><rect x="3" y="3" width="3.5" height="9"/><rect x="9" y="6" width="3.5" height="6"/>',
  ),
  distributeHorizontally: icon(
    '<path d="M1.5 2v12M14.5 2v12"/><rect x="6.5" y="4.5" width="3" height="7"/>',
  ),
  distributeVertically: icon(
    '<path d="M2 1.5h12M2 14.5h12"/><rect x="4.5" y="6.5" width="7" height="3"/>',
  ),
}

export type ToolbarIconName = keyof typeof icons
