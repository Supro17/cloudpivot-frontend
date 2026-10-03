<template>
  <div>
    <PageHeader title="文档库" subtitle="目录树 + 文件列表，文件实际存放在 MinIO，库里只存对象名">
      <template #actions>
        <el-button v-hasPermi="['document:add']" class="cp-btn" :icon="FolderAdd" @click="openFolder">新建文件夹</el-button>
        <el-button
          v-hasPermi="['document:add']"
          class="cp-btn"
          type="primary"
          :icon="Upload"
          @click="uploadVisible = true"
        >上传文件</el-button>
      </template>
    </PageHeader>

    <div class="cp-card doc">
      <!-- 左：目录树 -->
      <aside class="doc__tree">
        <div class="doc__tree-head">
          <span>目录</span>
          <el-button link class="cp-link" @click="loadTree">刷新</el-button>
        </div>
        <el-tree
          :data="tree"
          :props="{ label: 'fileName', children: 'children' }"
          node-key="fileId"
          highlight-current
          default-expand-all
          @node-click="onNode"
        />
        <el-button link class="cp-link" @click="onNode({ fileId: 0 })">根目录</el-button>
      </aside>

      <!-- 右：文件列表 -->
      <section class="doc__list">
        <div class="doc__bar">
          <el-input v-model="keyword" placeholder="搜索文件名" clearable style="width: 220px" @keyup.enter="doSearch" />
          <el-button class="cp-btn" type="primary" @click="doSearch">搜索</el-button>
          <el-button class="cp-btn" @click="loadList">重置</el-button>
          <span class="doc__crumb">当前位置：{{ currentName }}</span>
        </div>

        <el-table v-loading="loading" class="cp-table" :data="rows">
          <el-table-column label="名称" min-width="240">
            <template #default="{ row }">
              <el-icon class="ico">
                <Folder v-if="row.fileType === 1" /><Document v-else />
              </el-icon>
              <a
                v-if="row.fileType === 1"
                class="link"
                @click="openFolderRow(row)"
              >{{ row.fileName }}</a>
              <span v-else>{{ row.fileName }}</span>
            </template>
          </el-table-column>
          <el-table-column label="大小" width="110" align="right">
            <template #default="{ row }">{{ sizeText(row.fileSize) }}</template>
          </el-table-column>
          <el-table-column prop="fileOwner" label="上传者" width="120" />
          <el-table-column prop="remark" label="备注" width="160" show-overflow-tooltip />
          <el-table-column prop="createTime" label="创建时间" width="200" :formatter="fmt" />
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <el-button v-if="row.fileType !== 1" link class="cp-link" @click="download(row)">下载</el-button>
              <el-button v-hasPermi="['document:edit']" link class="cp-link" @click="rename(row)">重命名</el-button>
              <el-button v-hasPermi="['document:remove']" link class="cp-link cp-link--danger" @click="handleRemove(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <TablePager v-model:page="query.pageNum" v-model:size="query.pageSize" :total="total" @change="loadList" />
      </section>
    </div>

    <!-- 新建文件夹 -->
    <el-dialog v-model="folderVisible" title="新建文件夹" width="460px">
      <el-form label-width="80px">
        <el-form-item label="文件夹名">
          <el-input v-model="folderName" placeholder="文件夹名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button class="cp-btn" @click="folderVisible = false">取消</el-button>
        <el-button class="cp-btn" type="primary" :loading="saving" @click="submitFolder">创建</el-button>
      </template>
    </el-dialog>

    <!-- 重命名 -->
    <el-dialog v-model="renameVisible" title="重命名" width="460px">
      <el-form label-width="80px">
        <el-form-item label="新名称">
          <el-input v-model="renameName" placeholder="新的文件/文件夹名称" @keyup.enter="submitRename" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button class="cp-btn" @click="renameVisible = false">取消</el-button>
        <el-button class="cp-btn" type="primary" :loading="saving" @click="submitRename">确定</el-button>
      </template>
    </el-dialog>

    <!-- 上传文件 -->
    <el-dialog v-model="uploadVisible" title="上传文件" width="480px">
      <el-upload ref="uploadRef" drag :auto-upload="false" :limit="1" :on-change="onFileChange">
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">拖拽文件到此处，或 <em>点击选择</em></div>
        <template #tip>
          <div class="el-upload__tip">单个文件不超过 {{ MAX_FILE_MB }}MB</div>
        </template>
      </el-upload>
      <el-form label-width="80px" class="up">
        <el-form-item label="文件类型" required>
          <el-select v-model="fileType" placeholder="选择文件类型" style="width: 100%">
            <el-option v-for="t in FILE_TYPES" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="remark" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button class="cp-btn" @click="uploadVisible = false">取消</el-button>
        <el-button class="cp-btn" type="primary" :loading="saving" @click="submitUpload">上传</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { FolderAdd, Upload, Folder, Document, UploadFilled } from '@element-plus/icons-vue'
import { tree, list, createFolder, createFile, updateDoc, removeDoc, downloadUrl, search } from '@/api/document'
import { getToken } from '@/utils/auth'
import { confirmDelete } from '@/utils/confirm'
import PageHeader from '@/components/PageHeader.vue'
import TablePager from '@/components/TablePager.vue'
import { formatDateTimeCN } from '@/utils/date'

const treeData = ref([])
const rows = ref([])
const total = ref(0)
// 表格时间列统一格式化（el-table 的 :formatter 签名是 (row, column, cellValue)）
const fmt = (row, column, cellValue) => formatDateTimeCN(cellValue)

const loading = ref(false)
const saving = ref(false)
const parentId = ref(0)
const currentName = ref('根目录')
const keyword = ref('')

const folderVisible = ref(false)
const folderName = ref('')
const uploadVisible = ref(false)
const remark = ref('')
const pickedFile = ref(null)
const fileType = ref(null)
const renameVisible = ref(false)
const renameName = ref('')
const renameRow = ref({})

const query = reactive({ pageNum: 1, pageSize: 10 })

// 上传上限，必须与后端 Nacos application-dev.yml 的
// spring.servlet.multipart.max-file-size 保持一致，否则会出现
// 「前端放行、后端 413」或反过来「前端拦了、其实后端允许」的错位。
const MAX_FILE_MB = 50
const MAX_FILE_SIZE = MAX_FILE_MB * 1024 * 1024

const uploadRef = ref(null)

// 文件类型字典 —— 对应后端 cp_document.doc_file_type 表（type_id / type_name）
// 后端暂未提供查询该字典的接口，故在此固化；字典若有变动需同步此处。
// 注意：doc_file.file_type = 1 表示「文件夹」，文件类型是 100 及以上。
const FILE_TYPES = [
  { id: 100, name: 'Word 文档' },
  { id: 101, name: 'Excel 表格' },
  { id: 102, name: 'PPT 演示' },
  { id: 103, name: 'PDF' },
  { id: 104, name: '图片' },
  { id: 105, name: '压缩包' },
  { id: 106, name: '文本' },
  { id: 107, name: '其他' }
]

// 按扩展名自动推断类型，减少一次手动选择
const EXT_TYPE_MAP = {
  doc: 100, docx: 100,
  xls: 101, xlsx: 101,
  ppt: 102, pptx: 102,
  pdf: 103,
  png: 104, jpg: 104, jpeg: 104, gif: 104, bmp: 104,
  zip: 105, rar: 105, '7z': 105, tar: 105, gz: 105,
  txt: 106, md: 106, log: 106
}

function guessType(name) {
  const ext = (name.split('.').pop() || '').toLowerCase()
  return EXT_TYPE_MAP[ext] || 107
}

function sizeText(size) {
  if (!size) return '-'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

async function loadTree() {
  const res = await tree()
  treeData.value = res.data || []
}

async function loadList() {
  loading.value = true
  try {
    const res = await list({ parentId: parentId.value, pageNum: query.pageNum, pageSize: query.pageSize })
    rows.value = res.rows || []
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}

function onNode(node) {
  parentId.value = node.fileId || 0
  currentName.value = node.fileName || '根目录'
  query.pageNum = 1
  loadList()
}

function openFolderRow(row) {
  parentId.value = row.fileId
  currentName.value = row.fileName
  query.pageNum = 1
  loadList()
}

function openFolder() {
  folderName.value = ''
  folderVisible.value = true
}

async function submitFolder() {
  if (!folderName.value) {
    ElMessage.warning('请输入文件夹名')
    return
  }
  saving.value = true
  try {
    await createFolder({ fileName: folderName.value, parentId: parentId.value, fileType: 1, remark: '' })
    ElMessage.success('已创建')
    folderVisible.value = false
    loadTree()
    loadList()
  } finally {
    saving.value = false
  }
}

/**
 * 大小校验：超限时给明确提示并返回 false。
 * 放在选文件阶段而不是提交阶段 —— 否则用户选完、点上传，等请求打到后端
 * 才被拒（原来会看到 Spring 的英文原文 “Maximum upload size exceeded”）。
 */
function checkSize(file) {
  if (!file) return true
  if (file.size > MAX_FILE_SIZE) {
    const actual = (file.size / 1024 / 1024).toFixed(1)
    ElMessage.warning(`「${file.name}」${actual}MB，超过单个文件 ${MAX_FILE_MB}MB 的上限，请压缩后重试`)
    return false
  }
  return true
}

function onFileChange(file) {
  const raw = file.raw
  if (!checkSize(raw)) {
    // 清掉 el-upload 内部已选中的文件，否则列表里还挂着它、看起来像选成功了
    pickedFile.value = null
    fileType.value = null
    uploadRef.value?.clearFiles()
    return
  }
  pickedFile.value = raw
  // 按扩展名自动推断类型
  fileType.value = guessType(file.name || raw?.name || '')
}

async function submitUpload() {
  if (!pickedFile.value) {
    ElMessage.warning('请先选择文件')
    return
  }
  if (!fileType.value) {
    ElMessage.warning('请选择文件类型')
    return
  }
  // 双保险：pickedFile 也可能从别处被改
  if (!checkSize(pickedFile.value)) return
  saving.value = true
  try {
    const fd = new FormData()
    fd.append('file', pickedFile.value)
    fd.append('fileName', pickedFile.value.name)
    fd.append('parentId', parentId.value)
    fd.append('fileType', fileType.value)
    fd.append('remark', remark.value)
    await createFile(fd)
    ElMessage.success('上传成功')
    uploadVisible.value = false
    pickedFile.value = null
    fileType.value = null
    remark.value = ''
    loadList()
  } finally {
    saving.value = false
  }
}

// 重命名：用 el-dialog 而不是原生 prompt()
// （原生 prompt 会阻塞页面渲染，风格也与其它页面不一致）
function rename(row) {
  renameRow.value = row
  renameName.value = row.fileName
  renameVisible.value = true
}

async function submitRename() {
  const name = (renameName.value || '').trim()
  if (!name) {
    ElMessage.warning('请输入新名称')
    return
  }
  if (name === renameRow.value.fileName) {
    renameVisible.value = false
    return
  }
  saving.value = true
  try {
    await updateDoc({
      fileId: renameRow.value.fileId,
      fileName: name,
      parentId: renameRow.value.parentId,
      fileType: renameRow.value.fileType,
      remark: renameRow.value.remark
    })
    ElMessage.success('已重命名')
    renameVisible.value = false
    loadTree()
    loadList()
  } finally {
    saving.value = false
  }
}

// 下载：download 接口需要带 token，所以用 fetch 取 blob 再触发保存
function download(row) {
  fetch(downloadUrl(row.fileId), {
    headers: { Authorization: 'Bearer ' + getToken() }
  })
    .then((r) => r.blob())
    .then((blob) => {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = row.fileName
      a.click()
      URL.revokeObjectURL(a.href)
    })
    .catch(() => ElMessage.error('下载失败'))
}

function handleRemove(row) {
  confirmDelete(() => removeDoc(row.fileId), `「${row.fileName}」`, {
    successMsg: '已移入回收站',
    onSuccess: () => {
      loadTree()
      loadList()
    }
  })
}

function doSearch() {
  if (!keyword.value) {
    // 关键词清空 → 回到当前目录的列表查询
    loadList()
    return
  }
  // 搜索接口是 POST + body，字段名必须是 fileName（后端 DocSearchQuery 的字段名）
  search({ fileName: keyword.value })
    .then((res) => {
      rows.value = res.rows || []
      total.value = res.total || 0
    })
    .catch(() => {})
}

onMounted(() => {
  loadTree()
  loadList()
})
</script>

<style scoped>
.doc {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.doc__tree {
  width: 240px;
  flex-shrink: 0;
  background: var(--cp-surface-2);
  border-radius: 14px;
  padding: 14px;
}

.doc__tree-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: var(--cp-text-3);
  margin-bottom: 8px;
}

.doc__list {
  flex: 1;
  min-width: 0;
}

.doc__bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 18px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--cp-hairline);
}

.doc__crumb {
  margin-left: auto;
  font-size: 12px;
  color: var(--cp-text-3);
}

.ico {
  margin-right: 6px;
  vertical-align: -2px;
  color: var(--cp-primary);
}

.link {
  color: var(--cp-primary);
  cursor: pointer;
}

.up {
  margin-top: 16px;
}
</style>
