<template>
  <aside class="sidebar">
    <nav class="nav">
      <RouterLink to="/recipe" class="nav-item">Recipe</RouterLink>
      <RouterLink to="/recipe-test" class="nav-item">Recipe Test</RouterLink>
      <RouterLink to="/history" class="nav-item">My History</RouterLink>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<style scoped>
.sidebar {
  width: 240px;
  border-right: 1px solid #ccc;
  padding: 12px;
  box-sizing: border-box;
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-item {
  text-decoration: none;
  color: #333;
  padding: 6px 8px;
  border-radius: 4px;
}

.nav-item.router-link-active {
  background: #007acc;
  color: #fff;
}
</style>