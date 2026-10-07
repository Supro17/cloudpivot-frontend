<template>
  <div>
    <div class="page-head">
      <div>
        <h2 class="cp-page-title">我的信箱</h2>
        <p class="cp-page-desc">
          收到消息后点击「查看」即标记已读；未读数
          <el-badge :value="unread" :hidden="unread === 0" class="badge">
            <el-icon><Bell /></el-icon>
          </el-badge>
        </p>
      </div>
      <div class="head-actions">
        <el-button
          v-hasPermi="['message:add']"
          type="primary"
          :icon="EditPen"
          @click="sendVisible = true"
        >
          发消息
        </el-button>
        <el-button :icon="Refresh" @click="refresh">刷新</el-button>
      </div>
    </div>

    <div class="cp-card">
      <el-table v-loading="loading" :data="rows">
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.ifRead === 1 ? 'info' : 'danger'" size="small" effect="light">
              {{ row.ifRead === 1 ? '已读' : '未读' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="240" show-overflow-tooltip />
        <el-table-column prop="fromUser" label="发送人" width="140" />
        <el-table-column prop="publishTime" label="发布时间" width="200" :formatter="fmt" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)">
              {{ row.ifRead === 1 ? '查看' : '查看并标记已读' }}
            </el-button>
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

    <!-- 发消息：复用消息表单（mode=send 走「新建并立即发布」，不落草稿） -->
    <MsgFormDialog v-model="sendVisible" mode="send" @saved="onSent" />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { Bell, EditPen, Refresh } from '@element-plus/icons-vue'
import { listInbox, markRead } from '@/api/message'
import { useWebsocketStore } from '@/store/modules/websocket'
import MsgDetailDrawer from '../components/MsgDetailDrawer.vue'
import MsgFormDialog from '../components/MsgFormDialog.vue'
import { formatDateTimeCN } from '@/utils/date'

const wsStore = useWebsocketStore()

// 表格时间列统一格式化（el-table 的 :formatter 签名是 (row, column, cellValue)）
const fmt = (row, column, cellValue) => formatDateTimeCN(cellValue)

const loading = ref(false)
const rows = ref([])
const total = ref(0)

// 未读数以 wsStore 为唯一数据源：顶部红点与页面 badge 共用同一个值，
// 避免 WebSocket 推送只更新一端、导致同一页面出现两个不同的数字
const unread = computed(() => wsStore.unread)

const query = reactive({ pageNum: 1, pageSize: 10 })
const detailVisible = ref(false)
const detailId = ref(null)
const sendVisible = ref(false)

async function getList() {
  loading.value = true
  try {
    // ⑦ 信箱的返回体是 AjaxResult：data 里是 { total, rows }
    const res = await listInbox(query)
    const data = res.data || {}
    rows.value = data.rows || []
    total.value = data.total || 0
  } finally {
    loading.value = false
  }
}

function refresh() {
  getList()
  wsStore.refreshUnread()
}

// 发送成功：刷新列表与未读数（自己可能也在接收范围内）
function onSent() {
  getList()
  wsStore.refreshUnread()
}

// 查看详情 + 未读则标记已读（⑨ 幂等，重复点击也不会重复计数）
function handleView(row) {
  detailId.value = row.messageId
  detailVisible.value = true
  if (row.ifRead !== 1) {
    markRead(row.messageId).then(() => {
      row.ifRead = 1
      // 不做本地自减，直接以服务端重算的值为准
      wsStore.refreshUnread()
    })
  }
}

onMounted(() => {
  getList()
  wsStore.refreshUnread()
})
</script>

<style scoped>
.page-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 16px;
}

.badge {
  vertical-align: middle;
}

.head-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pager {
  margin-top: 16px;
  justify-content: flex-end;
}
</style>
