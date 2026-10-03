<template>
  <div>
    <PageHeader title="考勤统计" subtitle="按区间统计出勤率，工作日由后端按「非周末」规则计算" />

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
        <el-select v-model="deptId" clearable placeholder="全部部门" style="width: 200px" @change="search">
          <el-option v-for="d in departOptions" :key="d.deptId" :label="d.deptName" :value="d.deptId" />
        </el-select>
        <el-button class="cp-btn" type="primary" @click="search">查询</el-button>
        <el-button class="cp-btn" @click="reset">重置</el-button>
      </div>

      <el-table v-loading="loading" class="cp-table" :data="rows">
        <el-table-column prop="userName" label="账号" width="140" />
        <el-table-column prop="deptName" label="部门" width="180" />
        <el-table-column prop="workDays" label="工作日" width="100" align="center" />
        <el-table-column prop="actualDays" label="实际出勤" width="110" align="center" />
        <el-table-column label="出勤率" min-width="240">
          <template #default="{ row }">
            <div class="rate">
              <el-progress
                :percentage="clampPercent(row.attendanceRate)"
                :stroke-width="10"
                :show-text="false"
                :color="rateColor(row.attendanceRate)"
              />
              <span class="rate__text">{{ row.attendanceRate }}%</span>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { statistics } from '@/api/attendance'
import { listDepart } from '@/api/org'
import { clampPercent } from '@/utils/date'
import PageHeader from '@/components/PageHeader.vue'

const loading = ref(false)
const rows = ref([])
const deptId = ref(null)
const departOptions = ref([])
const range = ref(defaultRange())

function defaultRange() {
  const end = new Date()
  const start = new Date(end.getFullYear(), end.getMonth(), 1)
  const f = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return [f(start), f(end)]
}

function rateColor(rate) {
  const v = Number(rate)
  if (v >= 90) return '#34c759'
  if (v >= 60) return '#ff9f0a'
  return '#ff3b30'
}

async function getList() {
  loading.value = true
  try {
    const res = await statistics({ beginDate: range.value?.[0], endDate: range.value?.[1], deptId: deptId.value })
    rows.value = res.data || []
  } finally {
    loading.value = false
  }
}

function search() {
  getList()
}

function reset() {
  range.value = defaultRange()
  deptId.value = null
  getList()
}

// 出勤率文字放在进度条外面（text-inside 时小百分比会被压在色条里看不清）
onMounted(async () => {
  // 部门下拉只是「筛选项」：拿不到（例如普通员工没有 org:depart:list 权限）也不能
  // 影响主列表加载 —— 否则 await 抛错会让后面的 getList() 永远执行不到，页面一片空白
  try {
    const res = await listDepart({ pageNum: 1, pageSize: 500 })
    departOptions.value = res.rows || []
  } catch (e) {
    departOptions.value = []
  }
  getList()
})
  </script>

<style scoped>
/* 出勤率：进度条 + 右侧文字。不用 text-inside —— 百分比小时文字会被压在色条里显示不全 */
.rate {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rate :deep(.el-progress) {
  flex: 1;
  min-width: 120px;
}

.rate__text {
  width: 64px;
  text-align: right;
  color: var(--cp-text-2);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}
</style>
