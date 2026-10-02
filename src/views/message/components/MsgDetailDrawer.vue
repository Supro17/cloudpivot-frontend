<template>
  <el-drawer v-model="visible" :title="detail?.title || '消息详情'" size="42%">
    <div v-if="detail" class="detail">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="类型">{{ typeText }}</el-descriptions-item>
        <el-descriptions-item label="发布状态">
          <el-tag :type="detail.ifPublish === 1 ? 'success' : 'info'" size="small">
            {{ detail.ifPublish === 1 ? '已发布' : '草稿' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="有效期开始">{{ detail.beginTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="有效期结束">{{ detail.endTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="发送范围" :span="2">{{ scopeText }}</el-descriptions-item>
      </el-descriptions>

      <div class="content-title">正文</div>
      <div class="content-body">{{ detail.content || '（无正文）' }}</div>
    </div>
  </el-drawer>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { getMsg } from '@/api/message'

const visible = defineModel({ type: Boolean, default: false })
const props = defineProps({ messageId: { type: [Number, String], default: null } })

const detail = ref(null)

const TYPE_TEXT = { 1: '通知', 2: '公告', 3: '提醒' }
const SCOPE_TEXT = { 0: '所有人', 1: '按机构', 2: '按部门', 3: '按员工' }

const typeText = computed(() => TYPE_TEXT[detail.value?.type] || '通知')
const scopeText = computed(() => {
  const scope = detail.value?.sendScope
  const base = SCOPE_TEXT[scope] || '-'
  // 定向时把范围值展示出来（后端 scopeValue 是逗号分隔）
  return scope === 0 || !detail.value?.scopeValue ? base : `${base}：${detail.value.scopeValue}`
})

watch(
  () => [visible.value, props.messageId],
  ([show, id]) => {
    if (show && id) {
      getMsg(id).then((res) => {
        detail.value = res.data
      })
    }
    if (!show) detail.value = null
  }
)
</script>

<style scoped>
.content-title {
  margin: 20px 0 8px;
  font-weight: 600;
}

.content-body {
  white-space: pre-wrap;
  line-height: 1.8;
  background: var(--cp-bg);
  border-radius: var(--cp-radius-md);
  padding: 16px;
  min-height: 120px;
  color: var(--cp-text);
}
</style>
