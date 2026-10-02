<template>
  <el-dialog
    v-model="visible"
    :title="form.messageId ? '编辑消息' : '新建消息'"
    width="640px"
    destroy-on-close
    @closed="reset"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
      <el-form-item label="标题" prop="title">
        <el-input v-model="form.title" maxlength="50" show-word-limit placeholder="消息标题" />
      </el-form-item>

      <el-form-item label="类型" prop="type">
        <el-radio-group v-model="form.type">
          <el-radio :value="1">通知</el-radio>
          <el-radio :value="2">公告</el-radio>
          <el-radio :value="3">提醒</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="有效期" required>
        <el-date-picker
          v-model="range"
          type="datetimerange"
          format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DD HH:mm:ss"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="发送范围" prop="sendScope">
        <el-radio-group v-model="form.sendScope" @change="onScopeChange">
          <el-radio :value="0">所有人</el-radio>
          <el-radio :value="1">按机构</el-radio>
          <el-radio :value="2">按部门</el-radio>
          <el-radio :value="3">按员工</el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- 按机构：机构多选 -->
      <el-form-item v-if="form.sendScope === 1" label="选择机构" prop="scopeValue">
        <el-select v-model="scopeArr" multiple filterable placeholder="选择机构" style="width: 100%">
          <el-option
            v-for="b in branchOptions"
            :key="b.branchId"
            :label="b.branchName"
            :value="String(b.branchId)"
          />
        </el-select>
      </el-form-item>

      <!-- 按部门：部门多选 -->
      <el-form-item v-if="form.sendScope === 2" label="选择部门" prop="scopeValue">
        <el-select
          v-model="scopeArr"
          multiple
          filterable
          placeholder="选择部门"
          style="width: 100%"
        >
          <el-option
            v-for="d in departOptions"
            :key="d.deptId"
            :label="d.deptName"
            :value="String(d.deptId)"
          />
        </el-select>
      </el-form-item>

      <!-- 按员工：手工输入登录名 -->
      <el-form-item v-if="form.sendScope === 3" label="员工账号" prop="scopeValue">
        <el-input v-model="scopeStr" placeholder="多个账号用英文逗号分隔，如 zhangsan,lisi" />
      </el-form-item>

      <el-form-item label="正文" prop="content">
        <el-input
          v-model="form.content"
          type="textarea"
          :rows="6"
          maxlength="500"
          show-word-limit
          placeholder="消息正文"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleSave">保存为草稿</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { addMsg, updateMsg } from '@/api/message'
import { listBranch, listDepart } from '@/api/org'

const visible = defineModel({ type: Boolean, default: false })
const emit = defineEmits(['saved'])

/** 编辑时由父组件传入整行（含 scopeValue 原文） */
const props = defineProps({
  row: { type: Object, default: null }
})

const formRef = ref(null)
const saving = ref(false)

const form = reactive({
  messageId: null,
  title: '',
  content: '',
  type: 1,
  beginTime: '',
  endTime: '',
  sendScope: 0,
  scopeValue: ''
})

const range = ref([])
const scopeArr = ref([])
const scopeStr = ref('')

const branchOptions = ref([])
const departOptions = ref([])

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入正文', trigger: 'blur' }],
  sendScope: [{ required: true, message: '请选择发送范围', trigger: 'change' }]
}

// scope=3 时用文本框，其余用多选 —— 统一拼成逗号分隔的 scopeValue
const scopeValue = computed(() => {
  if (form.sendScope === 0) return ''
  if (form.sendScope === 3) return scopeStr.value
  return scopeArr.value.join(',')
})

// 编辑回显：把后端的 scopeValue 拆回多选/文本框
watch(
  () => props.row,
  (row) => {
    if (!row) return
    Object.assign(form, {
      messageId: row.messageId,
      title: row.title,
      content: row.content || '',
      type: row.type || 1,
      beginTime: row.beginTime || '',
      endTime: row.endTime || '',
      sendScope: row.sendScope ?? 0,
      scopeValue: row.scopeValue || ''
    })
    range.value = row.beginTime ? [row.beginTime, row.endTime] : []
    if (row.sendScope === 3) scopeStr.value = row.scopeValue || ''
    else scopeArr.value = (row.scopeValue || '').split(',').filter(Boolean)
  },
  { immediate: true }
)

// 范围切到机构/部门时才加载选项（惰性）
function onScopeChange(scope) {
  if (scope === 1 && branchOptions.value.length === 0) {
    listBranch().then((res) => {
      branchOptions.value = res.rows || res.data || []
    })
  }
  if (scope === 2 && departOptions.value.length === 0) {
    listDepart({ pageNum: 1, pageSize: 500 }).then((res) => {
      departOptions.value = res.rows || []
    })
  }
  scopeArr.value = []
  scopeStr.value = ''
}

function reset() {
  form.messageId = null
  form.title = ''
  form.content = ''
  form.type = 1
  form.beginTime = ''
  form.endTime = ''
  form.sendScope = 0
  form.scopeValue = ''
  range.value = []
  scopeArr.value = []
  scopeStr.value = ''
}

function handleSave() {
  formRef.value.validate(async (valid) => {
    if (!valid) return

    if (!range.value || range.value.length !== 2) {
      ElMessage.warning('请选择有效期')
      return
    }
    if (form.sendScope !== 0 && !scopeValue.value) {
      ElMessage.warning('请填写发送范围')
      return
    }

    const payload = {
      ...form,
      beginTime: range.value[0],
      endTime: range.value[1],
      scopeValue: scopeValue.value
    }
    // 新增时不传 messageId
    if (!form.messageId) delete payload.messageId

    saving.value = true
    try {
      if (form.messageId) {
        await updateMsg(payload)
        ElMessage.success('已保存')
      } else {
        await addMsg(payload)
        ElMessage.success('已保存为草稿，可在列表中发布')
      }
      visible.value = false
      emit('saved')
    } finally {
      saving.value = false
    }
  })
}
</script>
