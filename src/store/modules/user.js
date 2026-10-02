import { defineStore } from 'pinia'
import { login as loginApi, logout as logoutApi, getInfo as getInfoApi } from '@/api/login'
import { getToken, setToken, removeToken } from '@/utils/auth'
import { usePermissionStore } from '@/store/modules/permission'
import { useWebsocketStore } from '@/store/modules/websocket'

/**
 * 用户状态：token、用户信息、角色与权限点
 *
 * roles / permissions 后续接入「动态路由」时使用；
 * 本骨架阶段只用于展示用户名与退出登录。
 */
export const useUserStore = defineStore('user', {
  state: () => ({
    token: getToken() || '',
    name: '',
    avatar: '',
    roles: [],
    permissions: []
  }),
  actions: {
    // 登录。返回体：{ code, msg, data: { access_token, expires_in } }
    async login(userInfo) {
      const res = await loginApi(userInfo)
      const token = res.data.access_token
      this.token = token
      setToken(token)
    },

    // 拉取当前用户。返回体顶层直接是 { roles, permissions, user }
    async getInfo() {
      const res = await getInfoApi()
      this.roles = res.roles || []
      this.permissions = res.permissions || []
      this.name = (res.user && res.user.userName) || ''
      this.avatar = (res.user && res.user.avatar) || ''
    },

    // 安全退出（项目要求 6）：无论后端是否成功，本地数据必须全部清空
    async logout() {
      try {
        await logoutApi()
      } finally {
        this.token = ''
        this.name = ''
        this.avatar = ''
        this.roles = []
        this.permissions = []
        removeToken()
        // 清空其它 Pinia store（动态路由/菜单树）+ 断开消息推送长连接
        const permissionStore = usePermissionStore()
        permissionStore.reset()
        useWebsocketStore().disconnect()
        // sessionStorage 整体清空（token 等所有客户端缓存数据）
        sessionStorage.clear()
      }
    }
  }
})
