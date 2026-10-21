<div align="center">

<img src="assets/icons/icon128.png" width="96" alt="Melhorar Mensagem icon" />

# ✨ Melhorar Mensagem (Improve Message)

**Improve your messages with AI right where you write them.**
Select the text → right-click → pick a style → the text is replaced in place.

🆓 On-device AI (Chrome 138+, no API key) · 🔑 or your favorite API (OpenAI, Groq, OpenRouter, Ollama…)

[![pt-BR](https://img.shields.io/badge/lang-pt--BR-purple)](README.md) [![en](https://img.shields.io/badge/language-English-purple)](README.en.md) [![Chrome 138+](https://img.shields.io/badge/Chrome-138%2B-4285F4?logo=googlechrome&logoColor=white)] [![Firefox 142+](https://img.shields.io/badge/Firefox-142%2B-FF7139?logo=firefox&logoColor=white)] [![Manifest V3](https://img.shields.io/badge/manifest-3.0-blueviolet)] [![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

</div>

---

## 🖼️ In action

![](docs/img/uso-menu.png)

*Sloppily typed sentence? Context menu, one click, text replaced.*

---

## 🤔 Why this extension exists

The daily routine used to be: type a messy sentence, open ChatGPT, paste, ask for a fix, copy back, paste into the field. Now it is: **select, right-click, pick a style. One and a half seconds, done.**

## ✨ What it does

- **Context menu on editable fields** (Gmail, WhatsApp Web, web forms, `<textarea>`, `<input>`, contenteditable — including inside iframes).
- **4 writing styles** in the right-click submenu:
  - ✨ **Improve message (default)** — fix and make professional
  - 🎩 **More formal** — tone suited for clients and managers
  - ✂️ **Shorter** — cut the fluff, keep what matters and the politeness
  - 🔤 **Grammar only** — conservative, changes as little as possible
- **Replacement that preserves undo** (uses `execCommand('insertText')` so Ctrl+Z keeps working).
- **Non-intrusive feedback**: a discreet toast ("Improving…", success, errors with clear guidance).
- **Zero signup to start**: on Chrome 138+ it uses the **Gemini Nano model that downloads to your computer** — no key, no cloud, offline after the first download.
- **Privacy**: the API key is stored only in your browser; there is no server between you and the provider.

<div align="center">

| First-run setup | Full options |
| --- | --- |
| ![](docs/img/config-inicial.png) | ![](docs/img/opcoes.png) |

</div>

---

## 📦 Install

### Chrome / Edge / Brave

```bash
git clone https://github.com/dnsouzadev/melhorar-mensagem.git
cd melhorar-mensagem
python3 build.py          # builds dist/chrome and dist/firefox
```

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. **Load unpacked** → pick the `dist/chrome` folder
4. The first-run setup wizard opens automatically 🎉

### Firefox

1. Open `about:debugging#/runtime/this-firefox`
2. **Load Temporary Add-on…** → `dist/firefox/manifest.json`

Temporary installs expire when the browser closes. For daily use, submit `dist/firefox.zip` to [self-distribution signing on AMO](https://addons.mozilla.org/developers/addon/submit/) (free) and install the signed `.xpi`.

> ℹ️ Firefox has no on-device AI option; the wizard suggests **Groq** (free) there instead.

---

## ⚙️ Configuration

The first-run wizard asks **how you want the AI to work**:

| Provider | Cost | Key |
| --- | --- | --- |
| **On-device browser AI** (default) | 🆓 free, runs on your PC | — |
| **Groq** | 🆓 generous free tier | console.groq.com/keys |
| **OpenAI** | pay per use (separate from the ChatGPT subscription) | platform.openai.com/api-keys |
| **OpenRouter** | many models, some free | openrouter.ai/keys |
| **Ollama** | 🆓 fully offline | — |
| **Custom** | any OpenAI-compatible endpoint | your own service |

### On-device AI (recommended on Chrome)

Uses Chrome's [Prompt API](https://developer.chrome.com/docs/ai/prompt-api) with **local Gemini Nano**. Requirements:

- Chrome **138+** (Windows 10/11, macOS 13+, Linux)
- **22 GB** free disk space (volume that hosts the Chrome profile)
- **16 GB RAM** (4+ cores) **or a GPU with 4+ GB VRAM**
- Unmetered internet **only for the first download**

If a **“Download model”** button appears on the options page/wizard, click it and follow the percentage. After that it works offline. Internal status: `chrome://on-device-internals`.

### Ollama (optional)

Ollama blocks unknown origins by default; start the server allowing extension origins:

```bash
OLLAMA_ORIGINS="chrome-extension://* moz-extension://*" ollama serve
```

---

## 🕹️ Usage

1. Write your message (typos welcome 😉)
2. **Select the parts** you want revised
3. Right-click → **✨ Melhorar mensagem** → pick a style
4. Review and send. *Not happy?* **Ctrl+Z undoes it.**

A confirmation toast appears at the bottom of the screen; errors explain the cause ("Invalid API key", "Rate limit reached"…) and what to do.

---

## 🩺 Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| "Invalid or missing API key" | Wrong/expired key or provider changed in Options |
| "Could not connect to the API" | Network, wrong URL, or Ollama without `OLLAMA_ORIGINS` |
| "The AI took too long" | Provider overload — try again |
| Menu does not appear | The click was not inside an editable field, or the page is internal (`chrome://…`) |
| Menu missing after editing code | Reload the extension (Chrome: 🔄 in `chrome://extensions`; Firefox: Reload in `about:debugging`) |
| On-device AI "unavailable" | Chrome below 138 or hardware outside requirements |

---

## 🛠️ Development

```
manifest.json          base manifest (Chrome, hand-written)
manifest.firefox.json  Firefox manifest (hand-written; gecko/MV3)
background.js          context submenu, wizard launcher, on-device AI fallback
content.js             captures the selection, calls the AI, replaces the text
options.html/js        full settings (provider, key, model, connection test)
onboarding.html/js     first-run setup wizard
build.py               copies files into dist/ and packages the zips (no code generation)
docs/img               screenshots used in the READMEs
```

- **Demo mode**: opening `options.html` or `onboarding.html` directly in a browser (without the extension installed) emulates `chrome.storage` and `LanguageModel` — handy for tweaking the layout and capturing screenshots.
- **Releasing a version** (SemVer + git tags):

```bash
# 1. update "version" in manifest.json
# 2. record the change in CHANGELOG.md
git commit -am "v0.5.1: description"
git tag -a v0.5.1 -m "summary"
git push origin master --tags
python3 build.py
```

### Engineering notes

- One **single codebase** for both browsers; both manifests (`manifest.json`, `manifest.firefox.json`) are hand-written and `build.py` only copies files and packages the zips.
- Replacement uses `document.execCommand("insertText")` **because it preserves undo**; a manual fallback (without undo) covers browsers that drop that legacy API.
- On-device AI has a **double fallback**: it tries the content script frame first, then delegates to the service worker (which caches the session).

---

## 🗺️ Roadmap

- [ ] Popup with a preview before replacing (accept/discard)
- [ ] Keyboard shortcut (e.g. Alt + M)
- [x] Menu styles — v0.4.0
- [x] On-device browser AI — v0.2.0
- [x] First-run setup — v0.3.0
- [ ] Store publishing (Chrome Web Store, AMO)

Have an idea? Issues and PRs are welcome!

---

## 🧠 Privacy

- The selected text is sent **only to the provider you chose** (local for on-device AI or Ollama).
- Keys live in `chrome.storage` inside your browser; **nothing** is sent to third parties.
- The extension collects no history, injects no tracking and has no telemetry.

---

## 📄 License

[MIT](LICENSE) — © 2026 <a href="https://github.com/dnsouzadev">dnsouzadev</a>
