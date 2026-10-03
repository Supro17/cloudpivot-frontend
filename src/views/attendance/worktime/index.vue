<template>
  <div>
    <PageHeader title="工作时间" subtitle="配置各机构的上下班时间，作为签到签退的判定依据" />

    <div class="cp-card">
      <div class="cp-toolbar">
        <el-select v-model="branchId" placeholder="全部机构" clearable style="width: 220px" @change="load">
          <el-option v-for="b in branchOptions" :key="b.branchId" :label="b.branchName" :value="b.branchId" />
        </el-select>
        <el-button v-hasPermi="['attendance:worktime:edit']" class="cp-btn" type="primary" :loading="saving" @click="submit">保存</el-button>
      </div>

      <el-form :model="form" label-width="120px" class="wt">
        <el-form-item label="适用机构">
          <span class="wt__scope">{{ currentBranchName }}</span>
        </el-form-item>
        <el-form-item label="上班时间">
          <el-time-select
            v-model="form.beginTime"
            :start="begin"
            :end="form.endTime || '23:30'"
            step="00:30"
            placeholder="选择上班时间"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="下班时间">
          <el-time-select
            v-model="form.endTime"
            :start="form.beginTime || '00:00'"
            :end="end"
            step="00:30"
            placeholder="选择下班时间"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="最近更新">
          <span class="wt__scope">{{ formatDateTimeCN(form.updateTime) }}</span>
        </el-form-item>
      </el-form>

      <p class="tip">
        未选择具体机构时，保存的是<b>全局默认工作时间</b>（branchId = 0）。
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getWorktime, updateWorktime } from '@/api/attendance'
import { listBranch } from '@/api/org'
import PageHeader from '@/components/PageHeader.vue'
import { formatDateTimeCN } from '@/utils/date'

const branchId = ref(null)
const branchOptions = ref([])
const saving = ref(false)

const form = reactive({ id: null, branchId: 0, beginTime: '', endTime: '', updateTime: '' })

const begin = computed(() => '00:00')
const end = computed(() => '23:30')

const currentBranchName = computed(
  () => branchOptions.value.find((b) => b.branchId === branchId.value)?.branchName || '全局默认'
)

async function load() {
  const res = await getWorktime({ branchId: branchId.value })
  const d = res.data || {}
  Object.assign(form, {
    id: d.id ?? null,
    branchId: d.branchId ?? branchId.value ?? 0,
    beginTime: d.beginTime || '',
    endTime: d.endTime || '',
    updateTime: d.updateTime || ''
  })
}

async function submit() {
  if (!form.beginTime || !form.endTime) {
    ElMessage.warning('请选择完整的上下班时间')
    return
  }
  saving.value = true
  try {
    await updateWorktime({
      id: form.id,
      branchId: branchId.value ?? 0,
      beginTime: form.beginTime,
      endTime: form.endTime
    })
    ElMessage.success('已保存')
    load()
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  // 机构下拉是筛选项，拿不到也不该阻断主数据加载（同考勤统计页的处理）
  try {
    const res = await listBranch({ pageNum: 1, pageSize: 500 })
    branchOptions.value = res.rows || []
  } catch (e) {
    branchOptions.value = []
  }
  load()
})
</script>

<style scoped>
.wt {
  max-width: 520px;
  padding-top: 8px;
}

.wt__scope {
  font-size: 14px;
  color: var(--cp-text-2);
}

.tip {
  margin-top: 20px;
  font-size: 12px;
  color: var(--cp-text-3);
}
</style>
