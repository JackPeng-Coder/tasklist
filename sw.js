// 缓存名：每次发版升一档（v1 -> v2 -> ...），配合 activate 清理旧缓存，确保旧窗口尽快吃到新版本
const CACHE = 'tasklist-v3'
self.addEventListener('install', (e) => {
  self.skipWaiting()
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./'])))
})
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()))
})
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return
  // 页面导航：网络优先、离线回退缓存，发版后刷新即可拿到最新页面
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {})
          return res
        })
        .catch(() => caches.match(e.request)),
    )
    return
  }
  // 静态资源（文件名带内容哈希）：缓存优先，拿不到再回源
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      const copy = res.clone()
      caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {})
      return res
    })),
  )
})
