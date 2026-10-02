import request from '@/utils/request'

/**
 * 认证相关接口
 *
 * 注意：这些都走网关（8080）。
 *  - /auth/**       → cp-auth（网关剥掉 /auth 前缀，服务内是 /login /logout）
 *  - /system/user/getInfo → cp-system
 */

// 登录。验证码在网关配置里已关闭（security.captcha.enabled=false），无需传 code
export function login(data) {
  return request({
    url: '/auth/login',
    method: 'post',
    data: data
  })
}

// 退出登录
export function logout() {
  return request({
    url: '/auth/logout',
    method: 'post'
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
