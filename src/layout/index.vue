<template>
  <div class="app-shell">
    <!-- 顶部导航：毛玻璃，Apple 官网风格 -->
    <header class="nav">
      <div class="nav-inner">
        <div class="brand" @click="router.push('/index')">{{ settings.title }}</div>

        <el-menu
          class="nav-menu"
          mode="horizontal"
          :default-active="activeMenu"
          :ellipsis="false"
          router
        >
          <MenuItem
            v-for="item in permissionStore.sidebarRouters.filter((r) => !r.hidden)"
            :key="item.path"
            :item="item"
            base-path=""
          />
        </el-menu>

        <!-- 消息未读角标：点击进信箱 -->
        <el-tooltip content="我的信箱" placement="bottom">
          <el-badge
            :value="wsStore.unread"
            :hidden="!wsStore.unread"
            :max="99"
            class="bell"
          >
            <el-button text :icon="Bell" @click="router.push('/message/inbox')" />
          </el-badge>
        </el-tooltip>

        <el-dropdown @command="handleCommand">
          <span class="user-chip">
            <el-icon><User /></el-icon>
            {{ userStore.name || '未登录' }}
            <el-icon class="caret"><ArrowDown /></el-icon>
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

    <!-- 内容区 -->
    <main class="content">
      <router-view v-slot="{ Component }">
        <component :is="Component" />
      </router-view>
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

// 高亮当前菜单：取路径前两段（/message/list → /message/list）
const activeMenu = computed(() => {
  const p = route.path
  const seg = p.split('/').filter(Boolean)
  return seg.length >= 2 ? '/' + seg.slice(0, 2).join('/') : p
})

// 安全退出：清 Pinia 全部状态 + sessionStorage，再回登录页
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

.nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-bottom: 1px solid var(--cp-border);
}

.nav-inner {
  max-width: 1280px;
  margin: 0 auto;
  height: var(--cp-nav-height);
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 0 20px;
}

.brand {
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.3px;
  cursor: pointer;
  color: var(--cp-text);
  flex-shrink: 0;
}

.nav-menu {
  flex: 1;
  border-bottom: none !important;
  background: transparent;
}

/* el-menu horizontal 去默认底色/下划线，贴合苹果风 */
.nav-menu :deep(.el-menu-item),
.nav-menu :deep(.el-sub-menu__title) {
  border-bottom: none !important;
  height: var(--cp-nav-height);
  line-height: var(--cp-nav-height);
  color: var(--cp-text);
  font-size: 14px;
  padding: 0 14px;
  border-radius: 0;
}

.nav-menu :deep(.el-menu-item:hover),
.nav-menu :deep(.el-sub-menu__title:hover) {
  background: rgba(0, 0, 0, 0.04) !important;
}

.nav-menu :deep(.el-menu-item.is-active) {
  color: var(--cp-primary) !important;
}

.bell {
  display: flex;
  align-items: center;
}

.user-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-size: 14px;
  color: var(--cp-text);
  padding: 6px 10px;
  border-radius: 8px;
  flex-shrink: 0;
}

.user-chip:hover {
  background: rgba(0, 0, 0, 0.04);
}

.content {
  max-width: 1280px;
  margin: 0 auto;
  padding: 28px 20px 40px;
}
</style>
