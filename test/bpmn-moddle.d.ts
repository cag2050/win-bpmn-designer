/**
 * bpmn-moddle 的 package.json 只在 `./types` 子路径下导出类型（而且只有 BPMN
 * 模型接口，没有运行时类的声明），根入口是纯 JS。测试要直接用 BpmnModdle 做
 * XML 往返，所以在这里按实际用到的部分补一份最小声明。
 *
 * 刻意放在 test/ 而不是 src/types/：库源码不 import 这个包，
 * 发布出去的 .d.ts 不该带上这段（否则会污染消费方的类型空间）。
 */
declare module 'bpmn-moddle' {
  interface ParseResult {
    rootElement: Record<string, unknown> & { rootElements?: unknown[] }
    warnings: unknown[]
  }

  interface SerializeResult {
    xml?: string
  }

  export class BpmnModdle {
    constructor(extensions?: Record<string, unknown>)
    fromXML(xml: string, type?: string): Promise<ParseResult>
    toXML(element: unknown, options?: { format?: boolean }): Promise<SerializeResult>
    create(type: string, attrs?: Record<string, unknown>): Record<string, unknown>
  }
}
