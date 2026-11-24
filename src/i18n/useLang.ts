import { useSyncExternalStore } from 'react'
import { getLang, subscribeLang, type Lang } from './translator'

export function useLang(): Lang {
  return useSyncExternalStore(subscribeLang, getLang, getLang)
}
