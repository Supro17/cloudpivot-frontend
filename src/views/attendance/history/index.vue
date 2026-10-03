<template>
  <div>
    <PageHeader title="考勤历史" subtitle="按「机构 → 部门 → 员工」级联筛选，可见范围由你的角色数据权限决定" />

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
        <el-select v-model="branchId" clearable placeholder="全部机构" style="width: 180px" @change="onBranchChange">
          <el-option v-for="b in branchOptions" :key="b.branchId" :label="b.branchName" :value="b.branchId" />
        </el-select>
        <el-select v-model="deptId" clearable placeholder="全部部门" style="width: 180px" @change="onDeptChange">
          <el-option v-for="d in departOptions" :key="d.deptId" :label="d.deptName" :value="d.deptId" />
        </el-select>
        <el-select
          v-model="userName"
          clearable
          filterable
          placeholder="全部员工"
          style="width: 200px"
          @change="search"
        >
          <el-option
            v-for="u in userOptions"
            :key="u.userName"
            :label="(u.nickName || u.userName) + '（' + u.userName + '）'"
            :value="u.userName"
          />
        </el-select>
        <el-button class="cp-btn" type="primary" @click="search">查询</el-button>
        <el-button class="cp-btn" @click="reset">重置</el-button>
      </div>

      <el-table v-loading="loading" class="cp-table" :data="rows" :span-method="spanMethod">
        <!-- ★ 必须有「账号」列：本页是查询页，数据权限放开的人（管理员/人事/主管）
             会看到同一天多条记录，那是【不同的人】，不是重复数据。
             后端已按 (user_name, sign_date) 分组，一天一人一行。 -->
        <el-table-column prop="userName" label="账号" width="130" />
        <!-- 同一天的记录合并成一个日期单元格（设计文档 4.6.2「合并单元格」） -->
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
import { listBranch, listDepart, listUser } from '@/api/org'
import PageHeader from '@/components/PageHeader.vue'
import TablePager from '@/components/TablePager.vue'
import { formatDateTimeCN } from '@/utils/date'

// 表格时间列统一格式化（el-table 的 :formatter 签名是 (row, column, cellValue)）
const fmt = (row, column, cellValue) => formatDateTimeCN(cellValue)

const loading = ref(false)
const rows = ref([])
const total = ref(0)
const range = ref(defaultRange())

// 级联筛选：机构 → 部门 → 员工
const branchId = ref(null)
const deptId = ref(null)
const userName = ref(null)
const branchOptions = ref([])
const departOptions = ref([])
const userOptions = ref([])

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
      // 空值一律传 undefined，axios 会把它从 query string 里剔除
      branchId: branchId.value || undefined,
      deptId: deptId.value || undefined,
      userName: userName.value || undefined,
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

// 同一天的记录合并「日期」单元格（只处理日期列，索引 1；其余列不合并）
function spanMethod({ row, rowIndex, columnIndex }) {
  if (columnIndex !== 1) return
  const list = rows.value
  if (rowIndex > 0 && list[rowIndex - 1].signDate === row.signDate) {
    return { rowspan: 0, colspan: 0 } // 已被上一行合并，隐藏自身
  }
  let span = 1
  for (let i = rowIndex + 1; i < list.length; i++) {
    if (list[i].signDate === row.signDate) span++
    else break
  }
  return { rowspan: span, colspan: 1 }
}

// ===== 级联选项加载 =====
// 注意：这三个下拉都依赖 org 模块的列表接口（需要 org:*:list 权限），
// 普通员工调会 403 —— 必须 try/catch 兜住，否则主列表 getList() 永远执行不到。
async function loadBranches() {
  try {
    const res = await listBranch({ pageNum: 1, pageSize: 200 })
    branchOptions.value = res.rows || res.data || []
  } catch (e) {
    branchOptions.value = []
  }
}

async function loadDeparts(bid) {
  try {
    const res = await listDepart({ branchId: bid || undefined, pageNum: 1, pageSize: 500 })
    departOptions.value = res.rows || []
  } catch (e) {
    departOptions.value = []
  }
}

async function loadUsers(did) {
  if (!did) {
    userOptions.value = []
    return
  }
  try {
    const res = await listUser({ deptId: did, pageNum: 1, pageSize: 500 })
    userOptions.value = res.rows || []
  } catch (e) {
    userOptions.value = []
  }
}

// 换机构 → 部门/员工清空，并按机构重载部门
function onBranchChange() {
  deptId.value = null
  userName.value = null
  userOptions.value = []
  loadDeparts(branchId.value)
  search()
}

// 换部门 → 员工清空，并按部门重载员工
function onDeptChange() {
  userName.value = null
  loadUsers(deptId.value)
  search()
}

function reset() {
  range.value = defaultRange()
  branchId.value = null
  deptId.value = null
  userName.value = null
  userOptions.value = []
  loadDeparts(null)
  search()
}

onMounted(() => {
  loadBranches()
  loadDeparts(null)
  getList()
})
</script>
