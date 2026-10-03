import { defineStore } from 'pinia'
import router from '@/router'
import { getRouters as getRoutersApi } from '@/api/menu'
import Layout from '@/layout/index.vue'
import ParentView from '@/components/ParentView.vue'
import Placeholder from '@/views/placeholder.vue'
import { isHttp } from '@/utils/menu'

/**
 * 动态路由（Pinia 共享，供布局的侧边导航渲染菜单树）
 *
 * 数据源：GET /system/menu/getRouters（由 sys_menu 的 M/C 行驱动，见设计文档 9.5）
 *
 * 后端返回的 component 是字符串，映射规则：
 *   'Layout'                → 布局组件
 *   'ParentView'            → 二级父容器（继续渲染 router-view）
 *   'http://...'            → 外链，无组件（点击新窗口打开）
 *   'message/list/index'    → @/views/message/list/index.vue（import.meta.glob 懒加载）
 *   ↑ 若对应 view 文件不存在（如若依底座的 system/* 页面），落到占位页，避免点击报错
 */

// 一次性收集所有 view 的懒加载函数
const viewModules = import.meta.glob('/src/views/**/*.vue')

// 若依自带的、与本项目无关的菜单（官网/演示链接、代码生成等）
function isRuoyiItem(menu) {
  const title = (menu.meta?.title || '') + (menu.path || '')
  return /若依|ruoyi\.vip/.test(title)
}

// 导航里不展示的菜单：
//  - 系统管理 / 系统监控：对应页面是若依底座的功能（用户/角色/菜单/在线用户/定时任务等），
//    本项目前端未实现，点进去只有占位页 —— 演示时不需要，直接隐藏
//  - 系统工具：表单构建（在线表单设计器）、代码生成（开发工具）与本项目无关
//  - Sentinel / Nacos / Admin 控制台：运维用外链
// 这些路由也不再注册（直接输 URL 会落到 404，而 404 页保留导航栏，能点回来）；
// 想恢复只需从下面这个数组里删掉对应关键词。
const HIDE_MENU_KEYWORDS = [
  '系统管理',
  '系统监控',
  '表单构建',
  '代码生成',
  'Sentinel',
  'Nacos',
  'Admin控制台'
]

function isHiddenMenu(menu) {
  const title = menu.meta?.title || ''
  return HIDE_MENU_KEYWORDS.some((k) => title.includes(k))
}

/** 递归剔除「若依项」与「演示不需要项」，只影响导航显示，不影响路由注册 */
function pruneMenus(menus) {
  return menus
    .filter((m) => !isRuoyiItem(m) && !isHiddenMenu(m))
    .map((m) => ({ ...m, children: pruneMenus(m.children || []) }))
}

function loadView(component) {
  const key = `/src/views/${component}.vue`
  return viewModules[key] || Placeholder
}

// 把后端的菜单树转换成 vue-router 可用的路由配置
// 返回 null 表示该节点不需要注册路由（外链 / 若依无关项）—— 它们只留在菜单树里
function buildRoute(menu, parentKey = '') {
  // ★ 外链（如 Sentinel/Nacos 控制台、若依官网）不能进 vue-router：
  //   Route paths must start with "/"，addRoute 会直接抛异常
  //   菜单渲染时用 <a href target="_blank"> 新窗口打开
  if (isHttp(menu.path)) return null
  // 若依自带的无关菜单也不注册
  if (isRuoyiItem(menu)) return null

  // 用「父路径 + 自身 path」作为唯一键
  // ★ vue-router 以 name 为唯一键，重名会互相覆盖：
  //   若依按 path 生成 name，而「部门管理」与「部门日程」的 name 都是 Depart、
  //   「员工管理」与「用户管理」都是 User —— 后注册的会把先注册的顶掉，
  //   实测导致 /org/depart 直接 404。加父路径前缀即可保证全局唯一。
  const key = parentKey ? `${parentKey}/${menu.path}` : menu.path

  const route = {
    name: key.replace(/^\//, '').replace(/\//g, '_') || 'root',
    path: menu.path,
    hidden: menu.hidden,
    redirect: menu.redirect,
    meta: menu.meta
  }

  if (menu.component === 'Layout') {
    route.component = Layout
  } else if (menu.component === 'ParentView') {
    route.component = ParentView
  } else if (menu.component) {
    route.component = loadView(menu.component)
  }

  // 子级里的外链与若依项同样剔除
  const children = (menu.children || [])
    .filter((c) => !isHttp(c.path) && !isRuoyiItem(c))
    .map((c) => buildRoute(c, key))
    .filter(Boolean)
  if (children.length) route.children = children
  return route
}

export const usePermissionStore = defineStore('permission', {
  state: () => ({
    // 原始菜单树：顶部导航渲染用
    sidebarRouters: [],
    // 是否已加载
    loaded: false
  }),
  getters: {
    // 导航实际展示的菜单：剔除若依自带的无关项（表单构建/代码生成/运维控制台等）
    visibleMenus: (state) => pruneMenus(state.sidebarRouters)
  },
  actions: {
    async generateRoutes() {
      const res = await getRoutersApi()
      const menus = res.data || []

      // 菜单树原样保留（含外链），顶部导航渲染用
      this.sidebarRouters = menus
      // 只注册顶级路由（children 随顶级一起注册）；外链不注册
      menus.forEach((m) => {
        const route = buildRoute(m)
        if (!route) return
        // 热更新或重复登录时可能已注册过，避免 addRoute 报重名
        if (route.name && !router.hasRoute(route.name)) {
          router.addRoute(route)
        }
      })
      this.loaded = true
      return menus
    },
    reset() {
      this.sidebarRouters = []
      this.loaded = false
    }
  }
})
