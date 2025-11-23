const STOP_WORDS = new Set([
  'the',
  'and',
  'but',
  'or',
  'with',
  'a',
  'an',
  'to',
  'of',
  'for',
  'in',
  'on',
  'at',
  'by',
  'is',
  'are',
  'was',
  'were',
  'be',
  'has',
  'have',
  'had',
  'that',
  'this',
  'it',
  'as',
  'from',
  'his',
  'her',
  'their',
])

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (!request || typeof request !== 'object') {
    sendResponse({ summaries: [] })
    return
  }

  if (request.type === 'SUMMARIZE_TAGS') {
    const selectors = Array.isArray(request.selectors) ? request.selectors : []
    const summaries = selectors.map((config) => {
      const rawText = extractText(config.selector)
      const summary = rawText ? summarizeText(rawText, config.maxSentences || 2) : ''
      return { ...config, rawText, summary }
    })
    sendResponse({ summaries })
    return true
  }

  if (request.type === 'INSERT_NOTE') {
    const note = typeof request.note === 'string' ? request.note : ''
    if (!note.trim()) {
      sendResponse({ success: false, message: 'Note is empty.' })
      return true
    }
    const result = injectNote(note)
    sendResponse(result)
    return true
  }

  return true
})

function extractText(selector) {
  if (!selector) return ''
  const nodes = document.querySelectorAll(selector)
  if (!nodes.length) return ''
  const buffer = []
  nodes.forEach((node) => {
    const text = node.innerText || node.textContent
    if (text) {
      buffer.push(text.trim())
    }
  })
  return buffer.join('\n').trim()
}

function summarizeText(text, maxSentences) {
  const normalized = collapseWhitespace(text)
  const sentences = splitSentences(normalized)
  if (sentences.length <= maxSentences) {
    return sentences.join(' ')
  }

  const frequency = buildFrequencyMap(normalized)
  const ranked = sentences
    .map((sentence, index) => ({
      sentence,
      index,
      score: scoreSentence(sentence, frequency),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, maxSentences)
    .sort((a, b) => a.index - b.index)
    .map((item) => item.sentence.trim())

  return ranked.join(' ')
}

function collapseWhitespace(value) {
  return value.replace(/\s+/g, ' ').trim()
}

function splitSentences(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
}

function buildFrequencyMap(text) {
  const words = text.toLowerCase().match(/[a-z0-9']+/g) || []
  return words.reduce((map, word) => {
    if (STOP_WORDS.has(word) || word.length <= 2) {
      return map
    }
    map[word] = (map[word] || 0) + 1
    return map
  }, {})
}

function scoreSentence(sentence, frequency) {
  const words = sentence.toLowerCase().match(/[a-z0-9']+/g) || []
  if (!words.length) return 0
  const sum = words.reduce((total, word) => total + (frequency[word] || 0), 0)
  return sum / words.length
}

function injectNote(note) {
  const active = document.activeElement
  if (!active) {
    return { success: false, message: 'Focus a text area first.' }
  }

  if (active.tagName === 'TEXTAREA' || (active.tagName === 'INPUT' && active.type && active.type !== 'button')) {
    const start = active.selectionStart ?? active.value.length
    const end = active.selectionEnd ?? active.value.length
    const before = active.value.slice(0, start)
    const after = active.value.slice(end)
    active.value = `${before}${note}${after}`
    const cursor = start + note.length
    active.selectionStart = cursor
    active.selectionEnd = cursor
    active.dispatchEvent(new Event('input', { bubbles: true }))
    return { success: true }
  }

  if (active.isContentEditable) {
    const selection = window.getSelection()
    if (!selection) {
      return { success: false, message: 'Unable to access current selection.' }
    }
    selection.deleteFromDocument()
    selection.getRangeAt(0).insertNode(document.createTextNode(note))
    selection.collapseToEnd()
    return { success: true }
  }

  return { success: false, message: 'Focused element is not editable.' }
}
