import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getToken, removeToken } from '@/utils/auth'

/**
 * axios 封装 —— 骨架版
 *
 * 后端有两种返回体（这是本项目刻意保留的差异，见 README「两种返回体」）：
 *   AjaxResult      { code, msg, data }            —— 详情 / 操作结果
 *   TableDataInfo   { code, msg, total, rows }     —— 分页列表
 *
 * 约定：code === 200 时，把**整个响应体**原样交给调用方
 *   → 列表页取 res.rows / res.total
 *   → 其它接口取 res.data
 * 这样调用方一眼能看出自己在处理哪种返回体，不用做一层隐式解包。
 */

// 是否已经弹过「登录过期」确认框，避免并发请求触发多次弹窗
let reloginVisible = false

const service = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API,
  timeout: 10000
})

// 请求拦截：注入 token
service.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers['Authorization'] = 'Bearer ' + token
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截：统一处理业务码与网络错误
service.interceptors.response.use(
  (res) => {
    const body = res.data
    const code = body.code || 200

    if (code === 401) {
      handleRelogin()
      return Promise.reject(new Error(body.msg || '登录状态已过期'))
    }
    if (code !== 200) {
      ElMessage({ message: body.msg || '系统异常', type: 'error', duration: 3000 })
      return Promise.reject(new Error(body.msg || 'Error'))
    }
    return body
  },
  (error) => {
    // 网关 AuthFilter 直接返回 HTTP 401（如被单点登录踢下线、令牌过期），
    // 走不到上面的业务码分支，这里单独兜住，否则只弹提示、不跳登录页
    const status = error.response && error.response.status
    if (status === 401) {
      handleRelogin()
      return Promise.reject(error)
    }
    let message = error.message
    if (message === 'Network Error') {
      message = '网络异常，请检查后端服务与网关是否启动'
    } else if (message.includes('timeout')) {
      message = '请求超时'
    }
    ElMessage({ message, type: 'error', duration: 3000 })
    return Promise.reject(error)
  }
)

/** 登录过期：清 token 并跳转登录页 */
function handleRelogin() {
  if (reloginVisible) return
  reloginVisible = true
  removeToken()
  ElMessageBox.confirm('登录状态已过期，请重新登录', '提示', {
    confirmButtonText: '重新登录',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      // 直接跳转而非 router.push：登录页与守卫会接管后续流程
      window.location.href = '/login'
    })
    .finally(() => {
      reloginVisible = false
    })
}

export default service
