<template>
  <section class="history-page">
    <header class="history-header"><h1>My History</h1><button @click="loadHistory">Refresh</button></header>
    <table class="history-table"><thead><tr><th>이름</th><th>나의분임조</th><th>From 설비</th><th>Action</th><th>To 설비</th><th>시간</th><th>Recipe Name</th><th>Detail</th></tr></thead>
      <tbody><tr v-if="loading"><td colspan="8">Loading...</td></tr><tr v-else-if="items.length===0"><td colspan="8">이력이 없습니다.</td></tr><tr v-for="(row, idx) in items" :key="idx"><td>{{ row.actorName }}</td><td>{{ row.actorTeam }}</td><td>{{ row.fromEqpId }}</td><td>{{ row.action }}</td><td>{{ row.toEqpId || '-' }}</td><td>{{ row.createdAt }}</td><td>{{ row.recipeName }}</td><td>{{ row.detail }}</td></tr></tbody>
    </table>
  </section>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { recipeTestApi, type HistoryEntry } from '../../recipe_test/api/recipeTestApi'
const loading = ref(false)
const items = ref<HistoryEntry[]>([])
async function loadHistory(){ loading.value = true; try { const res = await recipeTestApi.getHistory(3000); items.value = res.items || [] } finally { loading.value = false } }
onMounted(loadHistory)
</script>
<style scoped>
.history-page{padding:16px}.history-header{display:flex;justify-content:space-between;align-items:center}.history-table{width:100%;border-collapse:collapse;background:#fff}.history-table th,.history-table td{border:1px solid #e5e7eb;padding:8px;text-align:left}.history-table th{background:#f4f7fb}
</style>
