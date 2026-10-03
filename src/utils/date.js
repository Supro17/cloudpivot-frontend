/**
 * 日期时间格式化工具
 */

const pad = (n) => String(n).padStart(2, '0')

/**
 * 格式化为中文日期时间：2026年10月03日10时05分55秒
 *
 * 使用场景：后端部分接口返回的是 Jackson 默认的 ISO 串
 * （如 2026-10-03T10:05:55.000+08:00），直接展示给用户很不友好。
 *
 * @param {String|Date|Number} value 时间值
 * @returns {String} 格式化结果；无法解析时原样返回
 */
export function formatDateTimeCN(value) {
  if (value === null || value === undefined || value === '') return '-'

  // 后端已经返回 'yyyy-MM-dd HH:mm:ss' 这类字符串时，直接取出各段重新拼，
  // 避免 new Date('2026-10-03 10:05:55') 在部分浏览器解析异常
  if (typeof value === 'string') {
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})/)
    if (m) {
      return `${m[1]}年${m[2]}月${m[3]}日${m[4]}时${m[5]}分${m[6]}秒`
    }
    // 只有日期
    const d = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (d) {
      return `${d[1]}年${d[2]}月${d[3]}日`
    }
  }

  const dt = value instanceof Date ? value : new Date(value)
  if (isNaN(dt.getTime())) return String(value)
  return `${dt.getFullYear()}年${pad(dt.getMonth() + 1)}月${pad(dt.getDate())}日` +
    `${pad(dt.getHours())}时${pad(dt.getMinutes())}分${pad(dt.getSeconds())}秒`
}

/** 只取时分秒：10:05:55 */
export function formatTime(value) {
  const s = formatDateTimeCN(value)
  const m = s.match(/(\d{2}时\d{2}分\d{2}秒)$/)
  return m ? m[1] : s
}

/**
 * 百分比安全值：进度条只接受 0~100
 * （数据异常给出 >100 时截断，避免 Element Plus 进度条渲染错乱）
 */
export function clampPercent(value) {
  const n = Number(value)
  if (isNaN(n)) return 0
  return Math.max(0, Math.min(100, n))
}
