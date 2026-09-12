import type { LocaleMessages } from '@/types'

/**
 * bpmn-js / diagram-js 内置文案的汉化表。
 *
 * key 必须与源码里 `translate()` 的入参**逐字一致**（含空格、括号、连字符），
 * 因为 diagram-js 的 translate 是「拿原文当 key 查表」的约定，对不上就原样透出英文。
 * 全量 key 可以这样取：
 *   grep -rhoE "translate\(\s*'[^']+'" node_modules/bpmn-js/lib node_modules/diagram-js/lib
 *   grep -oE "label: '[^']+'" node_modules/bpmn-js/lib/features/popup-menu/PopupEntries.js
 */
const zhCNBpmn: LocaleMessages = {
  // ── palette 工具组 ──────────────────────────────────
  'Activate hand tool': '启用抓手工具',
  'Activate lasso tool': '启用套索工具',
  'Activate create/remove space tool': '启用空间调整工具',
  'Activate global connect tool': '启用全局连线工具',

  // ── palette 创建 ───────────────────────────────────
  'Create start event': '创建开始事件',
  'Create intermediate/boundary event': '创建中间/边界事件',
  'Create end event': '创建结束事件',
  'Create gateway': '创建网关',
  'Create task': '创建任务',
  'Create data object reference': '创建数据对象',
  'Create data store reference': '创建数据存储',
  'Create expanded sub-process': '创建展开的子流程',
  'Create pool/participant': '创建泳道池/参与者',
  'Create group': '创建分组',

  // ── context-pad ────────────────────────────────────
  'Append task': '追加任务',
  'Append end event': '追加结束事件',
  'Append gateway': '追加网关',
  'Append intermediate/boundary event': '追加中间/边界事件',
  'Append receive task': '追加接收任务',
  'Append message intermediate catch event': '追加消息中间捕获事件',
  'Append timer intermediate catch event': '追加定时中间捕获事件',
  'Append conditional intermediate catch event': '追加条件中间捕获事件',
  'Append signal intermediate catch event': '追加信号中间捕获事件',
  'Append compensation activity': '追加补偿活动',
  'Add text annotation': '添加文本注释',
  'Connect to other element': '连接到其他元素',
  'Connect using association': '使用关联连接',
  'Connect using data input association': '使用数据输入关联连接',
  'Change element': '更改元素类型',
  Delete: '删除',

  // ── 泳道 ───────────────────────────────────────────
  'Add lane above': '在上方添加泳道',
  'Add lane below': '在下方添加泳道',
  'Divide into two lanes': '拆分为两条泳道',
  'Divide into three lanes': '拆分为三条泳道',

  // ── 对齐 / 分布 ────────────────────────────────────
  // bpmn-js 用 `translate('Align elements ' + alignment)` 拼接，六个方向必须各自成 key
  'Align elements': '对齐元素',
  'Align elements left': '左对齐',
  'Align elements center': '水平居中',
  'Align elements right': '右对齐',
  'Align elements top': '顶部对齐',
  'Align elements middle': '垂直居中',
  'Align elements bottom': '底部对齐',
  'Distribute elements horizontally': '水平均匀分布',
  'Distribute elements vertically': '垂直均匀分布',

  // ── 其他 ───────────────────────────────────────────
  'Search in diagram': '在流程图中搜索',
  'Open {element}': '打开 {element}',
  Loop: '循环',
  Collection: '集合',
  'Parallel multi-instance': '并行多实例',
  'Sequential multi-instance': '串行多实例',
  'Participant multiplicity': '参与者多重性',
  'Toggle non-interrupting': '切换中断/非中断',
  'flow elements must be children of pools/participants': '流程元素必须放在泳道池/参与者内',
  'Data object must be placed within a pool/participant.': '数据对象必须放在泳道池/参与者内。',

  // ── 替换菜单（PopupEntries）──────────────────────────
  Task: '任务',
  'User task': '用户任务',
  'Service task': '服务任务',
  'Script task': '脚本任务',
  'Send task': '发送任务',
  'Receive task': '接收任务',
  'Manual task': '手工任务',
  'Business rule task': '业务规则任务',
  'Call activity': '调用活动',
  'Sub-process (collapsed)': '子流程（折叠）',
  'Sub-process (expanded)': '子流程（展开）',
  'Ad-hoc sub-process (collapsed)': '临时子流程（折叠）',
  'Ad-hoc sub-process (expanded)': '临时子流程（展开）',
  'Event sub-process': '事件子流程',
  Transaction: '事务',

  'Exclusive gateway': '排他网关',
  'Parallel gateway': '并行网关',
  'Inclusive gateway': '包容网关',
  'Complex gateway': '复杂网关',
  'Event-based gateway': '事件网关',

  'Start event': '开始事件',
  'Message start event': '消息开始事件',
  'Message start event (non-interrupting)': '消息开始事件（非中断）',
  'Timer start event': '定时开始事件',
  'Timer start event (non-interrupting)': '定时开始事件（非中断）',
  'Conditional start event': '条件开始事件',
  'Conditional start event (non-interrupting)': '条件开始事件（非中断）',
  'Signal start event': '信号开始事件',
  'Signal start event (non-interrupting)': '信号开始事件（非中断）',
  'Error start event': '错误开始事件',
  'Escalation start event': '升级开始事件',
  'Escalation start event (non-interrupting)': '升级开始事件（非中断）',
  'Compensation start event': '补偿开始事件',

  'Intermediate throw event': '中间抛出事件',
  'Message intermediate catch event': '消息中间捕获事件',
  'Message intermediate throw event': '消息中间抛出事件',
  'Timer intermediate catch event': '定时中间捕获事件',
  'Conditional intermediate catch event': '条件中间捕获事件',
  'Link intermediate catch event': '链接中间捕获事件',
  'Link intermediate throw event': '链接中间抛出事件',
  'Signal intermediate catch event': '信号中间捕获事件',
  'Signal intermediate throw event': '信号中间抛出事件',
  'Escalation intermediate throw event': '升级中间抛出事件',
  'Compensation intermediate throw event': '补偿中间抛出事件',

  'End event': '结束事件',
  'Message end event': '消息结束事件',
  'Signal end event': '信号结束事件',
  'Error end event': '错误结束事件',
  'Escalation end event': '升级结束事件',
  'Cancel end event': '取消结束事件',
  'Compensation end event': '补偿结束事件',
  'Terminate end event': '终止结束事件',

  'Boundary event': '边界事件',
  'Message boundary event': '消息边界事件',
  'Message boundary event (non-interrupting)': '消息边界事件（非中断）',
  'Timer boundary event': '定时边界事件',
  'Timer boundary event (non-interrupting)': '定时边界事件（非中断）',
  'Conditional boundary event': '条件边界事件',
  'Conditional boundary event (non-interrupting)': '条件边界事件（非中断）',
  'Signal boundary event': '信号边界事件',
  'Signal boundary event (non-interrupting)': '信号边界事件（非中断）',
  'Escalation boundary event': '升级边界事件',
  'Escalation boundary event (non-interrupting)': '升级边界事件（非中断）',
  'Error boundary event': '错误边界事件',
  'Cancel boundary event': '取消边界事件',
  'Compensation boundary event': '补偿边界事件',

  'Data object reference': '数据对象',
  'Data store reference': '数据存储',
  'Empty pool/participant': '空泳道池/参与者',
  'Expanded pool/participant': '展开的泳道池/参与者',
}

export default zhCNBpmn
