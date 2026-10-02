/**
 * token 存取 —— 设计文档 9.4 约定：sessionStorage（支持同浏览器多身份调试）
 */
const TokenKey = 'CloudPivot-Token'

export function getToken() {
  return sessionStorage.getItem(TokenKey)
}

export function setToken(token) {
  return sessionStorage.setItem(TokenKey, token)
}

export function removeToken() {
  return sessionStorage.removeItem(TokenKey)
}
