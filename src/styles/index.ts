// 样式统一入口。
//
// 用 bpmn-embedded.css 而非 bpmn.css：前者把图标字体以 base64 内联，
// 消费方不需要处理字体文件的相对路径，dist 里也不会多出 assets 目录。
import 'bpmn-js/dist/assets/diagram-js.css'
import 'bpmn-js/dist/assets/bpmn-js.css'
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css'

import './index.scss'
