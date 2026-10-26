<script setup lang="ts">
import { computed, watch } from 'vue'
import LineChart from './LineChart.vue'

type Sample = [time: number, value: number]

/** Range the user dragged to zoom into; null shows the whole range. */
const zoom = defineModel<[number, number] | null>('zoom', { default: null })

const props = defineProps<{
  samples: Sample[]
  /** Pinned x range; defaults to the extent of the samples. */
  range?: [number, number]
}>()

const baseRange = computed<[number, number] | undefined>(() => {
  if (props.range) return props.range
  if (props.samples.length < 2) return undefined
  return [props.samples[0][0], props.samples[props.samples.length - 1][0]]
})

// Compared by value: callers may pass range as an inline array literal, which is a new array on
// every parent render and would otherwise drop the zoom whenever anything above re-renders.
watch([() => baseRange.value?.[0], () => baseRange.value?.[1]], () => {
  zoom.value = null
})

const visibleRange = computed(() => zoom.value ?? baseRange.value)

function onDragEnd(start: number, end: number) {
  zoom.value = [start, end]
}
</script>

<template>
  <LineChart
    :samples="props.samples"
    :x-domain="visibleRange"
    @drag-end="onDragEnd" />
</template>
