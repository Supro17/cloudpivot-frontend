import { ElMessageBox, ElMessage } from 'element-plus'

/**
 * 删除确认 —— 项目约定：所有删除操作必须二次确认，点「删除」才执行
 *
 * 用法：
 *   await confirmDelete(() => delUser(id), '该员工')
 *   // 或需要自己处理结果时
 *   await confirmDelete(() => delUser(id), '该员工', { onSuccess: refresh })
 *
 * @param {Function} action      真正执行删除的 Promise 函数
 * @param {String}   target      提示语里的对象描述，如「该员工」「选中的人员」
 * @param {Object}   options     { onSuccess, successMsg }
 * @returns {Boolean} 是否执行了删除
 */
export async function confirmDelete(action, target = '该条数据', options = {}) {
  const { onSuccess, successMsg = '删除成功' } = options
  try {
    await ElMessageBox.confirm(`确定要删除${target}吗？删除后可在回收站找回（如支持）。`, '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
      confirmButtonClass: 'el-button--danger'
    })
  } catch {
    return false // 用户点了取消
  }

  try {
    await action()
  } catch (e) {
    // 失败（如「该机构下存在部门，无法删除」）已由 request.js 统一弹过错误提示，
    // 这里只负责吞掉异常，避免变成未捕获的 Promise rejection 打到控制台
    return false
  }

  ElMessage.success(successMsg)
  if (onSuccess) onSuccess()
  return true
}
