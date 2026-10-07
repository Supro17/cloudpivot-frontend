import request from '@/utils/request'

/**
 * 组织管理域（网关 /org → cp-org）
 * 控制器：BranchInfoController(/branch) / DepartExtController(/depart) / UserExtController(/user)
 */

// ============================ 机构 ============================

/** GET /org/branch/list —— 作为「筛选器选项」使用时传 config={silent:true}，避免无权限时弹全局提示 */
export function listBranch(query, config = {}) {
  return request({ url: '/org/branch/list', method: 'get', params: query, ...config })
}

/** POST /org/branch/add */
export function addBranch(data) {
  return request({ url: '/org/branch/add', method: 'post', data })
}

/** PUT /org/branch/update */
export function updateBranch(data) {
  return request({ url: '/org/branch/update', method: 'put', data })
}

/** DELETE /org/branch/remove?branchId=xxx（后端参数无注解，走 query） */
export function removeBranch(branchId) {
  return request({ url: '/org/branch/remove', method: 'delete', params: { branchId } })
}

// ============================ 部门 ============================

/** GET /org/depart/list —— 同上，作为筛选器选项时传 {silent:true} */
export function listDepart(query, config = {}) {
  return request({ url: '/org/depart/list', method: 'get', params: query, ...config })
}

/** POST /org/depart/add */
export function addDepart(data) {
  return request({ url: '/org/depart/add', method: 'post', data })
}

/** PUT /org/depart/update */
export function updateDepart(data) {
  return request({ url: '/org/depart/update', method: 'put', data })
}

/** DELETE /org/depart/remove/{deptId} */
export function removeDepart(deptId) {
  return request({ url: `/org/depart/remove/${deptId}`, method: 'delete' })
}

// ============================ 员工 ============================

/** GET /org/user/list —— 同上，作为筛选器选项时传 {silent:true} */
export function listUser(query, config = {}) {
  return request({ url: '/org/user/list', method: 'get', params: query, ...config })
}

/** GET /org/user/{userId} */
export function getUser(userId) {
  return request({ url: `/org/user/${userId}`, method: 'get' })
}

/** POST /org/user/add */
export function addUser(data) {
  return request({ url: '/org/user/add', method: 'post', data })
}

/** PUT /org/user/update */
export function updateUser(data) {
  return request({ url: '/org/user/update', method: 'put', data })
}

/** DELETE /org/user/remove/{userName} */
export function removeUser(userName) {
  return request({ url: `/org/user/remove/${userName}`, method: 'delete' })
}

// ============================ 我的可选范围（选人用） ============================

/**
 * GET /org/scope/my —— 我的可选范围
 * 返回 { deptId, deptName, leader, level: 'NONE'|'DEPT'|'BRANCH', depts[], desc }
 *   level 决定能选到哪一层：DEPT=仅本部门 / BRANCH=本机构 / NONE=无范围
 *   desc 由服务端拼好，前端直接展示，避免前端重复实现判定逻辑
 */
export function myScope(config = {}) {
  return request({ url: '/org/scope/my', method: 'get', ...config })
}

/**
 * GET /org/scope/users?deptIds=1,2 —— 指定部门下的人员
 * 后端会与「我的可见部门」求交集，传范围外的 deptId 拿不到任何数据
 * （deptIds 用逗号拼接，Spring 端直接映射到 List<Long>）
 */
export function myScopeUsers(deptIds, config = {}) {
  const ids = Array.isArray(deptIds) ? deptIds.join(',') : deptIds
  return request({ url: '/org/scope/users', method: 'get', params: { deptIds: ids }, ...config })
}
