# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Browser extension (Manifest V3) that focuses search inputs on any webpage via Ctrl+K / Cmd+K. Runs as a content script injected into all pages. No background script or popup — just a single content script.

## Build & Dev Commands

- `npm run build` — Build with esbuild (bundles `src/index.ts` → `dist/index.js`, copies `manifest.json` to `dist/`)
- `npm run dev` — Watch mode with `tsc --watch` + `web-ext run` for Firefox live reload
- No test suite currently configured

## Architecture

Single-file extension: `src/index.ts` contains everything:
1. **CSS injection** — Creates a `<style>` element with neon glow animation classes
2. **Keyboard listener** — Captures Ctrl+K/Cmd+K, finds search input, focuses it with glow effect
3. **Search input detection** (`findSearchInput()`) — Tries an extensive ordered list of CSS selectors (standard HTML5, ARIA, i18n variants, framework-specific, e-commerce patterns). Prioritizes visible elements, falls back to hidden ones with aggressive focus techniques
4. **Visibility check** (`isElementVisible()`) — Filters candidates by computed style and dimensions

## Build System

`build.js` uses esbuild directly (not tsc) to bundle for browser (IIFE format, ES2017 target). The `tsconfig.json` is used by the dev command and editor tooling but not the production build.

## Loading the Extension

Load `dist/` folder as an unpacked extension in Chrome (`chrome://extensions/`) or as a temporary add-on in Firefox (`about:debugging`).

## Key Conventions

- Search selectors include Finnish ("hae", "etsi", "hakusana"), Swedish ("sök"), German ("suche"), French ("recherche"), and Spanish ("buscar") translations
- The selector list order matters — more specific/reliable selectors come first
