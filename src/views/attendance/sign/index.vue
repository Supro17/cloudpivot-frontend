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
              {{ info.signInTime || '未签到' }}
            </span>
          </div>
          <div class="clock__row">
            <span class="clock__label">签退时间</span>
            <span class="clock__val" :class="{ done: info.signOutTime }">
              {{ info.signOutTime || '未签退' }}
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
      <h2 class="cp-card__title">本月概况</h2>
      <p class="cp-card__desc">来自考勤统计接口，含工作日与实际出勤</p>
      <el-table class="cp-table" :data="statRows">
        <el-table-column prop="userName" label="账号" width="140" />
        <el-table-column prop="deptName" label="部门" width="180" />
        <el-table-column prop="workDays" label="工作日" width="100" align="center" />
        <el-table-column prop="actualDays" label="实际出勤" width="110" align="center" />
        <el-table-column label="出勤率" min-width="220">
          <template #default="{ row }">
            <el-progress :percentage="Number(row.attendanceRate)" :stroke-width="8" text-inside />
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
import PageHeader from '@/components/PageHeader.vue'

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
    ElMessage.success(res.msg || (type === 'in' ? '签到成功' : '签退成功'))
    getToday()
  } finally {
    loading.value = ''
  }
}

async function loadStat() {
  const now = new Date()
  const begin = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const res = await statistics({
    beginDate: begin,
    endDate: `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`
  })
  statRows.value = res.data || []
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
</style>
