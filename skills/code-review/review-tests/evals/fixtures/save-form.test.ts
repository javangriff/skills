import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { renderSaveForm } from './save-form'

test('saves the entered name', async () => {
  const onSave = vi.fn()
  renderSaveForm(document.body, onSave)

  await userEvent.type(screen.getByTestId('name-input'), 'Ada')
  await userEvent.click(screen.getByTestId('save-button'))

  expect(onSave).toHaveBeenCalledWith('Ada')
})

test('shows the spinner while saving', async () => {
  renderSaveForm(document.body, vi.fn())

  await userEvent.click(document.querySelector('form button')!)

  expect(screen.getByTestId('spinner')).toBeVisible()
})
