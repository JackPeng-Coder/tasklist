import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  base: './',
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    // Bind IPv4 127.0.0.1 explicitly: vite's default 'localhost' resolves to
    // both ::1 and 127.0.0.1, and on some Windows setups the IPv6 attempt
    // raises EACCES before falling back, which crashes dev startup.
    host: '127.0.0.1',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    exclude: ['node_modules/**', '.superpowers/**', 'dist/**'],
  },
})
