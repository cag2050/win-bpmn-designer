import type { CreateProcessOptions } from '@/types'

/**
 * Flowable 引擎期望的 targetNamespace。
 * 用别的值虽然也能部署，但 Flowable Modeler / 部分 REST 接口会按这个值做归类，保持一致更省事。
 */
export const FLOWABLE_TARGET_NAMESPACE = 'http://www.flowable.org/processdef'

/** Flowable 扩展属性的命名空间。 */
export const FLOWABLE_NAMESPACE = 'http://flowable.org/bpmn'

export const FLOWABLE_PREFIX = 'flowable'

/** 生成一个带时间戳后缀的 id，避免同一页面多次新建时 id 撞车。 */
function uniqueSuffix(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

/**
 * 生成一份只含开始节点的空流程 XML。
 * 注意 bpmn-js 要求 BPMNDiagram / BPMNPlane 齐全，否则 importXML 会报 no diagram to display。
 */
export function createEmptyDiagram(options: CreateProcessOptions = {}): string {
  // 默认值刻意用英文：本函数不认识 locale，由 BpmnCanvas.createNew 传入按当前
  // 语言翻好的名字。写死中文会让 en-US 下新建的流程也是中文。
  const {
    processId = `Process_${uniqueSuffix()}`,
    processName = 'New process',
    startEventName = 'Start',
    targetNamespace = FLOWABLE_TARGET_NAMESPACE,
  } = options

  const definitionsId = `Definitions_${uniqueSuffix()}`

  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:${FLOWABLE_PREFIX}="${FLOWABLE_NAMESPACE}"
                  id="${definitionsId}"
                  targetNamespace="${targetNamespace}"
                  exporter="win-bpmn-designer">
  <bpmn:process id="${processId}" name="${processName}" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" name="${startEventName}" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="${processId}">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="160" y="120" width="36" height="36" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>
`
}
