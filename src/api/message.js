import request from '@/utils/request'

/**
 * 消息沟通域接口（设计文档 5.5.2，共 10 个 + WebSocket）
 *
 * 注意：URL 不带 /dev-api 前缀（axios baseURL 统一添加）。
 * 方法严格 RESTful：查询 GET / 新增 POST / 修改 PUT / 删除 DELETE。
 */

/** ① 消息列表（管理端）→ TableDataInfo { total, rows } */
export function listMsg(query) {
  return request({ url: '/message/list', method: 'get', params: query })
}

/** ② 消息详情 → AjaxResult { data: MsgDetailVo } */
export function getMsg(id) {
  return request({ url: `/message/${id}`, method: 'get' })
}

/** ③ 新建消息（落库为草稿）→ AjaxResult { data: 新 message_id } */
export function addMsg(data) {
  return request({ url: '/message', method: 'post', data: data })
}

/** ④ 修改消息（仅草稿可改） */
export function updateMsg(data) {
  return request({ url: '/message', method: 'put', data: data })
}

/** ⑤ 删除消息（逻辑删） */
export function delMsg(id) {
  return request({ url: `/message/${id}`, method: 'delete' })
}

/** ⑥ 发布消息（幂等，重复发布会报「请勿重复发布」） */
export function publishMsg(id) {
  return request({ url: `/message/${id}/publish`, method: 'put' })
}

/** ⑦ 我的信箱 → AjaxResult { data: { total, unread, rows } } */
export function listInbox(query) {
  return request({ url: '/message/inbox', method: 'get', params: query })
}

/** ⑧ 已发送 → TableDataInfo { total, rows } */
export function listSent(query) {
  return request({ url: '/message/sent', method: 'get', params: query })
}

/** ⑨ 标记已读（幂等，连点两次计数不变） */
export function markRead(id) {
  return request({ url: `/message/${id}/read`, method: 'put' })
}

/** ⑩ 未读数 → AjaxResult { data: { count } } */
export function getUnreadCount() {
  return request({ url: '/message/unread/count', method: 'get' })
}
