<template>
  <div class="home">
    <el-card shadow="never">
      <template #header>
        <span>前端骨架已就绪</span>
      </template>
      <el-space direction="vertical" alignment="flex-start" :size="8">
        <el-text>工程：Vue3 + Vite + Element Plus + Pinia + Axios</el-text>
        <el-text>已接通：登录 / 获取用户信息 / 退出、token 存 sessionStorage、路由守卫</el-text>
        <el-text>请求走：/dev-api → 网关 8080（vite proxy 剥前缀）</el-text>
        <el-text type="warning">业务页面（六大域）待骨架审核通过后开发</el-text>
      </el-space>
    </el-card>

    <el-card shadow="never" class="mt">
      <template #header>
        <span>骨架自检</span>
      </template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="当前用户">{{ userStore.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="角色">{{ userStore.roles.join('、') || '-' }}</el-descriptions-item>
        <el-descriptions-item label="权限点数">{{ userStore.permissions.length }}</el-descriptions-item>
        <el-descriptions-item label="token 已存入 sessionStorage">✅</el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<script setup>
import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mt {
  margin-top: 0;
}
</style>
