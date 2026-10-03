<template>
  <div>
    <PageHeader title="部门管理" subtitle="维护部门扩展信息：负责人、联系方式与所属机构">
      <template #actions>
        <el-button v-hasPermi="['org:depart:add']" class="cp-btn" type="primary" :icon="Plus" @click="openForm()">新增部门</el-button>
      </template>
    </PageHeader>

    <div class="cp-card">
      <div class="cp-toolbar">
        <el-input v-model="query.deptName" placeholder="部门名称" clearable style="width: 200px" @keyup.enter="search" />
        <el-select v-model="query.branchId" clearable placeholder="全部机构" style="width: 200px">
          <el-option v-for="b in branchOptions" :key="b.branchId" :label="b.branchName" :value="b.branchId" />
        </el-select>
        <el-button class="cp-btn" @click="search">查询</el-button>
        <el-button class="cp-btn" @click="resetQuery">重置</el-button>
      </div>

      <el-table v-loading="loading" class="cp-table" :data="rows">
        <el-table-column prop="deptId" label="部门 ID" width="100" />
        <el-table-column prop="deptName" label="部门名称" min-width="180" />
        <el-table-column prop="principalUser" label="负责人" width="120" />
        <el-table-column prop="connectTelNo" label="座机" width="140" />
        <el-table-column prop="connectMobileNo" label="手机" width="140" />
        <el-table-column prop="faxes" label="传真" width="140" />
        <el-table-column prop="branchId" label="所属机构" width="100" />
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button v-hasPermi="['org:depart:edit']" link class="cp-link" @click="openForm(row)">编辑</el-button>
            <el-button v-hasPermi="['org:depart:remove']" link class="cp-link cp-link--danger" @click="handleRemove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <TablePager v-model:page="query.pageNum" v-model:size="query.pageSize" :total="total" @change="getList" />
    </div>

    <el-dialog v-model="dialogVisible" :title="form.deptId ? '编辑部门' : '新增部门'" width="560px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="部门名称" prop="deptName">
          <el-input v-model="form.deptName" placeholder="部门名称（需与系统部门一致）" />
        </el-form-item>
        <el-form-item label="负责人" prop="principalUser">
          <el-input v-model="form.principalUser" placeholder="负责人登录名" />
        </el-form-item>
        <el-form-item label="座机" prop="connectTelNo">
          <el-input v-model="form.connectTelNo" placeholder="010-88888888" />
        </el-form-item>
        <el-form-item label="手机" prop="connectMobileNo">
          <el-input v-model="form.connectMobileNo" placeholder="13800000000" />
        </el-form-item>
        <el-form-item label="传真" prop="faxes">
          <el-input v-model="form.faxes" placeholder="010-88888899" />
        </el-form-item>
        <el-form-item label="所属机构" prop="branchId">
          <el-select v-model="form.branchId" filterable placeholder="选择所属机构" style="width: 100%">
            <el-option v-for="b in branchOptions" :key="b.branchId" :label="b.branchName" :value="b.branchId" />
          </el-select>
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
import { listDepart, addDepart, updateDepart, removeDepart, listBranch } from '@/api/org'
import { confirmDelete } from '@/utils/confirm'
import PageHeader from '@/components/PageHeader.vue'
import TablePager from '@/components/TablePager.vue'

const loading = ref(false)
const saving = ref(false)
const rows = ref([])
const total = ref(0)
const branchOptions = ref([])
const dialogVisible = ref(false)
const formRef = ref(null)

const query = reactive({ pageNum: 1, pageSize: 10, deptName: '', branchId: null })
const form = reactive({
  deptId: null,
  deptName: '',
  principalUser: '',
  connectTelNo: '',
  connectMobileNo: '',
  faxes: '',
  branchId: null
})

const rules = {
  deptName: [{ required: true, message: '请输入部门名称', trigger: 'blur' }],
  principalUser: [{ required: true, message: '请输入负责人', trigger: 'blur' }],
  branchId: [{ required: true, message: '请选择所属机构', trigger: 'change' }]
}

async function getList() {
  loading.value = true
  try {
    const res = await listDepart(query)
    rows.value = res.rows || []
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}

async function loadBranchOptions() {
  if (branchOptions.value.length) return
  const res = await listBranch({ pageNum: 1, pageSize: 500 })
  branchOptions.value = res.rows || []
}

function search() {
  query.pageNum = 1
  getList()
}

function resetQuery() {
  query.deptName = ''
  query.branchId = null
  search()
}

function openForm(row) {
  loadBranchOptions()
  Object.assign(form, {
    deptId: row?.deptId ?? null,
    deptName: row?.deptName ?? '',
    principalUser: row?.principalUser ?? '',
    connectTelNo: row?.connectTelNo ?? '',
    connectMobileNo: row?.connectMobileNo ?? '',
    faxes: row?.faxes ?? '',
    branchId: row?.branchId ?? null
  })
  dialogVisible.value = true
  formRef.value?.clearValidate()
}

function submit() {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    saving.value = true
    try {
      if (form.deptId) {
        await updateDepart(form)
        ElMessage.success('已保存')
      } else {
        await addDepart(form)
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
  confirmDelete(() => removeDepart(row.deptId), `部门「${row.deptName}」`, { onSuccess: getList })
}

onMounted(getList)
</script>
