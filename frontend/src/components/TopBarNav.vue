<template>
  <header class="topbar">
    <div class="brand">Recipe Master</div>

    <nav class="nav-center">
      <RouterLink to="/recipe-test" class="nav-item">AMAT</RouterLink>
      <RouterLink to="/recipe-test-ebara" class="nav-item">Ebara</RouterLink>
    </nav>

    <nav class="nav-right">
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
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
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
.nav-center {
  display: flex;
  align-items: center;
  gap: 4px;
}
.nav-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
}
.nav-item {
  text-decoration: none;
  color: #334155;
  padding: 6px 14px;
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
