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

function loadView(component) {
  const key = `/src/views/${component}.vue`
  return viewModules[key] || Placeholder
}

// 把后端的菜单树转换成 vue-router 可用的路由配置
// 返回 null 表示该节点不需要注册路由（外链）—— 它只留在菜单树里供导航渲染
function buildRoute(menu) {
  // ★ 外链（如 Sentinel/Nacos 控制台、若依官网）不能进 vue-router：
  //   Route paths must start with "/"，addRoute 会直接抛异常
  //   菜单渲染时用 <a href target="_blank"> 新窗口打开
  if (isHttp(menu.path)) return null

  const route = {
    name: menu.name,
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

  // 子级里的外链同样剔除
  const children = (menu.children || [])
    .filter((c) => !isHttp(c.path))
    .map(buildRoute)
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
