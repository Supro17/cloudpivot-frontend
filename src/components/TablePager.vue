<template>
  <div class="pager">
    <span class="pager__total">共 {{ total }} 条</span>
    <el-pagination
      v-model:current-page="page"
      v-model:page-size="size"
      :page-sizes="[10, 20, 50, 100]"
      :total="total"
      layout="sizes, prev, pager, next"
      background
      @current-change="emit('change')"
      @size-change="emit('change')"
    />
  </div>
</template>

<script setup>
/**
 * 分页条：左侧总数、右侧页码。所有分页列表页共用。
 * 用 defineModel 做双向绑定（props 不可写，v-model 不能直接落在 prop 上）。
 * 用法：<TablePager v-model:page="query.pageNum" v-model:size="query.pageSize" :total="total" @change="getList" />
 */
const page = defineModel('page', { type: Number, default: 1 })
const size = defineModel('size', { type: Number, default: 10 })

defineProps({
  total: { type: Number, default: 0 }
})

const emit = defineEmits(['change'])
</script>

<style scoped>
.pager {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20px;
}

.pager__total {
  font-size: 13px;
  color: var(--cp-text-3);
}
</style>
