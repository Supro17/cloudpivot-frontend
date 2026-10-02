<template>
  <div>
    <div class="page-head">
      <div>
        <h2 class="cp-page-title">已发送</h2>
        <p class="cp-page-desc">我发布过的全部消息（含已删除后不可见的除外）</p>
      </div>
      <el-button :icon="Refresh" @click="getList">刷新</el-button>
    </div>

    <div class="cp-card">
      <el-table v-loading="loading" :data="rows">
        <el-table-column prop="title" label="标题" min-width="240" show-overflow-tooltip />
        <el-table-column label="类型" width="90" align="center">
          <template #default="{ row }">{{ TYPE_TEXT[row.type] || '通知' }}</template>
        </el-table-column>
        <el-table-column label="有效期" width="340">
          <template #default="{ row }">{{ row.beginTime }} ~ {{ row.endTime }}</template>
        </el-table-column>
        <el-table-column prop="publishTime" label="发布时间" width="180" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row.messageId)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="query.pageNum"
        v-model:page-size="query.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        class="pager"
        @size-change="getList"
        @current-change="getList"
      />
    </div>

    <MsgDetailDrawer v-model="detailVisible" :message-id="detailId" />
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { listSent } from '@/api/message'
import MsgDetailDrawer from '../components/MsgDetailDrawer.vue'

const TYPE_TEXT = { 1: '通知', 2: '公告', 3: '提醒' }

const loading = ref(false)
const rows = ref([])
const total = ref(0)

const query = reactive({ pageNum: 1, pageSize: 10 })
const detailVisible = ref(false)
const detailId = ref(null)

async function getList() {
  loading.value = true
  try {
    // ⑧ 已发送是 TableDataInfo：顶层就是 total / rows
    const res = await listSent(query)
    rows.value = res.rows || []
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}

function openDetail(id) {
  detailId.value = id
  detailVisible.value = true
}

onMounted(getList)
</script>

<style scoped>
.page-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 16px;
}

.pager {
  margin-top: 16px;
  justify-content: flex-end;
}
</style>
