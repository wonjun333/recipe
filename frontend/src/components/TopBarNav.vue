<template>
  <header class="topbar">
    <div class="brand">Recipe</div>

    <nav class="nav">
      <RouterLink to="/recipe-test" class="nav-item">Recipe Test</RouterLink>
      <RouterLink to="/history" class="nav-item">My History</RouterLink>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<style scoped>
.topbar {
  position: sticky;
  top: 0;
  z-index: 40;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 14px;
  box-sizing: border-box;
  background: rgba(255, 255, 255, .96);
  border-bottom: 1px solid #d8dee9;
  backdrop-filter: blur(10px);
}
.brand {
  font-size: 15px;
  font-weight: 800;
  color: #111827;
  white-space: nowrap;
}
.nav {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.nav-item {
  text-decoration: none;
  color: #334155;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
  transition: background-color .14s ease, color .14s ease;
  white-space: nowrap;
}
.nav-item:hover {
  background: #eef3fb;
}
.nav-item.router-link-active {
  background: #007acc;
  color: #fff;
}
</style>