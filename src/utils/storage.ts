import { DEFAULT_SELECTORS } from '../constants/defaultSelectors'
import type { SelectorConfig } from '../types'

const STORAGE_KEY = 'practiceFusionSelectors'

export const hasChromeStorage =
  typeof chrome !== 'undefined' && !!chrome.storage && !!chrome.storage.sync && !!chrome.runtime?.id

export async function loadSelectors(): Promise<SelectorConfig[]> {
  if (hasChromeStorage) {
    const result = await chrome.storage.sync.get([STORAGE_KEY])
    if (Array.isArray(result[STORAGE_KEY]) && result[STORAGE_KEY].length > 0) {
      return sanitize(result[STORAGE_KEY])
    }
  } else {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          return sanitize(parsed)
        }
      } catch {
        /* ignore */
      }
    }
  }
  return DEFAULT_SELECTORS
}

export async function saveSelectors(selectors: SelectorConfig[]) {
  const cleaned = sanitize(selectors)
  if (hasChromeStorage) {
    await chrome.storage.sync.set({ [STORAGE_KEY]: cleaned })
    return
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned))
}

export function sanitize(selectors: SelectorConfig[]): SelectorConfig[] {
  return selectors
    .map((item) => ({
      ...item,
      label: item.label.trim() || 'Untitled',
      selector: item.selector.trim(),
      category: item.category ?? 'other',
      maxSentences: Number.isFinite(item.maxSentences) ? Math.max(1, Number(item.maxSentences)) : 2,
    }))
    .filter((item) => item.selector.length > 0)
}

export function createSelectorTemplate(): SelectorConfig {
  return {
    id: crypto?.randomUUID?.() ?? `selector-${Date.now()}`,
    label: 'New Section',
    selector: '',
    category: 'other',
    maxSentences: 2,
  }
}
