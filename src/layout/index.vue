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

      <el-dropdown @command="handleCommand" trigger="click">
        <el-tooltip
          :content="userStore.orgText || '未设置部门'"
          placement="bottom"
          :disabled="!userStore.orgText"
        >
          <span class="user-chip">
            <!-- 有头像显示图片，没有则显示姓名首字（el-avatar 的插槽即回落内容） -->
            <el-avatar :size="32" :src="userStore.avatar || undefined" class="user-chip__avatar">
              {{ userStore.displayName.slice(0, 1) }}
            </el-avatar>
            <span class="user-chip__info">
              <span class="user-chip__name">{{ userStore.displayName }}</span>
              <span v-if="userStore.jobTitle || userStore.deptName" class="user-chip__meta">
                {{ userStore.jobTitle }}<template v-if="userStore.jobTitle && userStore.deptName"> · </template>{{ userStore.deptName }}
              </span>
            </span>
            <el-icon class="user-chip__caret"><ArrowDown /></el-icon>
          </span>
        </el-tooltip>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon><Postcard /></el-icon>个人资料
            </el-dropdown-item>
            <el-dropdown-item command="avatar">
              <el-icon><Picture /></el-icon>更换头像
            </el-dropdown-item>
            <el-dropdown-item command="logout" divided>
              <el-icon><SwitchButton /></el-icon>退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <!-- 隐藏的文件选择器：点「更换头像」时触发 -->
      <input
        ref="avatarInput"
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        style="display: none"
        @change="onAvatarPicked"
      />
    </div>
  </header>

  <div class="body">
    <!-- 左侧：当前一级菜单下的二级/三级页面（泛微 OA 的典型形态） -->
    <aside class="sidemenu" v-if="sides.length">
      <div class="sidemenu__title">{{ currentTopTitle }}</div>
      <el-menu class="sidemenu__menu" :default-active="activeSide" :ellipsis="false" @select="onSelectSide">
        <!-- ★ base-path 必须传当前一级菜单路径：子项 path 是相对路径（'user'），
             传空串会拼不出 /system/user，点击后跳到 /user 直接 404 -->
        <MenuItem v-for="s in sides" :key="s.path" :item="s" :base-path="activeTop" />
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

  <!-- 个人资料弹窗 -->
  <el-dialog v-model="profileVisible" title="个人资料" width="460px">
    <div class="pf">
      <div class="pf__head">
        <el-avatar :size="64" :src="userStore.avatar || undefined" class="pf__avatar">
          {{ userStore.displayName.slice(0, 1) }}
        </el-avatar>
        <div class="pf__head-text">
          <div class="pf__name">{{ userStore.displayName }}</div>
          <div class="pf__sub">{{ userStore.jobTitle || '未设置职务' }}</div>
        </div>
        <el-button class="cp-btn" size="small" @click="triggerAvatarPick">更换头像</el-button>
      </div>

      <el-descriptions :column="1" border class="pf__desc">
        <el-descriptions-item label="登录账号">{{ userStore.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="职务">
          {{ userStore.jobTitle || '未设置' }}
          <span v-if="userStore.profileRoles.length" class="pf__roles">
            （角色：{{ userStore.profileRoles.join('、') }}）
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="所属机构">{{ userStore.branchName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="所属部门">{{ userStore.deptName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="性别">{{ GENDER[userStore.gender] || '未设置' }}</el-descriptions-item>
        <el-descriptions-item label="个性签名">{{ userStore.signDesc || '-' }}</el-descriptions-item>
      </el-descriptions>
    </div>
  </el-dialog>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Bell, ArrowDown, OfficeBuilding, Postcard, Picture } from '@element-plus/icons-vue'
import * as Icons from '@element-plus/icons-vue'
import settings from '@/settings'
import { useUserStore } from '@/store/modules/user'
import { usePermissionStore } from '@/store/modules/permission'
import { useWebsocketStore } from '@/store/modules/websocket'
import { uploadAvatar } from '@/api/profile'
import { visibleChildren, resolvePath, isHttp } from '@/utils/menu'
import MenuItem from './components/MenuItem.vue'

const GENDER = { 0: '未知', 1: '男', 2: '女' }

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const permissionStore = usePermissionStore()
const wsStore = useWebsocketStore()

// 个人资料弹窗 + 隐藏的文件选择器
const profileVisible = ref(false)
const avatarInput = ref(null)

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
  // 一级本身就是外链（少见，如把 swagger 提到顶层）
  if (isHttp(index)) {
    window.open(index, '_blank')
    return
  }

  const target = menus.value.find((m) => m.path === index)
  const kids = target ? visibleChildren(target) : []

  if (kids.length) {
    // ★ 子项的 path 是【相对路径】（如 'user'、'branch'），必须拼上父路径
    //   变成 /system/user、/org/branch —— 直接 router.push('user') 会以当前路径
    //   为基准解析，从 /index 变成 /user → 404
    const full = resolvePath(index, kids[0].path)
    if (isHttp(full)) {
      window.open(full, '_blank')
    } else {
      router.push(full)
    }
  } else if (index !== '/index') {
    router.push(index)
  }
}

function onSelectSide(index) {
  if (index) router.push(index)
}

/**
 * 右上角下拉菜单：个人资料 / 更换头像 / 退出登录（安全退出）
 */
async function handleCommand(command) {
  if (command === 'profile') {
    profileVisible.value = true
    return
  }
  if (command === 'avatar') {
    triggerAvatarPick()
    return
  }
  if (command === 'logout') {
    await userStore.logout()
    router.push('/login')
  }
}

/** 触发隐藏的文件选择器 */
function triggerAvatarPick() {
  avatarInput.value && avatarInput.value.click()
}

/**
 * 选中图片后立即上传
 * 后端从登录态取用户名，所以这里只传 file，不能传 userName（防止改别人头像）
 */
async function onAvatarPicked(e) {
  const file = e.target.files && e.target.files[0]
  // 清空 value，保证连续选同一个文件也能触发 change
  e.target.value = ''
  if (!file) return

  if (!/^image\//.test(file.type)) {
    ElMessage.warning('请选择图片文件')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.warning('头像不能超过 5MB')
    return
  }

  const fd = new FormData()
  fd.append('file', file)
  try {
    await uploadAvatar(fd)
    ElMessage.success('头像已更新')
    // 重新拉一次档案，拿到新的头像地址
    await userStore.fetchProfile()
  } catch (err) {
    // request.js 已弹错误提示，这里不再重复
  }
}

// 进入布局时拉一次个人档案（头像/职务/部门/机构）
onMounted(() => {
  if (!userStore.profileLoaded) {
    userStore.fetchProfile()
  }
})
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

/* 右上角用户信息：头像 + 姓名/职务·部门 两行 */
.user-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--cp-radius-sm);
  outline: none;
}

.user-chip:hover {
  background: var(--cp-primary-light);
}

.user-chip__avatar {
  flex-shrink: 0;
  background: var(--cp-primary);
  color: #fff;
  font-size: 14px;
}

.user-chip__info {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
  min-width: 0;
}

.user-chip__name {
  font-size: 13px;
  color: var(--cp-text);
  white-space: nowrap;
}

.user-chip__meta {
  font-size: 11px;
  color: var(--cp-text-3);
  white-space: nowrap;
  max-width: 190px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-chip__caret {
  font-size: 12px;
  color: var(--cp-text-3);
  flex-shrink: 0;
}

/* ---------- 个人资料弹窗 ---------- */
.pf__head {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;
}

.pf__avatar {
  background: var(--cp-primary);
  color: #fff;
  font-size: 24px;
  flex-shrink: 0;
}

.pf__head-text {
  flex: 1;
  min-width: 0;
}

.pf__name {
  font-size: 17px;
  font-weight: 600;
  color: var(--cp-text);
}

.pf__sub {
  font-size: 12px;
  color: var(--cp-text-3);
  margin-top: 2px;
}

.pf__desc :deep(.el-descriptions__label) {
  width: 88px;
}

.pf__roles {
  color: var(--cp-text-3);
  font-size: 12px;
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
