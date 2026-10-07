<template>
  <div class="org-picker">
    <div class="org-picker__row">
      <el-tree-select
        v-model="innerIds"
        class="org-picker__select"
        :data="tree"
        :props="{ label: 'label', children: 'children' }"
        node-key="id"
        multiple
        show-checkbox
        filterable
        collapse-tags
        :max-collapse-tags="2"
        :render-after-expand="false"
        default-expand-all
        :loading="loading"
        :disabled="disabled"
        :placeholder="placeholder"
      />
      <el-button link type="primary" size="small" :disabled="disabled || !userIds.length" @click="selectAll">
        全选
      </el-button>
      <el-button link size="small" :disabled="disabled || !picked.length" @click="clearAll">清空</el-button>
    </div>
    <p v-if="scope.desc" class="org-picker__hint">可选范围：{{ scope.desc }}</p>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { myScope, myScopeUsers } from '@/api/org'

/**
 * 组织选人组件（机构 → 部门 → 人员 三级）
 *
 * 对外 v-model 是「人员账号数组」（sys_user.user_name），机构/部门节点只是分组、不对外暴露。
 * 可选范围由服务端按当前登录用户算好（普通员工=本部门，负责人=本机构），前端只负责渲染，
 * 即使有人绕过界面直接调接口，服务端还会再校验一次。
 *
 * 为什么一次性把范围内的人员全拉下来，而不是点开部门再懒加载：
 *   ① 要支持「全选」与「编辑回显」—— 懒加载下未展开的节点拿不到，这两件事都做不完整；
 *   ② 单人范围是「本部门或本机构」，本项目几十人量级，一次拉全量完全无压力。
 *   若将来单机构人员达到数千，再改为懒加载 + cache-data 回显。
 */

/** 分组节点 ID 前缀：带此前缀的是机构/部门，不参与对外输出 */
const GROUP_PREFIX = '__'

const props = defineProps({
  placeholder: { type: String, default: '选择人员' },
  disabled: { type: Boolean, default: false }
})

/** 对外：人员账号数组 */
const picked = defineModel({ type: Array, default: () => [] })

const loading = ref(false)
const scope = ref({})
const tree = ref([])
const userIds = ref([])
/** 全选用的 ID 集合（含机构/部门分组节点，交给树的级联去勾选人员） */
const allSelectIds = ref([])
const innerIds = ref([])
let syncing = false

const isGroupId = (id) => String(id).startsWith(GROUP_PREFIX)

/** 内部选中（含分组 ID）→ 对外只输出人员账号 */
watch(
  innerIds,
  (ids) => {
    syncing = true
    picked.value = (ids || []).filter((id) => !isGroupId(id))
    // 让上面的 set 走完再解锁，避免与外层回显 watch 形成回环
    setTimeout(() => {
      syncing = false
    }, 0)
  },
  { deep: true }
)

/** 对外值变化（含编辑回显）→ 同步到内部；两者等价时不动作，避免死循环 */
watch(
  picked,
  (names) => {
    if (syncing) return
    const current = innerIds.value.filter((id) => !isGroupId(id))
    const next = names || []
    const same = current.length === next.length && current.every((n) => next.includes(n))
    if (same) return
    innerIds.value = [...next]
  },
  { immediate: true, deep: true }
)

async function load() {
  loading.value = true
  try {
    const res = await myScope()
    const data = res.data || {}
    scope.value = data

    const depts = data.depts || []
    if (!depts.length) {
      tree.value = []
      userIds.value = []
      return
    }

    // 一次性取回范围内全部部门的人
    const ur = await myScopeUsers(depts.map((d) => d.deptId))
    const users = ur.data || []

    const byDept = {}
    users.forEach((u) => {
      const key = String(u.deptId)
      if (!byDept[key]) byDept[key] = []
      byDept[key].push(u)
    })

    // 机构 → 部门 → 人员
    const branchMap = new Map()
    depts.forEach((d) => {
      const bKey = d.branchId == null ? 'none' : String(d.branchId)
      if (!branchMap.has(bKey)) {
        branchMap.set(bKey, {
          id: GROUP_PREFIX + 'b' + bKey,
          label: d.branchName || '其他',
          children: []
        })
      }
      const list = byDept[String(d.deptId)] || []
      branchMap.get(bKey).children.push({
        id: GROUP_PREFIX + 'd' + d.deptId,
        label: `${d.deptName}（${list.length} 人）`,
        children: list.map((u) => ({
          id: u.userName,
          label: u.nickName && u.nickName !== u.userName ? `${u.nickName}（${u.userName}）` : u.userName
        }))
      })
    })

    tree.value = Array.from(branchMap.values())

    // 收集全部可选 ID（含分组），供「全选」使用
    const all = []
    const usersOnly = []
    tree.value.forEach((b) => {
      all.push(b.id)
      ;(b.children || []).forEach((d) => {
        all.push(d.id)
        ;(d.children || []).forEach((u) => {
          all.push(u.id)
          usersOnly.push(u.id)
        })
      })
    })
    userIds.value = usersOnly
    allSelectIds.value = all
  } catch (e) {
    ElMessage.error('加载可选范围失败')
  } finally {
    loading.value = false
  }
}

function selectAll() {
  if (disabled.value) return
  innerIds.value = [...allSelectIds.value]
}

function clearAll() {
  if (disabled.value) return
  innerIds.value = []
}

onMounted(load)
</script>

<style scoped>
.org-picker__row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.org-picker__select {
  flex: 1;
  min-width: 0;
}

.org-picker__hint {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--cp-text-3);
}
</style>
