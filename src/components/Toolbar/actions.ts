import type { BpmnElement, BpmnModeler } from '@/types'

export type Alignment = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
export type Distribution = 'horizontal' | 'vertical'

/** 对齐至少要 2 个图元，均匀分布至少要 3 个，否则 diagram-js 的规则会直接拒绝。 */
export const MIN_ALIGN_COUNT = 2
export const MIN_DISTRIBUTE_COUNT = 3

const ZOOM_STEP = 0.1
const MIN_ZOOM = 0.2
const MAX_ZOOM = 4

interface Canvas {
  zoom: (value?: number | string) => number
}

interface Selection {
  get: () => BpmnElement[]
}

export function zoomBy(modeler: BpmnModeler, step: number): void {
  const canvas = modeler.get<Canvas>('canvas')
  const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, canvas.zoom() + step))
  canvas.zoom(next)
}

export function zoomIn(modeler: BpmnModeler): void {
  zoomBy(modeler, ZOOM_STEP)
}

export function zoomOut(modeler: BpmnModeler): void {
  zoomBy(modeler, -ZOOM_STEP)
}

export function fitViewport(modeler: BpmnModeler): void {
  modeler.get<Canvas>('canvas').zoom('fit-viewport')
}

export function alignElements(modeler: BpmnModeler, alignment: Alignment): void {
  const elements = modeler.get<Selection>('selection').get()
  if (elements.length < MIN_ALIGN_COUNT) return

  modeler
    .get<{ trigger: (e: BpmnElement[], a: Alignment) => void }>('alignElements')
    .trigger(elements, alignment)
}

export function distributeElements(modeler: BpmnModeler, distribution: Distribution): void {
  const elements = modeler.get<Selection>('selection').get()
  if (elements.length < MIN_DISTRIBUTE_COUNT) return

  modeler
    .get<{ trigger: (e: BpmnElement[], d: Distribution) => void }>('distributeElements')
    .trigger(elements, distribution)
}

/** 触发浏览器下载。导出 XML / SVG 共用。 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
