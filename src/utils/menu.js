/**
 * 动态菜单的路由工具
 *
 * 后端 getRouters 返回的 children path 是相对路径（如 user），
 * el-menu 的 index 需要完整路径（如 /system/user）才能触发路由跳转。
 */

/** 是否外链（http/https 开头） */
export function isHttp(path) {
  return /^https?:\/\//i.test(path || '')
}

/** 拼接出完整路由路径 */
export function resolvePath(parentPath, childPath) {
  if (!childPath) return parentPath || '/'
  if (isHttp(childPath)) return childPath
  if (childPath.startsWith('/')) return childPath
  return (parentPath.endsWith('/') ? parentPath : parentPath + '/') + childPath
}

/** 过滤掉 hidden 的子级 */
export function visibleChildren(item) {
  return (item.children || []).filter((c) => !c.hidden)
}

/** 是否渲染为可点击的菜单叶子（无可见子级） */
export function isLeaf(item) {
  return visibleChildren(item).length === 0
}
