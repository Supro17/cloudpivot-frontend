<template>
  <div>
    <PageHeader title="回收站" subtitle="删除的文档先进回收站，可还原；永久删除不可恢复" />

    <div class="cp-card">
      <div class="cp-toolbar">
        <el-button class="cp-btn" type="primary" :disabled="!rows.length" @click="handleRestoreAll">
          全部还原
        </el-button>
        <span class="hint">共 {{ total }} 条待处理</span>
      </div>

      <el-table v-loading="loading" class="cp-table" :data="rows">
        <el-table-column prop="fileName" label="名称" min-width="240" show-overflow-tooltip />
        <el-table-column label="类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag class="cp-tag" :type="row.fileType === 1 ? 'warning' : 'info'" effect="light" size="small">
              {{ row.fileType === 1 ? '文件夹' : '文件' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="fileOwner" label="原上传者" width="130" />
        <el-table-column prop="updateTime" label="删除时间" width="180" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link class="cp-link" @click="handleRestore(row)">还原</el-button>
            <el-button link class="cp-link cp-link--danger" @click="handlePurge(row)">永久删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <TablePager v-model:page="query.pageNum" v-model:size="query.pageSize" :total="total" @change="getList" />
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { recycleList, restoreDoc, purgeDoc } from '@/api/document'
import { confirmDelete } from '@/utils/confirm'
import PageHeader from '@/components/PageHeader.vue'
import TablePager from '@/components/TablePager.vue'

const loading = ref(false)
const rows = ref([])
const total = ref(0)
const query = reactive({ pageNum: 1, pageSize: 10 })

async function getList() {
  loading.value = true
  try {
    const res = await recycleList({ pageNum: query.pageNum, pageSize: query.pageSize })
    rows.value = res.rows || []
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}

function handleRestore(row) {
  restoreDoc(row.fileId).then(() => {
    ElMessage.success('已还原')
    getList()
  })
}

function handleRestoreAll() {
  ElMessageBox.confirm(`确定要还原全部 ${total.value} 条吗？`, '批量还原', {
    confirmButtonText: '全部还原',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      // 后端没有批量接口，逐条还原
      for (const r of rows.value) {
        await restoreDoc(r.fileId)
      }
      ElMessage.success('已全部还原')
      getList()
    })
    .catch(() => {})
}

// 永久删除不可恢复，确认文案要说清楚
function handlePurge(row) {
  confirmDelete(() => purgeDoc(row.fileId), `「${row.fileName}」`, {
    successMsg: '已永久删除',
    onSuccess: getList
  })
}

onMounted(getList)
</script>

<style scoped>
.hint {
  margin-left: auto;
  font-size: 12px;
  color: var(--cp-text-3);
}
</style>
