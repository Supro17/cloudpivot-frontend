<template>
  <div class="cp-card placeholder">
    <h2 class="cp-page-title">{{ title }}</h2>
    <p class="cp-page-desc">该页面来自若依底座的菜单，不在六大业务域范围内，骨架阶段未实现。</p>
    <el-empty description="页面待实现" :image-size="90" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const title = computed(() => route.meta?.title || '页面')
</script>
