import { checkRole } from '@/utils/permission'

/**
 * v-hasRole —— 角色级显示指令
 *
 *   <el-button v-hasRole="['admin','hr']">仅管理员/人事可见</el-button>
 *
 * 当前登录用户没有该角色时把元素从 DOM 移除；超管（admin）恒通过。
 */
export default {
  mounted(el, binding) {
    const { value } = binding
    if (!Array.isArray(value) || value.length === 0) {
      throw new Error('v-hasRole 需要一个非空数组，例如 v-hasRole="[\'admin\']"')
    }
    if (!checkRole(value)) {
      el.parentNode && el.parentNode.removeChild(el)
    }
  }
}
