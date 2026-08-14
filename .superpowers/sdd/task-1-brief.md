### Task 1: 椤圭洰鑴氭墜鏋朵笌娴嬭瘯鍩虹嚎

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `index.html`
- Create: `src/vite-env.d.ts`
- Create: `src/main.ts`
- Create: `src/App.vue`
- Create: `src/logic/status.spec.ts`锛堜粎鍗犱綅鏂█锛?- Create: `.gitignore`
- Modify: `README.md`锛堝垵濮嬭鏄庯級

**Interfaces:**
- Produces: 鍙繍琛岀殑椤圭洰楠ㄦ灦锛坄npm run dev` / `npm test` / `npm run build` 鍏ㄩ儴鍙敤锛夛紝鍚庣画鎵€鏈変换鍔″湪姝や箣涓婂閲忓紑鍙戙€?
- [ ] **Step 1: 鍒涘缓 package.json 涓庝緷璧?*

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

- [ ] **Step 2: 鍒涘缓 vite 閰嶇疆锛堝惈 vitest 鐜涓庤矾寰勫埆鍚嶏級**

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

- [ ] **Step 3: 鍒涘缓 TS 閰嶇疆**

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

- [ ] **Step 4: 鍒涘缓鍏ュ彛鏂囦欢**

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

`src/App.vue`锛堝崰浣嶏紝Task 10 鏇挎崲锛?
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

- [ ] **Step 5: 鍒涘缓鍗犱綅娴嬭瘯骞跺畨瑁呬緷璧?*

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

杩愯: `npm install`
Expected: 瀹夎鎴愬姛鏃犳姤閿欍€?
- [ ] **Step 6: 鍒濆鍖?git 骞堕獙璇佸熀绾?*

杩愯:
```powershell
git init
npm test
npm run build
```
Expected: `npm test` 閫氳繃 1 涓敤渚嬶紱`npm run build` 浜у嚭 `dist/` 鏃犵被鍨嬮敊璇€?
- [ ] **Step 7: Commit**

```powershell
git add -A
git commit -m "chore: scaffold vite + vue3 + ts + vitest"
```

---

