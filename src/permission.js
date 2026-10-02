import router from './router'
import { getToken } from '@/utils/auth'
import { useUserStore } from '@/store/modules/user'
import { usePermissionStore } from '@/store/modules/permission'
import { useWebsocketStore } from '@/store/modules/websocket'

/**
 * 路由守卫
 *
 * 流程：
 *   有 token → 首次进入拉用户信息 + 动态路由（getRouters → addRoute）→ 放行
 *   无 token → 白名单（/login）之外一律跳登录，并携带 redirect
 *
 * 关于「api 前缀」（项目要求 4）：
 *   所有接口的 URL 都**不带** /dev-api 前缀 —— 前缀由 axios 的 baseURL
 *   （VITE_APP_BASE_API）统一添加，开发期由 vite proxy 转发到网关并剥掉。
 */
const whiteList = ['/login']

router.beforeEach(async (to, from, next) => {
  const hasToken = getToken()

  if (hasToken) {
    if (to.path === '/login') {
      next({ path: '/' })
    } else {
      const userStore = useUserStore()
      const permissionStore = usePermissionStore()

      if (userStore.roles.length === 0) {
        // 刷新后内存状态丢失：拉用户信息 + 动态路由，再重新进入目标页
        try {
          await userStore.getInfo()
          await permissionStore.generateRoutes()
          // 登录后接入消息推送长连接（内部有防重入判断）
          useWebsocketStore().connect()
          next({ ...to, replace: true })
        } catch (err) {
          // 必须留痕：否则「登录后闪回登录页」这种问题无从排查
          console.error('[守卫] 初始化用户信息/动态路由失败：', err)
          await userStore.logout()
          next(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
        }
      } else {
        next()
      }
    }
  } else {
    if (whiteList.includes(to.path)) {
      next()
    } else {
      next(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
    }
  }
})

router.afterEach((to) => {
  const title = to.meta?.title
  document.title = title ? `${title} - 云枢OA` : '云枢OA'
})
