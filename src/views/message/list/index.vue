<template>
  <div>
    <div class="page-head">
      <div>
        <h2 class="cp-page-title">消息管理</h2>
        <p class="cp-page-desc">新建、编辑、发布站内消息；发布后可实时推送给在线用户</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="openForm(null)">新建消息</el-button>
    </div>

    <!-- 筛选 -->
    <div class="cp-card filter">
      <el-form inline>
        <el-form-item label="标题">
          <el-input
            v-model="query.title"
            placeholder="按标题模糊查询"
            clearable
            style="width: 220px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="发布状态">
          <el-select v-model="query.ifPublish" clearable placeholder="全部" style="width: 140px">
            <el-option label="草稿" :value="0" />
            <el-option label="已发布" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleQuery">查询</el-button>
          <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 列表 -->
    <div class="cp-card">
      <el-table v-loading="loading" :data="rows">
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
        <el-table-column label="类型" width="90" align="center">
          <template #default="{ row }">{{ TYPE_TEXT[row.type] || '通知' }}</template>
        </el-table-column>
        <el-table-column label="有效期" width="400">
          <template #default="{ row }">
            {{ formatDateTimeCN(row.beginTime) }} ~ {{ formatDateTimeCN(row.endTime) }}
          </template>
        </el-table-column>
        <el-table-column label="发布状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.ifPublish === 1 ? 'success' : 'info'" size="small">
              {{ row.ifPublish === 1 ? '已发布' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="publishTime" label="发布时间" width="200" :formatter="fmt" />
        <el-table-column label="操作" width="230" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row.messageId)">详情</el-button>
            <el-button
              v-if="row.ifPublish === 0"
              link
              type="primary"
              @click="openForm(row)"
            >
              编辑
            </el-button>
            <el-button v-if="row.ifPublish === 0" link type="success" @click="handlePublish(row)">
              发布
            </el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
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

    <MsgFormDialog v-model="formVisible" :row="editingRow" @saved="getList" />
    <MsgDetailDrawer v-model="detailVisible" :message-id="detailId" />
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { Plus, Search, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { listMsg, delMsg, publishMsg, getMsg } from '@/api/message'
import { confirmDelete } from '@/utils/confirm'
import MsgFormDialog from '../components/MsgFormDialog.vue'
import MsgDetailDrawer from '../components/MsgDetailDrawer.vue'
import { formatDateTimeCN } from '@/utils/date'

const TYPE_TEXT = { 1: '通知', 2: '公告', 3: '提醒' }

// 表格时间列统一格式化（el-table 的 :formatter 签名是 (row, column, cellValue)）
const fmt = (row, column, cellValue) => formatDateTimeCN(cellValue)

const loading = ref(false)
const rows = ref([])
const total = ref(0)

const query = reactive({
  pageNum: 1,
  pageSize: 10,
  title: '',
  ifPublish: null
})

const formVisible = ref(false)
const editingRow = ref(null)
const detailVisible = ref(false)
const detailId = ref(null)

async function getList() {
  loading.value = true
  try {
    const res = await listMsg(query)
    rows.value = res.rows || []
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}

function handleQuery() {
  query.pageNum = 1
  getList()
}

function resetQuery() {
  query.title = ''
  query.ifPublish = null
  handleQuery()
}

/**
 * 打开表单
 * ★ 编辑时必须先取详情：列表行是 MsgListVo，只有
 *   {messageId, title, type, beginTime, endTime, ifPublish, publishTime}，
 *   **不含 content / sendScope / scopeValue** —— 直接用它回显会把正文清空，
 *   提交时后端报「内容不能为空」，编辑永远失败。
 */
async function openForm(row) {
  if (row?.messageId) {
    const res = await getMsg(row.messageId)
    editingRow.value = res.data
  } else {
    editingRow.value = null
  }
  formVisible.value = true
}

function openDetail(id) {
  detailId.value = id
  detailVisible.value = true
}

// 发布是关键动作：确认后执行；后端幂等，重复发布会提示「请勿重复发布」
function handlePublish(row) {
  ElMessageBox.confirm(`确定发布「${row.title}」吗？发布后内容与发送对象将被锁定。`, '发布确认', {
    confirmButtonText: '发布',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => publishMsg(row.messageId))
    .then(() => {
      ElMessage.success('发布成功，已投递推送')
      getList()
    })
    .catch(() => {})
}

// 项目要求 5：删除必须有确认弹窗
function handleDelete(row) {
  confirmDelete(() => delMsg(row.messageId), `消息「${row.title}」`, {
    onSuccess: getList
  })
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

.filter {
  margin-bottom: 16px;
  padding: 16px 16px 0;
}

.filter :deep(.el-form-item) {
  margin-bottom: 16px;
}

.pager {
  margin-top: 16px;
  justify-content: flex-end;
}
</style>
