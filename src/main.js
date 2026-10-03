import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import './assets/styles/index.css'

import App from './App.vue'
import store from './store'
import router from './router'
import hasPermi from './directive/hasPermi'
import hasRole from './directive/hasRole'
import './permission'

const app = createApp(App)

// 全局注册 Element Plus 图标（组件里 <el-icon><User /></el-icon> 可直接用）
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 按钮级权限指令：无权限时元素直接不渲染，避免"点了才 403"
app.directive('hasPermi', hasPermi)
app.directive('hasRole', hasRole)

app.use(store)
app.use(router)
app.use(ElementPlus, { locale: zhCn })

app.mount('#app')
