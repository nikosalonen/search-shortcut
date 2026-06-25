# Configurable Shortcut Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users change the keyboard shortcut and toggle the glow animation via an in-extension options page, with settings stored per-device and applied live to open tabs.

**Architecture:** A shared `src/settings.ts` module is the single source of truth for the `Settings` type, defaults, validation, event-matching, and `chrome.storage.local` access. The content script (`src/index.ts`) reads settings and subscribes to changes; a new options page (`src/options.html` + `src/options.ts`) edits them. No background service worker is added.

**Tech Stack:** TypeScript (bundled by esbuild → IIFE), Manifest V3, `chrome.storage.local`, Node 24 built-in test runner (`node --test`) with native TypeScript type-stripping.

## Global Constraints

- Node version: **24** (per `.nvmrc`); tests rely on Node 24's default TypeScript type-stripping — no transpiler dependency.
- **No new runtime or build dependencies.** Tests use the built-in `node:test` / `node:assert`. (No `@types/chrome`, no `tsx`, etc.)
- Modifier model is **literal**: `ctrl` and `meta` are distinct; matching is exact (every modifier boolean must equal the event's, plus the key).
- Storage area is **`chrome.storage.local`** (per-device), key name `settings`.
- Default shortcut is **platform-aware**: Mac → `Cmd+K` (`meta:true`), otherwise `Ctrl+K` (`ctrl:true`); `glow:true`.
- `manifest.json` must remain **`web-ext lint` clean** (0 errors, 0 warnings). It currently contains `manifest_version`, `name`, `version: "1.0.0"`, `description`, `content_scripts` (matches `<all_urls>`, js `index.js`), and `browser_specific_settings.gecko` with `id` + `data_collection_permissions.required: ["none"]`.
- Cross-browser storage access uses the **callback form** of `chrome.storage.*` (supported by both Chrome and Firefox); no `browser`/`chrome` detection.
- The production build is esbuild (`build.js`); `tsconfig.json` is for type-checking/editor only and is set to `noEmit`.

---

### Task 1: Settings foundation (pure core + tooling + tests)

Creates the shared module's pure functions, the test setup, and the tooling changes (noEmit tsconfig, esbuild watch for dev, test + CI wiring) that the rest of the feature depends on. No `chrome` access yet — that arrives in Task 2.

**Files:**
- Create branch first (Step 0).
- Create: `src/settings.ts`
- Create: `src/settings.test.ts`
- Modify: `tsconfig.json`
- Modify: `build.js`
- Modify: `package.json:5-7` (scripts)
- Modify: `.github/workflows/ci.yml:22-25`

**Interfaces:**
- Produces (consumed by Tasks 2 & 3):
  - `interface Settings { key: string; ctrl: boolean; meta: boolean; alt: boolean; shift: boolean; glow: boolean }`
  - `interface KeyEventLike { key: string; ctrlKey: boolean; metaKey: boolean; altKey: boolean; shiftKey: boolean }`
  - `function pickPlatformDefault(platform: string): Settings`
  - `function defaultSettings(): Settings`
  - `function validate(s: Settings): boolean`
  - `function matches(e: KeyEventLike, s: Settings): boolean`
  - `function formatShortcut(s: Settings): string`

- [ ] **Step 0: Create a feature branch**

Run:
```bash
git checkout -b feat/configurable-shortcut
```

- [ ] **Step 1: Write the failing tests**

Create `src/settings.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  matches,
  validate,
  pickPlatformDefault,
  formatShortcut,
  type Settings,
  type KeyEventLike,
} from './settings.ts';

const ctrlK: Settings = { key: 'k', ctrl: true, meta: false, alt: false, shift: false, glow: true };

function ev(p: Partial<KeyEventLike>): KeyEventLike {
  return { key: '', ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, ...p };
}

test('matches: exact ctrl+k fires', () => {
  assert.equal(matches(ev({ key: 'k', ctrlKey: true }), ctrlK), true);
});

test('matches: ctrl+shift+k does NOT fire a ctrl+k binding', () => {
  assert.equal(matches(ev({ key: 'k', ctrlKey: true, shiftKey: true }), ctrlK), false);
});

test('matches: key compare is case-insensitive', () => {
  assert.equal(matches(ev({ key: 'K', ctrlKey: true }), ctrlK), true);
});

test('matches: meta instead of ctrl does not fire a ctrl binding', () => {
  assert.equal(matches(ev({ key: 'k', metaKey: true }), ctrlK), false);
});

test('validate: rejects a no-modifier combo', () => {
  assert.equal(validate({ ...ctrlK, ctrl: false }), false);
});

test('validate: rejects a modifier-only combo (empty key)', () => {
  assert.equal(validate({ ...ctrlK, key: '' }), false);
});

test('validate: accepts a valid combo', () => {
  assert.equal(validate(ctrlK), true);
});

test('pickPlatformDefault: mac -> meta, not ctrl', () => {
  const d = pickPlatformDefault('MacIntel');
  assert.equal(d.meta, true);
  assert.equal(d.ctrl, false);
});

test('pickPlatformDefault: non-mac -> ctrl, not meta', () => {
  const d = pickPlatformDefault('Win32');
  assert.equal(d.ctrl, true);
  assert.equal(d.meta, false);
});

test('formatShortcut: renders modifiers + uppercased key', () => {
  assert.equal(formatShortcut(ctrlK), 'Ctrl + K');
});
```

- [ ] **Step 2: Add the `test` script and update the `dev` script**

In `package.json`, replace the `scripts` block (`package.json:5-7`):
```json
  "scripts": {
    "build": "node build.js",
    "dev": "node build.js --watch & web-ext run --source-dir dist/",
    "test": "node --test \"src/**/*.test.ts\""
  },
```
(The `dev` change is required because Task 1 sets `noEmit` — `tsc --watch` no longer emits, so dev rebuilds via esbuild watch instead.)

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module './settings.ts'` / `settings.ts` does not exist.

- [ ] **Step 4: Create the settings module (pure functions only)**

Create `src/settings.ts`:
```ts
export interface Settings {
  key: string;
  ctrl: boolean;
  meta: boolean;
  alt: boolean;
  shift: boolean;
  glow: boolean;
}

export interface KeyEventLike {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
}

export function pickPlatformDefault(platform: string): Settings {
  const isMac = /mac/i.test(platform);
  return {
    key: 'k',
    ctrl: !isMac,
    meta: isMac,
    alt: false,
    shift: false,
    glow: true,
  };
}

export function defaultSettings(): Settings {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  const platform = nav.userAgentData?.platform ?? navigator.platform ?? '';
  return pickPlatformDefault(platform);
}

export function validate(s: Settings): boolean {
  if (!s || typeof s.key !== 'string' || s.key.length !== 1) return false;
  return s.ctrl || s.meta || s.alt || s.shift;
}

export function matches(e: KeyEventLike, s: Settings): boolean {
  return (
    e.ctrlKey === s.ctrl &&
    e.metaKey === s.meta &&
    e.altKey === s.alt &&
    e.shiftKey === s.shift &&
    e.key.toLowerCase() === s.key
  );
}

export function formatShortcut(s: Settings): string {
  const parts: string[] = [];
  if (s.ctrl) parts.push('Ctrl');
  if (s.meta) parts.push('Cmd');
  if (s.alt) parts.push('Alt');
  if (s.shift) parts.push('Shift');
  parts.push(s.key.length === 1 ? s.key.toUpperCase() : s.key);
  return parts.join(' + ');
}
```

- [ ] **Step 5: Configure tsconfig for noEmit + .ts imports**

In `tsconfig.json`, set `noEmit`, add `allowImportingTsExtensions`, and remove the now-unused `outDir`. The `compilerOptions` block becomes:
```json
  "compilerOptions": {
    "target": "ES2017",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS — 10 tests passing, 0 failing.

- [ ] **Step 7: Verify type-checking passes**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 8: Add esbuild watch support to build.js**

Replace the entire contents of `build.js`:
```js
const esbuild = require('esbuild');
const fs = require('node:fs');

const watch = process.argv.includes('--watch');

const buildOptions = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  outdir: 'dist',
  platform: 'browser',
  format: 'iife',
  target: 'es2017',
  minify: true,
};

function copyStatic() {
  fs.mkdirSync('dist', { recursive: true });
  fs.copyFileSync('manifest.json', 'dist/manifest.json');
}

async function run() {
  if (watch) {
    const ctx = await esbuild.context(buildOptions);
    await ctx.watch();
    copyStatic();
    console.log('esbuild: watching for changes...');
  } else {
    await esbuild.build(buildOptions);
    copyStatic();
  }
}

run().catch(() => process.exit(1));
```

- [ ] **Step 9: Verify the production build still works**

Run: `npm run build && ls dist/`
Expected: succeeds; `dist/` contains `index.js` and `manifest.json`.

- [ ] **Step 10: Wire tests into CI**

In `.github/workflows/ci.yml`, add an `npm test` step between `npm ci` and the type-check (current `ci.yml:22-25`):
```yaml
      - run: npm ci
      - run: npm test
      - run: npx tsc --noEmit
      - run: npm run build
```

- [ ] **Step 11: Commit**

```bash
git add src/settings.ts src/settings.test.ts tsconfig.json build.js package.json .github/workflows/ci.yml
git commit -m "feat: add settings module core with platform-aware shortcut defaults"
```

---

### Task 2: Content script reads settings (live)

Wires the content script to the settings module: replaces the hardcoded `Ctrl+K` check with `matches()`, gates the glow on `settings.glow`, adds live updates via `chrome.storage.onChanged`, adds the `chrome` storage glue to `settings.ts`, and declares the `storage` permission.

**Files:**
- Create: `src/browser-globals.d.ts`
- Modify: `src/settings.ts` (append storage helpers)
- Modify: `src/index.ts:1-50`
- Modify: `manifest.json`

**Interfaces:**
- Consumes (from Task 1): `Settings`, `KeyEventLike`, `defaultSettings`, `validate`, `matches`.
- Produces (consumed by Task 3):
  - `function loadSettings(): Promise<Settings>`
  - `function saveSettings(s: Settings): Promise<void>`
  - `function onSettingsChanged(cb: (s: Settings) => void): void`

- [ ] **Step 1: Add a minimal ambient type for the `chrome` storage API used**

Create `src/browser-globals.d.ts` (no new dependency; declares only what we call, callback form for cross-browser support):
```ts
declare const chrome: {
  storage: {
    local: {
      get(key: string, cb: (items: Record<string, unknown>) => void): void;
      set(items: Record<string, unknown>, cb?: () => void): void;
    };
    onChanged: {
      addListener(
        cb: (
          changes: Record<string, { newValue?: unknown; oldValue?: unknown }>,
          areaName: string,
        ) => void,
      ): void;
    };
  };
};
```

- [ ] **Step 2: Append storage helpers to `src/settings.ts`**

Add to the end of `src/settings.ts`:
```ts
const STORAGE_KEY = 'settings';

export function loadSettings(): Promise<Settings> {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.get(STORAGE_KEY, (items) => {
        const stored = items[STORAGE_KEY] as Settings | undefined;
        resolve(stored && validate(stored) ? stored : defaultSettings());
      });
    } catch {
      resolve(defaultSettings());
    }
  });
}

export function saveSettings(s: Settings): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: s }, () => resolve());
  });
}

export function onSettingsChanged(cb: (s: Settings) => void): void {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;
    const change = changes[STORAGE_KEY];
    if (!change) return;
    const next = change.newValue as Settings | undefined;
    if (next && validate(next)) cb(next);
  });
}
```

- [ ] **Step 3: Update the content script to use settings**

In `src/index.ts`, add this import as the new line 1 (above the existing top comment):
```ts
import {
  loadSettings,
  onSettingsChanged,
  defaultSettings,
  matches,
  type Settings,
} from './settings.ts';
```

Then, immediately after the style-injection `try { document.head.appendChild(style); } ...` block (currently ending at `src/index.ts:27`), insert the settings bootstrap:
```ts

// Load user settings; start from platform defaults so the shortcut works
// before storage resolves, then keep in sync with changes from the options page.
let currentSettings: Settings = defaultSettings();
loadSettings().then((s) => {
  currentSettings = s;
});
onSettingsChanged((s) => {
  currentSettings = s;
});
```

Then replace the entire keydown listener (currently `src/index.ts:30-50`) with:
```ts
document.addEventListener('keydown', (event) => {
  if (matches(event, currentSettings)) {
    event.preventDefault(); // Prevent default browser behavior

    const searchInput = findSearchInput();

    if (searchInput) {
      searchInput.focus();

      if (currentSettings.glow) {
        searchInput.classList.add('search-focus-pulse');

        const removePulse = () => {
          searchInput.classList.remove('search-focus-pulse');
          searchInput.removeEventListener('animationend', removePulse);
        };
        searchInput.addEventListener('animationend', removePulse);
      }
    }
  }
});
```

- [ ] **Step 4: Declare the `storage` permission in the manifest**

In `manifest.json`, add a `permissions` array after `description` (before `content_scripts`):
```json
  "description": "Focus on search input with keyboard shortcut",
  "permissions": ["storage"],
  "content_scripts": [
```

- [ ] **Step 5: Verify type-check and build**

Run: `npx tsc --noEmit && npm run build`
Expected: No type errors; build succeeds; `dist/index.js` regenerated.

- [ ] **Step 6: Verify nothing broke in the unit tests**

Run: `npm test`
Expected: PASS — still 10 tests passing (the pure-function tests are unaffected).

- [ ] **Step 7: Manual verification (load the extension)**

Load `dist/` as an unpacked extension in Chrome (`chrome://extensions/` → Developer mode → Load unpacked).
Expected: on any page, the default shortcut (`Ctrl+K`, or `Cmd+K` on Mac) focuses a search input with the glow animation — same behavior as before this feature.

- [ ] **Step 8: Commit**

```bash
git add src/browser-globals.d.ts src/settings.ts src/index.ts manifest.json
git commit -m "feat: drive content-script shortcut and glow from stored settings"
```

---

### Task 3: Options page

Adds the settings UI, wires it to `saveSettings`, registers it in the manifest, and teaches the build to bundle `options.ts` and copy `options.html`. After this task, changing the shortcut/glow in the options page updates open tabs live.

**Files:**
- Create: `src/options.html`
- Create: `src/options.ts`
- Modify: `manifest.json`
- Modify: `build.js`

**Interfaces:**
- Consumes (from Tasks 1 & 2): `loadSettings`, `saveSettings`, `defaultSettings`, `validate`, `formatShortcut`, `Settings`.

- [ ] **Step 1: Create the options page markup**

Create `src/options.html` (no inline script — MV3 CSP-safe; loads `options.js`):
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Search Focus — Options</title>
  <style>
    body { font: 14px/1.5 system-ui, sans-serif; max-width: 380px; margin: 24px auto; padding: 0 16px; }
    h1 { font-size: 18px; }
    .row { margin: 16px 0; }
    label { display: block; margin-bottom: 6px; font-weight: 600; }
    #shortcut { font: inherit; padding: 8px 12px; min-width: 160px; cursor: pointer; }
    #hint { color: #b00; min-height: 1.2em; margin: 6px 0 0; }
    #status { color: #2a7; margin-left: 8px; }
    .glow-row label { font-weight: 400; }
    #reset { background: none; border: none; color: #06c; cursor: pointer; padding: 0; }
  </style>
</head>
<body>
  <h1>Search Focus</h1>

  <div class="row">
    <label for="shortcut">Shortcut</label>
    <button id="shortcut" type="button">Ctrl + K</button>
    <p id="hint"></p>
  </div>

  <div class="row glow-row">
    <label><input type="checkbox" id="glow" /> Show glow animation</label>
  </div>

  <div class="row">
    <button id="reset" type="button">Reset to default</button>
    <span id="status"></span>
  </div>

  <script src="options.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create the options page logic**

Create `src/options.ts`:
```ts
import {
  loadSettings,
  saveSettings,
  defaultSettings,
  validate,
  formatShortcut,
  type Settings,
} from './settings.ts';

const shortcutBtn = document.getElementById('shortcut') as HTMLButtonElement;
const hint = document.getElementById('hint') as HTMLParagraphElement;
const glowBox = document.getElementById('glow') as HTMLInputElement;
const resetBtn = document.getElementById('reset') as HTMLButtonElement;
const statusEl = document.getElementById('status') as HTMLSpanElement;

let settings: Settings = defaultSettings();
let recording = false;

function render(): void {
  shortcutBtn.textContent = recording ? 'Press keys…' : formatShortcut(settings);
  glowBox.checked = settings.glow;
}

async function persist(): Promise<void> {
  await saveSettings(settings);
  statusEl.textContent = 'Saved ✓';
  setTimeout(() => {
    statusEl.textContent = '';
  }, 1500);
}

loadSettings().then((s) => {
  settings = s;
  render();
});

shortcutBtn.addEventListener('click', () => {
  recording = true;
  hint.textContent = 'Press a key combo with at least one modifier. Esc to cancel.';
  render();
});

document.addEventListener('keydown', (e) => {
  if (!recording) return;
  e.preventDefault();

  if (e.key === 'Escape') {
    recording = false;
    hint.textContent = '';
    render();
    return;
  }

  // Ignore presses that are only a modifier key.
  if (['Control', 'Meta', 'Alt', 'Shift'].includes(e.key)) return;

  const candidate: Settings = {
    ...settings,
    key: e.key.toLowerCase(),
    ctrl: e.ctrlKey,
    meta: e.metaKey,
    alt: e.altKey,
    shift: e.shiftKey,
  };

  if (!validate(candidate)) {
    hint.textContent = 'Need at least one modifier (Ctrl/Cmd/Alt/Shift) plus a single key.';
    return;
  }

  settings = candidate;
  recording = false;
  hint.textContent = '';
  render();
  void persist();
});

glowBox.addEventListener('change', () => {
  settings = { ...settings, glow: glowBox.checked };
  void persist();
});

resetBtn.addEventListener('click', () => {
  settings = defaultSettings();
  render();
  void persist();
});
```

- [ ] **Step 3: Register the options page in the manifest**

In `manifest.json`, add after the `content_scripts` array (before `browser_specific_settings`):
```json
  "options_ui": {
    "page": "options.html",
    "open_in_tab": true
  },
```

- [ ] **Step 4: Teach the build to bundle options.ts and copy options.html**

In `build.js`, add `src/options.ts` to `entryPoints` and copy the HTML in `copyStatic`:
```js
const buildOptions = {
  entryPoints: ['src/index.ts', 'src/options.ts'],
  bundle: true,
  outdir: 'dist',
  platform: 'browser',
  format: 'iife',
  target: 'es2017',
  minify: true,
};

function copyStatic() {
  fs.mkdirSync('dist', { recursive: true });
  fs.copyFileSync('manifest.json', 'dist/manifest.json');
  fs.copyFileSync('src/options.html', 'dist/options.html');
}
```

- [ ] **Step 5: Verify type-check and build**

Run: `npx tsc --noEmit && npm run build && ls dist/`
Expected: no type errors; build succeeds; `dist/` contains `index.js`, `options.js`, `options.html`, `manifest.json`.

- [ ] **Step 6: Verify the manifest is still lint-clean**

Run: `npx web-ext lint --source-dir dist/ --self-hosted`
Expected: 0 errors, 0 warnings, 0 notices.

- [ ] **Step 7: Verify unit tests still pass**

Run: `npm test`
Expected: PASS — 10 tests passing.

- [ ] **Step 8: Manual verification (end-to-end)**

Reload the unpacked extension. Right-click the extension → Options (or `chrome://extensions/` → Details → Extension options).
Expected:
1. The page shows the current shortcut and glow state.
2. Click the shortcut button, press e.g. `Ctrl+/` → it records and shows "Saved ✓".
3. On an already-open tab, `Ctrl+/` now focuses search and the old `Ctrl+K` no longer does (live update, no reload).
4. Unchecking "Show glow animation" → focusing search no longer pulses.
5. "Reset to default" restores `Ctrl+K` / `Cmd+K` and glow on.

- [ ] **Step 9: Update README usage/docs**

In `README.md`, update the Usage section to mention configurability and add the options page to the project structure. Add after the existing Usage steps:
```markdown
### Changing the shortcut

Open the extension's options page (right-click the extension icon → **Options**, or
`chrome://extensions/` → **Details** → **Extension options**). Click the shortcut
field, press your preferred combination (at least one modifier plus a key), and it
saves automatically. You can also toggle the glow animation or reset to the default.
```
And in the Project Structure block, add under `src/`:
```markdown
│   ├── settings.ts    # Shared settings: type, defaults, validation, matching, storage
│   ├── options.html   # Options page markup
│   └── options.ts     # Options page logic
```

- [ ] **Step 10: Commit**

```bash
git add src/options.html src/options.ts manifest.json build.js README.md
git commit -m "feat: add options page to configure shortcut and glow"
```

---

## Self-Review

**Spec coverage:**
- Custom options page → Task 3. ✓
- Shortcut + glow toggle configurable → Task 3 (UI), Task 2 (glow gating). ✓
- Literal modifiers, exact match → `matches()` Task 1, tested. ✓
- Platform-aware defaults → `pickPlatformDefault`/`defaultSettings` Task 1, tested. ✓
- `chrome.storage.local`, key `settings` → Task 2 storage helpers. ✓
- Live update via `storage.onChanged` → Task 2 `onSettingsChanged` + content-script subscription. ✓
- Validation (≥1 modifier + one key, fallback to defaults) → `validate()` Task 1; fallback in `loadSettings` Task 2. ✓
- Edge cases (storage fail→defaults, glow off, lowercase key) → Task 2 (`try/catch`, glow gate), Task 1 (`toLowerCase`). ✓
- Minimal `node:test` setup + CI wiring → Task 1. ✓
- Build changes (options entry, copy html) + manifest (`options_ui`, `storage`) → Tasks 2 & 3. ✓
- README update → Task 3 Step 9. ✓
- `web-ext lint` clean → Task 3 Step 6. ✓

**Placeholder scan:** No TBD/TODO/"handle edge cases" placeholders; every code step contains full code.

**Type consistency:** `Settings` / `KeyEventLike` shapes and the signatures of `matches`, `validate`, `pickPlatformDefault`, `defaultSettings`, `formatShortcut`, `loadSettings`, `saveSettings`, `onSettingsChanged` are identical across the module definition (Tasks 1–2) and all consumers (Tasks 2–3). Storage key string `settings` matches between `saveSettings`, `loadSettings`, and `onSettingsChanged`. CSS class `search-focus-pulse` matches the existing stylesheet.
