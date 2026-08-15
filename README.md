# Tasklist

一个基于 Vue 3 + Vite + TypeScript 的任务清单（todo）应用。PWA 支持，数据本地持久化。

## 常用命令

- `npm run dev` — 启动开发服务器
- `npm test` — 运行单元测试（vitest run）
- `npm run build` — 类型检查并构建产物（`vue-tsc -b && vite build`）
- `npm run preview` — 预览构建产物

## 技术栈

Vue 3、Vite、TypeScript、Pinia、vue-i18n、Vitest

## 项目文档

- [DESIGN.md](DESIGN.md) — 项目设计画像：一切设计细节（陈述语气，设计变更须同步于此）
- [ROADMAP.md](ROADMAP.md) — 开发计划与排期
- [AGENTS.md](AGENTS.md) — 项目约定（供编码代理阅读）

## 部署

```bash
npm run build
npx gh-pages -d dist
```

## 开发

```bash
npm install
npm run dev      # 开发
npm test         # 单测
```

如无 gh-pages 依赖，`npm i -D gh-pages` 或手动推送 `dist/` 到 gh-pages 分支。
