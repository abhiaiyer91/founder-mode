const DEFAULT_SELECTORS = [
  {
    id: 'subjective',
    label: 'Subjective',
    selector: '[data-pf-section="subjective"], .pf-subjective',
    category: 'subjective',
    maxSentences: 3,
  },
  {
    id: 'objective',
    label: 'Objective',
    selector: '[data-pf-section="objective"], .pf-objective',
    category: 'objective',
    maxSentences: 3,
  },
  {
    id: 'assessment',
    label: 'Assessment',
    selector: '[data-pf-section="assessment"], .pf-assessment',
    category: 'assessment',
    maxSentences: 2,
  },
  {
    id: 'plan',
    label: 'Plan',
    selector: '[data-pf-section="plan"], .pf-plan',
    category: 'plan',
    maxSentences: 2,
  },
  {
    id: 'allergies',
    label: 'Allergies',
    selector: '[data-pf-section="allergies"], .pf-allergies',
    category: 'objective',
    maxSentences: 2,
  },
]

chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.sync.get(['practiceFusionSelectors'])
  if (!Array.isArray(existing.practiceFusionSelectors) || existing.practiceFusionSelectors.length === 0) {
    await chrome.storage.sync.set({ practiceFusionSelectors: DEFAULT_SELECTORS })
  }
})
