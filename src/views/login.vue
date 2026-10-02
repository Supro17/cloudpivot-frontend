<template>
  <div class="login">
    <div class="login__inner">
      <h1 class="login__title">{{ settings.title }}</h1>
      <p class="login__subtitle">企业协同办公平台</p>

      <div class="login__form">
        <el-form ref="formRef" :model="form" :rules="rules" size="large" @submit.prevent>
          <el-form-item prop="username">
            <el-input v-model="form.username" placeholder="账号" autocomplete="username" />
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="密码"
              show-password
              autocomplete="current-password"
              @keyup.enter="handleLogin"
            />
          </el-form-item>
          <el-button
            class="login__btn"
            type="primary"
            :loading="loading"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form>
        <p class="login__tip">演示账号 admin / admin123　·　验证码已关闭</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import settings from '@/settings'
import { useUserStore } from '@/store/modules/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  username: 'admin',
  password: 'admin123'
})

const rules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

function handleLogin() {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      await userStore.login(form)
      ElMessage.success('登录成功')
      router.push(route.query.redirect || '/')
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.login {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--cp-bg);
  padding: 40px 22px;
}

.login__inner {
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.login__title {
  font-size: 40px;
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.05;
  margin: 0;
}

.login__subtitle {
  margin-top: 6px;
  font-size: 17px;
  color: var(--cp-text-2);
  letter-spacing: -0.01em;
}

.login__form {
  margin-top: 40px;
  background: var(--cp-surface);
  border-radius: var(--cp-radius);
  padding: 32px 28px 24px;
  box-shadow: var(--cp-shadow);
  text-align: left;
}

.login__btn {
  width: 100%;
  margin-top: 4px;
}

.login__tip {
  margin-top: 18px;
  text-align: center;
  font-size: 12px;
  color: var(--cp-text-3);
}
</style>
