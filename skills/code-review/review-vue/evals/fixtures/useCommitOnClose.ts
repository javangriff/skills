import { watch, type Ref } from 'vue'

import { injectFilterContext } from './filterContext'

/** Sends a filter's changes as soon as its popover closes, ahead of the debounce. */
export const useCommitOnClose = (open: Ref<boolean>) => {
  const { commitFilters } = injectFilterContext()

  watch(open, isOpen => {
    if (!isOpen) commitFilters()
  })
}
