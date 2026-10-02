import request from '@/utils/request'

/**
 * 文档知识域（网关 /document → cp-document，网关不剥前缀）
 * DocumentController 类级 @RequestMapping("/document")
 */

/** GET /document/tree —— 左侧目录树 */
export function tree() {
  return request({ url: '/document/tree', method: 'get' })
}

/** GET /document/list?parentId= → TableDataInfo */
export function list(params) {
  return request({ url: '/document/list', method: 'get', params })
}

/** GET /document/{id}/detail */
export function detail(id) {
  return request({ url: `/document/${id}/detail`, method: 'get' })
}

/** POST /document/folder —— body: { fileName, parentId, remark } */
export function createFolder(data) {
  return request({ url: '/document/folder', method: 'post', data })
}

/** POST /document/file —— multipart：file + fileName + parentId */
export function createFile(formData) {
  return request({ url: '/document/file', method: 'post', data: formData })
}

/** PUT /document/update —— body: { fileId, fileName, parentId, fileType, remark } */
export function updateDoc(data) {
  return request({ url: '/document/update', method: 'put', data })
}

/** DELETE /document/{id} —— 逻辑删（进回收站） */
export function removeDoc(id) {
  return request({ url: `/document/${id}`, method: 'delete' })
}

/** GET /document/recycle/list → TableDataInfo */
export function recycleList() {
  return request({ url: '/document/recycle/list', method: 'get' })
}

/** PUT /document/recycle/restore/{id} —— 从回收站还原 */
export function restoreDoc(id) {
  return request({ url: `/document/recycle/restore/${id}`, method: 'put' })
}

/** DELETE /document/recycle/{id} —— 永久删除 */
export function purgeDoc(id) {
  return request({ url: `/document/recycle/${id}`, method: 'delete' })
}

/** POST /document/search —— body: { keyword, ... } */
export function search(data) {
  return request({ url: '/document/search', method: 'post', data })
}

/** GET /document/download/{id} —— 二进制流，用 window.open 触发下载 */
export function downloadUrl(id) {
  return `/document/download/${id}`
}
