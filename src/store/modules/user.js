import { defineStore } from 'pinia'
import { login as loginApi, logout as logoutApi, getInfo as getInfoApi } from '@/api/login'
import { getProfile } from '@/api/profile'
import { getToken, setToken, removeToken } from '@/utils/auth'
import { usePermissionStore } from '@/store/modules/permission'
import { useWebsocketStore } from '@/store/modules/websocket'

/**
 * 用户状态：token、用户信息、第三方档案（头像/职务/部门/机构）、角色与权限点
 */
export const useUserStore = defineStore('user', {
  state: () => ({
    token: getToken() || '',
    /** 登录名（sys_user.user_name） */
    name: '',
    /** 姓名（sys_user.nick_name） */
    nickName: '',
    /** 头像 URL（MinIO 访问地址） */
    avatar: '',
    roles: [],
    permissions: [],

    // ===== 以下来自 /org/user/profile（个人档案，右上角展示用）=====
    gender: null,
    signDesc: '',
    deptId: null,
    deptName: '',
    branchId: null,
    branchName: '',
    /** 岗位名（sys_post，可能为空） */
    postName: '',
    /** 角色名列表（如 ['部门主管']） */
    profileRoles: [],
    profileLoaded: false
  }),
  getters: {
    /**
     * 职务：优先用岗位名，没配岗位就用角色名
     * （演示数据里 sys_user_post 基本没数据，角色名「部门主管/人事专员」本身就是职务）
     */
    jobTitle: (state) => state.postName || state.profileRoles[0] || '',
    /** 展示名：优先姓名，其次登录名 */
    displayName: (state) => state.nickName || state.name || '未登录',
    /** 所在部门（含机构）的展示文案 */
    orgText: (state) => {
      if (state.branchName && state.deptName) {
        return state.branchName + ' · ' + state.deptName
      }
      return state.branchName || state.deptName || ''
    }
  },
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
      this.nickName = (res.user && res.user.nickName) || this.name
      this.avatar = (res.user && res.user.avatar) || ''
    },

    /**
     * 拉取个人档案（头像 / 职务 / 部门 / 机构）
     * 失败不抛出：右上角只是展示信息，拿不到就退化成只显示姓名，
     * 不能让它把登录流程带崩。
     */
    async fetchProfile() {
      try {
        const res = await getProfile()
        const p = res.data || {}
        this.nickName = p.nickName || this.nickName || this.name
        this.avatar = p.avatarPath || this.avatar || ''
        this.gender = p.gender
        this.signDesc = p.signDesc || ''
        this.deptId = p.deptId
        this.deptName = p.deptName || ''
        this.branchId = p.branchId
        this.branchName = p.branchName || ''
        this.postName = p.postName || ''
        this.profileRoles = p.roleNames || []
        this.profileLoaded = true
      } catch (e) {
        console.warn('[user] 拉取个人档案失败，右上角降级为姓名展示：', e)
      }
    },

    // 安全退出（项目要求 6）：无论后端是否成功，本地数据必须全部清空
    async logout() {
      try {
        await logoutApi()
      } finally {
        this.token = ''
        this.name = ''
        this.nickName = ''
        this.avatar = ''
        this.roles = []
        this.permissions = []
        this.gender = null
        this.signDesc = ''
        this.deptId = null
        this.deptName = ''
        this.branchId = null
        this.branchName = ''
        this.postName = ''
        this.profileRoles = []
        this.profileLoaded = false
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
