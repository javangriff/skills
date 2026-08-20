<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { debounce } from 'es-toolkit'

interface Props {
  // the placeholder text for the input
  placeholder?: string
  // the minimum number of characters before searching
  minChars?: number
  // whether the input is disabled or not
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Search…',
  minChars: 3,
  disabled: false,
})

const emit = defineEmits<{ search: [term: string] }>()

const query = ref('')

const isLongEnough = computed(() => query.value.length >= props.minChars)

const runSearch = debounce((term: string) => {
  emit('search', term)
}, 300)

function onInput(event: Event) {
  // get the value from the input
  const value = (event.target as HTMLInputElement).value
  // set the query to the value
  query.value = value
  if (value.length >= props.minChars) {
    runSearch(value)
  }
}

function clear() {
  query.value = ''
  emit('search', '')
}

watch(
  () => props.disabled,
  disabled => {
    // if it becomes disabled, clear the field
    if (disabled) clear()
  },
)
</script>

<template>
  <div class="search-input">
    <input
      :value="query"
      :placeholder="placeholder"
      :disabled="disabled"
      @input="onInput"
    />
    <button
      v-if="query"
      @click="clear"
    >
      Clear
    </button>
  </div>
</template>
