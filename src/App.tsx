import { useEffect, useMemo, useState } from 'react'
import { DEFAULT_SELECTORS } from './constants/defaultSelectors'
import type { SelectorConfig, SummaryResult } from './types'
import { generateSoapNote } from './utils/note'
import { createSelectorTemplate, loadSelectors, saveSelectors } from './utils/storage'
import './App.css'

const categoryOptions: Array<{ value: SelectorConfig['category']; label: string }> = [
  { value: 'subjective', label: 'Subjective' },
  { value: 'objective', label: 'Objective' },
  { value: 'assessment', label: 'Assessment' },
  { value: 'plan', label: 'Plan' },
  { value: 'other', label: 'Other' },
]

const hasChromeRuntime = typeof chrome !== 'undefined' && !!chrome.runtime?.id

function App() {
  const [selectors, setSelectors] = useState<SelectorConfig[]>(DEFAULT_SELECTORS)
  const [summaries, setSummaries] = useState<SummaryResult[]>([])
  const [note, setNote] = useState('')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadSelectors().then(setSelectors).catch(() => setSelectors(DEFAULT_SELECTORS))
  }, [])

  const selectorCount = selectors.length
  const previewMode = useMemo(() => !hasChromeRuntime, [])

  const updateSelector = (id: string, patch: Partial<SelectorConfig>) => {
    setSelectors((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  const removeSelector = (id: string) => {
    setSelectors((prev) => prev.filter((item) => item.id !== id))
  }

  const handleAddSelector = () => {
    setSelectors((prev) => [...prev, createSelectorTemplate()])
  }

  const handleResetSelectors = () => {
    setSelectors(DEFAULT_SELECTORS)
    setStatusMessage('Reset to default Practice Fusion tags.')
    setErrorMessage(null)
  }

  const handleSaveSelectors = async () => {
    setIsSaving(true)
    setStatusMessage(null)
    try {
      await saveSelectors(selectors)
      setStatusMessage('Selector rules saved.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to save selectors.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleScan = async () => {
    setIsScanning(true)
    setStatusMessage(previewMode ? 'Preview mode: using mocked data.' : 'Scanning page…')
    setErrorMessage(null)
    try {
      const results = await summarizePage(selectors)
      setSummaries(results)
      const draft = generateSoapNote(results)
      if (draft) {
        setNote(draft)
      }
      setStatusMessage(`Captured ${results.length} section${results.length === 1 ? '' : 's'}.`)
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to reach the content script. Reload the page and try again.',
      )
    } finally {
      setIsScanning(false)
    }
  }

  const handleGenerateNote = () => {
    const draft = generateSoapNote(summaries)
    setNote(draft)
    setStatusMessage(draft ? 'SOAP note updated.' : 'No summaries available for note generation.')
  }

  const handleCopyNote = async () => {
    if (!note.trim()) return
    try {
      await navigator.clipboard.writeText(note)
      setStatusMessage('Note copied to clipboard.')
    } catch {
      setErrorMessage('Clipboard permission was denied. Copy manually instead.')
    }
  }

  const handleInsertNote = async () => {
    if (!note.trim()) return
    try {
      const response = await insertNoteIntoActiveField(note)
      if (!response?.success) {
        throw new Error(response?.message ?? 'Active field not found.')
      }
      setStatusMessage('Note inserted into the focused field.')
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to insert note. Focus a text field inside Practice Fusion.',
      )
    }
  }

  const handleSelectorChange = (id: string, field: keyof SelectorConfig, value: string) => {
    if (field === 'maxSentences') {
      updateSelector(id, { maxSentences: Number(value) })
    } else {
      updateSelector(id, { [field]: value } as Partial<SelectorConfig>)
    }
  }

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <h1>Practice Fusion Companion</h1>
          <p>Summarize tagged chart data and draft SOAP notes directly inside Practice Fusion.</p>
        </div>
        {previewMode && <span className="badge badge--warning">Preview mode</span>}
      </header>

      <section className="panel">
        <div className="panel__header">
          <h2>Selector rules</h2>
          <div className="panel__actions">
            <button type="button" className="button button--ghost" onClick={handleResetSelectors}>
              Reset defaults
            </button>
            <button type="button" className="button button--ghost" onClick={handleAddSelector}>
              Add selector
            </button>
            <button
              type="button"
              className="button"
              onClick={handleSaveSelectors}
              disabled={isSaving || selectorCount === 0}
            >
              {isSaving ? 'Saving…' : 'Save selectors'}
            </button>
          </div>
        </div>

        {selectorCount === 0 ? (
          <p className="empty-state">Add at least one selector to start summarizing.</p>
        ) : (
          <div className="selector-grid">
            <div className="selector-grid__header">
              <span>Label</span>
              <span>CSS selector</span>
              <span>Category</span>
              <span>Max sentences</span>
              <span />
            </div>
            {selectors.map((selector) => (
              <div className="selector-grid__row" key={selector.id}>
                <input
                  value={selector.label}
                  onChange={(event) => handleSelectorChange(selector.id, 'label', event.target.value)}
                />
                <input
                  value={selector.selector}
                  placeholder='[data-pf-section="subjective"]'
                  onChange={(event) => handleSelectorChange(selector.id, 'selector', event.target.value)}
                />
                <select
                  value={selector.category}
                  onChange={(event) => handleSelectorChange(selector.id, 'category', event.target.value)}
                >
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={selector.maxSentences}
                  onChange={(event) => handleSelectorChange(selector.id, 'maxSentences', event.target.value)}
                />
                <button type="button" className="button button--ghost" onClick={() => removeSelector(selector.id)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="panel__footer">
          <button
            type="button"
            className="button button--primary"
            onClick={handleScan}
            disabled={isScanning || selectorCount === 0}
          >
            {isScanning ? 'Scanning…' : 'Scan current page'}
          </button>
          {statusMessage && <span className="status status--info">{statusMessage}</span>}
          {errorMessage && <span className="status status--error">{errorMessage}</span>}
        </div>
      </section>

      <section className="panel">
        <div className="panel__header">
          <h2>Summaries</h2>
          <span className="panel__hint">
            The content script looks for the selectors you configured, extracts the text, and performs a lightweight
            frequency summary directly in the browser. No PHI leaves the page.
          </span>
        </div>
        {summaries.length === 0 ? (
          <p className="empty-state">No summaries yet. Scan a page inside Practice Fusion to populate this section.</p>
        ) : (
          <div className="summary-grid">
            {summaries.map((item) => (
              <article key={item.id} className="summary-card">
                <div className="summary-card__header">
                  <div>
                    <h3>{item.label}</h3>
                    <p className="summary-card__selector">{item.selector}</p>
                  </div>
                  <span className="badge">{item.category}</span>
                </div>
                <p className="summary-card__body">{item.summary || 'No sentences met the threshold.'}</p>
                <details>
                  <summary>Source text</summary>
                  <p className="summary-card__raw">{item.rawText || 'Selector did not match any text.'}</p>
                </details>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel__header">
          <h2>Patient note</h2>
          <div className="panel__actions">
            <button type="button" className="button button--ghost" onClick={handleGenerateNote} disabled={!summaries.length}>
              Build SOAP note
            </button>
            <button type="button" className="button button--ghost" onClick={handleCopyNote} disabled={!note.trim()}>
              Copy
            </button>
            <button type="button" className="button" onClick={handleInsertNote} disabled={!note.trim() || previewMode}>
              Insert into Practice Fusion
            </button>
          </div>
        </div>
        <textarea
          className="note-textarea"
          rows={10}
          placeholder="SOAP note draft will appear here."
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </section>
    </div>
  )
}

async function summarizePage(selectors: SelectorConfig[]): Promise<SummaryResult[]> {
  if (!hasChromeRuntime) {
    return selectors.map((selector) => ({
      ...selector,
      rawText: `Mocked text for ${selector.label}. Replace with live data once the extension is loaded inside Chrome.`,
      summary: `Summary preview for ${selector.label}.`,
    }))
  }

  const tabId = await getActiveTabId()
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(
      tabId,
      { type: 'SUMMARIZE_TAGS', selectors },
      (response: { summaries: SummaryResult[] } | undefined) => {
        const lastError = chrome.runtime.lastError
        if (lastError) {
          reject(new Error(lastError.message))
          return
        }
        resolve(response?.summaries ?? [])
      },
    )
  })
}

async function insertNoteIntoActiveField(note: string) {
  if (!hasChromeRuntime) {
    try {
      await navigator.clipboard.writeText(note)
      return { success: true, message: 'Copied to clipboard because Chrome APIs are not available.' }
    } catch {
      return { success: false, message: 'Clipboard permission denied.' }
    }
  }
  const tabId = await getActiveTabId()
  return new Promise<{ success: boolean; message?: string }>((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, { type: 'INSERT_NOTE', note }, (response) => {
      const lastError = chrome.runtime.lastError
      if (lastError) {
        reject(new Error(lastError.message))
        return
      }
      resolve(response)
    })
  })
}

async function getActiveTabId(): Promise<number> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tabs[0]?.id) {
    throw new Error('Unable to find the active Practice Fusion tab.')
  }
  return tabs[0].id
}

export default App
