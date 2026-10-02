<template>
  <!-- 顶栏：横向一级菜单（泛微 OA 的标志：顶栏放模块，左侧放页面） -->
  <header class="topbar">
    <div class="brand" @click="router.push('/index')">
      <el-icon><OfficeBuilding /></el-icon>
      <span>{{ settings.title }}</span>
    </div>

    <el-menu class="topbar__menu" mode="horizontal" :default-active="activeTop" :ellipsis="false" @select="onSelectTop">
      <el-menu-item v-for="m in menus" :key="m.path" :index="m.path">
        <el-icon v-if="iconOf(m)"><component :is="iconOf(m)" /></el-icon>
        <span>{{ m.meta?.title }}</span>
      </el-menu-item>
    </el-menu>

    <div class="topbar__right">
      <el-tooltip content="我的信箱" placement="bottom">
        <el-badge :value="wsStore.unread" :hidden="!wsStore.unread" :max="99">
          <el-button text :icon="Bell" @click="router.push('/message/inbox')" />
        </el-badge>
      </el-tooltip>

      <el-dropdown @command="handleCommand">
        <span class="user-chip">
          <el-icon><User /></el-icon>
          {{ userStore.name || '未登录' }}
          <el-icon><ArrowDown /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="logout">
              <el-icon><SwitchButton /></el-icon>退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>

  <div class="body">
    <!-- 左侧：当前一级菜单下的二级/三级页面（泛微 OA 的典型形态） -->
    <aside class="sidemenu" v-if="sides.length">
      <div class="sidemenu__title">{{ currentTopTitle }}</div>
      <el-menu class="sidemenu__menu" :default-active="activeSide" :ellipsis="false" @select="onSelectSide">
        <MenuItem v-for="s in sides" :key="s.path" :item="s" base-path="" />
      </el-menu>
    </aside>

    <!-- 内容区：面包屑 + 页面 -->
    <main class="content">
      <el-breadcrumb separator="/" class="crumb">
        <el-breadcrumb-item :to="{ path: '/index' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item v-for="c in crumbs" :key="c">{{ c }}</el-breadcrumb-item>
      </el-breadcrumb>

      <router-view v-slot="{ Component }">
        <component :is="Component" />
      </router-view>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Bell, User, ArrowDown, OfficeBuilding } from '@element-plus/icons-vue'
import * as Icons from '@element-plus/icons-vue'
import settings from '@/settings'
import { useUserStore } from '@/store/modules/user'
import { usePermissionStore } from '@/store/modules/permission'
import { useWebsocketStore } from '@/store/modules/websocket'
import { visibleChildren } from '@/utils/menu'
import MenuItem from './components/MenuItem.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const permissionStore = usePermissionStore()
const wsStore = useWebsocketStore()

const menus = computed(() => permissionStore.visibleMenus)

// 当前所在的一级菜单（取路径首段匹配）
const activeTop = computed(() => {
  const first = '/' + route.path.split('/').filter(Boolean)[0]
  const hit = menus.value.find((m) => m.path === first)
  return hit ? hit.path : '/index'
})

const currentTop = computed(() => menus.value.find((m) => m.path === activeTop.value))

const currentTopTitle = computed(() => currentTop.value?.meta?.title || '导航')

// 左侧展示当前一级菜单下的子项
const sides = computed(() => (currentTop.value ? visibleChildren(currentTop.value) : []))

const activeSide = computed(() => route.path)

// 面包屑：首页 / 一级模块 / 页面标题
const crumbs = computed(() => {
  const list = []
  if (currentTopTitle.value && currentTopTitle.value !== '导航') list.push(currentTopTitle.value)
  const title = route.meta?.title
  if (title && title !== currentTopTitle.value) list.push(title)
  return list
})

function iconOf(m) {
  return Icons[m.meta?.icon] || null
}

// 点一级菜单：若其下有页面则跳第一个，否则跳该模块路径
function onSelectTop(index) {
  const target = menus.value.find((m) => m.path === index)
  const kids = target ? visibleChildren(target) : []
  if (kids.length) {
    router.push(kids[0].path)
  } else if (index !== '/index') {
    router.push(index)
  }
}

function onSelectSide(index) {
  if (index) router.push(index)
}

// 安全退出：清 Pinia 全部状态 + sessionStorage
async function handleCommand(command) {
  if (command !== 'logout') return
  await userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
/* ---------- 顶栏 ---------- */
.topbar {
  height: var(--cp-topbar-h);
  background: #fff;
  border-bottom: 1px solid var(--cp-border);
  display: flex;
  align-items: center;
  padding: 0 12px 0 0;
}

.brand {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 200px;
  padding-left: 16px;
  font-size: 15px;
  font-weight: 600;
  color: var(--cp-primary);
  cursor: pointer;
  flex-shrink: 0;
}

.topbar__menu {
  flex: 1;
  border-bottom: none !important;
  height: var(--cp-topbar-h);
}

.topbar__menu :deep(.el-menu-item) {
  height: var(--cp-topbar-h);
  line-height: var(--cp-topbar-h);
  border-bottom: none !important;
  border-radius: 0;
  background: transparent !important;
  padding: 0 16px;
  font-size: 13px;
  color: var(--cp-text-2);
}

.topbar__menu :deep(.el-menu-item:hover) {
  background: var(--cp-primary-light) !important;
  color: var(--cp-primary) !important;
}

.topbar__menu :deep(.el-menu-item.is-active) {
  background: var(--cp-primary-light) !important;
  color: var(--cp-primary) !important;
  font-weight: 600;
}

.topbar__right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.user-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--cp-text-2);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--cp-radius-sm);
}

.user-chip:hover {
  background: var(--cp-primary-light);
  color: var(--cp-primary);
}

/* ---------- 主体 ---------- */
.body {
  display: flex;
  min-height: calc(100% - var(--cp-topbar-h));
}

.sidemenu {
  width: var(--cp-sidemenu-w);
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid var(--cp-border-light);
  overflow-y: auto;
}

.sidemenu__title {
  height: 38px;
  line-height: 38px;
  padding: 0 16px;
  font-size: 13px;
  font-weight: 600;
  color: var(--cp-text);
  border-bottom: 1px solid var(--cp-border-light);
}

.sidemenu__menu {
  border-right: none !important;
  padding: 6px 0;
}

.sidemenu__menu :deep(.el-menu-item),
.sidemenu__menu :deep(.el-sub-menu__title) {
  height: 36px;
  line-height: 36px;
  font-size: 13px;
  color: var(--cp-text-2);
  border-radius: 0;
}

.sidemenu__menu :deep(.el-menu-item:hover),
.sidemenu__menu :deep(.el-sub-menu__title:hover) {
  background: var(--cp-primary-light) !important;
  color: var(--cp-primary) !important;
}

.sidemenu__menu :deep(.el-menu-item.is-active) {
  background: var(--cp-primary-light) !important;
  color: var(--cp-primary) !important;
  font-weight: 600;
}

/* ---------- 内容区 ---------- */
.content {
  flex: 1;
  min-width: 0;
  padding: 12px 14px 20px;
}

.crumb {
  margin-bottom: 10px;
  font-size: 12px;
}
</style>
