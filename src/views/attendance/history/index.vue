<template>
  <div>
    <PageHeader title="考勤历史" :subtitle="hasOrgFilter
        ? '按「机构 → 部门 → 员工」级联筛选，可见范围由你的角色数据权限决定'
        : '可见范围由你的角色数据权限决定，当前仅能查询本人考勤记录'" />

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
        <!-- 级联筛选器依赖 org 模块的列表接口权限（org:branch|depart|user:list）。
             无该权限的角色（如普通员工）只显示日期筛选 —— 既不展示空下拉，也不发起必然 403 的请求。 -->
        <el-select
          v-if="canFilterBranch"
          v-model="branchId"
          clearable
          placeholder="全部机构"
          style="width: 180px"
          @change="onBranchChange"
        >
          <el-option v-for="b in branchOptions" :key="b.branchId" :label="b.branchName" :value="b.branchId" />
        </el-select>
        <el-select
          v-if="canFilterDepart"
          v-model="deptId"
          clearable
          placeholder="全部部门"
          style="width: 180px"
          @change="onDeptChange"
        >
          <el-option v-for="d in departOptions" :key="d.deptId" :label="d.deptName" :value="d.deptId" />
        </el-select>
        <el-select
          v-if="canFilterUser"
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

      <div v-if="!hasOrgFilter" class="filter-hint">
        你的角色没有组织架构查看权限，无法按机构/部门/员工筛选，此处仅显示数据权限范围内（本人）的考勤记录
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
import { computed, onMounted, reactive, ref } from 'vue'
import { history } from '@/api/attendance'
import { listBranch, listDepart, listUser } from '@/api/org'
import PageHeader from '@/components/PageHeader.vue'
import TablePager from '@/components/TablePager.vue'
import { formatDateTimeCN } from '@/utils/date'
import { checkPermi } from '@/utils/permission'

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

// 级联筛选器依赖 org 模块的列表接口权限。能进本页的角色里，staff / doc_admin
// 只拿到 attendance:history:list，没有 org:*:list —— 对他们不显示筛选器、不发起请求，
// 否则后端返回 403，会被 axios 拦截器弹成全局「没有访问权限」提示。
const canFilterBranch = computed(() => checkPermi(['org:branch:list']))
const canFilterDepart = computed(() => checkPermi(['org:depart:list']))
const canFilterUser = computed(() => checkPermi(['org:user:list']))
const hasOrgFilter = computed(() => canFilterBranch.value || canFilterDepart.value || canFilterUser.value)

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
// 三个下拉都依赖 org 模块的列表接口（需要 org:*:list 权限）。
// 双重保险：① 调用前先判权限，无权限直接不发请求；② 请求统一带 silent:true，
// 万一后端权限有变动，也只静默失败、不弹全局「没有访问权限」提示。
async function loadBranches() {
  if (!canFilterBranch.value) {
    branchOptions.value = []
    return
  }
  try {
    const res = await listBranch({ pageNum: 1, pageSize: 200 }, { silent: true })
    branchOptions.value = res.rows || res.data || []
  } catch (e) {
    branchOptions.value = []
  }
}

async function loadDeparts(bid) {
  if (!canFilterDepart.value) {
    departOptions.value = []
    return
  }
  try {
    const res = await listDepart({ branchId: bid || undefined, pageNum: 1, pageSize: 500 }, { silent: true })
    departOptions.value = res.rows || []
  } catch (e) {
    departOptions.value = []
  }
}

async function loadUsers(did) {
  if (!did || !canFilterUser.value) {
    userOptions.value = []
    return
  }
  try {
    const res = await listUser({ deptId: did, pageNum: 1, pageSize: 500 }, { silent: true })
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
  if (canFilterDepart.value) loadDeparts(null)
  search()
}

onMounted(() => {
  // 无 org 权限的角色（普通员工 / 文档管理员）只加载主列表
  if (canFilterBranch.value) loadBranches()
  if (canFilterDepart.value) loadDeparts(null)
  getList()
})
</script>

<style scoped>
/* 无组织架构权限时的说明条：解释「为什么没有筛选器」，避免用户以为页面坏了 */
.filter-hint {
  margin-top: 10px;
  padding: 8px 12px;
  border-left: 3px solid var(--cp-warn, #e6a23c);
  background: var(--cp-surface-2);
  border-radius: 6px;
  color: var(--cp-text-2);
  font-size: 13px;
  line-height: 1.6;
}
</style>
