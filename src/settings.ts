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
