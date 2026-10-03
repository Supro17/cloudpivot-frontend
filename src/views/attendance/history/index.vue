<template>
  <div>
    <PageHeader title="考勤历史" subtitle="按日期区间查询考勤记录，可见范围由你的角色数据权限决定" />

    <div class="cp-card">
      <div class="cp-toolbar">
        <el-date-picker
          v-model="range"
          type="daterange"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width: 260px"
        />
        <el-button class="cp-btn" type="primary" @click="search">查询</el-button>
        <el-button class="cp-btn" @click="reset">重置</el-button>
      </div>

      <el-table v-loading="loading" class="cp-table" :data="rows">
        <!-- ★ 必须有「账号」列：本页是查询页，数据权限放开的人（管理员/人事/主管）
             会看到同一天多条记录，那是【不同的人】，不是重复数据。
             后端已按 (user_name, sign_date) 分组，一天一人一行。 -->
        <el-table-column prop="userName" label="账号" width="130" />
        <el-table-column prop="signDate" label="日期" width="190" :formatter="fmt" />
        <el-table-column prop="signInTime" label="签到时间" width="200" :formatter="fmt" />
        <el-table-column prop="signOutTime" label="签退时间" width="200" :formatter="fmt" />
        <el-table-column label="状态" width="140" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.signInTime && row.signOutTime" class="cp-tag" type="success" effect="light">完整</el-tag>
            <el-tag v-else-if="row.signInTime" class="cp-tag" type="warning" effect="light">仅签到</el-tag>
            <el-tag v-else class="cp-tag" type="info" effect="light">缺勤</el-tag>
          </template>
        </el-table-column>
      </el-table>

      <TablePager v-model:page="query.pageNum" v-model:size="query.pageSize" :total="total" @change="getList" />
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { history } from '@/api/attendance'
import PageHeader from '@/components/PageHeader.vue'
import TablePager from '@/components/TablePager.vue'
import { formatDateTimeCN } from '@/utils/date'

// 表格时间列统一格式化（el-table 的 :formatter 签名是 (row, column, cellValue)）
const fmt = (row, column, cellValue) => formatDateTimeCN(cellValue)

const loading = ref(false)
const rows = ref([])
const total = ref(0)
const range = ref(defaultRange())

const query = reactive({ pageNum: 1, pageSize: 10 })

function defaultRange() {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 30)
  const f = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return [f(start), f(end)]
}

async function getList() {
  loading.value = true
  try {
    const res = await history({
      beginDate: range.value?.[0],
      endDate: range.value?.[1],
      pageNum: query.pageNum,
      pageSize: query.pageSize
    })
    rows.value = res.rows || []
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}

function search() {
  query.pageNum = 1
  getList()
}

function reset() {
  range.value = defaultRange()
  search()
}

onMounted(getList)
</script>
