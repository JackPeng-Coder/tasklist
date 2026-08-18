# Tasklist

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

一个纯前端、单机优先的任务清单（todo）应用：多列表、事项与组合递归嵌套、按状态与日期分组、拖拽排序与合并、撤销/重做，支持中英双语、浅深主题，数据只存在你自己的设备上。

- **无服务器**：不登录、不联网、不上传；数据仅存于浏览器本地（localStorage）
- **PWA**：可「安装到桌面」，离线可用，独立窗口运行
- **部署简单**：GitHub Pages，`npm run build` 后推送产物即可

## 特性

- 多列表管理，列表状态（逾期/待办/完成）随内容自动计算并着色
- 事项 / 组合（组）递归嵌套，组合状态由子孙事项递归得出
- 主区按状态分三组：已逾期 · 未完成 · 已完成，组内按日期分隔
- 日期与时间记录，支持「今天 / 明天 / 昨天 / 后天」等相对标记
- 拖拽排序：行内位移超过阈值进入拖拽，拖到组合合并、按住 `Ctrl` 拖到事项合并
- 撤销 / 重做：`Ctrl/Cmd+Z`、`Ctrl+Y` 或 `Ctrl/Cmd+Shift+Z`，侧栏亦有按钮；对列表内容数据生效
- 中英双语（vue-i18n）、浅 / 深主题、字号调节（全局跟随）
- 导入 / 导出 JSON 备份，导入支持同 ID 覆盖合并
- 数据损坏自动检测：备份原数据后重置，不丢失

## 技术栈

Vue 3 · Vite · TypeScript · Pinia · vue-i18n · Vitest · PWA

无 UI 组件库，全部组件手写 + CSS 变量主题（`src/styles/variables.css`）。

## 数据与隐私

- 数据仅保存在你浏览器的 localStorage（键 `tasklist:v1`），**不会上传任何服务器**
- 备份：可随时导出 JSON 文件到本地；更换设备时导入恢复
- 详见 [DESIGN.md](DESIGN.md) 第 1 节「产品概述」

## 开始使用

```bash
npm install    # 安装依赖
npm run dev    # 启动开发服务器（http://127.0.0.1:5173）
```

生产构建与本地预览：

```bash
npm run build     # 类型检查（vue-tsc -b）+ 构建产物到 dist/
npm run preview   # 预览构建产物
```

## 测试

```bash
npm test             # 全量单测（vitest run）
npm run test:watch   # 监听模式
```

## 部署（GitHub Pages）

```bash
npm run build
npx gh-pages -d dist
```

如无 gh-pages 依赖，先 `npm i -D gh-pages`；也可以手动把 `dist/` 推送到 gh-pages 分支。

## 项目文档

- [DESIGN.md](DESIGN.md) — 项目设计画像：一切设计细节（设计变更须同步于此）
- [ROADMAP.md](ROADMAP.md) — 开发计划与排期
- [AGENTS.md](AGENTS.md) — 项目约定（供编码代理阅读）

## 作者与许可

© 2026 [Jack Peng (彭俊杰)](https://github.com/JackPeng-Coder) · 见 [LICENSE](LICENSE)（MIT License）

开源仓库：[https://github.com/JackPeng-Coder/tasklist](https://github.com/JackPeng-Coder/tasklist)
