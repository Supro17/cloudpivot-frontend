# 云枢OA 前端

Vue3 + Vite + Element Plus + Pinia + Axios + Vue Router（JavaScript）

## 运行

```bash
npm install      # npmmirror 镜像
npm run dev      # 开发：http://localhost:8081
npm run build:prod
```

- 开发端口 **8081**（避开网关 8080；vite.config.js 可改）
- 请求带 `/dev-api` 前缀，vite proxy 转发到**网关 8080** 并剥掉前缀（跨域由代理解决）
- WebSocket：`/dev-api/ws/message?token=xxx`（vite 的 ws 代理同样转发）

> 运行前需启动后端：Nacos、gateway(8080)、auth(9200)、system(9201)、org(9215)、message(9219) 等。

## 项目约定（开发必读）

1. **跨域**：开发期由 vite proxy 代理解决，生产由 Nginx 反代；前端代码里不出现后端地址
2. **RESTful**：查询 GET / 新增 POST / 修改 PUT / 删除 DELETE，与后端 Controller 严格对应
3. **共享数据进 Pinia**：用户信息（`modules/user.js`）、动态菜单（`modules/permission.js`）、
   消息未读数与长连接（`modules/websocket.js`）都在 store，组件里用 `useXxxStore()` 取
4. **api 前缀**：`src/api/*.js` 里的 URL 一律**不带** `/dev-api`，前缀由 axios `baseURL`
   （`VITE_APP_BASE_API`）统一添加
5. **删除必须二次确认**：统一用 `utils/confirm.js` 的 `confirmDelete(action, target)`，点「删除」才执行
6. **安全退出**：`user store` 的 `logout()` 清空 token、用户信息、动态菜单、断开长连接并
   `sessionStorage.clear()`，然后回登录页
7. **组件间跳转一律用路由**（`router.push`），不做页面内嵌套切换
8. **风格**：参考 Apple 官网 —— 浅灰背景 `#f5f5f7`、白色大圆角卡片、苹果蓝 `#0071e3`、
   顶部毛玻璃导航（`assets/styles/index.css` 里有全部设计变量）

## 两种返回体（关键约定）

后端刻意保留两种返回体，`utils/request.js` 在 `code===200` 时**原样透传整个响应体**：

| 返回方式 | JSON 结构 | 调用方取值 |
| --- | --- | --- |
| `success(data)` | `{code, msg, data}` | `res.data` |
| `getDataTable(page)` | `{code, msg, total, rows}` | `res.rows` / `res.total` |

特例：信箱 ⑦ 的返回体是 `AjaxResult`，但 `data` 里是 `{ total, unread, rows }`。

## 目录结构

```
src/
├── api/                    接口定义（URL 不带前缀）
│   ├── login.js            认证：login / logout / getInfo
│   ├── menu.js             动态路由：getRouters
│   ├── message.js          消息域 10 个接口
│   └── org.js              机构/部门下拉（消息发布选择范围用）
├── assets/styles/index.css 全局样式（Apple 风格设计变量）
├── components/ParentView.vue  二级父容器（后端 component='ParentView'）
├── layout/
│   ├── index.vue           顶部毛玻璃导航 + 内容区
│   └── components/MenuItem.vue  递归菜单项（支持外链/多级）
├── router/index.js         静态路由（登录/首页/404）
├── store/
│   ├── index.js            Pinia 入口
│   └── modules/
│       ├── user.js         token、用户信息、角色权限、登录/安全退出
│       ├── permission.js   动态路由：getRouters → addRoute + 菜单树
│       └── websocket.js    消息长连接：心跳、断线重连、未读角标
├── utils/
│   ├── auth.js             token 存取（sessionStorage，设计文档 9.4）
│   ├── confirm.js          删除二次确认
│   ├── menu.js             菜单路径拼接/外链判断
│   └── request.js          axios 封装（两种返回体、401 处理）
├── views/
│   ├── login.vue           登录页（验证码已关闭）
│   ├── index.vue           首页
│   ├── error/404.vue
│   ├── placeholder.vue     若依底座菜单的占位页
│   └── message/            消息域
│       ├── components/     MsgFormDialog（新建/编辑）、MsgDetailDrawer（详情）
│       ├── list/index.vue  消息管理：查询/新建/编辑/详情/发布/删除
│       ├── inbox/index.vue 我的信箱：查看并标记已读、未读数
│       └── sent/index.vue  已发送
├── main.js                 入口
├── permission.js           路由守卫（登录拦截 + 动态路由 + 接入长连接）
└── settings.js             应用常量
```

## 动态路由说明

登录后守卫里调 `GET /system/menu/getRouters`（由 `sys_menu` 的 M/C 行驱动）：

- 顶级 `component='Layout'` → 注册为布局路由；`'ParentView'` → 二级父容器
- 叶子 `component='message/list/index'` → 懒加载 `src/views/message/list/index.vue`
- 对应 view 不存在（若依底座的 system/* 页面）→ 落到 `views/placeholder.vue`
- 外链（Sentinel/Nacos 控制台）→ 新窗口打开
- 顶部导航用 `permission store` 里的**原始菜单树**渲染，支持多级

## 消息实时推送

- 登录后守卫里建立长连接；每 30s 发 `ping` 心跳，断线 5s 重连
- 推送体只有信号 `{ type: 'NEW_MESSAGE', count, title }` —— 角标 +1 并弹通知，
  **数据以 HTTP 接口为准**（信箱页自己刷新）
- 退出登录时断开连接并清空未读状态
