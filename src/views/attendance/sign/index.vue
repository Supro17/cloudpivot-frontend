<template>
  <div>
    <PageHeader title="我的考勤" subtitle="每日签到签退，一天各一次，后端以唯一索引保证幂等" />

    <div class="cp-card">
      <!-- 打卡卡片 -->
      <div class="clock">
        <div class="clock__time">{{ now }}</div>
        <div class="clock__date">{{ dateText }}</div>

        <div class="clock__rows">
          <div class="clock__row">
            <span class="clock__label">签到时间</span>
            <span class="clock__val" :class="{ done: info.signInTime }">
              {{ formatDateTimeCN(info.signInTime) }}
            </span>
          </div>
          <div class="clock__row">
            <span class="clock__label">签退时间</span>
            <span class="clock__val" :class="{ done: info.signOutTime }">
              {{ formatDateTimeCN(info.signOutTime) }}
            </span>
          </div>
        </div>

        <div class="clock__btns">
          <el-button
            class="cp-btn clock__btn"
            type="primary"
            size="large"
            :disabled="!info.canSignIn"
            :loading="loading === 'in'"
            @click="doSign('in')"
          >
            签到
          </el-button>
          <el-button
            class="cp-btn clock__btn"
            size="large"
            :disabled="!info.canSignOut"
            :loading="loading === 'out'"
            @click="doSign('out')"
          >
            签退
          </el-button>
        </div>

        <p class="clock__tip">
          已签到后按钮自动置灰 —— 幂等由后端数据库唯一索引保证，重复提交不会产生脏数据
        </p>
      </div>
    </div>

    <div class="cp-card">
      <h2 class="cp-card__title">本月概况（本人）</h2>
      <p class="cp-card__desc">
        只统计你自己 · 其他人的考勤请到「考勤统计」查看
      </p>
      <el-table class="cp-table" :data="statRows">
        <el-table-column prop="deptName" label="部门" width="220" />
        <el-table-column prop="workDays" label="工作日" width="100" align="center" />
        <el-table-column prop="actualDays" label="实际出勤" width="110" align="center" />
        <el-table-column label="出勤率" min-width="220">
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
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { today, signIn, signOut, statistics } from '@/api/attendance'
import { formatDateTimeCN, clampPercent } from '@/utils/date'
import { useUserStore } from '@/store/modules/user'
import PageHeader from '@/components/PageHeader.vue'

const userStore = useUserStore()

const info = reactive({ signInTime: null, signOutTime: null, canSignIn: false, canSignOut: false })
const statRows = ref([])
const loading = ref('')
const tick = ref(new Date())
let timer = null

// 注意：这里不能也叫 today —— 与上面 import 的 today() 接口重名会报「重复声明」
const now = computed(() => tick.value.toLocaleTimeString('zh-CN', { hour12: false }))
const dateText = computed(() =>
  tick.value.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
)

async function getToday() {
  const res = await today()
  Object.assign(info, res.data || {})
}

async function doSign(type) {
  loading.value = type
  try {
    const res = type === 'in' ? await signIn() : await signOut()
    const d = res.data || {}
    if (type === 'in' && d.late) {
      // 后端按全局工作时间（att_work_time）判定迟到
      ElMessage.warning('签到成功，迟到 ' + (d.lateMinutes || 0) + ' 分钟')
    } else {
      ElMessage.success(type === 'in' ? '签到成功' : '签退成功')
    }
    getToday()
  } finally {
    loading.value = ''
  }
}

// 工作日天数（非周六周日）：与后端 AttStatisticsServiceImpl.countWorkDays 口径一致（口径 A）
function countWorkDays(begin, end) {
  let n = 0
  for (const d = new Date(begin); d <= end; d.setDate(d.getDate() + 1)) {
    const w = d.getDay()
    if (w !== 0 && w !== 6) n++
  }
  return n
}

async function loadStat() {
  const f = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const now = new Date()
  const begin = new Date(now.getFullYear(), now.getMonth(), 1)
  // ★ 统计区间截止到今天：未到月底按当天算，而不是按整月（否则出勤率会被"未来未到的日子"拉低）
  const res = await statistics({
    beginDate: f(begin),
    endDate: f(now)
  })
  const all = res.data || []
  // ★「我的考勤」只展示本人：统计接口返回的是「当前数据权限可见范围内所有人」
  //   （admin/人事/考勤管理员能看到多行，普通员工只有自己一行）。
  //   这里统一按登录名筛出自己那一条；其他人的明细到「考勤统计」页看。
  const mine = all.find((r) => r.userName === userStore.name)
  if (mine) {
    statRows.value = [mine]
    return
  }
  // 本月还没有任何打卡记录时，后端不会返回本行（SQL 按 att_sign 分组），
  // 这里补一条「本人 0 出勤」的记录，避免页面空着让人误以为坏了。
  statRows.value = [
    {
      userName: userStore.name,
      deptName: userStore.orgText || '',
      workDays: countWorkDays(begin, now),
      actualDays: 0,
      attendanceRate: 0
    }
  ]
}

// 出勤率配色：≥90% 绿 / ≥60% 橙 / 其余红（与考勤统计页保持一致）
function rateColor(rate) {
  const v = Number(rate)
  if (v >= 90) return '#67c23a'
  if (v >= 60) return '#e6a23c'
  return '#f56c6c'
}

onMounted(() => {
  getToday()
  loadStat()
  timer = setInterval(() => (tick.value = new Date()), 1000)
})

onUnmounted(() => timer && clearInterval(timer))
</script>

<style scoped>
.clock {
  text-align: center;
  padding: 20px 0 8px;
}

.clock__time {
  font-size: 68px;
  font-weight: 300;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.clock__date {
  margin-top: 8px;
  font-size: 15px;
  color: var(--cp-text-2);
}

.clock__rows {
  display: flex;
  justify-content: center;
  gap: 60px;
  margin: 32px 0;
}

.clock__row {
  text-align: center;
}

.clock__label {
  display: block;
  font-size: 12px;
  color: var(--cp-text-3);
}

.clock__val {
  display: block;
  margin-top: 4px;
  font-size: 22px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--cp-text-3);
}

.clock__val.done {
  color: var(--cp-success);
}

.clock__btns {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.clock__btn {
  min-width: 140px;
}

.clock__tip {
  margin-top: 20px;
  font-size: 12px;
  color: var(--cp-text-3);
}

/* 出勤率：进度条 + 右侧文字。
   不用 text-inside —— 百分比小时文字会被压在色条里显示不全（实测 50% 就看不清楚） */
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
