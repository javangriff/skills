import * as flagsModule from './flags'
import { createFlagClient } from './flags'

test('returns true for an enabled flag', async () => {
  const client = createFlagClient(async () => ({ 'new-checkout': true }))

  expect(await client.isEnabled('new-checkout')).toBe(true)
})

test('treats an unknown flag as disabled', async () => {
  const client = createFlagClient(async () => ({ 'new-checkout': true }))

  expect(await client.isEnabled('dark-mode')).toBe(false)
})

test('defaults a missing flag to false', async () => {
  const client = createFlagClient(async () => ({}))

  expect(await client.isEnabled('dark-mode')).toBe(false)
})

test('isEnabled returns a boolean', async () => {
  const client = createFlagClient(async () => ({ 'new-checkout': true }))

  expect(typeof (await client.isEnabled('new-checkout'))).toBe('boolean')
})

test('stores the loaded flags', async () => {
  const client = createFlagClient(async () => ({ 'new-checkout': true }))

  await client.isEnabled('new-checkout')

  expect(client._loadedFlags()).toEqual({ 'new-checkout': true })
})

test('the beta banner helper has been removed', () => {
  expect('isBetaBannerEnabled' in flagsModule).toBe(false)
})
