<template>
  <div>
    <!-- Apple 式大标题区 -->
    <section class="cp-hero">
      <h1 class="cp-hero__title">工作台</h1>
      <p class="cp-hero__subtitle">六大业务域已全部接入，从这里进入你的日常工作。</p>
    </section>

    <!-- 业务域入口 -->
    <section class="cp-card">
      <h2 class="cp-card__title">业务域</h2>
      <p class="cp-card__desc">点击卡片进入对应模块</p>
      <div class="tiles">
        <div v-for="d in domains" :key="d.path" class="tile" @click="go(d.path)">
          <div class="tile__icon" :style="{ background: d.bg }">
            <el-icon><component :is="d.icon" /></el-icon>
          </div>
          <div class="tile__text">
            <div class="tile__title">{{ d.title }}</div>
            <div class="tile__desc">{{ d.desc }}</div>
          </div>
          <el-icon class="tile__arrow"><ArrowRight /></el-icon>
        </div>
      </div>
    </section>

    <!-- 当前会话 -->
    <section class="cp-card">
      <h2 class="cp-card__title">当前会话</h2>
      <p class="cp-card__desc">登录信息与实时连接状态</p>
      <el-descriptions :column="4" border>
        <el-descriptions-item label="账号">{{ userStore.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="角色">{{ userStore.roles.join('、') || '-' }}</el-descriptions-item>
        <el-descriptions-item label="权限点数">{{ userStore.permissions.length }}</el-descriptions-item>
        <el-descriptions-item label="消息连接">
          <span :class="wsStore.connected ? 'ok' : 'off'">
            {{ wsStore.connected ? '已连接' : '未连接' }}
          </span>
        </el-descriptions-item>
      </el-descriptions>
    </section>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import {
  OfficeBuilding,
  Calendar,
  Clock,
  Document,
  ChatDotRound,
  ArrowRight
} from '@element-plus/icons-vue'
import { useUserStore } from '@/store/modules/user'
import { useWebsocketStore } from '@/store/modules/websocket'

const router = useRouter()
const userStore = useUserStore()
const wsStore = useWebsocketStore()

const domains = [
  { title: '组织管理', desc: '机构 · 部门 · 员工', path: '/org/branch', icon: OfficeBuilding, bg: '#e8f2ff' },
  { title: '日程协作', desc: '我的日程 · 部门日程 · 便签', path: '/calendar/mine', icon: Calendar, bg: '#fff1e6' },
  { title: '考勤管理', desc: '签到签退 · 历史 · 统计', path: '/attendance/sign', icon: Clock, bg: '#e9f9ee' },
  { title: '文档知识', desc: '文档库 · 回收站', path: '/document/file', icon: Document, bg: '#f3ecff' },
  { title: '消息沟通', desc: '消息管理 · 信箱 · 已发送', path: '/message/list', icon: ChatDotRound, bg: '#ffeef0' }
]

// 项目约定 7：组件间一律路由跳转
function go(path) {
  router.push(path)
}
</script>

<style scoped>
.tiles {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
}

.tile {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  border-radius: 16px;
  background: var(--cp-surface-2);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.tile:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.07);
}

.tile__icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #1d1d1f;
  flex-shrink: 0;
}

.tile__text {
  flex: 1;
  min-width: 0;
}

.tile__title {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.tile__desc {
  font-size: 12px;
  color: var(--cp-text-3);
  margin-top: 2px;
}

.tile__arrow {
  color: var(--cp-text-3);
  font-size: 14px;
}

.ok {
  color: var(--cp-success);
  font-weight: 500;
}

.off {
  color: var(--cp-text-3);
}
</style>
