import request from '@/utils/request'

/**
 * 考勤管理域（网关 /attendance → cp-attendance）
 * AttendanceController / AttStatisticsController / AttWorkTimeController 均无类级前缀
 */

/** GET /attendance/today —— 今日签到状态 */
export function today() {
  return request({ url: '/attendance/today', method: 'get' })
}

/** POST /attendance/sign/in —— 签到（后端按「一天一次」做幂等） */
export function signIn() {
  return request({ url: '/attendance/sign/in', method: 'post' })
}

/** POST /attendance/sign/out —— 签退 */
export function signOut() {
  return request({ url: '/attendance/sign/out', method: 'post' })
}

/** GET /attendance/history?beginDate=&endDate= → TableDataInfo */
export function history(params) {
  return request({ url: '/attendance/history', method: 'get', params })
}

/** GET /attendance/statistics?beginDate=&endDate=&deptId= */
export function statistics(params) {
  return request({ url: '/attendance/statistics', method: 'get', params })
}

/** GET /attendance/worktime?branchId= */
export function getWorktime(params) {
  return request({ url: '/attendance/worktime', method: 'get', params })
}

/** PUT /attendance/worktime —— body: { id, branchId, beginTime, endTime } */
export function updateWorktime(data) {
  return request({ url: '/attendance/worktime', method: 'put', data })
}
