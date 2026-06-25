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

test('validate: rejects tampered storage with non-boolean flags', () => {
  const tampered = { ...ctrlK, ctrl: 'yes' } as unknown as Settings;
  assert.equal(validate(tampered), false);
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
