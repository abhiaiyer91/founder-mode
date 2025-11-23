# Practice Fusion Companion (Chrome Extension)

This project packages a Chrome extension that recognizes structured data inside Practice Fusion (or any EHR with predictable DOM tags), summarizes each section, and generates a SOAP-style patient note you can drop directly into the chart.

The UI is a Vite + React popup, while background and content scripts are plain JavaScript shipped with the extension bundle. Everything runs locally inside the browser—no PHI leaves the page.

## Key features

- **Tag-based extraction** – Configure CSS selectors (e.g. `[data-pf-section="subjective"]`) to target the chart segments you care about.
- **On-device summarization** – A lightweight frequency-based algorithm condenses each section into a few sentences without calling external APIs.
- **SOAP note builder** – Automatically stitches the summaries into Subjective, Objective, Assessment, and Plan sections; edit before sending.
- **One-click insertion** – Sends the final note back into whatever text area is focused inside Practice Fusion (or copies to clipboard when running outside Chrome).
- **Persistent selector rules** – Stored with `chrome.storage.sync`, so the configuration follows you between Chrome profiles (and falls back to localStorage during development).

## Local development

```bash
npm install
npm run dev
```

`npm run dev` serves the popup UI at `http://localhost:5173`. Chrome APIs are unavailable in this mode, so the app switches to “Preview mode” and shows mocked summaries. Use it to adjust styling and selector management without loading the full extension.

## Build & load the extension

1. **Build assets**

   ```bash
   npm run build
   ```

   Vite outputs the popup bundle into `dist/`, while the manifest, background worker, and content script are copied verbatim from `public/`.

2. **Load in Chrome**
   - Open `chrome://extensions`
   - Enable **Developer mode**
   - Click **Load unpacked** and select the `dist` folder
   - Pin “Practice Fusion Companion” to the toolbar for quick access

3. **Test in Practice Fusion**
   - Navigate to a chart that includes the tags/configured selectors
   - Click the extension icon → **Scan current page**
   - Optionally tweak the generated note, then click **Insert into Practice Fusion** while a chart note field is focused

## Customizing selectors

1. Open the popup and use **Add selector** to define additional sections.
2. Provide:
   - **Label** – Display name in the UI and generated note.
   - **CSS selector** – Any valid selector; multiple selectors can be comma-separated.
   - **Category** – Determines which SOAP section receives the summary.
   - **Max sentences** – Cap for the summarizer per section (1–6 recommended).
3. Hit **Save selectors** (stored in `chrome.storage.sync`) to reuse the configuration next time.

## How it works

- `public/contentScript.js` listens for `SUMMARIZE_TAGS` and `INSERT_NOTE` messages:
  - It queries each selector, strips whitespace, and ranks sentences by TF-style word frequency.
  - Results travel back to the popup as `{ label, selector, rawText, summary }`.
  - When instructed to insert the note, the script writes into the active `<textarea>`, `<input>`, or `contenteditable` element and emits an `input` event to trigger Practice Fusion’s listeners.
- `public/background.js` seeds default selectors on install.
- `src/App.tsx` drives the popup workflow: selector management, summary display, SOAP assembly, clipboard support, and communication with the content script.

## Scripts

| Command       | Description                                    |
| ------------- | ---------------------------------------------- |
| `npm run dev` | Hot reload the popup UI (mocked Chrome APIs).  |
| `npm run lint`| ESLint across the repo.                        |
| `npm run build`| Type-check then create the Chrome extension bundle. |
| `npm run preview` | Preview the production popup bundle locally. |

## Notes & extensions

- Edit `public/manifest.json` if you need to restrict host permissions (e.g. only `https://*.practicefusion.com/*`).
- To integrate with an LLM or remote summarizer later, replace the frequency summarizer inside `public/contentScript.js` with a message to your backend—be mindful of HIPAA considerations.
- `public/contentScript.js` currently runs on every page; adjust `matches` or use `chrome.scripting.registerContentScripts` if you only want it active inside Practice Fusion.

Feel free to adapt the selector defaults or UI copy to match your clinic’s documentation workflow. Contributions welcome!
