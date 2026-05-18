<template>
  <div v-if="visible" class="loading-overlay">
    <div class="loading-card">
      <div class="spinner"></div>
      <div class="loading-text">{{ message }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean
  message: string
}>()
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(255, 255, 255, .55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 12000;
}
.loading-card {
  background: #fff;
  border: 1px solid #d7dbe6;
  border-radius: 16px;
  padding: 22px 28px;
  box-shadow: 0 18px 40px rgba(10, 20, 40, .18);
  display: grid;
  gap: 12px;
  justify-items: center;
}
.spinner {
  width: 34px;
  height: 34px;
  border: 4px solid #dbe4ff;
  border-top-color: #2b59ff;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}
.loading-text {
  font-size: 13px;
  font-weight: 800;
  color: #1f2937;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>