<template>
  <div>
    <div class="cp-hero">
      <div>
        <h1 class="cp-hero__title">工作台</h1>
        <p class="cp-hero__subtitle">欢迎回来，{{ userStore.name }}。这里是六大业务域的入口。</p>
      </div>
    </div>

    <!-- 统计 -->
    <div class="cp-card">
      <h2 class="cp-card__title">我的概况</h2>
      <div class="stats">
        <div class="stat">
          <div class="stat__num">{{ wsStore.unread }}</div>
          <div class="stat__label">未读消息</div>
        </div>
        <div class="stat">
          <div class="stat__num">{{ userStore.roles.length }}</div>
          <div class="stat__label">拥有角色</div>
        </div>
        <div class="stat">
          <div class="stat__num">{{ userStore.permissions.length }}</div>
          <div class="stat__label">权限点</div>
        </div>
        <div class="stat">
          <div class="stat__num">{{ wsStore.connected ? '在线' : '离线' }}</div>
          <div class="stat__label">消息连接</div>
        </div>
      </div>
    </div>

    <!-- 快捷入口 -->
    <div class="cp-card">
      <h2 class="cp-card__title">快捷入口</h2>
      <div class="entries">
        <div v-for="d in domains" :key="d.path" class="entry" @click="go(d.path)">
          <el-icon class="entry__icon" :style="{ background: d.bg, color: d.color }">
            <component :is="d.icon" />
          </el-icon>
          <div class="entry__text">
            <div class="entry__title">{{ d.title }}</div>
            <div class="entry__desc">{{ d.desc }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import {
  OfficeBuilding,
  Calendar,
  Clock,
  Document,
  ChatDotRound
} from '@element-plus/icons-vue'
import { useUserStore } from '@/store/modules/user'
import { useWebsocketStore } from '@/store/modules/websocket'

const router = useRouter()
const userStore = useUserStore()
const wsStore = useWebsocketStore()

const domains = [
  { title: '组织管理', desc: '机构 · 部门 · 员工', path: '/org/branch', icon: OfficeBuilding, bg: '#ecf5ff', color: '#1e7fff' },
  { title: '日程协作', desc: '我的日程 · 部门日程 · 便签', path: '/calendar/mine', icon: Calendar, bg: '#fdf6ec', color: '#e6a23c' },
  { title: '考勤管理', desc: '签到签退 · 历史 · 统计', path: '/attendance/sign', icon: Clock, bg: '#f0f9eb', color: '#67c23a' },
  { title: '文档知识', desc: '文档库 · 回收站', path: '/document/file', icon: Document, bg: '#f4f4f5', color: '#909399' },
  { title: '消息沟通', desc: '消息管理 · 信箱 · 已发送', path: '/message/list', icon: ChatDotRound, bg: '#fef0f0', color: '#f56c6c' }
]

// 项目约定 7：组件间一律路由跳转
function go(path) {
  router.push(path)
}
</script>

<style scoped>
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}

.stat {
  background: #fafbfc;
  border: 1px solid var(--cp-border-light);
  border-radius: var(--cp-radius);
  padding: 16px;
  text-align: center;
}

.stat__num {
  font-size: 26px;
  font-weight: 600;
  color: var(--cp-primary);
  line-height: 1.2;
}

.stat__label {
  font-size: 12px;
  color: var(--cp-text-3);
  margin-top: 4px;
}

.entries {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px;
}

.entry {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid var(--cp-border-light);
  border-radius: var(--cp-radius);
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.entry:hover {
  border-color: var(--cp-primary);
}

.entry__icon {
  width: 34px;
  height: 34px;
  border-radius: var(--cp-radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  flex-shrink: 0;
}

.entry__title {
  font-size: 13px;
  font-weight: 600;
}

.entry__desc {
  font-size: 12px;
  color: var(--cp-text-3);
  margin-top: 1px;
}
</style>
