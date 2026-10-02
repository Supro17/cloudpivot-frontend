<template>
  <section class="cp-hero cp-hero__row">
    <div>
      <h1 class="cp-hero__title">{{ title }}</h1>
      <p class="cp-hero__subtitle">{{ subtitle }}</p>
    </div>
    <div class="cp-hero__actions">
      <slot name="actions" />
    </div>
  </section>
</template>

<script setup>
/**
 * Apple 式页面大标题：44px 标题 + 灰色副标题 + 右侧操作区
 * 12 个业务页面统一用它，保证信息层级一致
 */
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' }
})
</script>

<style scoped>
.cp-hero__actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}
</style>
