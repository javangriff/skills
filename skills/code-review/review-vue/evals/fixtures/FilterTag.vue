<script setup lang="ts">
import Popover from './Popover.vue'
import FilterControl from './FilterControl.vue'
import { useCommitOnClose } from './useCommitOnClose'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{ columnId: string; label: string }>()

useCommitOnClose(open)
</script>

<template>
  <Popover v-model:open="open">
    <template #trigger>
      <button type="button">{{ props.label }}</button>
    </template>
    <FilterControl
      :column-id="props.columnId"
      @select="open = false" />
  </Popover>
</template>
