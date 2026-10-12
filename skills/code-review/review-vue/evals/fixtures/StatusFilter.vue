<script setup lang="ts">
import { watch } from 'vue'

import StatusSelect from './StatusSelect.vue'
import { useFiltersStore } from './filtersStore'

const filters = useFiltersStore()

// The status survives a reload.
watch(
  () => filters.status,
  status => localStorage.setItem('companies.status', status),
)
</script>

<template>
  <StatusSelect v-model="filters.status" />
</template>
