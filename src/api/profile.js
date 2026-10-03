import request from '@/utils/request'

/**
 * 个人档案（自服务，登录即可）
 * 一次返回：用户 + 部门 + 机构 + 岗位 + 角色
 * 返回体顶层 { code, msg, data: MyProfileVo }
 */
export function getProfile() {
  return request({ url: '/org/user/profile', method: 'get' })
}

/**
 * 上传/更换【我的】头像
 * ★ 后端已改为从登录态取用户名，**不需要也不能传 userName**（防止改别人头像）
 * @param {FormData} formData 只含 file 字段
 */
export function uploadAvatar(formData) {
  return request({
    url: '/org/user/avatar',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
