<template>
  <div>
    <PageHeader title="个人便签" subtitle="轻量记录个人待办与提醒">
      <template #actions>
        <el-button class="cp-btn" type="primary" :icon="Plus" @click="openForm()">新增便签</el-button>
      </template>
    </PageHeader>

    <div class="cp-card">
      <div class="notes">
        <div v-for="n in rows" :key="n.id" class="note">
          <div class="note__head">
            <h3 class="note__title">{{ n.noteTitle || n.title || '(无标题)' }}</h3>
            <el-dropdown @command="(cmd) => onCmd(cmd, n)">
              <el-button link class="cp-link"><el-icon><MoreFilled /></el-icon></el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="edit">编辑</el-dropdown-item>
                  <el-dropdown-item command="remove" divided>删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
          <p class="note__body">{{ n.noteContent || n.content }}</p>
          <div class="note__foot">{{ (n.updateTime || n.createTime || '').slice(0, 16) }}</div>
        </div>

        <el-empty v-if="!rows.length" description="还没有便签" class="empty" />
      </div>
    </div>

    <el-dialog v-model="formVisible" :title="form.id ? '编辑便签' : '新增便签'" width="520px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="70px">
        <el-form-item label="标题" prop="noteTitle">
          <el-input v-model="form.noteTitle" placeholder="便签标题" />
        </el-form-item>
        <el-form-item label="内容" prop="noteContent">
          <el-input v-model="form.noteContent" type="textarea" :rows="5" placeholder="便签内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button class="cp-btn" @click="formVisible = false">取消</el-button>
        <el-button class="cp-btn" type="primary" :loading="saving" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { Plus, MoreFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { listNote, addNote, updateNote, removeNote } from '@/api/schedule'
import { confirmDelete } from '@/utils/confirm'
import PageHeader from '@/components/PageHeader.vue'

const rows = ref([])
const formVisible = ref(false)
const saving = ref(false)
const formRef = ref(null)

const form = reactive({ id: null, noteTitle: '', noteContent: '' })

const rules = {
  noteTitle: [{ required: true, message: '请输入标题', trigger: 'blur' }]
}

async function getList() {
  const res = await listNote()
  rows.value = res.data || []
}

function openForm(row) {
  Object.assign(form, {
    id: row?.id ?? null,
    noteTitle: row?.noteTitle || row?.title || '',
    noteContent: row?.noteContent || row?.content || ''
  })
  formVisible.value = true
  formRef.value?.clearValidate()
}

function submit() {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    saving.value = true
    try {
      if (form.id) {
        await updateNote(form)
        ElMessage.success('已保存')
      } else {
        await addNote(form)
        ElMessage.success('新增成功')
      }
      formVisible.value = false
      getList()
    } finally {
      saving.value = false
    }
  })
}

function onCmd(cmd, row) {
  if (cmd === 'edit') {
    openForm(row)
  } else if (cmd === 'remove') {
    confirmDelete(() => removeNote(row.id), `便签「${row.noteTitle || row.title}」`, {
      onSuccess: getList
    })
  }
}

onMounted(getList)
</script>

<style scoped>
.notes {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
}

.note {
  background: var(--cp-surface-2);
  border-radius: 16px;
  padding: 16px 18px;
  min-height: 140px;
  display: flex;
  flex-direction: column;
}

.note__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.note__title {
  font-size: 15px;
  font-weight: 600;
  margin: 0;
}

.note__body {
  flex: 1;
  font-size: 13px;
  color: var(--cp-text-2);
  margin: 8px 0;
  white-space: pre-wrap;
  overflow: hidden;
}

.note__foot {
  font-size: 11px;
  color: var(--cp-text-3);
}

.empty {
  grid-column: 1 / -1;
}
</style>
