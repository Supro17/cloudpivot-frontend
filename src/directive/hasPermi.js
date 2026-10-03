import { checkPermi } from '@/utils/permission'

/**
 * v-hasPermi —— 按钮级权限指令
 *
 *   <el-button v-hasPermi="['org:user:add']">新增</el-button>
 *
 * 当前登录用户没有该权限点时，直接把元素从 DOM 移除（不是 disable、不是隐藏），
 * 避免用户看到一个点了会 403 的按钮。
 *
 * 「或」关系：数组里任意一个命中即可；超管（*:*:*）恒通过。
 */
export default {
  mounted(el, binding) {
    const { value } = binding
    if (!Array.isArray(value) || value.length === 0) {
      throw new Error('v-hasPermi 需要一个非空数组，例如 v-hasPermi="[\'org:user:add\']"')
    }
    if (!checkPermi(value)) {
      el.parentNode && el.parentNode.removeChild(el)
    }
  }
}
