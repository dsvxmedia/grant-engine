import { AsyncLocalStorage } from 'node:async_hooks'

/**
 * Demo mode swaps the database out for fixtures, but the scheduled jobs still
 * have to do real work against the real database. Cron handlers run their body
 * inside runWithRealDb, and the Supabase factory checks this store before it
 * decides which client to hand back.
 */
const realDb = new AsyncLocalStorage<boolean>()

export function runWithRealDb<T>(fn: () => Promise<T>): Promise<T> {
  return realDb.run(true, fn)
}

export function realDbRequested(): boolean {
  return realDb.getStore() === true
}
