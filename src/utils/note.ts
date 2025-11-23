import type { NoteSection, SummaryResult } from '../types'

const SECTION_TITLES: Record<NoteSection, string> = {
  subjective: 'Subjective',
  objective: 'Objective',
  assessment: 'Assessment',
  plan: 'Plan',
  other: 'Other',
}

const SECTION_ORDER: NoteSection[] = ['subjective', 'objective', 'assessment', 'plan', 'other']

export function generateSoapNote(summaries: SummaryResult[]): string {
  if (!summaries.length) return ''

  const sections = SECTION_ORDER.map((section) => {
    const entries = summaries.filter((item) => item.category === section && item.summary.trim().length > 0)
    if (!entries.length) return null
    const lines = entries.map((item) => `- ${item.label}: ${item.summary}`)
    return `${SECTION_TITLES[section]}\n${lines.join('\n')}`
  }).filter(Boolean)

  return sections.join('\n\n')
}
