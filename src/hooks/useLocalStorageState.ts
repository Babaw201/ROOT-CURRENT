import { useState } from 'react'
import { readJSON, writeJSON } from '../utils/storage'

type SetState<T> = (value: T | ((previous: T) => T)) => void

/** Comme `useState`, mais la valeur est aussi lue/écrite en localStorage (versionné, voir utils/storage). */
export function useLocalStorageState<T>(key: string, initialValue: T): [T, SetState<T>] {
  const [value, setValue] = useState<T>(() => readJSON(key, initialValue))

  const update: SetState<T> = (next) => {
    setValue((previous) => {
      const resolved = typeof next === 'function' ? (next as (previous: T) => T)(previous) : next
      writeJSON(key, resolved)
      return resolved
    })
  }

  return [value, update]
}
