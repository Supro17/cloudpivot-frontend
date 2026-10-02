import { defineStore } from 'pinia'
import { ElNotification } from 'element-plus'
import { getUnreadCount } from '@/api/message'
import { getToken } from '@/utils/auth'

// 心跳与重连的定时器放模块级即可，不需要进响应式 state
let heartbeatTimer = null
let reconnectTimer = null

/**
 * WebSocket 长连接（消息实时推送）
 *
 * 地址：ws(s)://{host}{base}/ws/message?token=xxx
 *   - 开发期经 vite proxy 的 ws 代理转发到网关
 *   - 网关已把 /ws/** 加入白名单，真正的鉴权在服务端握手拦截器完成
 *
 * 推送体只有「信号」：{ type: 'NEW_MESSAGE', count: 1, title: '...' }
 * → 收到后角标 +1、弹通知，**数据仍以 HTTP 接口为准**（信箱页自己会刷新）
 *
 * 心跳：每 30s 发 'ping'，服务端回 'pong'，防止空闲连接被网关掐断
 */
export const useWebsocketStore = defineStore('websocket', {
  state: () => ({
    ws: null,
    connected: false,
    unread: 0
  }),
  actions: {
    connect() {
      if (this.ws) return
      const token = getToken()
      if (!token) return

      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
      const base = import.meta.env.VITE_APP_BASE_API
      const url = `${protocol}//${location.host}${base}/ws/message?token=${encodeURIComponent(token)}`

      const ws = new WebSocket(url)
      this.ws = ws

      ws.onopen = () => {
        this.connected = true
        this.startHeartbeat()
        this.refreshUnread()
      }
      ws.onmessage = (e) => {
        if (e.data === 'pong') return
        try {
          const payload = JSON.parse(e.data)
          if (payload.type === 'NEW_MESSAGE') {
            this.unread += payload.count || 1
            ElNotification({
              title: '收到新消息',
              message: payload.title || '',
              type: 'primary',
              duration: 4500
            })
          }
        } catch {
          // 非 JSON 帧（如 pong）忽略
        }
      }
      ws.onclose = () => {
        this.connected = false
        this.stopHeartbeat()
        this.scheduleReconnect()
      }
      ws.onerror = () => {
        this.connected = false
      }
    },

    startHeartbeat() {
      this.stopHeartbeat()
      heartbeatTimer = setInterval(() => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send('ping')
        }
      }, 30000)
    },

    stopHeartbeat() {
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer)
        heartbeatTimer = null
      }
    },

    // 断线 5 秒后重连（connect 内部有 token 判断，登出后不会误连）
    scheduleReconnect() {
      this.stopReconnect()
      reconnectTimer = setTimeout(() => {
        this.ws = null
        this.connect()
      }, 5000)
    },

    stopReconnect() {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
    },

    // 以 SQL 真值校准角标（信箱页标记已读后调用）
    async refreshUnread() {
      try {
        const res = await getUnreadCount()
        this.unread = (res.data && res.data.count) || 0
      } catch {
        // 静默：角标不影响主流程
      }
    },

    // 登出时彻底断开并清状态
    disconnect() {
      this.stopHeartbeat()
      this.stopReconnect()
      if (this.ws) {
        try {
          this.ws.close()
        } catch {
          // ignore
        }
        this.ws = null
      }
      this.connected = false
      this.unread = 0
    }
  }
})
