<template>
  <div>
    <PageHeader title="部门日程" subtitle="按周查看所选部门成员的日程安排，用于排会与协调">
      <template #actions>
        <el-select v-model="deptId" placeholder="全部部门" clearable style="width: 200px" @change="load">
          <el-option v-for="d in departOptions" :key="d.deptId" :label="d.deptName" :value="d.deptId" />
        </el-select>
      </template>
    </PageHeader>

    <div class="cp-card">
      <div class="cp-toolbar">
        <el-button class="cp-btn" :icon="ArrowLeft" @click="goWeek(-7)" />
        <strong>{{ weekStart }} ~ {{ weekEnd }}</strong>
        <el-button class="cp-btn" :icon="ArrowRight" @click="goWeek(7)" />
        <el-button class="cp-btn" @click="thisWeek">本周</el-button>
      </div>

      <div class="week">
        <div v-for="d in days" :key="d.date" class="day">
          <div class="day__head">
            <div class="day__week">{{ d.week }}</div>
            <div class="day__date">{{ d.md }}</div>
          </div>
          <ul class="day__list">
            <li v-for="s in map[d.date] || []" :key="s.scheduleId">
              <span class="t">{{ s.beginTime?.slice(11, 16) }}</span>
              <span class="n">{{ s.title }}</span>
              <span class="u">{{ s.createUser }}</span>
            </li>
            <li v-if="!(map[d.date] || []).length" class="empty">—</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import { departWeek } from '@/api/schedule'
import { listDepart } from '@/api/org'
import PageHeader from '@/components/PageHeader.vue'

const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

const deptId = ref(null)
const departOptions = ref([])
const weekStart = ref(monday(new Date()))
const map = ref({})

function monday(d) {
  const x = new Date(d)
  const day = (x.getDay() + 6) % 7
  x.setDate(x.getDate() - day)
  return fmt(x)
}

function fmt(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const weekEnd = computed(() => {
  const d = new Date(weekStart.value)
  d.setDate(d.getDate() + 6)
  return fmt(d)
})

const days = computed(() =>
  Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart.value)
    d.setDate(d.getDate() + i)
    return {
      date: fmt(d),
      week: WEEK[(d.getDay() + 6) % 7 === 6 ? 0 : (d.getDay() + 6) % 7],
      md: `${d.getMonth() + 1}/${d.getDate()}`
    }
  })
)

async function load() {
  const res = await departWeek({ deptId: deptId.value, weekStart: weekStart.value })
  map.value = res.data || {}
}

function goWeek(step) {
  const d = new Date(weekStart.value)
  d.setDate(d.getDate() + step)
  weekStart.value = fmt(d)
  load()
}

function thisWeek() {
  weekStart.value = monday(new Date())
  load()
}

onMounted(async () => {
  // 部门下拉只是「筛选项」：拿不到（例如角色没有 org:depart:list）也不能影响主列表加载，
  // 否则 await 抛错会让后面的 load() 永远执行不到，页面一片空白
  try {
    const res = await listDepart({ pageNum: 1, pageSize: 500 }, { silent: true })
    departOptions.value = res.rows || []
  } catch (e) {
    departOptions.value = []
  }
  load()
})
</script>

<style scoped>
.week {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 10px;
}

.day {
  background: var(--cp-surface-2);
  border-radius: 14px;
  padding: 12px;
  min-height: 180px;
}

.day__head {
  text-align: center;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--cp-hairline);
  margin-bottom: 8px;
}

.day__week {
  font-size: 12px;
  color: var(--cp-text-3);
}

.day__date {
  font-size: 15px;
  font-weight: 600;
}

.day__list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.day__list li {
  font-size: 12px;
  padding: 4px 0;
  border-bottom: 1px dashed rgba(0, 0, 0, 0.05);
  line-height: 1.4;
}

.day__list .t {
  color: var(--cp-primary);
  margin-right: 4px;
}

.day__list .u {
  color: var(--cp-text-3);
  margin-left: 4px;
}

.day__list .empty {
  color: var(--cp-text-3);
  text-align: center;
}
</style>
