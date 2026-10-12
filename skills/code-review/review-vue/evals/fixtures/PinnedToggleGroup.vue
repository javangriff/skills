<script setup lang="ts">
import { computed, watch } from 'vue'

import ToggleGroup from './ToggleGroup.vue'
import { injectFilterContext } from './filterContext'

const props = defineProps<{ columnId: string }>()

const { serverFiltering, columnById, setFilter } = injectFilterContext()

const column = computed(() => columnById(props.columnId))
const options = computed(() => column.value?.filterOptions ?? [])

if (import.meta.env.DEV) {
  watch(
    () => serverFiltering.value && !column.value?.filterOptions,
    hasNoOptions => {
      if (hasNoOptions) {
        console.warn(`[PinnedToggleGroup] ${props.columnId} has no options; a server-side table needs filterOptions`)
      }
    },
    { immediate: true },
  )
}
</script>

<template>
  <ToggleGroup
    :options="options"
    @update:model-value="setFilter(props.columnId, $event)" />
</template>
