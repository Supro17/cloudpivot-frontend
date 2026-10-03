import { useUserStore } from '@/store/modules/user'

/** 全部权限标识（后端超管返回的权限串） */
const ALL_PERMISSION = '*:*:*'
/** 超级管理员角色标识 */
const SUPER_ADMIN = 'admin'

/**
 * 判断当前用户是否具备权限（数组内为「或」关系）
 * 用途：v-if="checkPermi(['system:user:add'])"、或脚本里做逻辑分支
 */
export function checkPermi(value) {
  if (!Array.isArray(value) || value.length === 0) {
    return true
  }
  const perms = useUserStore().permissions || []
  return perms.includes(ALL_PERMISSION) || value.some((p) => perms.includes(p))
}

/**
 * 判断当前用户是否具备角色（数组内为「或」关系）
 * 超管角色（admin）恒为 true
 */
export function checkRole(value) {
  if (!Array.isArray(value) || value.length === 0) {
    return true
  }
  const roles = useUserStore().roles || []
  return roles.includes(SUPER_ADMIN) || value.some((r) => roles.includes(r))
}
