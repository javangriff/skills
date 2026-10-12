<script setup lang="ts">
import { computed, ref } from 'vue'

import FilterTag from './FilterTag.vue'
import { injectFilterContext } from './filterContext'

const { filters } = injectFilterContext()

// A tag being edited stays until its popover closes, so emptying its value does not unmount it mid-edit.
const editingColumnId = ref<string>()

const shownFilters = computed(() =>
  filters.value.filter(filter => filter.id === editingColumnId.value || filter.value !== undefined),
)

const onTagOpenChange = (columnId: string, isOpen: boolean) => {
  if (isOpen) {
    editingColumnId.value = columnId
  } else if (editingColumnId.value === columnId) {
    editingColumnId.value = undefined
  }
}
</script>

<template>
  <div>
    <FilterTag
      v-for="filter in shownFilters"
      :key="filter.id"
      :column-id="filter.id"
      :label="filter.label"
      :open="editingColumnId === filter.id"
      @update:open="onTagOpenChange(filter.id, $event)" />
  </div>
</template>
