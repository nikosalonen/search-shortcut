# Configurable Shortcut Settings — Design

**Date:** 2026-06-25
**Status:** Approved (pending implementation plan)

## Summary

Let users change the keyboard shortcut (currently hardcoded `Ctrl+K` / `Cmd+K`) and
toggle the neon glow animation, via a small options page inside the extension.
Settings are stored per-device in `chrome.storage.local` and take effect live on
already-open tabs.

## Goals

- User-configurable shortcut: any combination of modifiers + one main key.
- User-toggleable glow animation.
- No regression to the current "one content script" simplicity beyond what the
  feature strictly requires (one options page + `storage` permission; **no**
  background service worker).
- Settings apply to open tabs immediately, without reload.

## Non-goals

- Cross-device sync of settings (explicitly using `storage.local`, not `sync`).
- A master enable/disable toggle for the whole extension.
- Per-site configuration.
- Native browser shortcut rebinding (the `commands` API) — rejected because it
  would require a background service worker and message passing.

## Decisions (from brainstorming)

| Decision | Choice | Rationale |
|---|---|---|
| Where users change the shortcut | Custom options page | Settings live "in the extension"; no background worker needed |
| What is configurable | Shortcut + glow toggle | Matches "simple settings"; glow is a cheap addition |
| Modifier model | **Literal** (Ctrl ≠ Cmd) | Intuitive "press your keys"; exact matching |
| Storage | `chrome.storage.local` | Per-device — a literal Cmd+K shouldn't sync to a Windows machine |
| Tests | Add minimal `node:test` setup | Pure-function core is worth covering; zero new deps |

## Architecture & Files

Current architecture is a single content script with no background/popup/options.
This feature adds exactly one new surface (an options page) and the `storage`
permission.

| File | Change |
|---|---|
| `src/settings.ts` | **New.** Shared single source of truth: `Settings` type, `DEFAULTS`, `pickPlatformDefault()`, `validate()`, `matches(event, settings)`, `loadSettings()`, `onSettingsChanged()`. Imported by both the content script and the options page. |
| `src/options.html` | **New.** Settings UI (shortcut capture field + glow checkbox + reset link). |
| `src/options.ts` | **New.** Wires the UI to `chrome.storage.local`: keystroke capture, validation, save with confirmation, reset. |
| `src/index.ts` | **Changed.** Replace hardcoded `(ctrlKey || metaKey) && key === 'k'` with `matches(event, currentSettings)`; load settings at startup; subscribe to `onSettingsChanged`; gate the glow class on `settings.glow`. |
| `manifest.json` | **Changed.** Add `"options_ui": { "page": "options.html", "open_in_tab": true }` and `"permissions": ["storage"]`. |
| `build.js` | **Changed.** Add a second esbuild entry (`src/options.ts` → `dist/options.js`); copy `options.html` → `dist/`. |
| `tsconfig.json` | Already `module: ESNext` + `moduleResolution: bundler` — supports the new imports. No change expected. |
| `package.json` | Add `"test"` script running `node --test`. |
| `.github/workflows/ci.yml` | Add an `npm test` step. |

**Permission impact:** adds `storage` only (low sensitivity, no new host access). Does
not worsen store review beyond the existing `<all_urls>`.

## Data Model

```ts
type Settings = {
  key: string;     // single main key, lowercased — e.g. "k", "/", "."
  ctrl: boolean;
  meta: boolean;   // Cmd on Mac, Win/Super key elsewhere
  alt: boolean;
  shift: boolean;
  glow: boolean;   // neon pulse animation on/off
};
```

- **Defaults** are platform-aware on first run, preserving today's behavior until
  customized: Mac → `Cmd+K` (`meta:true`), otherwise `Ctrl+K` (`ctrl:true`); `glow:true`.
  Platform detected via `navigator.userAgentData?.platform` with a `navigator.platform`
  fallback.
- Stored under a single key (e.g. `settings`) in `chrome.storage.local`.

## Behavior

### Matching (content script)
`matches(event, settings)` is a pure function:
- Every modifier must equal its stored boolean **exactly** (`event.ctrlKey === settings.ctrl`,
  same for `meta`, `alt`, `shift`) — so `Ctrl+K` does **not** fire on `Ctrl+Shift+K`.
- `event.key.toLowerCase() === settings.key`.
- On a match: `preventDefault()`, find the search input, focus it, and (if
  `settings.glow`) add the `search-focus-pulse` class. `preventDefault()` only fires
  on a real match.

### Live update
`src/index.ts` loads settings once at startup into a module-level variable and
registers `chrome.storage.onChanged`. The `keydown` handler reads the current value
on each event, so changes apply immediately to open tabs.

### Options page
- Shortcut field shows the current combo (e.g. `Ctrl + K`). Click → "recording"
  mode → next valid keydown is captured. `Esc` cancels.
- Invalid captures (modifier-only, or no modifier) are rejected with an inline hint.
- "Show glow animation" checkbox.
- Saves to `chrome.storage.local` on change, with a "Saved ✓" confirmation.
- "Reset to default" restores platform defaults.

### Validation
`validate(settings)` requires **at least one modifier true** and **exactly one main
key**. This prevents binding a bare `k` that would hijack all typing. Invalid or
missing stored data falls back to `DEFAULTS`.

### Edge cases
- Storage read fails / empty → `DEFAULTS`.
- Glow off → never add the pulse class.
- `event.key` normalized to lowercase before compare/store.

## Testing

The repo currently has no test runner. Add a minimal one using Node's built-in
`node:test` (zero new dependencies):
- `matches(event, settings)` — exact-match semantics, including the
  `Ctrl+K` ≠ `Ctrl+Shift+K` case.
- `validate(settings)` — rejects modifier-only and no-modifier combos; accepts valid ones.
- `pickPlatformDefault(platformString)` — Mac → meta, else ctrl.

Wire `npm test` (`node --test`) into `ci.yml` alongside the existing
`tsc --noEmit` and `npm run build` steps.

## Build

- `build.js` gains a second esbuild entry point for `src/options.ts` → `dist/options.js`
  (same browser/IIFE/ES2017 settings as the content script) and copies `options.html`
  → `dist/`.
- `manifest.json` references `options.html` (which loads `options.js`) and declares
  the `storage` permission.

## Out of scope / future

- Icons (16/48/128) for store publishing — tracked separately; not part of this feature.
- Cross-device sync, per-site rules, master on/off toggle.
