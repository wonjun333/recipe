<template>
  <div class="app-shell">
    <TopBarNav />
    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import TopBarNav from './components/TopBarNav.vue'
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: #f5f7fb;
}
.app-main {
  padding: 10px 12px 16px;
  box-sizing: border-box;
}
</style>