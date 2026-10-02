import request from '@/utils/request'

/**
 * 日程协作域（网关 /calendar → cp-schedule）
 * ScheduleController 无类级前缀，方法路径即完整路径
 */

// ============================ 日程 ============================

/** GET /calendar/mine/calendar?month=yyyy-MM */
export function mineCalendar(month) {
  return request({ url: '/calendar/mine/calendar', method: 'get', params: { month } })
}

/** GET /calendar/meeting/type —— 会议类型下拉 */
export function meetingType() {
  return request({ url: '/calendar/meeting/type', method: 'get' })
}

/** GET /calendar/depart/week?deptId=&beginDate= */
export function departWeek(params) {
  return request({ url: '/calendar/depart/week', method: 'get', params })
}

/** GET /calendar/{id} */
export function getSchedule(id) {
  return request({ url: `/calendar/${id}`, method: 'get' })
}

/** POST /calendar/add */
export function addSchedule(data) {
  return request({ url: '/calendar/add', method: 'post', data })
}

/** PUT /calendar/update */
export function updateSchedule(data) {
  return request({ url: '/calendar/update', method: 'put', data })
}

/** DELETE /calendar/{id} */
export function removeSchedule(id) {
  return request({ url: `/calendar/${id}`, method: 'delete' })
}

// ============================ 便签 ============================

/** GET /calendar/note/list */
export function listNote() {
  return request({ url: '/calendar/note/list', method: 'get' })
}

/** POST /calendar/note */
export function addNote(data) {
  return request({ url: '/calendar/note', method: 'post', data })
}

/** PUT /calendar/note */
export function updateNote(data) {
  return request({ url: '/calendar/note', method: 'put', data })
}

/** DELETE /calendar/note/{id} */
export function removeNote(id) {
  return request({ url: `/calendar/note/${id}`, method: 'delete' })
}
