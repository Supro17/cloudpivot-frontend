<template>
  <div>
    <PageHeader title="我的日程" subtitle="月历视图查看与新增个人日程，支持例会、评审、培训等类型">
      <template #actions>
        <el-button v-hasPermi="['schedule:add']" class="cp-btn" type="primary" :icon="Plus" @click="openForm()">新增日程</el-button>
      </template>
    </PageHeader>

    <div class="cp-card">
      <div class="cp-toolbar">
        <el-button class="cp-btn" :icon="ArrowLeft" @click="goMonth(-1)" />
        <strong class="month">{{ month }}</strong>
        <el-button class="cp-btn" :icon="ArrowRight" @click="goMonth(1)" />
        <el-button class="cp-btn" @click="month = todayMonth">本月</el-button>
        <span class="hint">带 <i class="dot" /> 标记的日期有日程</span>
      </div>

      <el-calendar v-model="selectedDate">
        <template #date-cell="{ data }">
          <div class="cell" :class="{ 'cell--has': (map[data.day] || []).length }">
            <div class="cell__date">{{ Number(data.day.split('-')[2]) }}</div>
            <ul class="cell__list">
              <li v-for="s in (map[data.day] || []).slice(0, 2)" :key="s.scheduleId" @click.stop="openDetail(s)">
                {{ s.title }}
              </li>
              <li v-if="(map[data.day] || []).length > 2" class="cell__more">+{{ map[data.day].length - 2 }} 项</li>
            </ul>
          </div>
        </template>
      </el-calendar>
    </div>

    <!-- 新增 / 编辑 -->
    <el-dialog v-model="formVisible" :title="form.scheduleId ? '编辑日程' : '新增日程'" width="600px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="日程标题" />
        </el-form-item>
        <el-form-item label="会议类型" prop="meetingId">
          <el-select v-model="form.meetingId" placeholder="选择类型" style="width: 100%">
            <el-option v-for="t in types" :key="t.meetingId" :label="t.meetingName" :value="t.meetingId" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间" required>
          <el-date-picker
            v-model="range"
            type="datetimerange"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            start-placeholder="开始"
            end-placeholder="结束"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="地点" prop="address">
          <el-input v-model="form.address" placeholder="如：3楼会议室" />
        </el-form-item>
        <el-form-item label="参与人" prop="preContracts">
          <el-select v-model="form.preContracts" multiple filterable placeholder="可留空" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注" prop="schContent">
          <el-input v-model="form.schContent" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="私密" prop="ifPrivate">
          <el-switch v-model="form.ifPrivate" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button class="cp-btn" @click="formVisible = false">取消</el-button>
        <el-button class="cp-btn" type="primary" :loading="saving" @click="submit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer v-model="detailVisible" title="日程详情" size="38%">
      <template v-if="current">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="标题">{{ current.title }}</el-descriptions-item>
          <el-descriptions-item label="类型">{{ current.meetingName }}</el-descriptions-item>
          <el-descriptions-item label="时间">{{ formatDateTimeCN(current.beginTime) }} ~ {{ formatDateTimeCN(current.endTime) }}</el-descriptions-item>
          <el-descriptions-item label="地点">{{ current.address || '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{ current.schContent || '-' }}</el-descriptions-item>
        </el-descriptions>
        <div class="drawer-actions">
          <el-button v-hasPermi="['schedule:edit']" class="cp-btn" type="primary" @click="editFromDetail">编辑</el-button>
          <el-button class="cp-btn" @click="backToList">返回日历</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { Plus, ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import {
  mineCalendar,
  meetingType,
  addSchedule,
  updateSchedule,
  getSchedule
} from '@/api/schedule'
import PageHeader from '@/components/PageHeader.vue'
import { formatDateTimeCN } from '@/utils/date'

const todayMonth = new Date().toISOString().slice(0, 7)
const month = ref(todayMonth)
const selectedDate = ref('')
const map = ref({})
const types = ref([])

const formVisible = ref(false)
const detailVisible = ref(false)
const saving = ref(false)
const formRef = ref(null)
const range = ref([])
const current = ref(null)

const form = reactive({
  scheduleId: null,
  title: '',
  meetingId: null,
  address: '',
  schContent: '',
  ifPrivate: 0,
  preContracts: []
})

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  meetingId: [{ required: true, message: '请选择会议类型', trigger: 'change' }]
}

// 后端返回 { "yyyy-MM-dd": [日程...] }，直接存 map 按天取
async function getCalendar() {
  const res = await mineCalendar(month.value)
  map.value = res.data || {}
}

async function loadTypes() {
  if (types.value.length) return
  const res = await meetingType()
  types.value = res.data || []
}

function goMonth(step) {
  const [y, m] = month.value.split('-').map(Number)
  const d = new Date(y, m - 1 + step, 1)
  month.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

watch(month, getCalendar)

function openForm(row) {
  loadTypes()
  Object.assign(form, {
    scheduleId: row?.scheduleId ?? null,
    title: row?.title ?? '',
    meetingId: row?.meetingId ?? null,
    address: row?.address ?? '',
    schContent: row?.schContent ?? '',
    ifPrivate: row?.ifPrivate ?? 0,
    preContracts: row?.preContracts || []
  })
  range.value = row?.beginTime ? [row.beginTime, row.endTime] : []
  detailVisible.value = false
  formVisible.value = true
  formRef.value?.clearValidate()
}

async function openDetail(s) {
  const res = await getSchedule(s.scheduleId)
  current.value = res.data
  detailVisible.value = true
}

function editFromDetail() {
  openForm(current.value)
}

function backToList() {
  detailVisible.value = false
}

function submit() {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    if (!range.value || range.value.length !== 2) {
      ElMessage.warning('请选择时间范围')
      return
    }
    saving.value = true
    try {
      const payload = { ...form, beginTime: range.value[0], endTime: range.value[1] }
      if (form.scheduleId) {
        await updateSchedule(payload)
        ElMessage.success('已保存')
      } else {
        await addSchedule(payload)
        ElMessage.success('新增成功')
      }
      formVisible.value = false
      getCalendar()
    } finally {
      saving.value = false
    }
  })
}

onMounted(() => {
  loadTypes()
  getCalendar()
})
</script>

<style scoped>
.month {
  min-width: 84px;
  text-align: center;
  font-size: 15px;
}

.hint {
  margin-left: auto;
  font-size: 12px;
  color: var(--cp-text-3);
}

.dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--cp-primary);
  margin: 0 3px;
  vertical-align: middle;
}

.cell {
  min-height: 84px;
  padding: 4px;
  border-radius: 8px;
}

.cell--has {
  background: rgba(0, 113, 227, 0.05);
}

.cell__date {
  font-size: 13px;
  color: var(--cp-text-2);
}

.cell__list {
  list-style: none;
  padding: 0;
  margin: 4px 0 0;
}

.cell__list li {
  font-size: 12px;
  color: var(--cp-primary);
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cell__more {
  color: var(--cp-text-3) !important;
  cursor: default !important;
}

.drawer-actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}
</style>
