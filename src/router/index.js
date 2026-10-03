import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/layout/index.vue'

/**
 * 静态路由（骨架阶段）
 *
 * 待业务阶段补充：
 *  - 动态路由：登录后调 GET /system/menu/getRouters，按后端返回的菜单树生成路由
 *    （这正是 sys_menu 里 C/M 行的作用，前端侧边栏由它驱动）
 *  - 各业务域页面：org / schedule / attendance / document / message
 */
export const constantRoutes = [
  {
    path: '/login',
    component: () => import('@/views/login.vue'),
    hidden: true
  },
  {
    path: '/',
    component: Layout,
    redirect: '/index',
    children: [
      {
        path: 'index',
        name: 'Index',
        component: () => import('@/views/index.vue'),
        meta: { title: '首页', icon: 'Odometer' }
      },
      // 404 必须放在布局内：这样走错路径时顶部/左侧导航还在，用户能点回去。
      // 放在布局外的话一进 404 整个导航就消失了，只能手改地址栏才能出来。
      // Vue Router 会优先匹配静态路径（/org/branch 等），不会被这条兜底规则抢走。
      {
        path: ':pathMatch(.*)*',
        name: 'NotFound',
        component: () => import('@/views/error/404.vue'),
        hidden: true
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes: constantRoutes,
  scrollBehavior: () => ({ top: 0 })
})

export default router
