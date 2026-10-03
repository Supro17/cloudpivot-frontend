/**
 * 动态菜单的路由工具
 *
 * 后端 getRouters 返回的 children path 是相对路径（如 user），
 * el-menu 的 index 需要完整路径（如 /system/user）才能触发路由跳转。
 */

/**
 * 是否外链（http/https 开头）
 *
 * ★ 兼容前导斜杠：后端 sys_menu.path 里外链存的可能是
 *   `/http://localhost:8080/swagger-ui/index.html`（多了个 /），
 *   只匹配 `^https?://` 会判成普通路径，结果外链点不开。
 */
export function isHttp(path) {
  return /^\/?https?:\/\//i.test(path || '')
}

/** 去掉外链可能多出来的前导斜杠，得到干净的 URL */
export function cleanHttpUrl(path) {
  return (path || '').replace(/^\//, '')
}

/** 拼接出完整路由路径 */
export function resolvePath(parentPath, childPath) {
  if (!childPath) return parentPath || '/'
  if (isHttp(childPath)) return cleanHttpUrl(childPath)
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
