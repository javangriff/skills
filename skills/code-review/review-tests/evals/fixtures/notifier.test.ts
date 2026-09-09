import { vi } from 'vitest'
import { notifyPasswordReset } from './notifier'

test('sends one password-reset message to the account email', async () => {
  const send = vi.fn().mockResolvedValue(undefined)

  await notifyPasswordReset({ send }, 'reader@example.com', 'https://example.com/reset/abc')

  expect(send).toHaveBeenCalledTimes(1)
  expect(send).toHaveBeenCalledWith(
    'reader@example.com',
    'Reset your password: https://example.com/reset/abc',
  )
})
