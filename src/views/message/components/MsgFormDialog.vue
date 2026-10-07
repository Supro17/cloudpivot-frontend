<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
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

      <!-- 发送对象：只渲染当前账号有权使用的选项（无权项直接不出现，而不是置灰） -->
      <el-form-item label="发送对象" prop="sendScope">
        <el-radio-group v-model="form.sendScope" @change="onScopeChange">
          <el-radio v-for="o in scopeOptions" :key="o.value" :value="o.value">{{ o.label }}</el-radio>
        </el-radio-group>
        <p v-if="scopeInfo.desc" class="scope-desc">{{ scopeInfo.desc }}</p>
      </el-form-item>

      <!-- 按机构：仅负责人 / 管理端可选，且只能选自己范围内的机构 -->
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

      <!-- 按部门：选项来自「我的可选范围」，普通员工只会看到本部门 -->
      <el-form-item v-if="form.sendScope === 2" label="选择部门" prop="scopeValue">
        <el-select v-model="scopeArr" multiple filterable placeholder="选择部门" style="width: 100%">
          <el-option
            v-for="d in departOptions"
            :key="d.deptId"
            :label="`${d.deptName}（${d.userCount} 人）`"
            :value="String(d.deptId)"
          />
        </el-select>
      </el-form-item>

      <!-- 按员工：机构 → 部门 → 人员 三级选择，范围同样受服务端限制 -->
      <el-form-item v-if="form.sendScope === 3" label="选择员工" prop="scopeValue">
        <OrgUserPicker v-model="pickedUsers" placeholder="按机构 / 部门 / 人员逐级选择" />
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
      <el-button type="primary" :loading="saving" @click="handleSave">{{ submitText }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { addMsg, updateMsg, sendMsg } from '@/api/message'
import { myScope } from '@/api/org'
import { checkPermi } from '@/utils/permission'
import OrgUserPicker from '@/components/OrgUserPicker.vue'

/**
 * 消息表单
 *
 * mode = draft（默认）：保存为草稿，供消息管理页「新建/编辑」使用
 * mode = send        ：立即发送，供「我的信箱」的发消息入口使用
 *
 * 发送对象按「我的可选范围」渲染：普通员工只有「本部门 / 本员工」，
 * 部门负责人多出「本机构」，管理端额外有「所有人」。
 * ★ 前端只负责「不让你选到」，服务端还会再校验一次（见 MsgMessageServiceImpl.checkSendScope）。
 */

const visible = defineModel({ type: Boolean, default: false })
const emit = defineEmits(['saved'])

const props = defineProps({
  row: { type: Object, default: null },
  mode: { type: String, default: 'draft' }
})

const isSend = computed(() => props.mode === 'send')
const submitText = computed(() => (isSend.value ? '发送' : '保存为草稿'))

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
const pickedUsers = ref([])

/** 我的可选范围（机构/部门/人员三级的数据源与层级） */
const scopeInfo = ref({ level: 'NONE', depts: [], desc: '' })
let scopeLoaded = false

const dialogTitle = computed(() => {
  if (isSend.value) return '发送消息'
  return form.messageId ? '编辑消息' : '新建消息'
})

/** 「所有人」= 全员广播，属管理端能力（需 message:list 或超管） */
const canSendAll = computed(() => checkPermi(['message:list']))
/** 「按机构」只有负责人（本机构）与管理端可选 */
const canSendByBranch = computed(() => ['BRANCH', 'ALL'].includes(scopeInfo.value.level))
const hasScope = computed(() => !!scopeInfo.value.level && scopeInfo.value.level !== 'NONE')

/** 当前账号可用的发送对象选项 */
const scopeOptions = computed(() => {
  const opts = []
  if (canSendAll.value) opts.push({ value: 0, label: '所有人' })
  if (canSendByBranch.value) opts.push({ value: 1, label: '按机构' })
  if (hasScope.value) {
    opts.push({ value: 2, label: '按部门' })
    opts.push({ value: 3, label: '按员工' })
  }
  return opts
})

/** 机构选项：从可选部门里按 branchId 去重得到 */
const branchOptions = computed(() => {
  const map = new Map()
  ;(scopeInfo.value.depts || []).forEach((d) => {
    if (d.branchId != null && !map.has(d.branchId)) {
      map.set(d.branchId, { branchId: d.branchId, branchName: d.branchName || '未命名机构' })
    }
  })
  return [...map.values()]
})

const departOptions = computed(() => scopeInfo.value.depts || [])

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入正文', trigger: 'blur' }],
  sendScope: [{ required: true, message: '请选择发送对象', trigger: 'change' }]
}

// 统一拼成逗号分隔的 scopeValue
const scopeValue = computed(() => {
  if (form.sendScope === 0) return ''
  if (form.sendScope === 3) return pickedUsers.value.join(',')
  return scopeArr.value.join(',')
})

// 编辑回显：把后端的 scopeValue 拆回多选 / 选择器
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
    const arr = (row.scopeValue || '').split(',').filter(Boolean)
    if (row.sendScope === 3) pickedUsers.value = arr
    else scopeArr.value = arr
  },
  { immediate: true }
)

// 打开时加载可选范围（缓存一次，同一会话内不重复请求）
watch(visible, async (v) => {
  if (!v) return
  await ensureScopeLoaded()
  // 当前选项无权使用（如普通员工默认的「所有人」）→ 落到第一个可用项
  if (!scopeOptions.value.some((o) => o.value === form.sendScope)) {
    form.sendScope = scopeOptions.value.length ? scopeOptions.value[0].value : 2
    scopeArr.value = []
    pickedUsers.value = []
  }
})

async function ensureScopeLoaded() {
  if (scopeLoaded) return
  try {
    const res = await myScope()
    scopeInfo.value = res.data || {}
    scopeLoaded = true
  } catch (e) {
    // 失败提示已由 request 拦截器统一处理
  }
}

function onScopeChange() {
  scopeArr.value = []
  pickedUsers.value = []
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
  pickedUsers.value = []
}

function handleSave() {
  formRef.value.validate(async (valid) => {
    if (!valid) return

    if (!range.value || range.value.length !== 2) {
      ElMessage.warning('请选择有效期')
      return
    }
    if (form.sendScope !== 0 && !scopeValue.value) {
      ElMessage.warning('请选择发送对象')
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
      if (isSend.value) {
        await sendMsg(payload)
        ElMessage.success('已发送')
      } else if (form.messageId) {
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

<style scoped>
.scope-desc {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--cp-text-3);
}
</style>
