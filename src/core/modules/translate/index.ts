import type { LocaleMessages, LocaleStore } from '@/types'

/**
 * 替换 diagram-js 内置的 translate。
 *
 * 查表与插值的顺序不能反：必须先用英文原文查到译文，再在译文上填 `{xxx}` 占位符。
 * 反过来的话 'Open {element}' 会先被填成 'Open Task_1'，就再也查不到表里了。
 */
export function createTranslate(getMessages: () => LocaleMessages) {
  return function translate(template: string, replacements?: Record<string, string>): string {
    const translated = getMessages()[template] ?? template

    return translated.replace(/{([^}]+)}/g, (_, key: string) => replacements?.[key] ?? `{${key}}`)
  }
}

/**
 * store 是普通可变对象而非 ref —— 它会被 didi 持有并传进 bpmn-js 内部，
 * 一旦带上 Vue 的响应式 Proxy，内部的引用相等判断就会失效（见方案 §4.2）。
 * 切换语言时改写 `store.messages` 再 `modeler.get('i18n').changed()` 即可，无需重建 modeler。
 */
export function createTranslateModule(store: LocaleStore) {
  return {
    translate: ['value', createTranslate(() => store.messages)],
  }
}
