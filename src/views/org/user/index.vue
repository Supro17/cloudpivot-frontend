<template>
  <div>
    <PageHeader title="员工管理" subtitle="员工档案来自系统用户，这里维护其扩展信息（性别、签名、头像）">
      <template #actions>
        <el-button v-hasPermi="['org:user:add']" class="cp-btn" type="primary" :icon="Plus" @click="openForm()">新增员工</el-button>
      </template>
    </PageHeader>

    <div class="cp-card">
      <div class="cp-toolbar">
        <el-input v-model="query.nickName" placeholder="姓名" clearable style="width: 160px" @keyup.enter="search" />
        <el-input v-model="query.userName" placeholder="登录账号" clearable style="width: 160px" @keyup.enter="search" />
        <el-select v-model="query.deptId" clearable placeholder="全部部门" style="width: 180px">
          <el-option v-for="d in departOptions" :key="d.deptId" :label="d.deptName" :value="d.deptId" />
        </el-select>
        <el-button class="cp-btn" @click="search">查询</el-button>
        <el-button class="cp-btn" @click="resetQuery">重置</el-button>
      </div>

      <el-table v-loading="loading" class="cp-table" :data="rows">
        <el-table-column label="姓名" min-width="150">
          <template #default="{ row }">
            <div class="who">
              <el-avatar :size="28" :src="row.avatarPath || undefined">{{ (row.nickName || '?').slice(0, 1) }}</el-avatar>
              <span>{{ row.nickName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="userName" label="登录账号" width="130" />
        <el-table-column prop="deptName" label="部门" width="180" />
        <el-table-column label="性别" width="80" align="center">
          <template #default="{ row }">{{ GENDER[row.gender] || '未知' }}</template>
        </el-table-column>
        <el-table-column prop="phonenumber" label="手机号" width="140" />
        <el-table-column prop="signDesc" label="个性签名" min-width="200" show-overflow-tooltip />
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button v-hasPermi="['org:user:edit']" link class="cp-link" @click="openForm(row)">编辑</el-button>
            <el-button v-hasPermi="['org:user:remove']" link class="cp-link cp-link--danger" @click="handleRemove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <TablePager v-model:page="query.pageNum" v-model:size="query.pageSize" :total="total" @change="getList" />
    </div>

    <el-dialog v-model="dialogVisible" :title="form.userName ? '编辑员工' : '新增员工'" width="560px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="登录账号" prop="userName">
          <el-input v-model="form.userName" :disabled="!!form.userName" placeholder="必须是系统中已存在的登录名" />
        </el-form-item>
        <el-form-item label="姓名" prop="nickName">
          <el-input v-model="form.nickName" placeholder="姓名" />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="form.gender">
            <el-radio :value="0">男</el-radio>
            <el-radio :value="1">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="手机号" prop="phonenumber">
          <el-input v-model="form.phonenumber" placeholder="13800000000" />
        </el-form-item>
        <el-form-item label="所属部门" prop="deptId">
          <el-select v-model="form.deptId" filterable placeholder="选择部门" style="width: 100%">
            <el-option v-for="d in departOptions" :key="d.deptId" :label="d.deptName" :value="d.deptId" />
          </el-select>
        </el-form-item>
        <el-form-item label="个性签名" prop="signDesc">
          <el-input v-model="form.signDesc" type="textarea" :rows="2" maxlength="100" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button class="cp-btn" @click="dialogVisible = false">取消</el-button>
        <el-button class="cp-btn" type="primary" :loading="saving" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { listUser, addUser, updateUser, removeUser, listDepart } from '@/api/org'
import { confirmDelete } from '@/utils/confirm'
import PageHeader from '@/components/PageHeader.vue'
import TablePager from '@/components/TablePager.vue'

const GENDER = { 0: '男', 1: '女' }

const loading = ref(false)
const saving = ref(false)
const rows = ref([])
const total = ref(0)
const departOptions = ref([])
const dialogVisible = ref(false)
const formRef = ref(null)

const query = reactive({ pageNum: 1, pageSize: 10, nickName: '', userName: '', deptId: null })
const form = reactive({
  userName: '',
  nickName: '',
  gender: 0,
  phonenumber: '',
  deptId: null,
  signDesc: ''
})

const rules = {
  userName: [{ required: true, message: '请输入登录账号', trigger: 'blur' }],
  nickName: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  deptId: [{ required: true, message: '请选择所属部门', trigger: 'change' }]
}

async function getList() {
  loading.value = true
  try {
    const res = await listUser(query)
    rows.value = res.rows || []
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}

async function loadDepartOptions() {
  if (departOptions.value.length) return
  const res = await listDepart({ pageNum: 1, pageSize: 500 })
  departOptions.value = res.rows || []
}

function search() {
  query.pageNum = 1
  getList()
}

function resetQuery() {
  query.nickName = ''
  query.userName = ''
  query.deptId = null
  search()
}

function openForm(row) {
  loadDepartOptions()
  Object.assign(form, {
    userName: row?.userName ?? '',
    nickName: row?.nickName ?? '',
    gender: row?.gender ?? 0,
    phonenumber: row?.phonenumber ?? '',
    deptId: row?.deptId ?? null,
    signDesc: row?.signDesc ?? ''
  })
  dialogVisible.value = true
  formRef.value?.clearValidate()
}

function submit() {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    saving.value = true
    try {
      if (form.userName) {
        await updateUser(form)
        ElMessage.success('已保存')
      } else {
        await addUser(form)
        ElMessage.success('新增成功')
      }
      dialogVisible.value = false
      getList()
    } finally {
      saving.value = false
    }
  })
}

function handleRemove(row) {
  confirmDelete(() => removeUser(row.userName), `员工「${row.nickName || row.userName}」`, {
    onSuccess: getList
  })
}

onMounted(getList)
</script>

<style scoped>
.who {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
