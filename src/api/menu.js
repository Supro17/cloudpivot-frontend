import request from '@/utils/request'

/**
 * 菜单 / 动态路由
 *
 * 返回体顶层 { code, msg, data }，data 是菜单树数组：
 *   [{ name, path, hidden, component: 'Layout', meta: { title, icon }, children: [...] }]
 */
export function getRouters() {
  return request({
    url: '/system/menu/getRouters',
    method: 'get'
  })
}
