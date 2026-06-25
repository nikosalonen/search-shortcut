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
  shortcutBtn.classList.toggle('recording', recording);
  glowBox.checked = settings.glow;
}

async function persist(): Promise<void> {
  await saveSettings(settings);
  statusEl.textContent = 'Saved ✓';
  setTimeout(() => {
    statusEl.textContent = '';
  }, 1500);
}

loadSettings()
  .then((s) => {
    settings = s;
    render();
  })
  .catch((err) => {
    console.error('Failed to load settings:', err);
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
