<template>
  <div class="app-shell">
    <!-- 顶部导航：Apple 官网同款 —— 48px 细高、毛玻璃、12px 小字、hover 才变蓝 -->
    <header class="nav">
      <div class="nav__inner">
        <div class="brand" @click="router.push('/index')">{{ settings.title }}</div>

        <el-menu
          class="nav__menu"
          mode="horizontal"
          :default-active="activeMenu"
          :ellipsis="false"
          router
        >
          <MenuItem
            v-for="item in menus"
            :key="item.path"
            :item="item"
            base-path=""
          />
        </el-menu>

        <div class="nav__right">
          <el-tooltip content="我的信箱" placement="bottom">
            <el-badge :value="wsStore.unread" :hidden="!wsStore.unread" :max="99" class="bell">
              <el-button text :icon="Bell" @click="router.push('/message/inbox')" />
            </el-badge>
          </el-tooltip>

          <el-dropdown @command="handleCommand">
            <span class="user-chip">
              <el-icon><User /></el-icon>
              {{ userStore.name || '未登录' }}
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
      </div>
    </header>

    <main class="content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Bell } from '@element-plus/icons-vue'
import settings from '@/settings'
import { useUserStore } from '@/store/modules/user'
import { usePermissionStore } from '@/store/modules/permission'
import { useWebsocketStore } from '@/store/modules/websocket'
import MenuItem from './components/MenuItem.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const permissionStore = usePermissionStore()
const wsStore = useWebsocketStore()

const menus = computed(() => permissionStore.visibleMenus)

const activeMenu = computed(() => {
  const seg = route.path.split('/').filter(Boolean)
  return seg.length >= 2 ? '/' + seg.slice(0, 2).join('/') : route.path
})

async function handleCommand(command) {
  if (command !== 'logout') return
  await userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.app-shell {
  min-height: 100%;
}

/* ---------- 导航 ---------- */
.nav {
  position: sticky;
  top: 0;
  z-index: 100;
  height: var(--cp-nav-h);
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
}

.nav__inner {
  max-width: var(--cp-content-w);
  height: var(--cp-nav-h);
  margin: 0 auto;
  padding: 0 22px;
  display: flex;
  align-items: center;
  gap: 28px;
}

.brand {
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--cp-text);
  cursor: pointer;
  flex-shrink: 0;
  line-height: 1;
}

.nav__menu {
  flex: 1;
  background: transparent;
  border-bottom: none !important;
}

.nav__menu :deep(.el-menu-item),
.nav__menu :deep(.el-sub-menu__title) {
  height: var(--cp-nav-h);
  line-height: var(--cp-nav-h);
  border-bottom: none !important;
  border-radius: 0;
  background: transparent !important;
  color: rgba(0, 0, 0, 0.8);
  font-size: 12px;
  letter-spacing: -0.01em;
  padding: 0 12px;
}

.nav__menu :deep(.el-menu-item:hover),
.nav__menu :deep(.el-sub-menu__title:hover) {
  color: var(--cp-primary) !important;
}

.nav__menu :deep(.el-menu-item.is-active) {
  color: var(--cp-primary) !important;
}

/* 去掉 el-menu 的下拉箭头与外层边框残留 */
.nav__menu :deep(.el-sub-menu__icon-arrow) {
  display: none;
}

.nav__right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.bell {
  display: flex;
  align-items: center;
}

.user-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.8);
  padding: 4px 8px;
  border-radius: 980px;
  cursor: pointer;
}

.user-chip:hover {
  color: var(--cp-primary);
  background: rgba(0, 0, 0, 0.04);
}

/* ---------- 内容区：大留白 + 居中窄栏 ---------- */
.content {
  max-width: var(--cp-content-w);
  margin: 0 auto;
  padding: 0 22px 72px;
}
</style>
