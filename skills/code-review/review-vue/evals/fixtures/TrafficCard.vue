<script setup lang="ts">
import { ref, watch } from 'vue'
import ZoomableChart from './ZoomableChart.vue'
import { useTrafficQuery } from './useTrafficQuery'

const props = defineProps<{ serviceId: string; from: number; to: number }>()

const zoom = ref<[number, number] | null>(null)

// A new query key leaves useQuery with no data, so isLoading turns true until it arrives.
const { samples, isLoading } = useTrafficQuery(
  () => props.serviceId,
  () => props.from,
  () => props.to,
)

watch([() => props.from, () => props.to], () => {
  zoom.value = null
})
</script>

<template>
  <section>
    <header>
      <button
        v-if="zoom"
        type="button"
        @click="zoom = null">
        Reset zoom
      </button>
    </header>
    <div
      v-if="isLoading"
      class="skeleton" />
    <ZoomableChart
      v-else
      v-model:zoom="zoom"
      :samples="samples" />
  </section>
</template>
