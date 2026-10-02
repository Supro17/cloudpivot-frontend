<template>
  <router-view />
</template>

<script setup>
// 骨架阶段：全局样式后续按需补充（当前用各组件内的局部样式）
</script>

<style>
/* 全局 Reset */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body,
#app {
  height: 100%;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif;
}
</style>
