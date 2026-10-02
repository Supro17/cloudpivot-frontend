import request from '@/utils/request'

/**
 * 组织域接口 —— 目前只用到「取选项列表」：
 * 消息发布时选择发送范围（按机构 / 按部门）需要这两份下拉数据。
 */

/** 机构列表（不分页，用于下拉） */
export function listBranch() {
  return request({ url: '/org/branch/list', method: 'get' })
}

/** 部门列表（可带 branchId 过滤，不带则返回全部） */
export function listDepart(query) {
  return request({ url: '/org/depart/list', method: 'get', params: query })
}
