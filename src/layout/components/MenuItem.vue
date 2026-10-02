<template>
  <!-- 有可见子级 → 下拉组；否则 → 可点击叶子 -->
  <template v-if="!isLeaf(item)">
    <el-sub-menu :index="item.path">
      <template #title>
        <el-icon v-if="iconComp"><component :is="iconComp" /></el-icon>
        <span>{{ item.meta?.title }}</span>
      </template>
      <MenuItem v-for="child in children" :key="child.path" :item="child" :base-path="item.path" />
    </el-sub-menu>
  </template>

  <!-- 外链：新窗口打开 -->
  <template v-else-if="isExternal(fullPath)">
    <a :href="fullPath" target="_blank" rel="noopener">
      <el-menu-item :index="fullPath">
        <el-icon v-if="iconComp"><component :is="iconComp" /></el-icon>
        <template #title>{{ item.meta?.title }}</template>
      </el-menu-item>
    </a>
  </template>

  <!-- 普通叶子：路由跳转（项目约定：组件间一律路由跳转） -->
  <el-menu-item v-else :index="fullPath">
    <el-icon v-if="iconComp"><component :is="iconComp" /></el-icon>
    <template #title>{{ item.meta?.title }}</template>
  </el-menu-item>
</template>

<script setup>
import { computed } from 'vue'
import * as Icons from '@element-plus/icons-vue'
import { isHttp, resolvePath, visibleChildren, isLeaf } from '@/utils/menu'

const props = defineProps({
  item: { type: Object, required: true },
  basePath: { type: String, default: '' }
})

const children = computed(() => visibleChildren(props.item))
const fullPath = computed(() => resolvePath(props.basePath, props.item.path))
const isExternal = (p) => isHttp(p)

// 后端返回的 icon 是名字（如 'system' / 'user'），映射到 Element Plus 图标
const iconComp = computed(() => Icons[props.item.meta?.icon] || null)
</script>
