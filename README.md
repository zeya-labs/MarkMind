# MarkMind — Firefox and Chinese language fork

[简体中文](README.zh-CN.md) · [Privacy / 隐私说明](PRIVACY.md) · [Upstream project](https://github.com/migsilva89/MarkMind)

<img src="./assets/readme/logo.png" alt="MarkMind logo" width="96" height="96">

This fork of [migsilva89/MarkMind](https://github.com/migsilva89/MarkMind) adds a Firefox build and an English / Simplified Chinese interface. The original MarkMind project and design are by [migsilva89](https://github.com/migsilva89).

## What changes in 2.1.0

- Separate browser packages: Chromium uses Manifest V3 with a service worker; Firefox uses Manifest V2 with a persistent module background page so long AI requests continue when the popup closes.
- Firefox bookmark roots, read-only system folders, and separators are handled without treating them as ordinary destination folders.
- An always-available language selector: follow the browser, English, or Simplified Chinese. The choice is saved in extension-local storage.
- Settings, onboarding, scan, review, duplicate cleanup, progress, and common errors are translated.
- AI requests ask for new folder names, descriptions, and summaries in the selected language. Existing folder names, bookmark titles, URLs, and IDs remain unchanged.
- Existing providers remain supported: Gemini, OpenAI, Anthropic, OpenRouter, and custom OpenAI-compatible endpoints such as Ollama and LM Studio.

## Browser support and installation

| Browser | Build | Installation |
| --- | --- | --- |
| Firefox desktop 140 or later | Signed XPI from Releases | Install from file; stays installed after restart |
| Chrome / Chromium / Edge | dist/chromium | Developer mode, Load unpacked |

Firefox continues to support Manifest V2 alongside Manifest V3. The persistent background page is intentional: long-running AI requests must remain active while the popup is closed. See [Mozilla's extension platform explanation](https://blog.mozilla.org/en/firefox/firefox-manifest-v3-adblockers/) and the [background manifest reference](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/background).

**The release provides a Mozilla-signed Firefox XPI for self-distribution on GitHub. It is not publicly listed on Mozilla Add-ons (AMO).** The upstream Chrome Web Store listing belongs to the original project; it does not install this fork's changes.

### Firefox: install the signed release (recommended)

1. Download [markmind-firefox-2.1.0-signed.xpi](https://github.com/zeya-labs/MarkMind/releases/download/v2.1.0/markmind-firefox-2.1.0-signed.xpi) from the [v2.1.0 release](https://github.com/zeya-labs/MarkMind/releases/tag/v2.1.0). Do not extract the XPI.
2. Open about:addons in Firefox.
3. Open the gear menu and choose **Install Add-on From File…**.
4. Select the signed XPI, review Firefox's permission prompt, and confirm installation.
5. Open MarkMind from the extensions menu and select your language and provider.

The signed installation remains after Firefox restarts. Signing does not mean the extension has a public AMO listing. The signature applies to this exact release package: local builds and changed code need a separate Mozilla signature before permanent installation. See Mozilla's [signing documentation](https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview/).

### Firefox: temporarily load an unsigned development build

1. Download the Firefox ZIP from this fork's release, or build it locally.
2. Extract the ZIP to a directory you will keep.
3. Open Firefox and visit about:debugging#/runtime/this-firefox.
4. Choose **Load Temporary Add-on**, then select manifest.json inside the extracted directory. When building locally, choose dist/firefox/manifest.json.
5. Open MarkMind from the extensions menu and select your language and provider.

Temporary installation lasts until Firefox restarts. After a restart, load the same manifest again. The unsigned ZIP and unpacked local build are for testing / development; for ordinary use, install the signed release above. See Mozilla's [temporary installation documentation](https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/).

### Chromium / Edge: load the build

1. Open chrome://extensions or edge://extensions.
2. Enable **Developer mode**.
3. Choose **Load unpacked** and select dist/chromium.

## Organize existing bookmarks

1. Export a backup using your browser's bookmark manager.
2. Open MarkMind → **Organize** and scan your bookmarks.
3. Optionally review duplicate groups. Duplicate deletion is permanent in MarkMind; it does not provide an undo or complete backup.
4. Select the bookmarks to organize, including loose bookmarks outside folders.
5. Optionally choose a destination folder to keep the result inside that subtree.
6. Run the AI analysis, review the proposed destinations, and accept only the moves you want.
7. Apply the approved moves.

Analysis alone does not move bookmarks. Applying a plan moves the original bookmarks rather than making copies. If a move fails, previously completed moves are not automatically rolled back. Start with a small selection to check whether the proposed categories fit your collection.

You may close the popup while Firefox analyzes bookmarks and reopen it to see progress. Keep Firefox running and leave the extension enabled until the job finishes. Closing the browser or reloading the extension interrupts an active request; this is not a durable job that continues after the browser exits.

Bulk analysis uses bookmark titles, URLs, current folder paths, and folder context. It does not fetch and read every bookmarked page. Single-page analysis can additionally use the current page's description and main heading.

## Language settings

The language selector is available before provider setup, including on onboarding screens.

- **Follow browser / auto**: Chinese browser locales use Simplified Chinese; other locales use English.
- **English / en** and **简体中文 / zh-CN**: explicit choices saved locally.
- New AI-generated names and prose follow the selected language. Existing bookmark names and folder paths are preserved.
- Raw messages returned by external services may remain in their original language.

## AI providers

Choose a provider, enter its API key, load the available models, and select a model. API usage and available free quotas are determined by that provider; MarkMind does not include paid AI credits.

| Provider | API key |
| --- | --- |
| Google Gemini | [Google AI Studio](https://aistudio.google.com/apikey) |
| OpenAI | [OpenAI Platform](https://platform.openai.com/api-keys) |
| Anthropic | [Anthropic Console](https://console.anthropic.com/) |
| OpenRouter | [OpenRouter](https://openrouter.ai/keys) |
| Custom OpenAI-compatible endpoint | Depends on the server; local servers can use an empty key |

### Ollama and LM Studio

In Settings, choose **Custom**. Set the base URL to http://127.0.0.1:11434/v1 for Ollama or http://127.0.0.1:1234/v1 for LM Studio. Leave the key empty if your local server does not require one. Grant the extension access to that endpoint when the browser asks.

If Ollama rejects extension-origin requests with 403, configure its OLLAMA_ORIGINS environment variable to allow the extension's origin and restart Ollama. For development across both browser families:

~~~text
OLLAMA_ORIGINS=chrome-extension://*,moz-extension://*
~~~

In LM Studio, enable CORS if the local server rejects browser requests. Use HTTPS for remote endpoints; the extension permits plain HTTP only for loopback addresses. Local models receive smaller batches and longer timeouts, but speed and classification quality depend on the model and hardware.

## Data and privacy

AI analysis sends selected bookmark information and folder context directly to the provider you configure. API keys are sent to that provider for authentication. Settings, keys, cached model lists, and organize sessions are stored in browser-local extension storage, which is **not an encrypted password vault**.

This fork has no analytics or telemetry service and no MarkMind account or server. Provider data handling still applies, and browser / website resource requests are separate from AI requests. Read [PRIVACY.md](PRIVACY.md) before using private bookmarks or confidential page content.

## Build and verify

Use Node.js 22 and npm. From a fresh checkout:

~~~bash
git clone https://github.com/zeya-labs/MarkMind.git
cd MarkMind
npm ci
npm run lint
npm test
npm run build
npm run lint:firefox
npm run package:firefox
~~~

Build outputs:

- dist/chromium: unpacked Chromium / Edge extension.
- dist/firefox: unpacked Firefox extension, including manifest.json.
- artifacts/markmind-firefox-2.1.0.zip: unsigned Firefox package.

The signed XPI is a separate [release attachment](https://github.com/zeya-labs/MarkMind/releases/download/v2.1.0/markmind-firefox-2.1.0-signed.xpi), not an output of these local build commands. Building or changing the source does not preserve the release's Mozilla signature; modified packages must be signed again.

For development, npm run dev serves the Chromium extension. npm run build:firefox rebuilds only the Firefox target. A GitHub Actions template is included at tools/github-actions-ci.yml for lint, unit tests, both builds, validation, and packaging. It is not enabled: the publishing credential did not have the workflow scope. To enable it, copy the template to .github/workflows/ci.yml using credentials with workflow access. Its artifact remains unsigned.

### Real Firefox test

After building, run:

~~~bash
npm run test:firefox
~~~

The test uses headless Firefox, an independent temporary browser profile, fixture bookmarks, and a local mock AI endpoint. It checks Chinese startup, native bookmark scanning, scoped organization, keeping analysis alive with the popup closed, review before moving, preserved titles, and English preference persistence. It does not call a live AI provider or use personal API keys. Results and screenshots are written under test-results/.

Firefox and a compatible geckodriver must be available. Set FIREFOX_BINARY and GECKODRIVER when they cannot be discovered automatically. To exercise an AI response longer than 60 seconds, set FIREFOX_AI_DELAY_MS=65000. For example, in PowerShell:

~~~powershell
$env:FIREFOX_AI_DELAY_MS = '65000'
npm run test:firefox
Remove-Item Env:FIREFOX_AI_DELAY_MS
~~~

The CI template does not run this Selenium test; it runs the portable verification and packaging commands above.

To verify a signed release separately, run `node tools/verify-firefox-signature.mjs /path/to/addon.xpi`. It uses Firefox's signature verification, installs into a new isolated profile, and checks that the add-on remains active after restarting Firefox. It never uses your personal browser profile.

### Validation and dependency notes

npm run lint:firefox runs tools/lint-firefox.mjs. It rejects all errors and unexpected warnings. The only allowlist is UNSAFE_VAR_ASSIGNMENT warnings in the isolated React vendor chunk: the current build has two generic innerHTML warnings from React DOM. Application-code warnings are not allowlisted. A passing result therefore does not mean the raw web-ext report has zero warnings.

This version uses Vite 6.4.4, including its security fixes. The production dependency audit for the delivery lockfile reports zero vulnerabilities; development tooling still has moderate / low audit findings. Run npm audit --omit=dev and npm audit to inspect the current reports rather than assuming the entire development dependency tree is clean.

### Project layout

~~~text
src/components/          React interface
src/hooks/               UI and organize workflow state
src/i18n/                language preferences and translation dictionaries
src/services/            bookmark operations, sessions, AI providers
src/utils/               browser-root handling and common helpers
public/_locales/         native extension name / description translations
vite.firefox.config.ts  Firefox-specific build and manifest
~~~

## Credits and support

- Original project: [migsilva89/MarkMind](https://github.com/migsilva89/MarkMind).
- Original website: [markmind.xyz](https://markmind.xyz).
- Support the upstream author: [Buy me a coffee](https://buymeacoffee.com/migsilva?utm_source=github-markmind).
- Firefox / language fork issues: [zeya-labs/MarkMind](https://github.com/zeya-labs/MarkMind/issues).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

The upstream license declaration above is preserved. This fork does not create a replacement license file.
