import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd())
  return {
    plugins: [vue()],
    resolve: {
      // @ 指向 src，与后端工程的约定保持一致
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    server: {
      host: true,
      // 8081：避免与网关 8080、以及旁边 CloudPivotOA_VUE3 的 80 端口冲突
      port: 8081,
      open: true,
      proxy: {
        // 前端请求带 /dev-api 前缀，由 Vite 转发到网关并剥掉前缀
        // （网关 8080：auth/system/org/... 各路由自己再剥业务前缀）
        '/dev-api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/dev-api/, '')
        },
        // WebSocket 走同源路径，Vite 原生支持 ws 代理
        '/dev-api/ws': {
          target: 'ws://localhost:8080',
          ws: true,
          rewrite: (p) => p.replace(/^\/dev-api/, '')
        }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  }
})
