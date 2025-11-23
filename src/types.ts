export type NoteSection = 'subjective' | 'objective' | 'assessment' | 'plan' | 'other'

export interface SelectorConfig {
  id: string
  label: string
  selector: string
  category: NoteSection
  maxSentences: number
}

export interface SummaryResult extends SelectorConfig {
  rawText: string
  summary: string
}
