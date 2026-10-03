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
