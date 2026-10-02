<template>
  <div>
    <PageHeader title="机构管理" subtitle="维护分公司 / 机构档案，机构是员工与消息范围的基础组织单元">
      <template #actions>
        <el-button class="cp-btn" type="primary" :icon="Plus" @click="openForm()">新增机构</el-button>
      </template>
    </PageHeader>

    <div class="cp-card">
      <div class="cp-toolbar">
        <el-input v-model="query.branchName" placeholder="机构名称" clearable style="width: 200px" @keyup.enter="search" />
        <el-button class="cp-btn" @click="search">查询</el-button>
        <el-button class="cp-btn" @click="resetQuery">重置</el-button>
      </div>

      <el-table v-loading="loading" class="cp-table" :data="rows">
        <el-table-column prop="branchId" label="机构 ID" width="100" />
        <el-table-column prop="branchName" label="机构名称" min-width="200" />
        <el-table-column prop="shortName" label="简称" width="140" />
        <el-table-column prop="deptId" label="对应部门 ID" width="120" />
        <el-table-column prop="sortNo" label="排序" width="80" align="center" />
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button link class="cp-link" @click="openForm(row)">编辑</el-button>
            <el-button link class="cp-link cp-link--danger" @click="handleRemove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <TablePager v-model:page="query.pageNum" v-model:size="query.pageSize" :total="total" @change="getList" />
    </div>

    <el-dialog v-model="dialogVisible" :title="form.branchId ? '编辑机构' : '新增机构'" width="520px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="机构名称" prop="branchName">
          <el-input v-model="form.branchName" placeholder="如：力平集团北京分公司" />
        </el-form-item>
        <el-form-item label="简称" prop="shortName">
          <el-input v-model="form.shortName" placeholder="如：北京分公司" />
        </el-form-item>
        <el-form-item label="对应部门" prop="deptId">
          <el-select v-model="form.deptId" filterable placeholder="选择该机构对应的部门" style="width: 100%">
            <el-option v-for="d in departOptions" :key="d.deptId" :label="d.deptName" :value="d.deptId" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序号" prop="sortNo">
          <el-input-number v-model="form.sortNo" :min="0" controls-position="right" />
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
import { listBranch, addBranch, updateBranch, removeBranch } from '@/api/org'
import { listDepart } from '@/api/org'
import { confirmDelete } from '@/utils/confirm'
import PageHeader from '@/components/PageHeader.vue'
import TablePager from '@/components/TablePager.vue'

const loading = ref(false)
const saving = ref(false)
const rows = ref([])
const total = ref(0)
const departOptions = ref([])
const dialogVisible = ref(false)
const formRef = ref(null)

const query = reactive({ pageNum: 1, pageSize: 10, branchName: '' })
const form = reactive({ branchId: null, branchName: '', shortName: '', deptId: null, sortNo: 0 })

const rules = {
  branchName: [{ required: true, message: '请输入机构名称', trigger: 'blur' }],
  deptId: [{ required: true, message: '请选择对应部门', trigger: 'change' }]
}

async function getList() {
  loading.value = true
  try {
    const res = await listBranch(query)
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

function resetQuery() {
  query.branchName = ''
  search()
}

async function loadDepartOptions() {
  if (departOptions.value.length) return
  const res = await listDepart({ pageNum: 1, pageSize: 500 })
  departOptions.value = res.rows || []
}

function openForm(row) {
  loadDepartOptions()
  Object.assign(form, {
    branchId: row?.branchId ?? null,
    branchName: row?.branchName ?? '',
    shortName: row?.shortName ?? '',
    deptId: row?.deptId ?? null,
    sortNo: row?.sortNo ?? 0
  })
  dialogVisible.value = true
  formRef.value?.clearValidate()
}

function submit() {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    saving.value = true
    try {
      if (form.branchId) {
        await updateBranch(form)
        ElMessage.success('已保存')
      } else {
        await addBranch(form)
        ElMessage.success('新增成功')
      }
      dialogVisible.value = false
      getList()
    } finally {
      saving.value = false
    }
  })
}

// 要求 5：删除必须二次确认
function handleRemove(row) {
  confirmDelete(() => removeBranch(row.branchId), `机构「${row.branchName}」`, {
    onSuccess: getList
  })
}

onMounted(getList)
</script>
