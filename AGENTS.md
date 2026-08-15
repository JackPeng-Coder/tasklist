# AGENTS.md — 项目约定（供编码代理阅读）

## 项目概述

Tasklist：Vue 3 + Vite + TypeScript + Pinia + vue-i18n 的纯前端任务清单应用。PWA（`public/manifest.webmanifest` + `public/sw.js`），数据仅存 localStorage，部署于 GitHub Pages（`base: './'`）。无 UI 组件库，手写组件 + CSS 变量主题（`src/styles/variables.css`，浅/深色）。

## 文档结构（必读，用户强制规则）

| 文件 | 定位 | 要求 |
|---|---|---|
| `DESIGN.md` | **项目设计画像**：一切设计细节 | 陈述语气、不带时间修饰、不含开发计划。**任何设计内容变更必须同步到此文档**（用户强制规则，代码改动同次提交或紧随其后） |
| `ROADMAP.md` | 开发计划与排期（根目录） | 与 DESIGN.md 分离，只放计划性内容 |
| `docs/superpowers/plans/` | 实施计划（writing-plans 产物） | 过程性文档，不视为设计 |

## 命令（package.json 为唯一事实来源）

- `npm run dev` — 开发服务器
- `npm test` — 全量单测（vitest run）；`npm run test:watch` — 监听模式
- `npm run build` — **类型检查 + 构建**（`vue-tsc -b && vite build`）。**无独立 lint/format/typecheck 脚本**，验证 = `npm test` + `npm run build`
- 无 CI 配置

## 测试约定

- vitest：jsdom 环境、`globals: true`（`describe/it/expect` 无需 import）
- 测试文件与源码同目录，命名 `*.spec.ts`
- **`vite.config.ts` 的 `test.exclude` 含 `.superpowers/**`**：仓库根目录克隆了 superpowers 源码（含非 vitest 格式的测试），不要移除该排除项，也不要让 vitest 扫到 `.superpowers`
- 组件测试用 `@vue/test-utils` mount + pinia/i18n 插件；`localStorage.clear()` 在 beforeEach
- i18n 断言注意 locale：`i18n.global.locale.value = 'zh'` 需在 beforeEach 显式设置（jsdom 默认 en）

## 代码约定

- 路径别名 `@/*` → `src/*`（vite + tsconfig 均配置）
- 数据键：`STORE_KEY = 'tasklist:v1'`、`BACKUP_KEY = 'tasklist:backup'`（`src/types.ts`）；写入防抖
- 新增文案必须**同时**更新 `src/i18n/zh.ts` 与 `src/i18n/en.ts`
- 类型定义集中在 `src/types.ts`；纯逻辑在 `src/logic/`（均带 spec）；状态在 `src/stores/`；组件在 `src/components/`

## 工作流程

遵循 superpowers 方法论（技能在 `~/.agents/skills`）：

- 创造性工作（新功能/组件/行为变更）→ 先 `brainstorming`，设计获用户确认后再动手
- bug 修复 → 先 `systematic-debugging` 定位根因
- 实施 → TDD（先写失败测试）；`verification-before-completion` 验证后再声明完成
- 设计变更落地后 → **同步更新 DESIGN.md**（用户强制规则）
