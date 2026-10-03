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

          // ★ 只能用 path 重新导航，不能写 next({ ...to })！
          //   动态路由是这一刻才注册的，所以本次导航一开始命中的是 404 兜底路由，
          //   to.name = 'NotFound'。而 vue-router 里 name 优先级高于 path，
          //   next({ ...to }) 会按 name 再解析回 404 —— 表现为「刷新/直接输
          //   业务页 URL 永远停在 404」。只带 path 才能按新注册的路由重新匹配。
          next({ path: to.path, query: to.query, hash: to.hash, replace: true })
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
