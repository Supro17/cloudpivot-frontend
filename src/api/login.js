import request from '@/utils/request'

/**
 * 认证相关接口
 *
 * 注意：这些都走网关（8080）。
 *  - /auth/**       → cp-auth（网关剥掉 /auth 前缀，服务内是 /login /logout）
 *  - /system/user/getInfo → cp-system
 */

// 获取验证码（网关 /code）
// 返回 { code: 是否开启验证码, uuid: 校验用标识, img: base64 图片 }
export function getCodeImg() {
  return request({ url: '/code', method: 'get' })
}

// 登录。带上验证码（网关 ValidateCodeFilter 会校验 code + uuid）
export function login(data) {
  return request({
    url: '/auth/login',
    method: 'post',
    data: data
  })
}

// 退出登录 —— 后端是 @DeleteMapping("logout")，严格 RESTful
export function logout() {
  return request({
    url: '/auth/logout',
    method: 'delete'
  })
}

// 获取当前用户信息 + 角色 + 权限点
// 返回体（顶层）：{ code, msg, roles, permissions, user }
export function getInfo() {
  return request({
    url: '/system/user/getInfo',
    method: 'get'
  })
}
