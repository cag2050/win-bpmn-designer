/**
 * standalone 页与 iframe 宿主的 postMessage 协议。
 *
 * 宿主 → iframe
 *   designer:load          { xml }            载入流程
 *   designer:request-save  {}                 要求回传当前内容
 *   designer:set-readonly  { readonly }       切换只读
 *
 * iframe → 宿主
 *   designer:ready         { version }        画布就绪，可以开始 load
 *   designer:change        { dirty }          内容有改动
 *   designer:saved         { xml, svg }       request-save 的回应
 *   designer:error         { message }        任意环节出错
 */

export interface HostToFrameMessageMap {
  'designer:load': { xml: string }
  'designer:request-save': Record<string, never>
  'designer:set-readonly': { readonly: boolean }
}

export interface FrameToHostMessageMap {
  'designer:ready': { version: string }
  'designer:change': { dirty: boolean }
  'designer:saved': { xml: string; svg: string }
  'designer:error': { message: string }
}

export type HostToFrameMessage = {
  [K in keyof HostToFrameMessageMap]: { type: K; payload: HostToFrameMessageMap[K] }
}[keyof HostToFrameMessageMap]

export type FrameToHostMessage = {
  [K in keyof FrameToHostMessageMap]: { type: K; payload: FrameToHostMessageMap[K] }
}[keyof FrameToHostMessageMap]

/**
 * 允许通信的宿主 origin。
 * 通过 `?origin=https://host.example.com` 传入，未指定时退化为 '*'（仅建议内网/开发环境）。
 */
export function resolveAllowedOrigin(): string {
  const fromQuery = new URLSearchParams(window.location.search).get('origin')
  return fromQuery ?? '*'
}

export function postToHost<K extends keyof FrameToHostMessageMap>(
  type: K,
  payload: FrameToHostMessageMap[K],
  targetOrigin: string,
): void {
  // 泛型 K 下 TS 无法把 { type, payload } 收敛到联合的某一支，这里的组合由签名保证
  const message = { type, payload } as FrameToHostMessage
  window.parent?.postMessage(message, targetOrigin)
}

/** 监听宿主消息，返回取消监听的函数。 */
export function listenHost(
  allowedOrigin: string,
  handler: (message: HostToFrameMessage) => void,
): () => void {
  function onMessage(event: MessageEvent): void {
    // origin 白名单校验：不校验的话任何页面都能往这个 iframe 里塞流程数据
    if (allowedOrigin !== '*' && event.origin !== allowedOrigin) return

    const data = event.data as HostToFrameMessage | undefined
    if (!data || typeof data.type !== 'string' || !data.type.startsWith('designer:')) return

    handler(data)
  }

  window.addEventListener('message', onMessage)
  return () => window.removeEventListener('message', onMessage)
}
