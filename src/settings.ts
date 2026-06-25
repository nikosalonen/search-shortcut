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
  // Storage data is untrusted; reject anything whose flags aren't real booleans.
  if (
    typeof s.ctrl !== 'boolean' ||
    typeof s.meta !== 'boolean' ||
    typeof s.alt !== 'boolean' ||
    typeof s.shift !== 'boolean' ||
    typeof s.glow !== 'boolean'
  ) {
    return false;
  }
  return s.ctrl || s.meta || s.alt || s.shift;
}

export function matches(e: KeyEventLike, s: Settings): boolean {
  return (
    e.ctrlKey === s.ctrl &&
    e.metaKey === s.meta &&
    e.altKey === s.alt &&
    e.shiftKey === s.shift &&
    e.key.toLowerCase() === s.key.toLowerCase()
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
    try {
      chrome.storage.local.set({ [STORAGE_KEY]: s }, () => resolve());
    } catch {
      resolve();
    }
  });
}

export function onSettingsChanged(cb: (s: Settings) => void): void {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;
    const change = changes[STORAGE_KEY];
    if (!change) return;
    const next = change.newValue as Settings | undefined;
    // Ignore writes that don't parse/validate; keep the last-known-good settings.
    if (next && validate(next)) cb(next);
  });
}
