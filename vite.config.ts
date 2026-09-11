// 裸跑 `vite` / `vite build` 时默认走 playground，避免误把示例站当成库产物。
// 构建库请用 `npm run build:lib`（vite.config.lib.ts）。
export { default } from './vite.config.playground'
