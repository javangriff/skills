import { defineStore } from 'pinia'
import { ref } from 'vue'

type Status = 'all' | 'active' | 'inactive'

const STATUSES: Status[] = ['all', 'active', 'inactive']

const storedStatus = (): Status | undefined => {
  const stored = localStorage.getItem('companies.status')
  return STATUSES.find(status => status === stored)
}

export const useFiltersStore = defineStore('filters', () => {
  const status = ref<Status>(storedStatus() ?? 'active')

  /** Called by the page header's "Reset view" button and when the user switches company. */
  const reset = () => {
    status.value = 'active'
  }

  return { status, reset }
})
