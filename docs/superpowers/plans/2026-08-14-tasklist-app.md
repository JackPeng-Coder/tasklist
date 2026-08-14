# 任务清单（Tasklist）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个纯前端、单机优先的任务管理 PWA（Vue 3 + Vite + TS），支持列表/事项/组合三级数据、递归分组、拖拽、i18n、导入导出与离线安装。

**Architecture:** 数据模型为 `List → TreeNode[]`（`TreeNode = Item | Group`，Group 递归嵌套）。所有状态/时间戳/排序/合并逻辑为纯函数（`src/logic/`），由 Pinia store（`src/stores/`）持有数据并负责 localStorage 持久化，Vue 组件只做渲染与交互。样式用 CSS 变量实现浅/深主题。

**Tech Stack:** Vue 3 (Composition API) + Vite + TypeScript + Pinia + vue-i18n + Vitest + @vue/test-utils + jsdom。无 UI 组件库。

## Global Constraints

- 数据键：localStorage `tasklist:v1`；备份键 `tasklist:backup`（见 DESIGN.md §4.4）
- 数据模型与 DESIGN.md §2.1 完全一致：`TaskData { version: 1, lists, settings, ui }`
- 状态色：已逾期=红、未完成=蓝、已完成=绿；组合深一档
- 排序：已逾期 → 未完成 → 已完成 三组；组内时间戳升序，同时间戳按名称；无时间=正无穷排组内最后
- 已逾期判定：未完成且时间戳 < 当前时刻
- 组合无 `done` 字段，状态/时间戳纯递归计算
- 拖拽：位移 > 8px 进入拖拽（否则视为点击），半透明预览，无效目标还原
- 导入合并：同 ID 覆盖本地，其余保留；导入前校验 JSON
- 名称必填、描述选填；弹窗支持 Esc 取消 / Enter 确认 / 点遮罩取消
- 语言：中/英（vue-i18n），默认跟随浏览器
- 路径别名：`@/` → `src/`；测试文件与源码同目录（`*.spec.ts`）

---

### Task 1: 项目脚手架与测试基线

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `index.html`
- Create: `src/vite-env.d.ts`
- Create: `src/main.ts`
- Create: `src/App.vue`
- Create: `src/logic/status.spec.ts`（仅占位断言）
- Create: `.gitignore`
- Modify: `README.md`（初始说明）

**Interfaces:**
- Produces: 可运行的项目骨架（`npm run dev` / `npm test` / `npm run build` 全部可用），后续所有任务在此之上增量开发。

- [ ] **Step 1: 创建 package.json 与依赖**

```json
{
  "name": "tasklist",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "pinia": "^3.0.1",
    "vue": "^3.5.13",
    "vue-i18n": "^11.1.1"
  },
  "devDependencies": {
    "@types/node": "^24.0.0",
    "@vitejs/plugin-vue": "^5.2.1",
    "@vue/test-utils": "^2.4.6",
    "jsdom": "^26.0.0",
    "typescript": "~5.7.2",
    "vite": "^6.3.0",
    "vitest": "^3.0.5",
    "vue-tsc": "^2.2.0"
  }
}
```

- [ ] **Step 2: 创建 vite 配置（含 vitest 环境与路径别名）**

`vite.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
```

- [ ] **Step 3: 创建 TS 配置**

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "preserve",
    "sourceMap": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] },
    "types": ["vitest/globals", "@types/node"]
  },
  "include": ["src/**/*.ts", "src/**/*.vue", "vite.config.ts"]
}
```

`tsconfig.node.json`:
```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "types": ["node"]
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 4: 创建入口文件**

`index.html`:
```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#ffffff" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <link rel="icon" href="data:," />
    <title>Tasklist</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

`src/vite-env.d.ts`:
```ts
/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
```

`src/main.ts`:
```ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './styles/main.css'

createApp(App).use(createPinia()).mount('#app')
```

`src/App.vue`（占位，Task 10 替换）:
```vue
<template>
  <div class="app">Tasklist</div>
</template>
```

`src/styles/main.css`:
```css
:root { --font-size: 16px; }
* { box-sizing: border-box; }
body { margin: 0; font-size: var(--font-size); }
```

- [ ] **Step 5: 创建占位测试并安装依赖**

`src/logic/status.spec.ts`:
```ts
describe('status', () => {
  it('placeholder', () => {
    expect(1 + 1).toBe(2)
  })
})
```

`.gitignore`:
```
node_modules
dist
*.local
.DS_Store
```

运行: `npm install`
Expected: 安装成功无报错。

- [ ] **Step 6: 初始化 git 并验证基线**

运行:
```powershell
git init
npm test
npm run build
```
Expected: `npm test` 通过 1 个用例；`npm run build` 产出 `dist/` 无类型错误。

- [ ] **Step 7: Commit**

```powershell
git add -A
git commit -m "chore: scaffold vite + vue3 + ts + vitest"
```

---

### Task 2: 类型定义与存储层

**Files:**
- Create: `src/types.ts`
- Create: `src/storage.ts`
- Create: `src/storage.spec.ts`

**Interfaces:**
- Consumes: DESIGN.md §2.1 数据模型
- Produces:
  - `src/types.ts`: `Item`、`Group`、`TreeNode`、`List`、`Settings`、`UIState`、`TaskData`、`NodeStatus`、`STORE_KEY`、`BACKUP_KEY`、`makeDefaultTaskData()`、`createItem(name)`、`createGroup(name)`、`createList(name)`、`uid()`
  - `src/storage.ts`: `loadTaskData(): { data: TaskData; recovered: boolean }`、`saveTaskData(data: TaskData): void`、`replaceAllTaskData(data: TaskData): void`

**Types 约定（后续所有任务引用）：**
```ts
export type NodeStatus = 'overdue' | 'pending' | 'done'
export type Theme = 'light' | 'dark'

export interface Item {
  id: string
  name: string
  description: string
  date?: string
  time?: string
  done: boolean
  createdAt: number
}

export interface Group {
  id: string
  name: string
  description: string
  date?: string
  time?: string
  expanded: boolean
  items: TreeNode[]
}

export type TreeNode = Item | Group

export interface List {
  id: string
  name: string
  description: string
  items: TreeNode[]
}

export interface Settings {
  theme: Theme
  fontSize: number
  lang: string
  showDescription: boolean
}

export interface UIState {
  sidebarCollapsed: boolean
  expandedGroupIds: string[]
}

export interface TaskData {
  version: 1
  lists: List[]
  settings: Settings
  ui: UIState
}

export const STORE_KEY = 'tasklist:v1'
export const BACKUP_KEY = 'tasklist:backup'
```

- [ ] **Step 1: 写失败测试**

`src/storage.spec.ts`:
```ts
import { STORE_KEY, BACKUP_KEY, type TaskData } from './types'
import { loadTaskData, saveTaskData, replaceAllTaskData } from './storage'

const data: TaskData = {
  version: 1,
  lists: [{ id: 'l1', name: 'A', description: '', items: [] }],
  settings: { theme: 'light', fontSize: 16, lang: 'zh', showDescription: true },
  ui: { sidebarCollapsed: false, expandedGroupIds: [] },
}

describe('storage', () => {
  beforeEach(() => localStorage.clear())

  it('保存后可读回', () => {
    saveTaskData(data)
    const { data: loaded, recovered } = loadTaskData()
    expect(loaded.lists[0].name).toBe('A')
    expect(recovered).toBe(false)
  })

  it('数据损坏时备份并返回默认数据', () => {
    localStorage.setItem(STORE_KEY, '{broken json')
    const { data: loaded, recovered } = loadTaskData()
    expect(recovered).toBe(true)
    expect(loaded.lists).toEqual([])
    expect(localStorage.getItem(BACKUP_KEY)).toContain('broken')
  })

  it('版本不符时视为损坏', () => {
    localStorage.setItem(STORE_KEY, JSON.stringify({ version: 999, lists: [] }))
    const { recovered } = loadTaskData()
    expect(recovered).toBe(true)
  })

  it('replaceAllTaskData 整体覆盖', () => {
    saveTaskData(data)
    const other = { ...data, lists: [{ id: 'l2', name: 'B', description: '', items: [] }] }
    replaceAllTaskData(other)
    expect(loadTaskData().data.lists[0].name).toBe('B')
  })
})
```

- [ ] **Step 2: 运行验证失败**

运行: `npm test`
Expected: FAIL（`src/storage.ts` 不存在，模块解析失败）。

- [ ] **Step 3: 实现 types.ts 与 storage.ts**

`src/types.ts`:
```ts
export type NodeStatus = 'overdue' | 'pending' | 'done'
export type Theme = 'light' | 'dark'

export interface Item {
  id: string
  name: string
  description: string
  date?: string
  time?: string
  done: boolean
  createdAt: number
}

export interface Group {
  id: string
  name: string
  description: string
  date?: string
  time?: string
  expanded: boolean
  items: TreeNode[]
}

export type TreeNode = Item | Group

export interface List {
  id: string
  name: string
  description: string
  items: TreeNode[]
}

export interface Settings {
  theme: Theme
  fontSize: number
  lang: string
  showDescription: boolean
}

export interface UIState {
  sidebarCollapsed: boolean
  expandedGroupIds: string[]
}

export interface TaskData {
  version: 1
  lists: List[]
  settings: Settings
  ui: UIState
}

export const STORE_KEY = 'tasklist:v1'
export const BACKUP_KEY = 'tasklist:backup'

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export function createItem(name: string): Item {
  return { id: uid(), name, description: '', done: false, createdAt: Date.now() }
}

export function createGroup(name: string): Group {
  return { id: uid(), name, description: '', expanded: false, items: [] }
}

export function createList(name: string): List {
  return { id: uid(), name, description: '', items: [] }
}

export function makeDefaultTaskData(): TaskData {
  return {
    version: 1,
    lists: [],
    settings: { theme: 'light', fontSize: 16, lang: 'zh', showDescription: true },
    ui: { sidebarCollapsed: false, expandedGroupIds: [] },
  }
}
```

`src/storage.ts`:
```ts
import { BACKUP_KEY, STORE_KEY, makeDefaultTaskData, type TaskData } from './types'

export function loadTaskData(): { data: TaskData; recovered: boolean } {
  const raw = localStorage.getItem(STORE_KEY)
  if (!raw) return { data: makeDefaultTaskData(), recovered: false }
  try {
    const parsed = JSON.parse(raw) as TaskData
    if (parsed.version !== 1 || !Array.isArray(parsed.lists)) throw new Error('bad version')
    return { data: parsed, recovered: false }
  } catch {
    try {
      localStorage.setItem(BACKUP_KEY, raw)
    } catch {
      /* backup 空间不足时忽略 */
    }
    return { data: makeDefaultTaskData(), recovered: true }
  }
}

export function saveTaskData(data: TaskData): void {
  localStorage.setItem(STORE_KEY, JSON.stringify(data))
}

export function replaceAllTaskData(data: TaskData): void {
  saveTaskData(data)
}
```

- [ ] **Step 4: 运行验证通过**

运行: `npm test`
Expected: PASS（4 个用例）。

- [ ] **Step 5: Commit**

```powershell
git add -A
git commit -m "feat: add types and storage layer"
```

---

### Task 3: 状态与时间戳计算（纯函数）

**Files:**
- Create: `src/logic/status.ts`
- Create: `src/logic/status.spec.ts`（替换占位）

**Interfaces:**
- Consumes: `src/types.ts` 的 `Item`、`Group`、`TreeNode`、`NodeStatus`
- Produces:
  - `itemTimestamp(item: Item): number` — 有日期+时间→对应毫秒；有日期无时间→当日 00:00；无日期→Infinity
  - `groupStatus(group: Group, now: number): NodeStatus` — 递归：存在逾期子孙→overdue；全部子孙已完成→done；无子孙或其余→pending
  - `groupTimestamp(group: Group, now: number): number` — 存在逾期/未完成子孙→其中最小时间戳（Infinity 也参与取 min）；全部完成→已完成子孙除去无时间后的最大时间戳，若无则 Infinity；无子孙→Infinity
  - `nodeStatus(node: TreeNode, now: number): NodeStatus`
  - `nodeTimestamp(node: TreeNode, now: number): number`
  - `isGroup(node: TreeNode): node is Group`

**规则原文（DESIGN.md §4.1）：** 事项时间戳：有日期+时间→`Date(date+'T'+time)`；有日期无时间→当日 00:00；无日期→正无穷。组合时间戳：存在已逾期或未完成递归事项→其中最小时间戳；全部完成→已完成中除去无时间后的最大值；无递归事项→正无穷。组合状态：存在逾期→overdue；全部完成→done；其他→pending。

- [ ] **Step 1: 写失败测试**

`src/logic/status.spec.ts`:
```ts
import { createGroup, createItem, type Group, type Item } from '../types'
import { groupStatus, groupTimestamp, isGroup, itemTimestamp, nodeStatus, nodeTimestamp } from './status'

const NOW = new Date('2026-08-14T12:00:00').getTime()

const it1: Item = { id: '1', name: 'a', description: '', done: false, createdAt: 1 }
const doneItem: Item = { id: '2', name: 'b', description: '', done: true, createdAt: 2 }
const dated: Item = { id: '3', name: 'c', description: '', date: '2026-08-20', done: false, createdAt: 3 }
const timed: Item = { id: '4', name: 'd', description: '', date: '2026-08-20', time: '18:00', done: false, createdAt: 4 }

describe('itemTimestamp', () => {
  it('无日期为正无穷', () => { expect(itemTimestamp(it1)).toBe(Infinity) })
  it('有日期无时间为当日零点', () => {
    expect(itemTimestamp(dated)).toBe(new Date('2026-08-20T00:00').getTime())
  })
  it('有日期有时间按实际时间', () => {
    expect(itemTimestamp(timed)).toBe(new Date('2026-08-20T18:00').getTime())
  })
})

describe('group 状态', () => {
  it('空组合为未完成', () => {
    const g = createGroup('g'); g.items = []
    expect(groupStatus(g, NOW)).toBe('pending')
  })
  it('含逾期子孙为已逾期', () => {
    const g = createGroup('g')
    const past: Item = { ...dated, date: '2026-08-01', id: 'x' }
    g.items = [it1, past]
    expect(groupStatus(g, NOW)).toBe('overdue')
  })
  it('全部完成则为已完成（含嵌套）', () => {
    const inner = createGroup('inner'); inner.items = [doneItem, { ...doneItem, id: 'y' }]
    const outer = createGroup('outer'); outer.items = [inner, { ...doneItem, id: 'z' }]
    expect(groupStatus(outer, NOW)).toBe('done')
  })
  it('部分完成未逾期为未完成', () => {
    const g = createGroup('g'); g.items = [doneItem, it1]
    expect(groupStatus(g, NOW)).toBe('pending')
  })
})

describe('group 时间戳', () => {
  it('未完成子孙取最小时间戳', () => {
    const g = createGroup('g'); g.items = [timed, dated]
    expect(groupTimestamp(g, NOW)).toBe(itemTimestamp(dated))
  })
  it('全部完成取已完成中最大时间戳', () => {
    const g = createGroup('g')
    g.items = [{ ...doneItem, id: 'a', date: '2026-08-10' }, { ...doneItem, id: 'b', date: '2026-08-15' }]
    expect(groupTimestamp(g, NOW)).toBe(itemTimestamp({ ...doneItem, date: '2026-08-15' }))
  })
  it('已完成但全部无时间则正无穷', () => {
    const g = createGroup('g'); g.items = [doneItem, { ...doneItem, id: 'y' }]
    expect(groupTimestamp(g, NOW)).toBe(Infinity)
  })
  it('空组合为正无穷', () => {
    const g = createGroup('g')
    expect(groupTimestamp(g, NOW)).toBe(Infinity)
  })
})

describe('nodeStatus / nodeTimestamp / isGroup', () => {
  it('isGroup 区分类型', () => {
    expect(isGroup(createGroup('g'))).toBe(true)
    expect(isGroup(createItem('i'))).toBe(false)
  })
  it('nodeStatus 委托正确', () => {
    expect(nodeStatus(dated, NOW)).toBe('pending')
    expect(nodeStatus({ ...dated, date: '2026-08-01' }, NOW)).toBe('overdue')
    expect(nodeStatus(doneItem, NOW)).toBe('done')
  })
  it('nodeTimestamp 对事项等于 itemTimestamp', () => {
    expect(nodeTimestamp(dated, NOW)).toBe(itemTimestamp(dated))
  })
})
```

- [ ] **Step 2: 运行验证失败**

运行: `npm test`
Expected: FAIL（模块不存在）。

- [ ] **Step 3: 实现 status.ts**

`src/logic/status.ts`:
```ts
import type { Group, Item, NodeStatus, TreeNode } from '../types'

export function isGroup(node: TreeNode): node is Group {
  return Array.isArray((node as Group).items)
}

export function itemTimestamp(item: Item): number {
  if (!item.date) return Infinity
  const t = item.time ? `${item.date}T${item.time}` : `${item.date}T00:00`
  const ms = new Date(t).getTime()
  return Number.isNaN(ms) ? Infinity : ms
}

function collectItems(nodes: TreeNode[]): Item[] {
  const out: Item[] = []
  for (const n of nodes) {
    if (isGroup(n)) out.push(...collectItems(n.items))
    else out.push(n)
  }
  return out
}

export function groupStatus(group: Group, now: number): NodeStatus {
  const items = collectItems(group.items)
  if (items.length === 0) return 'pending'
  const hasOverdue = items.some((i) => !i.done && itemTimestamp(i) < now)
  if (hasOverdue) return 'overdue'
  if (items.every((i) => i.done)) return 'done'
  return 'pending'
}

export function groupTimestamp(group: Group, now: number): number {
  const items = collectItems(group.items)
  if (items.length === 0) return Infinity
  const status = groupStatus(group, now)
  if (status === 'overdue' || status === 'pending') {
    return Math.min(...items.filter((i) => !i.done).map(itemTimestamp))
  }
  const ts = items.map(itemTimestamp).filter((t) => t !== Infinity)
  return ts.length > 0 ? Math.max(...ts) : Infinity
}

export function nodeStatus(node: TreeNode, now: number): NodeStatus {
  return isGroup(node) ? groupStatus(node, now) : node.done ? 'done' : itemTimestamp(node) < now ? 'overdue' : 'pending'
}

export function nodeTimestamp(node: TreeNode, now: number): number {
  return isGroup(node) ? groupTimestamp(node, now) : itemTimestamp(node)
}
```

- [ ] **Step 4: 运行验证通过**

运行: `npm test`
Expected: PASS（status 全部用例）。

- [ ] **Step 5: Commit**

```powershell
git add -A
git commit -m "feat: add node status and timestamp logic"
```

---

### Task 4: 分组与排序（纯函数）

**Files:**
- Create: `src/logic/sort.ts`
- Create: `src/logic/sort.spec.ts`

**Interfaces:**
- Consumes: `nodeStatus(node, now)`、`nodeTimestamp(node, now)`（Task 3）
- Produces: `sortNodes(nodes: TreeNode[], now: number): TreeNode[]` — 已按「组序 → 时间戳升序 → 名称」排好的扁平数组；`groupedNodes(nodes: TreeNode[], now: number): { overdue: TreeNode[]; pending: TreeNode[]; done: TreeNode[] }`

**规则（DESIGN.md §4.2）：** 三组自上而下 已逾期→未完成→已完成；组内时间戳升序，同时间戳按名称（`localeCompare`）排序；无时间戳排组内最后（Infinity 自然升序在最后）。

- [ ] **Step 1: 写失败测试**

`src/logic/sort.spec.ts`:
```ts
import { createGroup, createItem, type TreeNode } from '../types'
import { groupedNodes, sortNodes } from './sort'

const NOW = new Date('2026-08-14T12:00:00').getTime()

const mk = (name: string, date?: string, time?: string, done = false): TreeNode =>
  ({ ...createItem(name), date, time, done })

describe('sortNodes', () => {
  it('按状态分组排序：逾期→未完成→已完成', () => {
    const nodes = [
      mk('已完成', undefined, undefined, true),
      mk('待办A', '2026-08-20'),
      mk('逾期', '2026-08-01'),
    ]
    const sorted = sortNodes(nodes, NOW).map((n) => n.name)
    expect(sorted).toEqual(['逾期', '待办A', '已完成'])
  })

  it('组内时间戳升序，早的在前', () => {
    const nodes = [mk('晚', '2026-08-30'), mk('早', '2026-08-10')]
    expect(sortNodes(nodes, NOW).map((n) => n.name)).toEqual(['早', '晚'])
  })

  it('同时间戳按名称排序', () => {
    const nodes = [mk('b', '2026-08-20'), mk('a', '2026-08-20')]
    expect(sortNodes(nodes, NOW).map((n) => n.name)).toEqual(['a', 'b'])
  })

  it('无时间的排组内最后', () => {
    const nodes = [mk('无时间'), mk('有时间', '2026-08-20')]
    expect(sortNodes(nodes, NOW).map((n) => n.name)).toEqual(['有时间', '无时间'])
  })

  it('组合与事项并列参与排序', () => {
    const g = createGroup('组早'); g.date = '2026-08-05'
    const nodes = [mk('事项晚', '2026-08-30'), g]
    expect(sortNodes(nodes, NOW).map((n) => n.name)).toEqual(['组早', '事项晚'])
  })
})

describe('groupedNodes', () => {
  it('三组分离', () => {
    const nodes = [mk('逾期', '2026-08-01'), mk('待办', '2026-08-20'), mk('完成', undefined, undefined, true)]
    const { overdue, pending, done } = groupedNodes(nodes, NOW)
    expect(overdue.map((n) => n.name)).toEqual(['逾期'])
    expect(pending.map((n) => n.name)).toEqual(['待办'])
    expect(done.map((n) => n.name)).toEqual(['完成'])
  })
})
```

- [ ] **Step 2: 运行验证失败**

运行: `npm test`
Expected: FAIL（模块不存在）。

- [ ] **Step 3: 实现 sort.ts**

`src/logic/sort.ts`:
```ts
import type { NodeStatus, TreeNode } from '../types'
import { nodeStatus, nodeTimestamp } from './status'

const STATUS_ORDER: Record<NodeStatus, number> = { overdue: 0, pending: 1, done: 2 }

function compare(a: TreeNode, b: TreeNode, now: number): number {
  const sa = STATUS_ORDER[nodeStatus(a, now)]
  const sb = STATUS_ORDER[nodeStatus(b, now)]
  if (sa !== sb) return sa - sb
  const ta = nodeTimestamp(a, now)
  const tb = nodeTimestamp(b, now)
  if (ta !== tb) return ta - tb
  return a.name.localeCompare(b.name, 'zh-Hans-CN')
}

export function sortNodes(nodes: TreeNode[], now: number): TreeNode[] {
  return [...nodes].sort((a, b) => compare(a, b, now))
}

export function groupedNodes(nodes: TreeNode[], now: number): { overdue: TreeNode[]; pending: TreeNode[]; done: TreeNode[] } {
  const sorted = sortNodes(nodes, now)
  return {
    overdue: sorted.filter((n) => nodeStatus(n, now) === 'overdue'),
    pending: sorted.filter((n) => nodeStatus(n, now) === 'pending'),
    done: sorted.filter((n) => nodeStatus(n, now) === 'done'),
  }
}
```

- [ ] **Step 4: 运行验证通过**

运行: `npm test`
Expected: PASS。

- [ ] **Step 5: Commit**

```powershell
git add -A
git commit -m "feat: add sorting and grouping logic"
```

---

### Task 5: 日期显示与相对标记（纯函数）

**Files:**
- Create: `src/logic/dates.ts`
- Create: `src/logic/dates.spec.ts`

**Interfaces:**
- Consumes: 无（仅标准库）
- Produces:
  - `formatDateLabel(dateStr: string, now: Date): string` — 昨天/今天/明天/后天；同年→`M月D日`；跨年→`YYYY年M月D日`（中文格式，英文由调用方用 i18n 处理）
  - `resolveDateField(value: string, now: Date): string` — 支持 `yyyy-mm-dd`（原样）、`today`、`tomorrow`、`yesterday`、`today+N`、`today-N`，非法输入返回原值
  - `toISO(date: Date): string` — 输出 `yyyy-mm-dd`（本地时区）

- [ ] **Step 1: 写失败测试**

`src/logic/dates.spec.ts`:
```ts
import { formatDateLabel, resolveDateField, toISO } from './dates'

const NOW = new Date(2026, 7, 14, 12, 0) // 2026-08-14

describe('toISO', () => {
  it('输出本地 yyyy-mm-dd', () => {
    expect(toISO(new Date(2026, 7, 5))).toBe('2026-08-05')
  })
})

describe('formatDateLabel', () => {
  it('昨天/今天/明天/后天', () => {
    expect(formatDateLabel('2026-08-13', NOW)).toBe('yesterday')
    expect(formatDateLabel('2026-08-14', NOW)).toBe('today')
    expect(formatDateLabel('2026-08-15', NOW)).toBe('tomorrow')
    expect(formatDateLabel('2026-08-16', NOW)).toBe('dayAfterTomorrow')
  })
  it('同年显示 M月D日', () => {
    expect(formatDateLabel('2026-09-01', NOW)).toBe('9月1日')
  })
  it('跨年带年份', () => {
    expect(formatDateLabel('2025-12-31', NOW)).toBe('2025年12月31日')
  })
})

describe('resolveDateField', () => {
  it('绝对日期原样返回', () => {
    expect(resolveDateField('2026-08-20', NOW)).toBe('2026-08-20')
  })
  it('相对标记转换', () => {
    expect(resolveDateField('today', NOW)).toBe('2026-08-14')
    expect(resolveDateField('tomorrow', NOW)).toBe('2026-08-15')
    expect(resolveDateField('yesterday', NOW)).toBe('2026-08-13')
    expect(resolveDateField('today+3', NOW)).toBe('2026-08-17')
    expect(resolveDateField('today-2', NOW)).toBe('2026-08-12')
  })
  it('非法输入原样返回', () => {
    expect(resolveDateField('xxx', NOW)).toBe('xxx')
  })
})
```

- [ ] **Step 2: 运行验证失败**

运行: `npm test`
Expected: FAIL（模块不存在）。

- [ ] **Step 3: 实现 dates.ts**

`src/logic/dates.ts`:
```ts
export function toISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function formatDateLabel(dateStr: string, now: Date): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const target = new Date(y, m - 1, d)
  const base = startOfDay(now)
  const diff = Math.round((target.getTime() - base.getTime()) / 86400000)
  if (diff === -1) return 'yesterday'
  if (diff === 0) return 'today'
  if (diff === 1) return 'tomorrow'
  if (diff === 2) return 'dayAfterTomorrow'
  if (target.getFullYear() === now.getFullYear()) return `${m}月${d}日`
  return `${y}年${m}月${d}日`
}

export function resolveDateField(value: string, now: Date): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const match = /^today([+-]\d+)?$/.exec(value)
  if (match) {
    const offset = match[1] ? parseInt(match[1], 10) : 0
    return toISO(new Date(startOfDay(now).getTime() + offset * 86400000))
  }
  if (value === 'tomorrow') return toISO(new Date(startOfDay(now).getTime() + 86400000))
  if (value === 'yesterday') return toISO(new Date(startOfDay(now).getTime() - 86400000))
  return value
}
```

- [ ] **Step 4: 运行验证通过**

运行: `npm test`
Expected: PASS。

- [ ] **Step 5: Commit**

```powershell
git add -A
git commit -m "feat: add date label and relative date resolution"
```

---

### Task 6: 导入校验与合并（纯函数）

**Files:**
- Create: `src/logic/merge.ts`
- Create: `src/logic/merge.spec.ts`

**Interfaces:**
- Consumes: `src/types.ts`
- Produces:
  - `validateTaskData(input: unknown): { ok: true; data: TaskData } | { ok: false; error: string }` — 结构完整校验（version/lists/settings/ui，列表内递归校验 Item/Group 字段）
  - `mergeTaskData(local: TaskData, incoming: TaskData): TaskData` — 同 ID 覆盖本地（列表级），其余保留
  - `serializeExport(data: TaskData): string`、`parseImport(text: string)`（调 validateTaskData）

**规则（DESIGN.md §4.4）：** 同 ID 覆盖本地，其余保留；导入前校验 JSON 结构与字段合法性，错误则拒绝。

- [ ] **Step 1: 写失败测试**

`src/logic/merge.spec.ts`:
```ts
import type { TaskData, TreeNode } from '../types'
import { mergeTaskData, validateTaskData } from './merge'

const base: TaskData = {
  version: 1,
  lists: [
    { id: 'l1', name: '本地列表', description: '', items: [] },
    { id: 'l2', name: '仅本地', description: '', items: [] },
  ],
  settings: { theme: 'light', fontSize: 16, lang: 'zh', showDescription: true },
  ui: { sidebarCollapsed: false, expandedGroupIds: [] },
}

const incoming = (): TaskData => ({
  version: 1,
  lists: [
    { id: 'l1', name: '导入同名', description: '', items: [] },
    { id: 'l3', name: '仅导入', description: '', items: [] },
  ],
  settings: { theme: 'dark', fontSize: 18, lang: 'en', showDescription: false },
  ui: { sidebarCollapsed: true, expandedGroupIds: ['g1'] },
})

describe('validateTaskData', () => {
  it('合法数据通过', () => {
    expect(validateTaskData(base).ok).toBe(true)
  })
  it('version 错误拒绝', () => {
    expect(validateTaskData({ ...base, version: 2 }).ok).toBe(false)
  })
  it('缺字段拒绝', () => {
    const bad = JSON.parse(JSON.stringify(base)) as TaskData
    delete (bad.lists[0] as any).name
    expect(validateTaskData(bad).ok).toBe(false)
  })
  it('非法嵌套类型拒绝', () => {
    const bad = JSON.parse(JSON.stringify(base)) as TaskData
    bad.lists[0].items = [{ id: 'x', name: 'y', description: '' } as TreeNode]
    expect(validateTaskData(bad).ok).toBe(false)
  })
})

describe('mergeTaskData', () => {
  it('同 ID 覆盖，其余保留', () => {
    const merged = mergeTaskData(base, incoming())
    expect(merged.lists.map((l) => l.id)).toEqual(['l1', 'l2', 'l3'])
    expect(merged.lists.find((l) => l.id === 'l1')!.name).toBe('导入同名')
  })
  it('设置与 ui 以导入方为准', () => {
    const merged = mergeTaskData(base, incoming())
    expect(merged.settings.theme).toBe('dark')
    expect(merged.ui.sidebarCollapsed).toBe(true)
  })
})
```

- [ ] **Step 2: 运行验证失败**

运行: `npm test`
Expected: FAIL（模块不存在）。

- [ ] **Step 3: 实现 merge.ts**

`src/logic/merge.ts`:
```ts
import type { Group, Item, List, Settings, TaskData, TreeNode } from '../types'

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

function isValidItem(v: unknown): v is Item {
  return (
    isRecord(v) &&
    typeof v.id === 'string' &&
    typeof v.name === 'string' &&
    typeof v.description === 'string' &&
    typeof v.done === 'boolean' &&
    typeof v.createdAt === 'number' &&
    (v.date === undefined || typeof v.date === 'string') &&
    (v.time === undefined || typeof v.time === 'string')
  )
}

function isValidGroup(v: unknown): v is Group {
  return (
    isRecord(v) &&
    typeof v.id === 'string' &&
    typeof v.name === 'string' &&
    typeof v.description === 'string' &&
    typeof v.expanded === 'boolean' &&
    Array.isArray(v.items) &&
    v.items.every(isValidNode)
  )
}

function isValidNode(v: unknown): v is TreeNode {
  return isValidItem(v) || isValidGroup(v)
}

function isValidList(v: unknown): v is List {
  return (
    isRecord(v) &&
    typeof v.id === 'string' &&
    typeof v.name === 'string' &&
    typeof v.description === 'string' &&
    Array.isArray(v.items) &&
    v.items.every(isValidNode)
  )
}

function isValidSettings(v: unknown): v is Settings {
  return (
    isRecord(v) &&
    (v.theme === 'light' || v.theme === 'dark') &&
    typeof v.fontSize === 'number' &&
    typeof v.lang === 'string' &&
    typeof v.showDescription === 'boolean'
  )
}

export function validateTaskData(input: unknown): { ok: true; data: TaskData } | { ok: false; error: string } {
  if (!isRecord(input)) return { ok: false, error: 'not an object' }
  if (input.version !== 1) return { ok: false, error: 'unsupported version' }
  if (!Array.isArray(input.lists) || !input.lists.every(isValidList)) return { ok: false, error: 'invalid lists' }
  if (!isValidSettings(input.settings)) return { ok: false, error: 'invalid settings' }
  if (!isRecord(input.ui) || typeof (input.ui as any).sidebarCollapsed !== 'boolean' || !Array.isArray((input.ui as any).expandedGroupIds)) {
    return { ok: false, error: 'invalid ui' }
  }
  return { ok: true, data: input as TaskData }
}

export function mergeTaskData(local: TaskData, incoming: TaskData): TaskData {
  const map = new Map(local.lists.map((l) => [l.id, l]))
  for (const list of incoming.lists) map.set(list.id, list)
  return { version: 1, lists: [...map.values()], settings: incoming.settings, ui: incoming.ui }
}
```

- [ ] **Step 4: 运行验证通过**

运行: `npm test`
Expected: PASS。

- [ ] **Step 5: Commit**

```powershell
git add -A
git commit -m "feat: add import validation and merge logic"
```

---

### Task 7: 拖拽移动逻辑（纯函数）

**Files:**
- Create: `src/logic/move.ts`
- Create: `src/logic/move.spec.ts`

**Interfaces:**
- Consumes: `src/types.ts` 的 `List`、`TreeNode`、`createGroup`
- Produces:
  - `MoveSpec` 类型：`{ fromListId: string; nodeId: string; toKind: 'list' | 'group' | 'item'; toId: string }`
  - `applyMove(lists: List[], spec: MoveSpec, now: number): { lists: List[]; createdGroupId?: string }` — 返回新数组（不可变更新）
  - 规则：toKind='list'→移到目标列表根层；'group'→移入目标组合子层；'item'→删除原节点，新建组合（名 `目标名 · 源名`）包裹两者，放在目标项原位置
  - 若目标 == 源自身、源的后代、或目标与源同一位置 → 原样返回

- [ ] **Step 1: 写失败测试**

`src/logic/move.spec.ts`:
```ts
import { createGroup, createItem, type List } from '../types'
import { applyMove } from './move'

const NOW = Date.now()

function findNode(items: List['items'], id: string): { parent: List['items'] | null; node: any; index: number } {
  for (let i = 0; i < items.length; i++) {
    const n = items[i]
    if (n.id === id) return { parent: items, node: n, index: i }
    if ((n as any).items) {
      const r = findNode((n as any).items, id)
      if (r.node) return r
    }
  }
  return { parent: null, node: null, index: -1 }
}

function makeLists(): List[] {
  const l1: List = { id: 'l1', name: '一', description: '', items: [createItem('a'), createItem('b')] }
  const l2: List = { id: 'l2', name: '二', description: '', items: [] }
  return [l1, l2]
}

describe('applyMove', () => {
  it('移动到另一列表根层', () => {
    const { lists } = applyMove(makeLists(), { fromListId: 'l1', nodeId: 'a', toKind: 'list', toId: 'l2' }, NOW)
    const l2 = lists.find((l) => l.id === 'l2')!
    expect(l2.items.map((n) => n.id)).toContain('a')
    expect(findNode(lists[0].items, 'a').node).toBeNull()
  })

  it('移入组合子层', () => {
    const lists = makeLists()
    const g = createGroup('g')
    lists[0].items.push(g)
    const { lists: out } = applyMove(lists, { fromListId: 'l1', nodeId: 'a', toKind: 'group', toId: g.id }, NOW)
    const g2 = findNode(out[0].items, g.id).node
    expect(g2.items.map((n) => n.id)).toContain('a')
  })

  it('移到事项上自动建组合并包裹两者', () => {
    const { lists, createdGroupId } = applyMove(makeLists(), { fromListId: 'l1', nodeId: 'a', toKind: 'item', toId: 'b' }, NOW)
    const g = findNode(lists[0].items, createdGroupId!).node
    expect(g).not.toBeNull()
    expect(g.name).toBe('b · a')
    expect(g.items.map((n) => n.id).sort()).toEqual(['a', 'b'])
  })

  it('移动到自身无效', () => {
    const src = makeLists()
    const { lists } = applyMove(src, { fromListId: 'l1', nodeId: 'a', toKind: 'item', toId: 'a' }, NOW)
    expect(lists).toBe(src)
  })

  it('移入自己的后代无效', () => {
    const lists = makeLists()
    const g = createGroup('g')
    const child = createItem('child')
    g.items = [child]
    lists[0].items.push(g)
    const { lists: out } = applyMove(lists, { fromListId: 'l1', nodeId: 'g', toKind: 'item', toId: child.id }, NOW)
    expect(out).toBe(lists)
  })
})
```

- [ ] **Step 2: 运行验证失败**

运行: `npm test`
Expected: FAIL（模块不存在）。

- [ ] **Step 3: 实现 move.ts**

`src/logic/move.ts`:
```ts
import { createGroup, type List, type TreeNode } from '../types'

export interface MoveSpec {
  fromListId: string
  nodeId: string
  toKind: 'list' | 'group' | 'item'
  toId: string
}

export interface MoveResult {
  lists: List[]
  createdGroupId?: string
}

function removeNode(nodes: TreeNode[], nodeId: string): { removed: TreeNode | null; rest: TreeNode[] } {
  const idx = nodes.findIndex((n) => n.id === nodeId)
  if (idx >= 0) return { removed: nodes[idx], rest: nodes.filter((_, i) => i !== idx) }
  let removed: TreeNode | null = null
  let rest = nodes
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i]
    if (Array.isArray((n as any).items)) {
      const r = removeNode((n as any).items, nodeId)
      if (r.removed) {
        removed = r.removed
        rest = nodes.map((x, j) => (j === i ? { ...(x as any), items: r.rest } : x))
        break
      }
    }
  }
  return { removed, rest }
}

function isDescendant(list: List, ancestorId: string, nodeId: string): boolean {
  const walk = (nodes: TreeNode[]): boolean => {
    for (const n of nodes) {
      if (n.id === ancestorId) return true
      if (Array.isArray((n as any).items)) {
        if (n.id === nodeId) return false
        if (walk((n as any).items)) return true
      }
    }
    return false
  }
  return walk(list.items)
}

function insertAt(nodes: TreeNode[], targetId: string, item: TreeNode, mode: 'after' | 'root'): TreeNode[] {
  const idx = nodes.findIndex((n) => n.id === targetId)
  if (idx >= 0) {
    const out = [...nodes]
    out.splice(idx + (mode === 'after' ? 1 : 0), 0, item)
    return out
  }
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i]
    if (Array.isArray((n as any).items)) {
      const r = insertAt((n as any).items, targetId, item, mode)
      if (r !== (n as any).items) return nodes.map((x, j) => (j === i ? { ...(x as any), items: r } : x))
    }
  }
  return nodes
}

export function applyMove(lists: List[], spec: MoveSpec): MoveResult {
  const srcList = lists.find((l) => l.id === spec.fromListId)
  if (!srcList) return { lists }
  if (spec.toKind === 'item' && spec.nodeId === spec.toId) return { lists }
  if (spec.toKind === 'group' && spec.nodeId === spec.toId) return { lists }
  if (isDescendant(srcList, spec.nodeId, spec.toId)) return { lists }

  const { removed, rest } = removeNode(srcList.items, spec.nodeId)
  if (!removed) return { lists }

  const tmp = lists.map((l) => (l.id === srcList.id ? { ...l, items: rest } : l))

  if (spec.toKind === 'item') {
    const group = createGroup(`${(findNodeText(tmp, spec.toId) ?? '')} · ${removed.name}`)
    group.items = [removed, findNodeRef(tmp, spec.toId)!]
    const listOfTarget = tmp.find((l) => containsId(l, spec.toId))!
    return {
      lists: tmp.map((l) =>
        l.id === listOfTarget.id ? { ...l, items: replaceNode(l.items, spec.toId, group) } : l,
      ),
      createdGroupId: group.id,
    }
  }

  if (spec.toKind === 'group') {
    const targetList = tmp.find((l) => containsId(l, spec.toId))!
    return {
      lists: tmp.map((l) =>
        l.id === targetList.id ? { ...l, items: appendIntoGroup(l.items, spec.toId, removed) } : l,
      ),
    }
  }

  const destList = tmp.find((l) => l.id === spec.toId)
  if (!destList) return { lists: tmp }
  return { lists: tmp.map((l) => (l.id === destList.id ? { ...l, items: [...l.items, removed] } : l)) }
}

function findNodeText(list: List, id: string): string | null {
  const r = findRef(list.items, id)
  return r ? r.name : null
}

function findNodeRef(list: List, id: string): TreeNode | null {
  return findRef(list.items, id)
}

function findRef(nodes: TreeNode[], id: string): TreeNode | null {
  for (const n of nodes) {
    if (n.id === id) return n
    if (Array.isArray((n as any).items)) {
      const r = findRef((n as any).items, id)
      if (r) return r
    }
  }
  return null
}

function containsId(list: List, id: string): boolean {
  return findRef(list.items, id) !== null
}

function replaceNode(nodes: TreeNode[], targetId: string, item: TreeNode): TreeNode[] {
  const idx = nodes.findIndex((n) => n.id === targetId)
  if (idx >= 0) return nodes.map((n, i) => (i === idx ? item : n))
  return nodes.map((n) =>
    Array.isArray((n as any).items) ? { ...(n as any), items: replaceNode((n as any).items, targetId, item) } : n,
  )
}

function appendIntoGroup(nodes: TreeNode[], targetId: string, item: TreeNode): TreeNode[] {
  const idx = nodes.findIndex((n) => n.id === targetId)
  if (idx >= 0) return nodes.map((n, i) => (i === idx ? { ...(n as any), items: [...(n as any).items, item] } : n))
  return nodes.map((n) =>
    Array.isArray((n as any).items) ? { ...(n as any), items: appendIntoGroup((n as any).items, targetId, item) } : n,
  )
}
```

- [ ] **Step 4: 运行验证通过**

运行: `npm test`
Expected: PASS。

- [ ] **Step 5: Commit**

```powershell
git add -A
git commit -m "feat: add drag move logic"
```

---

### Task 8: Pinia 数据 store

**Files:**
- Create: `src/stores/data.ts`
- Create: `src/stores/data.spec.ts`

**Interfaces:**
- Consumes: `src/types.ts`、`src/storage.ts`、`src/logic/status.ts`、`src/logic/move.ts`
- Produces（`useDataStore()`，Pinia setup store）:
  - state: `lists: List[]`、`currentListId: string`、`recovered: boolean`、`loadError: string`
  - getters: `currentList: List | undefined`、`nodeCount(listId): number`（递归计数，用于侧栏 X 数）
  - actions:
    - `init()` — 加载存储，解析失败置 `recovered=true`，列表为空则创建欢迎列表（见 Task 18 前先建占位欢迎列表），默认选中第一个列表
    - `addList(name, description)` / `renameList(id, name)` / `deleteList(id)`
    - `addNode(parentId: string | null, node: TreeNode)`（parentId=null 表示当前列表根层）
    - `updateNode(nodeId: string, patch: Partial<Item>)`（支持在嵌套内查找）
    - `toggleDone(nodeId: string)`（事项专用）
    - `toggleGroupExpanded(nodeId: string)`
    - `deleteNode(nodeId: string)`
    - `moveNode(spec: MoveSpec)` — 调 `applyMove` 后写回
    - `selectList(id: string)`
  - 持久化：对 `lists`、`currentListId` 深度 watch，300ms 防抖后 `saveTaskData`
  - 跨标签页：监听 `storage` 事件，键为 `STORE_KEY` 时重新 `init()`
  - `refreshNow()` — 触发状态重算（时间刷新用，见 Task 15）

**欢迎列表（本任务先用占位，Task 18 换成 welcome.json）：** `init()` 中 `lists.length === 0` 时创建：
```ts
const welcome: List = { id: 'welcome', name: '欢迎使用任务清单', description: '示例列表', items: [] }
```
（Task 18 替换为读取 `src/data/welcome.json`）

- [ ] **Step 1: 写失败测试**

`src/stores/data.spec.ts`:
```ts
import { setActivePinia, createPinia } from 'pinia'
import { useDataStore } from './data'
import { STORE_KEY, type List } from '../types'

describe('data store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('init 空数据创建欢迎列表并选中', () => {
    const s = useDataStore()
    s.init()
    expect(s.lists.length).toBe(1)
    expect(s.currentListId).toBe(s.lists[0].id)
  })

  it('addNode 加入当前列表根层', () => {
    const s = useDataStore()
    s.init()
    const before = s.lists[0].items.length
    s.addNode(null, { id: 'n1', name: 'x', description: '', done: false, createdAt: 1 })
    expect(s.lists[0].items.length).toBe(before + 1)
  })

  it('toggleDone 递归查找并翻转', () => {
    const s = useDataStore()
    s.init()
    s.addNode(null, { id: 'g', name: 'g', description: '', expanded: true, items: [{ id: 'c', name: 'c', description: '', done: false, createdAt: 1 }] })
    s.toggleDone('c')
    const g = s.lists[0].items[0] as any
    expect(g.items[0].done).toBe(true)
  })

  it('deleteNode 递归删除', () => {
    const s = useDataStore()
    s.init()
    s.addNode(null, { id: 'g', name: 'g', description: '', expanded: true, items: [{ id: 'c', name: 'c', description: '', done: false, createdAt: 1 }] })
    s.deleteNode('c')
    expect((s.lists[0].items[0] as any).items.length).toBe(0)
  })

  it('写入持久化并可从存储读回', async () => {
    const s = useDataStore()
    s.init()
    s.addNode(null, { id: 'n1', name: 'x', description: '', done: false, createdAt: 1 })
    await new Promise((r) => setTimeout(r, 400))
    expect(localStorage.getItem(STORE_KEY)).toContain('"n1"')
  })

  it('删除当前列表后切换到其他列表', () => {
    const s = useDataStore()
    s.init()
    const l1 = s.lists[0]
    const l2: List = { id: 'l2', name: 'two', description: '', items: [] }
    s.lists.push(l2)
    s.selectList(l2.id)
    s.deleteList(l1.id)
    expect(s.currentListId).toBe('l2')
  })
})
```

- [ ] **Step 2: 运行验证失败**

运行: `npm test`
Expected: FAIL（模块不存在）。

- [ ] **Step 3: 实现 data.ts**

`src/stores/data.ts`:
```ts
import { defineStore } from 'pinia'
import { createGroup, createItem, createList, STORE_KEY, type Item, type List, type TaskData, type TreeNode } from '../types'
import { loadTaskData, saveTaskData } from '../storage'
import { applyMove, type MoveSpec } from '../logic/move'
import { useUiStore } from './ui'

function findNode(nodes: TreeNode[], id: string): TreeNode | null {
  for (const n of nodes) {
    if (n.id === id) return n
    if (Array.isArray((n as any).items)) {
      const r = findNode((n as any).items, id)
      if (r) return r
    }
  }
  return null
}

function mapNodes(nodes: TreeNode[], id: string, fn: (n: TreeNode) => TreeNode): TreeNode[] {
  return nodes.map((n) => {
    if (n.id === id) return fn(n)
    if (Array.isArray((n as any).items)) return { ...(n as any), items: mapNodes((n as any).items, id, fn) }
    return n
  })
}

function filterNodes(nodes: TreeNode[], id: string): TreeNode[] {
  const out: TreeNode[] = []
  for (const n of nodes) {
    if (n.id === id) continue
    out.push(Array.isArray((n as any).items) ? { ...(n as any), items: filterNodes((n as any).items, id) } : n)
  }
  return out
}

function countNodes(nodes: TreeNode[]): number {
  return nodes.reduce((acc, n) => acc + 1 + (Array.isArray((n as any).items) ? countNodes((n as any).items) : 0), 0)
}

function makeWelcomeList(): List {
  const g = createGroup('欢迎使用「组合」')
  g.description = '组合内可以继续放事项或组合，点击箭头展开'
  g.expanded = true
  g.items = [createItem('组合会自动统计 X/Y 已完成')]
  const l = createList('欢迎使用任务清单')
  l.description = '这是一个示例列表，可以随意修改或删除'
  l.items = [
    createItem('点击事项左侧的圆圈，标记完成'),
    g,
    { ...createItem('这是一个无日期的事项'), description: '有日期的事项会按时间排序' },
    { ...createItem('已完成事项'), done: true },
  ]
  return l
}

export const useDataStore = defineStore('data', () => {
  const lists = ref<List[]>([])
  const currentListId = ref('')
  const recovered = ref(false)

  function persist() {
    const uiStore = useUiStore()
    const data: TaskData = {
      version: 1,
      lists: lists.value,
      settings: uiStore.settings,
      ui: { sidebarCollapsed: uiStore.sidebarCollapsed, expandedGroupIds: uiStore.expandedGroupIds },
    }
    saveTaskData(data)
  }

  let saveTimer: number | undefined
  function scheduleSave() {
    clearTimeout(saveTimer)
    saveTimer = window.setTimeout(persist, 300)
  }

  function init() {
    const { data, recovered: rec } = loadTaskData()
    recovered.value = rec
    lists.value = data.lists
    if (lists.value.length === 0) {
      lists.value = [makeWelcomeList()]
      persist()
    }
    if (!lists.value.some((l) => l.id === currentListId.value)) {
      currentListId.value = lists.value[0].id
    }
  }

  function selectList(id: string) {
    if (lists.value.some((l) => l.id === id)) currentListId.value = id
  }

  const currentList = computed(() => lists.value.find((l) => l.id === currentListId.value))

  function nodeCount(listId: string): number {
    const l = lists.value.find((x) => x.id === listId)
    return l ? countNodes(l.items) : 0
  }

  function addList(name: string, description: string) {
    const l = createList(name)
    l.description = description
    lists.value.push(l)
    currentListId.value = l.id
    scheduleSave()
  }

  function renameList(id: string, name: string) {
    lists.value = lists.value.map((l) => (l.id === id ? { ...l, name } : l))
    scheduleSave()
  }

  function deleteList(id: string) {
    lists.value = lists.value.filter((l) => l.id !== id)
    if (currentListId.value === id) currentListId.value = lists.value[0]?.id ?? ''
    scheduleSave()
  }

  function addNode(parentId: string | null, node: TreeNode) {
    const list = currentList.value
    if (!list) return
    if (parentId === null) {
      lists.value = lists.value.map((l) => (l.id === list.id ? { ...l, items: [...l.items, node] } : l))
    } else {
      lists.value = lists.value.map((l) =>
        l.id === list.id ? { ...l, items: mapNodes(l.items, parentId, (n) => ({ ...(n as any), items: [...(n as any).items, node] })) } : l,
      )
    }
    scheduleSave()
  }

  function updateNode(nodeId: string, patch: Partial<Item>) {
    const list = currentList.value
    if (!list) return
    lists.value = lists.value.map((l) =>
      l.id === list.id ? { ...l, items: mapNodes(l.items, nodeId, (n) => ({ ...n, ...patch })) } : l,
    )
    scheduleSave()
  }

  function toggleDone(nodeId: string) {
    updateNode(nodeId, { done: !((findNode(currentList.value!.items, nodeId) as Item)?.done) })
  }

  function toggleGroupExpanded(nodeId: string) {
    updateNode(nodeId, { expanded: !(findNode(currentList.value!.items, nodeId) as any)?.expanded } as any)
  }

  function deleteNode(nodeId: string) {
    const list = currentList.value
    if (!list) return
    lists.value = lists.value.map((l) => (l.id === list.id ? { ...l, items: filterNodes(l.items, nodeId) } : l))
    scheduleSave()
  }

  function moveNode(spec: MoveSpec) {
    const { lists: out } = applyMove(lists.value, spec)
    if (out !== lists.value) {
      lists.value = out
      scheduleSave()
    }
  }

  function refreshNow() {
    /* 状态由 computed 依赖 now()，见 Task 15 */
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === STORE_KEY) init()
    })
  }

  return { lists, currentListId, recovered, currentList, nodeCount, init, selectList, addList, renameList, deleteList, addNode, updateNode, toggleDone, toggleGroupExpanded, deleteNode, moveNode, refreshNow }
})
```

注意：以上使用了 `ref/computed`，需要在文件头部补 import：`import { computed, ref } from 'vue'`。`updateNode` 的 patch 同时适用于 Item/Group 字段（expanded、done、name、description、date、time）。

- [ ] **Step 4: 运行验证通过**

运行: `npm test`
Expected: PASS（data store 全部用例）。

- [ ] **Step 5: Commit**

```powershell
git add -A
git commit -m "feat: add pinia data store with persistence"
```

---

### Task 9: Pinia UI store 与 now 时钟

**Files:**
- Create: `src/stores/ui.ts`
- Create: `src/stores/ui.spec.ts`

**Interfaces:**
- Consumes: `src/types.ts`
- Produces（`useUiStore()`）:
  - state: `settings: Settings`、`sidebarCollapsed: boolean`、`expandedGroupIds: string[]`（展开状态冗余表）、`editMode: boolean`、`now: number`
  - actions: `setTheme`、`setFontSize`、`setLang`、`setShowDescription`、`toggleSidebar`、`setGroupExpanded(id, expanded)`、`toggleEditMode`、`touchNow()`（now=Date.now()）
  - `applyToDOM()` — 在 body 上设置 `data-theme` 与 `--font-size`
  - 持久化：settings/ui 变化时写回（与 data store 共用一个 `tasklist:v1` 键，由 App 统一持久化见 Task 10；本任务先将变化广播给 data store 的 `scheduleSave`——通过暴露 `persistHook` 简化：直接使用 `useDataStore().persist()` 的等价实现，在 App 中统一 watch 两者）

简化决策：**App.vue（Task 10）对 `dataStore.lists/currentListId` 与 `uiStore.$state` 统一 watch 并防抖保存**，本任务只定义 ui store 本身。

- [ ] **Step 1: 写失败测试**

`src/stores/ui.spec.ts`:
```ts
import { createPinia, setActivePinia } from 'pinia'
import { useUiStore } from './ui'

describe('ui store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    document.body.dataset.theme = ''
  })

  it('默认浅色与中文字号 16', () => {
    const s = useUiStore()
    expect(s.settings.theme).toBe('light')
    expect(s.settings.fontSize).toBe(16)
  })

  it('切换主题写入 DOM', () => {
    const s = useUiStore()
    s.setTheme('dark')
    expect(document.body.dataset.theme).toBe('dark')
  })

  it('字号写入 DOM', () => {
    const s = useUiStore()
    s.setFontSize(20)
    expect(document.body.style.fontSize).toBe('20px')
  })

  it('展开状态与编辑模式', () => {
    const s = useUiStore()
    s.setGroupExpanded('g1', true)
    expect(s.expandedGroupIds).toContain('g1')
    s.toggleEditMode()
    expect(s.editMode).toBe(true)
    s.toggleSidebar()
    expect(s.sidebarCollapsed).toBe(true)
  })
})
```

- [ ] **Step 2: 运行验证失败**

运行: `npm test`
Expected: FAIL（模块不存在）。

- [ ] **Step 3: 实现 ui.ts**

`src/stores/ui.ts`:
```ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Settings, Theme } from '../types'

export const useUiStore = defineStore('ui', () => {
  const settings = ref<Settings>({ theme: 'light', fontSize: 16, lang: 'zh', showDescription: true })
  const sidebarCollapsed = ref(false)
  const expandedGroupIds = ref<string[]>([])
  const editMode = ref(false)
  const now = ref(Date.now())

  function applyToDOM() {
    document.body.dataset.theme = settings.value.theme
    document.body.style.fontSize = `${settings.value.fontSize}px`
  }

  function setTheme(theme: Theme) {
    settings.value.theme = theme
    applyToDOM()
  }

  function setFontSize(size: number) {
    settings.value.fontSize = size
    applyToDOM()
  }

  function setLang(lang: string) {
    settings.value.lang = lang
  }

  function setShowDescription(v: boolean) {
    settings.value.showDescription = v
  }

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function setGroupExpanded(id: string, expanded: boolean) {
    const set = new Set(expandedGroupIds.value)
    if (expanded) set.add(id)
    else set.delete(id)
    expandedGroupIds.value = [...set]
  }

  function toggleEditMode() {
    editMode.value = !editMode.value
  }

  function touchNow() {
    now.value = Date.now()
  }

  applyToDOM()

  return { settings, sidebarCollapsed, expandedGroupIds, editMode, now, applyToDOM, setTheme, setFontSize, setLang, setShowDescription, toggleSidebar, setGroupExpanded, toggleEditMode, touchNow }
})
```

- [ ] **Step 4: 运行验证通过**

运行: `npm test`
Expected: PASS。

- [ ] **Step 5: Commit**

```powershell
git add -A
git commit -m "feat: add ui store"
```

---

### Task 10: 应用外壳与布局

**Files:**
- Create: `src/App.vue`（替换占位）
- Create: `src/components/Sidebar.vue`
- Create: `src/components/RightRail.vue`
- Create: `src/components/MainArea.vue`
- Create: `src/styles/variables.css`
- Modify: `src/styles/main.css`

**Interfaces:**
- Consumes: `useDataStore`、`useUiStore`
- Produces: 三栏布局骨架；App 统一 watch 持久化；逾期自动刷新定时器（60s `touchNow` + `visibilitychange`）；`data-store`/`ui-store` 初始化的时序（App onMounted 调 `dataStore.init()` 并 `uiStore.applyToDOM()`）；`<slot>` 形式或 props 传递由组件间直接使用 store（直接使用 store 更简单，采用全局 store 直连）

**布局说明（DESIGN.md §3.1/3.2/3.3）：** 左侧栏稍宽（固定 240px，窄屏 <720px 覆盖式，用 `sidebar-open` class 控制），主区自适应，右侧栏稍窄（64px，窄屏移到底部横排）。

- [ ] **Step 1: 创建 CSS 变量与全局样式**

`src/styles/variables.css`:
```css
:root {
  --color-bg: #f5f6f8;
  --color-surface: #ffffff;
  --color-text: #222222;
  --color-muted: #999999;
  --color-border: #e3e5e8;
  --color-overdue: #e03e3e;
  --color-pending: #3a7bd5;
  --color-done: #2fa35c;
  --color-overdue-deep: #c22f2f;
  --color-pending-deep: #2d62b0;
  --color-done-deep: #23824a;
  --color-group-deep: #1c3a5e;
}

body[data-theme='dark'] {
  --color-bg: #1a1c20;
  --color-surface: #26292f;
  --color-text: #e8e8e8;
  --color-muted: #8a8f98;
  --color-border: #3a3e46;
  --color-overdue: #ff6b6b;
  --color-pending: #6ea8ff;
  --color-done: #5ecb8a;
  --color-overdue-deep: #d94f4f;
  --color-pending-deep: #4f8ee0;
  --color-done-deep: #3aa86c;
  --color-group-deep: #3d5f8f;
}
```

`src/styles/main.css`:
```css
@import './variables.css';
* { box-sizing: border-box; }
html, body { margin: 0; height: 100%; }
body { font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; background: var(--color-bg); color: var(--color-text); }
#app { height: 100vh; display: flex; }
```

- [ ] **Step 2: 写占位结构组件（先通过渲染测试）**

`src/components/Sidebar.vue`:
```vue
<template>
  <aside class="sidebar" :class="{ open: !ui.sidebarCollapsed }">
    <div class="sidebar-head">
      <button class="icon-btn" data-test="toggle-sidebar" @click="ui.toggleSidebar()">
        {{ ui.sidebarCollapsed ? '☰' : '✕' }}
      </button>
    </div>
    <div class="sidebar-body" />
  </aside>
</template>

<script setup lang="ts">
import { useUiStore } from '../stores/ui'
const ui = useUiStore()
</script>

<style scoped>
.sidebar { width: 240px; flex-shrink: 0; background: var(--color-surface); border-right: 1px solid var(--color-border); display: flex; flex-direction: column; }
@media (max-width: 720px) {
  .sidebar { position: fixed; inset: 0 auto 0 0; z-index: 50; transform: translateX(-100%); transition: transform .2s; }
  .sidebar.open { transform: translateX(0); }
}
.sidebar-head { padding: 8px; }
.icon-btn { background: none; border: none; font-size: 18px; cursor: pointer; color: var(--color-text); }
</style>
```

`src/components/RightRail.vue`:
```vue
<template>
  <nav class="right-rail">
    <button class="icon-btn" title="+ 事项" @click="$emit('add-item')">+事项</button>
    <button class="icon-btn" title="+ 组合" @click="$emit('add-group')">+组合</button>
    <button class="icon-btn" :class="{ active: ui.editMode }" @click="ui.toggleEditMode()">编辑</button>
    <button class="icon-btn" @click="$emit('open-settings')">设置</button>
  </nav>
</template>

<script setup lang="ts">
import { useUiStore } from '../stores/ui'
const ui = useUiStore()
defineEmits<{ (e: 'add-item'): void; (e: 'add-group'): void; (e: 'open-settings'): void }>()
</script>

<style scoped>
.right-rail { width: 64px; flex-shrink: 0; display: flex; flex-direction: column; gap: 8px; padding: 8px; background: var(--color-surface); border-left: 1px solid var(--color-border); }
@media (max-width: 720px) { .right-rail { flex-direction: row; position: fixed; bottom: 0; left: 0; right: 0; height: 48px; border-left: none; border-top: 1px solid var(--color-border); } }
.icon-btn { background: none; border: 1px solid transparent; border-radius: 8px; padding: 10px 4px; cursor: pointer; color: var(--color-text); font-size: 13px; }
.icon-btn.active { border-color: var(--color-pending); color: var(--color-pending); }
</style>
```

`src/components/MainArea.vue`（占位，Task 11 填充内容）:
```vue
<template>
  <main class="main-area" data-test="main-area">
    <h2>{{ data.currentList?.name ?? '' }}</h2>
  </main>
</template>

<script setup lang="ts">
import { useDataStore } from '../stores/data'
const data = useDataStore()
</script>

<style scoped>
.main-area { flex: 1; overflow-y: auto; padding: 16px; }
</style>
```

- [ ] **Step 3: 组装 App.vue 并接入持久化与刷新**

`src/App.vue`:
```vue
<template>
  <Sidebar />
  <MainArea />
  <RightRail @add-item="onAddItem" @add-group="onAddGroup" @open-settings="settingsOpen = true" />
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch } from 'vue'
import { useDataStore } from './stores/data'
import { useUiStore } from './stores/ui'
import { createItem, createGroup, type TreeNode } from './types'
import { saveTaskData } from './storage'
import Sidebar from './components/Sidebar.vue'
import MainArea from './components/MainArea.vue'
import RightRail from './components/RightRail.vue'

const data = useDataStore()
const ui = useUiStore()
const settingsOpen = ref(false)

let saveTimer: number | undefined
function scheduleSave() {
  clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => {
    saveTaskData({ version: 1, lists: data.lists, settings: ui.settings, ui: { sidebarCollapsed: ui.sidebarCollapsed, expandedGroupIds: ui.expandedGroupIds } })
  }, 300)
}

watch(() => [data.lists, data.currentListId, ui.$state], scheduleSave, { deep: true })

let interval: number | undefined
onMounted(() => {
  data.init()
  ui.applyToDOM()
  interval = window.setInterval(ui.touchNow, 60_000)
  document.addEventListener('visibilitychange', onVisibility)
})
onBeforeUnmount(() => {
  clearInterval(interval)
  document.removeEventListener('visibilitychange', onVisibility)
})
function onVisibility() {
  if (document.visibilityState === 'visible') ui.touchNow()
}

function addNodeToCurrent(node: TreeNode) {
  if (!data.currentList) return
  data.addNode(null, node)
}
function onAddItem() { addNodeToCurrent(createItem('')) }
function onAddGroup() { addNodeToCurrent(createGroup('')) }
</script>
```

注意：`settingsOpen` 用到 `ref`，请在 `import { onMounted, onBeforeUnmount, watch, ref } from 'vue'` 中补上。`data.$state` 访问时用 storeToRefs 替代会丢 watch 语义——本实现保留直接访问。若 TS 报 `data.lists` 只读问题，在 store 中返回的 `lists` 已用 `ref` 包装，读写均正常。

- [ ] **Step 4: 运行构建与测试**

运行: `npm test; npm run build`
Expected: 测试通过；构建无类型错误。

- [ ] **Step 5: 手动验收**

运行: `npm run dev`，浏览器打开 `http://localhost:5173`
Expected: 左侧栏显示欢迎列表（含「点击事项左侧的圆圈」等占位事项）、右侧栏四个按钮、主区显示列表名。

- [ ] **Step 6: Commit**

```powershell
git add -A
git commit -m "feat: app shell with three-column layout"
```

---

### Task 11: 递归渲染与完成切换

**Files:**
- Create: `src/components/TaskList.vue`
- Create: `src/components/TaskRow.vue`
- Create: `src/components/GroupRow.vue`
- Create: `src/components/__tests__/TaskList.spec.ts`
- Modify: `src/components/MainArea.vue`

**Interfaces:**
- Consumes: `useDataStore`、`useUiStore`、`sortNodes`/`groupedNodes`/`nodeStatus`/`nodeTimestamp`（Task 3/4）、`formatDateLabel`（Task 5）、`t`（i18n，Task 12 前先内联中文文案）
- Produces:
  - `<TaskList :nodes="TreeNode[]" :depth="number" @add-into="(parentId) => ..." />` — 递归渲染层
  - `<TaskRow :item="Item" :depth="number" />`、`<GroupRow :group="Group" :depth="number" />`（GroupRow 内部嵌 `<TaskList :nodes="group.items">`）
  - 行点击行为：TaskRow 整行/圆圈→`toggleDone`；GroupRow 箭头/整行→展开收起（递归 Group 内 `expanded` 用 ui store 记忆冗余，合并判定：组自身 `expanded` 字段为准）

**关键决策：展开状态以 Group 自身 `expanded` 字段为准**（DESIGN.md：组合展开状态记忆；ui store 的 expandedGroupIds 仅用于快速判断，实际读写 Group.expanded）。

- [ ] **Step 1: 写组件渲染测试**

`src/components/__tests__/TaskList.spec.ts`:
```ts
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import TaskList from '../TaskList.vue'
import { useDataStore } from '../../stores/data'

describe('TaskList', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('渲染三类分组标题与行', () => {
    const s = useDataStore()
    s.init()
    s.lists = [{
      id: 'l', name: 'L', description: '',
      items: [
        { id: 'a', name: '逾期项', description: '', date: '2026-01-01', done: false, createdAt: 1 },
        { id: 'b', name: '待办', description: '', done: false, createdAt: 2 },
        { id: 'c', name: '完成项', description: '', done: true, createdAt: 3 },
      ],
    }]
    const w = mount(TaskList, { props: { nodes: s.lists[0].items as any, depth: 0 }, global: { plugins: [createPinia()] } })
    expect(w.text()).toContain('逾期项')
    expect(w.text()).toContain('待办')
    expect(w.text()).toContain('完成项')
  })

  it('点击行切换完成状态', async () => {
    const s = useDataStore()
    s.init()
    s.lists = [{
      id: 'l', name: 'L', description: '',
      items: [{ id: 'a', name: '任务', description: '', done: false, createdAt: 1 }],
    }]
    s.currentListId = 'l'
    const w = mount(TaskList, { props: { nodes: s.lists[0].items as any, depth: 0 }, global: { plugins: [createPinia()] } })
    await w.find('[data-test="row"]').trigger('click')
    expect((s.lists[0].items[0] as any).done).toBe(true)
  })
})
```

- [ ] **Step 2: 运行验证失败**

运行: `npm test`
Expected: FAIL（组件不存在）。

- [ ] **Step 3: 实现三个组件**

`src/components/TaskList.vue`:
```vue
<template>
  <div class="task-list" :style="{ '--depth': depth }">
    <template v-if="grouped.overdue.length">
      <div class="group-head overdue" data-test="group-head-overdue">已逾期 <span class="rule" /></div>
      <NodeRow v-for="n in grouped.overdue" :key="n.id" :node="n" :depth="depth" />
    </template>
    <template v-if="grouped.pending.length">
      <div class="group-head pending">未完成 <span class="rule" /></div>
      <NodeRow v-for="n in grouped.pending" :key="n.id" :node="n" :depth="depth" />
    </template>
    <template v-if="grouped.done.length">
      <div class="group-head done">已完成 <span class="rule" /></div>
      <NodeRow v-for="n in grouped.done" :key="n.id" :node="n" :depth="depth" />
    </template>
    <div v-if="isEmpty" class="empty-tip" data-test="empty-tip">暂无事项</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUiStore } from '../stores/ui'
import { groupedNodes } from '../logic/sort'
import type { TreeNode } from '../types'
import NodeRow from './NodeRow.vue'

const props = defineProps<{ nodes: TreeNode[]; depth: number }>()
const ui = useUiStore()
const grouped = computed(() => groupedNodes(props.nodes, ui.now))
const isEmpty = computed(() => props.nodes.length === 0)
</script>
```

为保持递归干净，增加中间组件 `src/components/NodeRow.vue`（区分 Item/Group 分发到 TaskRow/GroupRow）:
```vue
<template>
  <TaskRow v-if="isGroup(node) === false" :item="node as Item" :depth="depth" />
  <GroupRow v-else :group="node as Group" :depth="depth" />
</template>

<script setup lang="ts">
import { isGroup } from '../logic/status'
import type { Group, Item, TreeNode } from '../types'
import TaskRow from './TaskRow.vue'
import GroupRow from './GroupRow.vue'
defineProps<{ node: TreeNode; depth: number }>()
</script>
```

`src/components/TaskRow.vue`:
```vue
<template>
  <div class="row" :class="statusClass" data-test="row" @click="data.toggleDone(item.id)">
    <span class="dot" :class="{ done: item.done }" data-test="dot" />
    <span class="name">{{ item.name }}</span>
    <span v-if="showDesc && item.description" class="desc"> · {{ item.description }}</span>
    <span class="spacer" />
    <span v-if="item.date" class="meta">{{ dateLabel }}</span>
    <template v-if="ui.editMode">
      <button class="mini-btn" @click.stop="$emit('edit', item.id)">编辑</button>
      <button class="mini-btn danger" @click.stop="$emit('remove', item.id)">删除</button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDataStore } from '../stores/data'
import { useUiStore } from '../stores/ui'
import { formatDateLabel } from '../logic/dates'
import { itemTimestamp, nodeStatus } from '../logic/status'
import type { Item } from '../types'

const props = defineProps<{ item: Item; depth: number }>()
const emit = defineEmits<{ (e: 'edit', id: string): void; (e: 'remove', id: string): void }>()
const data = useDataStore()
const ui = useUiStore()

const statusClass = computed(() => {
  const s = nodeStatus(props.item, ui.now)
  return s === 'overdue' ? 'overdue' : s === 'done' ? 'done' : 'pending'
})
const showDesc = computed(() => ui.settings.showDescription && !!props.item.description)
const dateLabel = computed(() => {
  if (!props.item.date) return ''
  const label = formatDateLabel(props.item.date, new Date(ui.now))
  const t = props.item.time ?? ''
  return label === 'yesterday' || label === 'today' || label === 'tomorrow' || label === 'dayAfterTomorrow'
    ? label + (t ? ` ${t}` : '')
    : label + (t ? ` ${t}` : '')
})
</script>

<style scoped>
.row { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 10px; background: var(--color-surface); margin-bottom: 6px; cursor: pointer; }
.overdue { background: color-mix(in srgb, var(--color-overdue) 12%, var(--color-surface)); }
.pending { background: color-mix(in srgb, var(--color-pending) 8%, var(--color-surface)); }
.done { background: color-mix(in srgb, var(--color-done) 8%, var(--color-surface)); }
.dot { width: 16px; height: 16px; border-radius: 50%; border: 2px solid var(--color-muted); flex-shrink: 0; }
.dot.done { border-color: var(--color-done); background: var(--color-done); }
.name { font-size: 15px; }
.desc { color: var(--color-muted); font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.spacer { flex: 1; }
.meta { color: var(--color-muted); font-size: 12px; }
.mini-btn { background: none; border: none; color: var(--color-muted); cursor: pointer; font-size: 12px; }
.mini-btn.danger:hover { color: var(--color-overdue); }
</style>
```

`src/components/GroupRow.vue`:
```vue
<template>
  <div>
    <div class="row" :class="statusClass" data-test="row" @click="toggle">
      <span class="arrow" :class="{ open: group.expanded }" data-test="arrow">▸</span>
      <span class="name">{{ group.name }}</span>
      <span v-if="showDesc && group.description" class="desc"> · {{ group.description }}</span>
      <span class="spacer" />
      <span v-if="group.date" class="meta">{{ dateLabel }}</span>
      <span class="meta">{{ doneCount }}/{{ totalCount }} 已完成</span>
      <template v-if="ui.editMode">
        <button class="mini-btn" @click.stop="$emit('edit', group.id)">编辑</button>
        <button class="mini-btn" @click.stop="$emit('add-item', group.id)">+事项</button>
        <button class="mini-btn" @click.stop="$emit('add-group', group.id)">+组合</button>
        <button class="mini-btn danger" @click.stop="$emit('remove', group.id)">删除</button>
      </template>
    </div>
    <div v-if="group.expanded" class="children">
      <div class="indent-line" />
      <TaskList :nodes="group.items" :depth="depth + 1" @edit="$emit('edit', $event)" @remove="$emit('remove', $event)" @add-item="$emit('add-item', $event)" @add-group="$emit('add-group', $event)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDataStore } from '../stores/data'
import { useUiStore } from '../stores/ui'
import { formatDateLabel } from '../logic/dates'
import { groupStatus } from '../logic/status'
import type { Group } from '../types'
import TaskList from './TaskList.vue'

const props = defineProps<{ group: Group; depth: number }>()
const emit = defineEmits<{ (e: 'edit', id: string): void; (e: 'remove', id: string): void; (e: 'add-item', parentId: string): void; (e: 'add-group', parentId: string): void }>()
const data = useDataStore()
const ui = useUiStore()

const statusClass = computed(() => {
  const s = groupStatus(props.group, ui.now)
  return s === 'overdue' ? 'overdue' : s === 'done' ? 'done' : 'pending'
})
const showDesc = computed(() => ui.settings.showDescription && !!props.group.description)
const dateLabel = computed(() => {
  if (!props.group.date) return ''
  const label = formatDateLabel(props.group.date, new Date(ui.now))
  return label + (props.group.time ? ` ${props.group.time}` : '')
})

function countRecursive(nodes: any[]): { done: number; total: number } {
  let done = 0, total = 0
  for (const n of nodes) {
    if (Array.isArray(n.items)) { const r = countRecursive(n.items); done += r.done; total += r.total }
    else { total += 1; if (n.done) done += 1 }
  }
  return { done, total }
}
const { done: doneCount, total: totalCount } = countRecursive(props.group.items)

function toggle() {
  data.updateNode(props.group.id, { expanded: !props.group.expanded } as any)
  ui.setGroupExpanded(props.group.id, !props.group.expanded)
}
</script>

<style scoped>
.row { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 10px; background: var(--color-surface); margin-bottom: 6px; cursor: pointer; border: 1px solid var(--color-border); }
.overdue { background: color-mix(in srgb, var(--color-overdue-deep) 15%, var(--color-surface)); }
.pending { background: color-mix(in srgb, var(--color-pending-deep) 12%, var(--color-surface)); }
.done { background: color-mix(in srgb, var(--color-done-deep) 12%, var(--color-surface)); }
.arrow { display: inline-block; width: 16px; transition: transform .15s; color: var(--color-muted); }
.arrow.open { transform: rotate(90deg); }
.name { font-weight: 600; }
.desc { color: var(--color-muted); font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.spacer { flex: 1; }
.meta { color: var(--color-muted); font-size: 12px; }
.mini-btn { background: none; border: none; color: var(--color-muted); cursor: pointer; font-size: 12px; }
.mini-btn.danger:hover { color: var(--color-overdue); }
.children { position: relative; margin-left: 18px; padding-left: 14px; }
.indent-line { position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: var(--color-border); }
</style>
```

- [ ] **Step 4: 组装 MainArea**

`src/components/MainArea.vue`:
```vue
<template>
  <main class="main-area" data-test="main-area">
    <template v-if="data.currentList">
      <h2 class="list-title">{{ data.currentList.name }}</h2>
      <p v-if="data.currentList.description" class="list-desc">{{ data.currentList.description }}</p>
      <TaskList :nodes="data.currentList.items" :depth="0" @add-item="onAddItem" @add-group="onAddGroup" />
    </template>
    <div v-else class="empty-tip">暂无列表</div>
  </main>
</template>

<script setup lang="ts">
import { useDataStore } from '../stores/data'
import { createGroup, createItem } from '../types'
import TaskList from './TaskList.vue'

const data = useDataStore()

function onAddItem(parentId: string | null) {
  if (!data.currentList) return
  data.addNode(parentId, createItem(''))
}
function onAddGroup(parentId: string | null) {
  if (!data.currentList) return
  data.addNode(parentId, createGroup(''))
}
</script>

<style scoped>
.main-area { flex: 1; overflow-y: auto; padding: 16px 20px; }
.list-title { margin: 0 0 4px; }
.list-desc { margin: 0 0 12px; color: var(--color-muted); font-size: 13px; }
</style>
```

- [ ] **Step 5: 运行验证**

运行: `npm test; npm run build`
Expected: TaskList 测试通过；构建无类型错误。

- [ ] **Step 6: Commit**

```powershell
git add -A
git commit -m "feat: recursive rendering with status grouping"
```

---

### Task 12: 弹窗与表单（新建/编辑/删除）

**Files:**
- Create: `src/components/ModalDialog.vue`
- Create: `src/components/ConfirmDialog.vue`
- Create: `src/components/ItemForm.vue`
- Create: `src/components/GroupForm.vue`
- Create: `src/components/ListForm.vue`
- Create: `src/components/__tests__/ModalDialog.spec.ts`
- Modify: `src/App.vue`、`src/components/Sidebar.vue`、`src/components/MainArea.vue`

**Interfaces:**
- Consumes: `useDataStore`、`useUiStore`（编辑模式）、`createItem`/`createGroup`/`createList`
- Produces:
  - `<ModalDialog :open="boolean" @close>` — 中央遮罩弹窗：Esc 取消、点击遮罩取消；内部 `title` slot + `actions` slot
  - `<ConfirmDialog :open :title :message @confirm @cancel>`
  - `<ItemForm v-model:name v-model:description v-model:date v-model:time v-model:hasDate v-model:hasTime :editing>`
  - `<GroupForm>`（name/description，同 ListForm 结构）
  - 表单校验：名称必填，空名称时确认按钮置灰/提示

**日期/时间编辑（DESIGN.md §3.6.3）：** 【开关】日期，打开后显示 `<input type="date">`；【开关】时间（需先开日期），打开后显示 `<input type="time">`。时间前置校验：未开日期时时间开关禁用。

- [ ] **Step 1: 写 ModalDialog 测试**

`src/components/__tests__/ModalDialog.spec.ts`:
```ts
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ModalDialog from '../ModalDialog.vue'

describe('ModalDialog', () => {
  it('关闭状态不渲染', () => {
    const w = mount(ModalDialog, { props: { open: false } })
    expect(w.find('[data-test="modal"]').exists()).toBe(false)
  })

  it('Esc 触发关闭', async () => {
    const w = mount(ModalDialog, { props: { open: true } })
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    expect(w.emitted('close')).toBeTruthy()
    w.unmount()
  })

  it('点击遮罩触发关闭，点击内容不触发', async () => {
    const w = mount(ModalDialog, { props: { open: true } })
    await w.find('[data-test="modal"]').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
    await w.find('[data-test="dialog"]').trigger('click')
    expect(w.emitted('close')).toHaveLength(1)
  })
})
```

- [ ] **Step 2: 运行验证失败**

运行: `npm test`
Expected: FAIL。

- [ ] **Step 3: 实现 ModalDialog 与 ConfirmDialog**

`src/components/ModalDialog.vue`（Esc 通过 window keydown 监听——遮罩 div 不可聚焦，事件挂在它上面在浏览器中不会触发）:
```vue
<template>
  <Teleport to="body">
    <div v-if="open" class="overlay" data-test="modal" @click.self="$emit('close')">
      <div class="dialog" data-test="dialog" role="dialog">
        <slot name="title"><h3 /></slot>
        <div class="body"><slot /></div>
        <div class="actions"><slot name="actions" /></div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

watch(
  () => props.open,
  (open) => {
    if (open) window.addEventListener('keydown', onKey)
    else window.removeEventListener('keydown', onKey)
  },
)
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<style scoped>
.overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, .4); display: flex; align-items: center; justify-content: center; z-index: 100; }
.dialog { background: var(--color-surface); border-radius: 12px; padding: 16px 20px; min-width: 320px; max-width: 90vw; box-shadow: 0 8px 30px rgba(0, 0, 0, .25); }
.body { margin: 12px 0; }
.actions { display: flex; justify-content: flex-end; gap: 8px; }
</style>
```

`src/components/ConfirmDialog.vue`:
```vue
<template>
  <ModalDialog :open="open" @close="$emit('cancel')">
    <template #title><h3>{{ title }}</h3></template>
    <p>{{ message }}</p>
    <template #actions>
      <button class="btn" @click="$emit('cancel')">取消</button>
      <button class="btn danger" data-test="confirm" @click="$emit('confirm')">删除</button>
    </template>
  </ModalDialog>
</template>

<script setup lang="ts">
import ModalDialog from './ModalDialog.vue'
defineProps<{ open: boolean; title: string; message: string }>()
defineEmits<{ (e: 'confirm'): void; (e: 'cancel'): void }>()
</script>

<style scoped>
.btn { padding: 6px 14px; border-radius: 8px; border: 1px solid var(--color-border); background: var(--color-surface); cursor: pointer; }
.btn.danger { background: var(--color-overdue); color: #fff; border: none; }
</style>
```

- [ ] **Step 4: 实现三个表单组件**

`src/components/ItemForm.vue`:
```vue
<template>
  <div class="form">
    <label>名称 *<input v-model="name" data-test="name" @keydown.enter="trySubmit" /></label>
    <label>描述<input v-model="description" /></label>
    <label class="switch-row"><span>日期</span><input type="checkbox" v-model="hasDate" /></label>
    <div v-if="hasDate" class="nested">
      <label><input type="date" v-model="date" /></label>
    </div>
    <label class="switch-row"><span>时间</span><input type="checkbox" v-model="hasTime" :disabled="!hasDate" /></label>
    <div v-if="hasTime" class="nested">
      <label><input type="time" v-model="time" /></label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{ name: string; description: string; date?: string; time?: string }>()
const emit = defineEmits<{
  (e: 'update:name', v: string): void
  (e: 'update:description', v: string): void
  (e: 'update:date', v?: string): void
  (e: 'update:time', v?: string): void
  (e: 'submit'): void
}>()

const name = ref(props.name)
const description = ref(props.description)
const hasDate = ref(!!props.date)
const hasTime = ref(!!props.time)
const date = ref(props.date ?? '')
const time = ref(props.time ?? '')

watch(name, (v) => emit('update:name', v))
watch(description, (v) => emit('update:description', v))
watch(hasDate, (v) => {
  emit('update:date', v ? (date.value || undefined) : undefined)
  if (!v) { hasTime.value = false; emit('update:time', undefined) }
})
watch(date, (v) => { if (hasDate.value) emit('update:date', v || undefined) })
watch(hasTime, (v) => emit('update:time', v ? (time.value || undefined) : undefined))
watch(time, (v) => { if (hasTime.value) emit('update:time', v || undefined) })

function trySubmit() { emit('submit') }
</script>

<style scoped>
.form { display: flex; flex-direction: column; gap: 10px; }
label { display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: var(--color-muted); }
input[type='text'], input[type='date'], input[type='time'] { padding: 8px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-surface); color: var(--color-text); font-size: 14px; }
.switch-row { flex-direction: row; align-items: center; gap: 8px; }
.switch-row span { flex: 1; }
.nested { padding-left: 20px; }
</style>
```

`src/components/GroupForm.vue` 与 `src/components/ListForm.vue`（同为名称/描述两输入框）:

`src/components/ListForm.vue`:
```vue
<template>
  <div class="form">
    <label>名称 *<input v-model="name" data-test="name" @keydown.enter="trySubmit" /></label>
    <label>描述<input v-model="description" /></label>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{ name: string; description: string }>()
const emit = defineEmits<{ (e: 'update:name', v: string): void; (e: 'update:description', v: string): void; (e: 'submit'): void }>()
const name = ref(props.name)
const description = ref(props.description)
watch(name, (v) => emit('update:name', v))
watch(description, (v) => emit('update:description', v))
function trySubmit() { emit('submit') }
</script>

<style scoped>
.form { display: flex; flex-direction: column; gap: 10px; }
label { display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: var(--color-muted); }
input { padding: 8px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-surface); color: var(--color-text); font-size: 14px; }
</style>
```

`src/components/GroupForm.vue` 复制 ListForm，仅把组件名/注释改为组合（内容相同）。

- [ ] **Step 5: 接入 App/MainArea/Sidebar 的弹窗流程**

`src/App.vue` 增加（追加到现有 script setup，并给 template 加 `<ConfirmDialog .../>` 等）：
```ts
import ConfirmDialog from './components/ConfirmDialog.vue'
import ModalDialog from './components/ModalDialog.vue'
import ListForm from './components/ListForm.vue'
import ItemForm from './components/ItemForm.vue'
import GroupForm from './components/GroupForm.vue'
import type { Item, Group } from './types'

const editingTarget = ref<'item' | 'group' | 'list' | null>(null)
const editingId = ref<string | null>(null)
const editingParentId = ref<string | null>(null)
const formName = ref('')
const formDescription = ref('')
const formDate = ref<string>()
const formTime = ref<string>()
const deletingId = ref<string | null>(null)
const deletingType = ref<'list' | 'node' | null>(null)

function openNewItem(parentId: string | null) {
  editingTarget.value = 'item'; editingId.value = null; editingParentId.value = parentId
  formName.value = ''; formDescription.value = ''; formDate.value = undefined; formTime.value = undefined
}
function openNewGroup(parentId: string | null) {
  editingTarget.value = 'group'; editingId.value = null; editingParentId.value = parentId
  formName.value = ''; formDescription.value = ''
}
function openEditNode(id: string) {
  const node = findNodeDeep(data.currentList!.items, id)
  if (!node) return
  editingTarget.value = 'item' in node ? 'item' : 'group'
  editingId.value = id
  formName.value = node.name; formDescription.value = node.description
  formDate.value = (node as Item).date; formTime.value = (node as Item).time
}
function findNodeDeep(nodes: any[], id: string): any {
  for (const n of nodes) {
    if (n.id === id) return n
    if (Array.isArray(n.items)) { const r = findNodeDeep(n.items, id); if (r) return r }
  }
  return null
}
function saveItemForm() {
  if (!formName.value.trim()) return
  const patch = { name: formName.value.trim(), description: formDescription.value, date: formDate.value, time: formTime.value }
  if (editingId.value) data.updateNode(editingId.value, patch as any)
  else data.addNode(editingParentId.value, { ...createItem(formName.value.trim()), description: formDescription.value, date: formDate.value, time: formTime.value } as any)
  editingTarget.value = null
}
function saveGroupForm() {
  if (!formName.value.trim()) return
  if (editingId.value) data.updateNode(editingId.value, { name: formName.value.trim(), description: formDescription.value } as any)
  else data.addNode(editingParentId.value, { ...createGroup(formName.value.trim()), description: formDescription.value } as any)
  editingTarget.value = null
}
function confirmDelete() {
  if (deletingType.value === 'list' && deletingId.value) data.deleteList(deletingId.value)
  if (deletingType.value === 'node' && deletingId.value) data.deleteNode(deletingId.value)
  deletingId.value = null; deletingType.value = null
}
```

`src/components/Sidebar.vue` 增加列表渲染（替换 `.sidebar-body`）与新增/编辑/删除/双击重命名：
```vue
<template>
  <aside class="sidebar" :class="{ open: !ui.sidebarCollapsed }">
    <div class="sidebar-head">
      <button class="icon-btn" @click="ui.toggleSidebar()">{{ ui.sidebarCollapsed ? '☰' : '✕' }}</button>
      <button class="icon-btn" @click="$emit('new-list')">+ 新建列表</button>
    </div>
    <div class="sidebar-body">
      <div v-for="l in data.lists" :key="l.id" class="list-item" :class="[{ active: l.id === data.currentListId }, statusOf(l)]" @click="data.selectList(l.id)">
        <span class="list-name" @dblclick="startRename(l)">{{ l.name }}</span>
        <span v-if="ui.editMode" class="mini-btn danger" @click.stop="$emit('delete-list', l.id)">删除</span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDataStore } from '../stores/data'
import { useUiStore } from '../stores/ui'
import { nodeStatus } from '../logic/status'
import type { List } from '../types'

const data = useDataStore()
const ui = useUiStore()
const emit = defineEmits<{ (e: 'new-list'): void; (e: 'delete-list', id: string): void }>()

function statusOf(l: List) {
  const nodes = l.items
  if (nodes.some((n) => nodeStatus(n, ui.now) === 'overdue')) return 'overdue'
  if (nodes.every((n) => nodeStatus(n, ui.now) === 'done') && nodes.length > 0) return 'done'
  return 'pending'
}
function startRename(l: List) {
  const name = prompt('重命名列表', l.name)
  if (name?.trim()) data.renameList(l.id, name.trim())
}
</script>

<style scoped>
.sidebar { width: 240px; ... }
.sidebar-body { flex: 1; overflow-y: auto; padding: 0 8px; }
.list-item { display: flex; align-items: center; gap: 6px; padding: 8px 10px; border-radius: 8px; cursor: pointer; margin-bottom: 4px; color: var(--color-text); }
.list-item.active { outline: 1px solid var(--color-border); background: var(--color-bg); }
.overdue { color: var(--color-overdue); }
.pending { color: var(--color-pending); }
.done { color: var(--color-done); }
.list-name { flex: 1; }
.mini-btn { background: none; border: none; color: var(--color-muted); cursor: pointer; }
.mini-btn.danger:hover { color: var(--color-overdue); }
</style>
```

`src/App.vue` template 追加（放在 RightRail 之后）：
```vue
    <ModalDialog :open="editingTarget !== null" @close="editingTarget = null">
      <template #title><h3>{{ editingId ? '编辑' : '新建' }} {{ editingTarget === 'item' ? '事项' : editingTarget === 'group' ? '组合' : '' }}</h3></template>
      <ItemForm v-if="editingTarget === 'item'" v-model:name="formName" v-model:description="formDescription" v-model:date="formDate" v-model:time="formTime" @submit="saveItemForm" />
      <GroupForm v-else-if="editingTarget === 'group'" v-model:name="formName" v-model:description="formDescription" @submit="saveGroupForm" />
      <template #actions>
        <button class="btn" @click="editingTarget = null">取消</button>
        <button class="btn primary" data-test="save" :disabled="!formName.trim()" @click="editingTarget === 'item' ? saveItemForm() : saveGroupForm()">确认</button>
      </template>
    </ModalDialog>
    <ConfirmDialog :open="deletingType !== null" title="确认删除" message="删除后不可恢复" @confirm="confirmDelete" @cancel="deletingId = null; deletingType = null" />
```

事件接线：`<MainArea @edit-node="openEditNode" @remove-node="(id) => { deletingId = id; deletingType = 'node' }" @add-item="openNewItem" @add-group="openNewGroup" />`（MainArea 内部透传 TaskList 的 emit）。`<Sidebar @new-list="openNewList" @delete-list="(id) => { deletingId = id; deletingType = 'list' }" />`。RightRail 的 add-item/add-group 改为 `openNewItem(null)/openNewGroup(null)`。

`openNewList()`:
```ts
function openNewList() {
  editingTarget.value = 'list'; editingId.value = null
  formName.value = ''; formDescription.value = ''
}
function saveListForm() {
  if (!formName.value.trim()) return
  if (editingId.value) data.renameList(editingId.value, formName.value.trim())
  else data.addList(formName.value.trim(), formDescription.value)
  editingTarget.value = null
}
```
（列表弹窗用 ListForm，App 中 `editingTarget === 'list'` 分支渲染 ListForm。）

- [ ] **Step 6: 运行验证**

运行: `npm test; npm run build`
Expected: 测试通过；构建无类型错误。

- [ ] **Step 7: 手动验收**

运行: `npm run dev`
- 右侧【+事项】弹出表单，空名称时确认按钮禁用
- 编辑模式开启后行内出现【编辑】【删除】；删除弹确认框；Esc 关闭弹窗

- [ ] **Step 8: Commit**

```powershell
git add -A
git commit -m "feat: modal dialogs and forms"
```

---

### Task 13: 拖拽

**Files:**
- Create: `src/composables/useDrag.ts`
- Create: `src/composables/useDrag.spec.ts`
- Create: `src/components/DragPreview.vue`
- Modify: `src/components/TaskList.vue`、`src/components/NodeRow.vue`、`src/components/GroupRow.vue`、`src/components/TaskRow.vue`、`src/components/MainArea.vue`

**Interfaces:**
- Consumes: `applyMove`/`MoveSpec`（Task 7）、`useDataStore`、`useUiStore`
- Produces:
  - `src/composables/useDrag.ts`（模块级单例）：`dragState: Ref<DragState | null>`、`beginDrag(nodeId, listId, parentId, e)`、`setDropHandler(fn)`、`resetDrag()`、纯函数 `shouldStartDrag(sx, sy, cx, cy)` 与 `resolveDropTarget(el)`
  - `DragState = { nodeId, listId, parentId, x, y, width, height, active }`；`DropTarget = { id, kind: 'item' | 'group' }`
  - `DragPreview.vue`：跟随指针的半透明预览卡片

**交互（DESIGN.md §4.4）：** 拖到组合上→入子层；拖到事项上→自动建组合；拖到空白处→根层；无效目标→还原。半透明预览：跟随指针的 `position: fixed` 卡片。

**简化实现方案：** 每个 NodeRow 在 pointerdown 时启动追踪（记录起点）；指针移动超过 8px 标记 dragging；dragging 期间 body 增加 `dragging` class（`.row { pointer-events: none }` 由 DragPreview 全屏层接管，`document.elementFromPoint` 判定 drop 目标）。pointerup 时：若目标行是组合→`moveNode({toKind:'group', toId})`；是事项→`toKind:'item'`；无目标→`toKind:'list', toId: currentListId`。目标行高亮由 TaskList 监听 `dragover` 事件更新 `hoverId`。

- [ ] **Step 1: 写 composable 测试**

`src/composables/useDrag.spec.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { shouldStartDrag, resolveDropTarget } from './useDrag'

describe('useDrag helpers', () => {
  it('位移超过 8px 触发拖拽', () => {
    expect(shouldStartDrag(0, 0, 9, 0)).toBe(true)
    expect(shouldStartDrag(0, 0, 8, 0)).toBe(false)
    expect(shouldStartDrag(0, 0, 0, 20)).toBe(true)
  })

  it('elementFromPoint 命中组合返回 group', () => {
    const el = { dataset: { dropId: 'g1', dropKind: 'group' } } as unknown as Element
    const target = resolveDropTarget(el)
    expect(target).toEqual({ id: 'g1', kind: 'group' })
  })

  it('无命中返回 null（根层处理）', () => {
    expect(resolveDropTarget(null)).toBeNull()
  })
})
```

- [ ] **Step 2: 运行验证失败**

运行: `npm test`
Expected: FAIL。

- [ ] **Step 3: 实现 useDrag**

`src/composables/useDrag.ts`（模块级单例：行组件共享同一拖拽状态，TaskList 统一注册 drop 回调并渲染预览）:
```ts
import { ref } from 'vue'

export interface DragState {
  nodeId: string
  listId: string
  parentId: string | null
  x: number
  y: number
  width: number
  height: number
  active: boolean
}

export interface DropTarget { id: string; kind: 'item' | 'group' }

export const DRAG_THRESHOLD = 8

export function shouldStartDrag(sx: number, sy: number, cx: number, cy: number): boolean {
  return Math.hypot(cx - sx, cy - sy) > DRAG_THRESHOLD
}

export function resolveDropTarget(el: Element | null): DropTarget | null {
  if (!el) return null
  const id = (el as HTMLElement).dataset.dropId
  const kind = (el as HTMLElement).dataset.dropKind
  if (id && (kind === 'item' || kind === 'group')) return { id, kind }
  return resolveDropTarget(el.parentElement)
}

export const dragState = ref<DragState | null>(null)
let onDrop: ((target: DropTarget | null) => void) | null = null
let startX = 0
let startY = 0
let tracking = false
let onMove: ((e: PointerEvent) => void) | null = null
let onUp: ((e: PointerEvent) => void) | null = null

export function setDropHandler(fn: (target: DropTarget | null) => void): void {
  onDrop = fn
}

export function beginDrag(nodeId: string, listId: string, parentId: string | null, e: PointerEvent): void {
  if (e.button !== 0 || tracking) return
  tracking = true
  startX = e.clientX
  startY = e.clientY
  const el = e.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  dragState.value = { nodeId, listId, parentId, x: e.clientX, y: e.clientY, width: rect.width, height: rect.height, active: false }
  onMove = (ev: PointerEvent) => {
    const d = dragState.value
    if (!d) return
    if (!d.active) {
      if (!shouldStartDrag(startX, startY, ev.clientX, ev.clientY)) return
      d.active = true
    }
    d.x = ev.clientX
    d.y = ev.clientY
  }
  onUp = (ev: PointerEvent) => {
    cleanup()
    const d = dragState.value
    dragState.value = null
    if (!d || !d.active) return
    const target = resolveDropTarget(document.elementFromPoint(ev.clientX, ev.clientY))
    onDrop?.(target)
  }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
}

function cleanup(): void {
  tracking = false
  if (onMove) window.removeEventListener('pointermove', onMove)
  if (onUp) window.removeEventListener('pointerup', onUp)
  onMove = null
  onUp = null
}

export function resetDrag(): void {
  dragState.value = null
  cleanup()
}
```

**注意：** 行点击（`click` 事件）与拖拽共存——`pointerup` 时若 `active=false` 直接返回且不调用 onDrop，随后浏览器仍会派发 `click` 到原行，完成状态切换照常工作；若 `active=true`（真拖拽）则行模板需吞掉本次 click：`TaskRow/GroupRow` 的 `@click` 改为 `@click="onRowClick"`，其中 `onRowClick` 先检查 `dragState.value?.active`，为 true 则直接 return（不触发 toggle）。

**Drop 处理（TaskList 注册，渲染 DragPreview）：** `TaskList.vue` 的 script 追加：
```ts
import { onBeforeUnmount } from 'vue'
import { useDataStore } from '../stores/data'
import { dragState, resetDrag, setDropHandler } from '../composables/useDrag'
import DragPreview from './DragPreview.vue'

const data = useDataStore()

setDropHandler((target) => {
  const d = dragState.value
  if (!d || !d.active) return
  if (target && target.id === d.nodeId) return // 无效目标
  data.moveNode({
    fromListId: d.listId,
    nodeId: d.nodeId,
    toKind: target?.kind === 'group' ? 'group' : target?.kind === 'item' ? 'item' : 'list',
    toId: target?.id ?? d.listId,
  })
})
onBeforeUnmount(() => resetDrag())
```
template 内追加 `<DragPreview :state="dragState" />`。

`DragPreview.vue`:
```vue
<template>
  <Teleport to="body">
    <div v-if="state && state.active" class="drag-preview" :style="{ left: state.x + 'px', top: state.y + 'px', width: state.width + 'px' }" data-test="drag-preview">
      拖动中…
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { DragState } from '../composables/useDrag'
defineProps<{ state: DragState | null }>()
</script>

<style scoped>
.drag-preview { position: fixed; z-index: 200; opacity: .5; pointer-events: none; background: var(--color-surface); border: 1px dashed var(--color-muted); border-radius: 8px; padding: 8px 12px; transform: translate(-50%, -50%); }
</style>
```

- [ ] **Step 4: 行组件接入拖拽**

`TaskRow.vue` 增加：
```vue
<div class="row" :data-drop-id="item.id" :data-drop-kind="item.done ? undefined : 'item'" @pointerdown="onPointerDown" @click="onRowClick" ...>
```
（`data-drop-kind` 仅未完成事项可作目标；已完成事项不可作 drop 目标。）
```ts
import { beginDrag, dragState } from '../composables/useDrag'
function onPointerDown(e: PointerEvent) {
  if ((e.target as HTMLElement).closest('button')) return
  beginDrag(item.id, data.currentListId, currentParentId, e)
}
function onRowClick() {
  if (dragState.value?.active) return // 拖拽结束吞掉本次 click
  data.toggleDone(item.id)
}
```
`currentParentId` 通过 props 从 TaskList 传入（`:parent-id="parentId"`）。GroupRow 同理由其 `data-drop-kind="group"`（未完成或已完成组合均可为目标，规则一致：可拖入任何组合），`onRowClick` 中改为切换展开而非 toggleDone；`TaskRow.vue` 原有的 `@click="data.toggleDone(item.id)"` 删除，GroupRow 原有的 `@click="toggle"` 替换为 `onRowClick`。

`TaskList.vue` 渲染 `DragPreview` 并实现 pointerup 全局处理（在 App 层 or TaskList 挂载 window pointerup 一次，命中行时用 elementFromPoint）。

- [ ] **Step 5: 运行验证**

运行: `npm test; npm run build`
Expected: 测试通过、构建无错误。

- [ ] **Step 6: 手动验收**

运行: `npm run dev`
- 按住事项拖动超过 8px 出现半透明预览
- 拖到组合上松开→进入子层；拖到未完成事项上松开→生成「B · A」组合；拖到空白→回根层；松开在原地→还原

- [ ] **Step 7: Commit**

```powershell
git add -A
git commit -m "feat: drag and drop with threshold and preview"
```

---

### Task 14: 侧栏完整功能

**Files:**
- Modify: `src/components/Sidebar.vue`、`src/App.vue`

**Interfaces:**
- Consumes: Task 12 的弹窗事件、`useDataStore`
- Produces: 侧栏「列表」标题 + 编辑按钮（切换 `ui.editMode`）、新建列表按钮、每项颜色随状态、编辑模式显示删除、双击重命名（Task 12 已实现核心，本任务补齐编辑按钮与新建列表入口接线）

- [ ] **Step 1: 补齐 Sidebar 模板**

将 `sidebar-head` 扩展为：左侧栏标题「列表」+ 编辑按钮（激活态高亮），下方列表，末尾「+ 新建列表」按钮（样式与列表项一致）。见 Task 12 中 Sidebar 已列出的结构，本任务补充 `sidebar-head` 中编辑按钮并接线 App 事件。

`src/components/Sidebar.vue` 的 head 区改为：
```vue
<div class="sidebar-head">
  <button class="icon-btn" @click="ui.toggleSidebar()">{{ ui.sidebarCollapsed ? '☰' : '✕' }}</button>
  <span class="title">列表</span>
  <button class="icon-btn" :class="{ active: ui.editMode }" @click="ui.toggleEditMode()">编辑</button>
</div>
```

- [ ] **Step 2: 验证接线**

运行: `npm run dev`
Expected: 侧栏编辑按钮可切换编辑模式；编辑模式下列表项右侧出现删除按钮；新建列表弹窗可创建并自动选中新列表；双击列表名可重命名。

- [ ] **Step 3: Commit**

```powershell
git add -A
git commit -m "feat: complete sidebar list management"
```

---

### Task 15: i18n 与设置弹窗

**Files:**
- Create: `src/i18n/index.ts`、`src/i18n/zh.ts`、`src/i18n/en.ts`
- Create: `src/components/SettingsPanel.vue`
- Create: `src/components/__tests__/SettingsPanel.spec.ts`
- Modify: `src/App.vue`、`src/main.ts`

**Interfaces:**
- Consumes: `useUiStore`
- Produces: vue-i18n 实例（`createI18n`，legacy: false）；`useI18n().t` 提供中英文案；`SettingsPanel` 弹窗含：显示描述开关、浅/深切换、字号滑块（12–24）、语言下拉（zh/en）、导入/导出/关于按钮（导入导出在 Task 16）

**文案键（本任务内全部组件文案迁移到 `t()`）：** `common.cancel/confirm/save/delete/edit/new`、`list.name/desc/new`、`item.name/desc/new`、`group.name/desc/new`、`status.overdue/pending/done`、`sidebar.lists`、`rail.addItem/addGroup/edit/settings`、`settings.title/showDescription/theme/fontSize/language/import/export/about`、`date.yesterday/today/tomorrow/dayAfterTomorrow`、`drag.preview`、`empty.noItems`、`welcome.*`（Task 18 使用）。

- [ ] **Step 1: 写 SettingsPanel 测试**

`src/components/__tests__/SettingsPanel.spec.ts`:
```ts
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SettingsPanel from '../SettingsPanel.vue'
import { useUiStore } from '../../stores/ui'
import { useI18n } from 'vue-i18n'
import i18n from '../../i18n'

describe('SettingsPanel', () => {
  beforeEach(() => { localStorage.clear(); setActivePinia(createPinia()) })

  it('切换主题与字号写回 store', async () => {
    const s = useUiStore()
    const w = mount(SettingsPanel, { global: { plugins: [createPinia(), i18n] } })
    await w.find('[data-test="theme-dark"]').setValue(true)
    expect(s.settings.theme).toBe('dark')
    await w.find('[data-test="font-size"]').setValue(20)
    expect(s.settings.fontSize).toBe(20)
  })

  it('语言切换', async () => {
    const s = useUiStore()
    const w = mount(SettingsPanel, { global: { plugins: [createPinia(), i18n] } })
    await w.find('[data-test="lang"]').setValue('en')
    expect(s.settings.lang).toBe('en')
    expect(i18n.global.locale.value).toBe('en')
  })
})
```

- [ ] **Step 2: 运行验证失败**

运行: `npm test`
Expected: FAIL（模块不存在）。

- [ ] **Step 3: 实现 i18n**

`src/i18n/zh.ts`:
```ts
export default {
  common: { cancel: '取消', confirm: '确认', save: '保存', edit: '编辑', delete: '删除', new: '新建', add: '添加' },
  list: { name: '列表名称', description: '列表描述', new: '新建列表' },
  item: { name: '事项名称', description: '事项描述', new: '新建事项', date: '日期', time: '时间' },
  group: { name: '组合名称', description: '组合描述', new: '新建组合' },
  status: { overdue: '已逾期', pending: '未完成', done: '已完成', doneCount: '{done}/{total} 已完成' },
  sidebar: { lists: '列表', edit: '编辑', newList: '+ 新建列表' },
  rail: { addItem: '+事项', addGroup: '+组合', edit: '编辑', settings: '设置' },
  settings: { title: '设置', showDescription: '显示描述', theme: '外观', light: '浅色模式', dark: '深色模式', fontSize: '字号大小', language: '语言', import: '导入数据', export: '导出数据', about: '关于', imported: '导入成功', importFailed: '导入失败：文件格式不正确' },
  date: { yesterday: '昨天', today: '今天', tomorrow: '明天', dayAfterTomorrow: '后天' },
  empty: { noItems: '暂无事项，点击右侧 + 添加' },
  confirm: { title: '确认删除', message: '删除后不可恢复' },
  required: '名称必填',
}
```

`src/i18n/en.ts`（对应键英文翻译，如 `overdue: 'Overdue'`, `pending: 'To do'`, `done: 'Done'`, `cancel: 'Cancel'` 等）。

`src/i18n/index.ts`:
```ts
import { createI18n } from 'vue-i18n'
import zh from './zh'
import en from './en'

const browserLang = navigator.language?.startsWith('zh') ? 'zh' : 'en'

export default createI18n({
  legacy: false,
  locale: localStorage.getItem('tasklist:lang') ?? browserLang,
  fallbackLocale: 'zh',
  messages: { zh, en },
})
```

`src/main.ts` 更新：`createApp(App).use(createPinia()).use(i18n).mount('#app')`，并 `watch` uiStore.settings.lang 写入 `localStorage('tasklist:lang')` 与 `i18n.global.locale`（在 App 中做）。

- [ ] **Step 4: 实现 SettingsPanel**

`src/components/SettingsPanel.vue`:
```vue
<template>
  <div class="panel">
    <label class="row"><span>{{ t('settings.showDescription') }}</span><input type="checkbox" :checked="ui.settings.showDescription" @change="ui.setShowDescription(($event.target as HTMLInputElement).checked)" /></label>
    <label class="row"><span>{{ t('settings.theme') }}</span>
      <select data-test="theme" @change="ui.setTheme(($event.target as HTMLSelectElement).value as any)">
        <option value="light" :selected="ui.settings.theme === 'light'">{{ t('settings.light') }}</option>
        <option value="dark" :selected="ui.settings.theme === 'dark'" data-test="theme-dark">{{ t('settings.dark') }}</option>
      </select>
    </label>
    <label class="row"><span>{{ t('settings.fontSize') }} ({{ ui.settings.fontSize }})</span>
      <input data-test="font-size" type="range" min="12" max="24" step="1" :value="ui.settings.fontSize" @input="ui.setFontSize(Number(($event.target as HTMLInputElement).value))" />
    </label>
    <label class="row"><span>{{ t('settings.language') }}</span>
      <select data-test="lang" :value="ui.settings.lang" @change="onLang($event)">
        <option value="zh">中文</option>
        <option value="en">English</option>
      </select>
    </label>
    <div class="row"><button data-test="import" @click="$emit('import')">{{ t('settings.import') }}</button></div>
    <div class="row"><button data-test="export" @click="$emit('export')">{{ t('settings.export') }}</button></div>
    <div class="row"><button @click="$emit('about')">{{ t('settings.about') }}</button></div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useUiStore } from '../stores/ui'
import i18n from '../i18n'

const ui = useUiStore()
const { t } = useI18n()
defineEmits<{ (e: 'import'): void; (e: 'export'): void; (e: 'about'): void }>()

function onLang(e: Event) {
  const v = (e.target as HTMLSelectElement).value
  ui.setLang(v)
  i18n.global.locale.value = v
  localStorage.setItem('tasklist:lang', v)
}
</script>

<style scoped>
.panel { display: flex; flex-direction: column; gap: 12px; min-width: 300px; }
.row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
</style>
```

- [ ] **Step 5: App 接入设置弹窗与文案迁移**

`src/App.vue`：`settingsOpen` 打开 ModalDialog 内嵌 SettingsPanel，事件 `import/export/about` 先空（Task 16 实现 import/export；about 弹版本号）。同时把 App/Sidebar/MainArea/TaskList/TaskRow/GroupRow/ConfirmDialog 中的中文文案替换为 `t('...')`。

- [ ] **Step 6: 运行验证**

运行: `npm test; npm run build`
Expected: 全部通过。

- [ ] **Step 7: Commit**

```powershell
git add -A
git commit -m "feat: i18n and settings panel"
```

---

### Task 16: 导入导出

**Files:**
- Create: `src/logic/io.ts`
- Create: `src/logic/io.spec.ts`
- Modify: `src/App.vue`

**Interfaces:**
- Consumes: `validateTaskData`/`mergeTaskData`（Task 6）、`useDataStore`、`useUiStore`、i18n 文案
- Produces: 导出=下载完整 `TaskData` JSON 文件（文件名 `tasklist-backup-YYYY-MM-DD.json`）；导入=`<input type="file">` 读文本→`validateTaskData`→弹窗确认覆盖/合并→`mergeTaskData` 写回→提示结果
- `src/logic/io.ts` 导出纯函数：`buildExportBlob(data: TaskData): Blob`、`parseImportText(text: string): { ok: true; data: TaskData } | { ok: false; error: string }`（注意：`<script setup>` 无法导出命名函数，辅助函数必须放此模块）

**规则（DESIGN.md §4.4）：** 同 ID 覆盖本地，其余保留；导入前校验；导入前弹窗确认。完整 TaskData 导出（含设置与 ui）。

- [ ] **Step 1: 写导出/导入辅助测试**

`src/logic/io.spec.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { buildExportBlob, parseImportText } from './io'

describe('import/export helpers', () => {
  const data = { version: 1, lists: [{ id: 'l', name: 'x', description: '', items: [] }], settings: { theme: 'light' as const, fontSize: 16, lang: 'zh', showDescription: true }, ui: { sidebarCollapsed: false, expandedGroupIds: [] } }

  it('导出为 JSON Blob', () => {
    const blob = buildExportBlob(data)
    expect(blob.type).toBe('application/json')
  })

  it('合法导入文本解析成功', () => {
    expect(parseImportText(JSON.stringify(data)).ok).toBe(true)
  })

  it('非法文本解析失败', () => {
    expect(parseImportText('not json').ok).toBe(false)
  })
})
```

- [ ] **Step 2: 运行验证失败**

运行: `npm test`
Expected: FAIL。

- [ ] **Step 3: 实现 io.ts 与 App 接线**

`src/logic/io.ts`（`<script setup>` 无法导出命名函数，辅助函数放此模块）:
```ts
import type { TaskData } from '../types'
import { validateTaskData } from './merge'

export function buildExportBlob(data: TaskData): Blob {
  return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
}

export function parseImportText(text: string): { ok: true; data: TaskData } | { ok: false; error: string } {
  try {
    return validateTaskData(JSON.parse(text))
  } catch {
    return { ok: false, error: 'invalid json' }
  }
}
```

`src/App.vue` 增加：
```ts
import { buildExportBlob, parseImportText } from './logic/io'
import { mergeTaskData } from './logic/merge'
import type { TaskData } from './types'

function doExport() {
  const data: TaskData = { version: 1, lists: dataStore.lists, settings: ui.settings, ui: { sidebarCollapsed: ui.sidebarCollapsed, expandedGroupIds: ui.expandedGroupIds } }
  const blob = buildExportBlob(data)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `tasklist-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function onImportFile(file: File) {
  const reader = new FileReader()
  reader.onload = () => {
    const r = parseImportText(String(reader.result))
    if (!r.ok) { alert(t('settings.importFailed')); return }
    pendingImport.value = r.data
    importConfirmOpen.value = true
  }
  reader.readAsText(file)
}

function confirmImport() {
  if (!pendingImport.value) return
  const merged = mergeTaskData({ version: 1, lists: dataStore.lists, settings: ui.settings, ui: { sidebarCollapsed: ui.sidebarCollapsed, expandedGroupIds: ui.expandedGroupIds } }, pendingImport.value)
  dataStore.lists = merged.lists
  ui.settings = merged.settings
  ui.sidebarCollapsed = merged.ui.sidebarCollapsed
  ui.expandedGroupIds = merged.ui.expandedGroupIds
  pendingImport.value = null
  importConfirmOpen.value = false
  alert(t('settings.imported'))
}
```
UI：SettingsPanel 的「导入数据」按钮触发隐藏 `<input type="file" accept="application/json" data-test="import-input">`；弹「确认导入？将覆盖同 ID 数据」ConfirmDialog（复用 ConfirmDialog，把确认文案参数化：`title/message/confirmText`）。「关于」弹窗显示应用名与版本。

注意：`alert` 临时用于提示，可用简单 toast 或复用 ConfirmDialog 的 message 槽替代（保持极简，用 `alert` 可接受但建议换成自绘轻提示 `useToast` —— 为控制范围，本任务采用 `alert` 并在后续任务如有多余篇幅再美化）。

- [ ] **Step 4: 运行验证**

运行: `npm test; npm run build`
Expected: 通过；手动：设置→导出下载文件；改文件→导入→确认弹窗→同 ID 覆盖。

- [ ] **Step 5: Commit**

```powershell
git add -A
git commit -m "feat: import and export with validation"
```

---

### Task 17: 侧栏状态色与逾期刷新（整合）

**Files:**
- Modify: `src/stores/data.ts`、`src/App.vue`

**Interfaces:**
- Consumes: Task 8 store、Task 10 定时器
- Produces: 侧栏列表颜色随列表整体状态（任一逾期→红；全部完成→绿；否则蓝）——已在 Task 12 的 Sidebar 实现；本任务将列表状态计算提取为纯函数 `listStatus(list, now)`（放 `src/logic/status.ts`）并补测试；App 的 60s 定时器已接入 `touchNow`，逾期自动刷新生效。

- [ ] **Step 1: 写 listStatus 测试（追加到 status.spec.ts）**

```ts
it('listStatus 由列表状态推断', () => {
  expect(listStatus({ id: 'l', name: '', description: '', items: [dated] }, NOW)).toBe('pending')
  expect(listStatus({ id: 'l', name: '', description: '', items: [{ ...dated, date: '2026-08-01' }] }, NOW)).toBe('overdue')
  expect(listStatus({ id: 'l', name: '', description: '', items: [doneItem] }, NOW)).toBe('done')
  expect(listStatus({ id: 'l', name: '', description: '', items: [] }, NOW)).toBe('pending')
})
```

- [ ] **Step 2: 实现**

`src/logic/status.ts` 追加：
```ts
import type { List } from '../types'

export function listStatus(list: List, now: number): NodeStatus {
  if (list.items.length === 0) return 'pending'
  if (list.items.some((n) => nodeStatus(n, now) === 'overdue')) return 'overdue'
  if (list.items.every((n) => nodeStatus(n, now) === 'done')) return 'done'
  return 'pending'
}
```

Sidebar 改用 `listStatus`（删除内部内联实现）。

- [ ] **Step 3: 验证**

运行: `npm test; npm run build`
Expected: 通过。手动：设置一个 2 分钟后到期的事项，保持页面打开，到点后行变红、侧栏变红（60s 内刷新）。

- [ ] **Step 4: Commit**

```powershell
git add -A
git commit -m "feat: list status color and overdue auto refresh"
```

---

### Task 18: 欢迎列表（welcome.json）与 PWA

**Files:**
- Create: `public/manifest.webmanifest`
- Create: `public/sw.js`
- Modify: `src/main.ts`（注册 SW）、`src/stores/data.ts`（init 读 welcome.json）
- Verify: `src/data/welcome.json`（已存在）

**Interfaces:**
- Consumes: `resolveDateField`（Task 5）、`src/data/welcome.json`
- Produces: 首次启动（无列表）创建 welcome.json 内容（相对日期按当天转换）；PWA 可安装（manifest 图标用占位 SVG data URL）

**welcome.json 结构 = `List`**（DESIGN.md §4.4 + 已建文件）。**使用静态 import（Vite 打包时同步内联，保持 `init()` 同步）**。`init()` 中：
```ts
import welcomeJson from '../data/welcome.json'

function ensureWelcomeList() {
  if (lists.value.length > 0) return
  const now = new Date()
  lists.value = [resolveRelativeDates(welcomeJson as unknown as List, now)]
  persist()
}
function resolveRelativeDates(nodes: TreeNode[], now: Date): TreeNode[] {
  return nodes.map((n) => {
    const copy = { ...n }
    if (copy.date) copy.date = resolveDateField(copy.date, now)
    if (Array.isArray((copy as any).items)) (copy as any).items = resolveRelativeDates((copy as any).items, now)
    return copy
  })
}
```
`init()` 同步调用 `ensureWelcomeList()`，无需 async；删除 Task 8 的 `makeWelcomeList` 内联实现。

**同时删除 store 内部的 `persist()`/`scheduleSave()` 及所有 `scheduleSave()` 调用**（Task 10 起持久化唯一入口是 App.vue 的统一 watch；双写会短暂写入默认 settings/ui，见 Task 10 报告关注点 2）。actions 仍保持纯状态变更。

- [ ] **Step 1: 创建 PWA 文件**

`public/manifest.webmanifest`:
```json
{
  "name": "任务清单",
  "short_name": "Tasklist",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#f5f6f8",
  "theme_color": "#f5f6f8",
  "icons": []
}
```

`public/sw.js`:
```js
const CACHE = 'tasklist-v1'
self.addEventListener('install', (e) => {
  self.skipWaiting()
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/'])))
})
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()))
})
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      const copy = res.clone()
      caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {})
      return res
    })),
  )
})
```

`src/main.ts` 注册 SW（仅生产环境）:
```ts
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}))
}
```

- [ ] **Step 2: 修改 data store init**

将 Task 8 的 `makeWelcomeList()` 内联创建替换为 `ensureWelcomeList()`（动态 import + 相对日期转换），并删除 `makeWelcomeList`。`init()` 改为调用 `ensureWelcomeList()`（async 内部处理）。

- [ ] **Step 3: 验证**

运行: `npm test; npm run build`
Expected: 通过；`dist/` 含 `manifest.webmanifest` 与 `sw.js`。
手动: 清空 localStorage 刷新 → 出现欢迎列表，且「带日期的事项」显示为**明天**、逾期示例为**昨天**（相对当天）。

- [ ] **Step 4: Commit**

```powershell
git add -A
git commit -m "feat: welcome list from json and PWA"
```

---

### Task 19: 收尾——README、部署与自检

**Files:**
- Modify: `README.md`（GitHub Pages 部署说明）
- Create: `docs/architecture.md`（可选，简短架构记录）

**Interfaces:**
- Consumes: 全部任务
- Produces: 可部署产物与文档

- [ ] **Step 1: 写 README 部署说明**

`README.md` 追加：
```markdown
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
```
（如无 gh-pages 依赖，`npm i -D gh-pages` 或手动推送 `dist/` 到 gh-pages 分支。）

- [ ] **Step 2: 全量回归**

运行: `npm test; npm run build`
Expected: 全部测试通过、构建无错误。

- [ ] **Step 3: 对照 DESIGN.md 走查**

对照 DESIGN.md 各节逐条核对：
- §3.1 左侧栏（编辑模式删除、双击重命名、颜色随状态、窄屏覆盖）
- §3.2 右侧栏（四按钮、窄屏底部）
- §3.3 主区（三组标题与分隔、空态）
- §3.4/3.5 事项与组合（圆圈/箭头、X/Y、编辑态按钮）
- §3.6 弹窗（Esc/Enter/遮罩）
- §3.7 设置（开关/切换/滑块/下拉/导入导出/关于）
- §4 全部逻辑（状态、排序、颜色、拖拽、记忆、导入合并、欢迎列表、名称必填）
发现问题就地修复。

- [ ] **Step 4: 最终提交**

```powershell
git add -A
git commit -m "docs: deployment guide and final walkthrough"
```

---

## Self-Review 记录

- **Spec 覆盖对照**（DESIGN.md）：
  - §1 单机/离线/导出导入 → Task 8/16/18 ✓
  - §2 技术选型/数据模型/开发计划 → Task 1/2 ✓
  - §3.1 侧栏 → Task 12/14/17 ✓
  - §3.2 右栏 → Task 10/15 ✓
  - §3.3 主区三组/空态 → Task 11 ✓
  - §3.4/3.5 行组件 → Task 11 ✓
  - §3.6 弹窗/表单 → Task 12 ✓
  - §3.7 设置 → Task 15/16 ✓
  - §4.1 状态/时间戳 → Task 3 ✓
  - §4.2 排序分组 → Task 4 ✓
  - §4.3 颜色 → Task 10/11/17 ✓
  - §4.4 拖拽/记忆/导入合并/损坏恢复/跨标签/刷新/欢迎列表 → Task 7/8/13/15/16/17/18 ✓
- **占位扫描**：所有步骤含完整代码或可执行命令，无 TBD。
- **类型一致性**：`MoveSpec`（Task 7 定义，Task 8/13 引用）、`nodeStatus/nodeTimestamp`（Task 3，Task 4/11/17 引用）、`resolveDateField`（Task 5，Task 18 引用）、`validateTaskData/mergeTaskData`（Task 6，Task 16 引用）、`beginDrag/setDropHandler/dragState`（Task 13 定义并引用）签名一致。
- **已知简化**：Task 13 拖拽为「阈值+预览+elementFromPoint 目标判定」的轻量实现，嵌套缩进放置不做微调；Task 16 提示用 `alert` 简化；Task 11 的 `TaskRow` 日期标签在 i18n 完成前先显示中文键名（Task 15 迁移）。
