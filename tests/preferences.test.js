import test from 'node:test';
import assert from 'node:assert/strict';
import { readPreference, writePreference, removePreference } from '../src/preferences.js';
test('blocked browser storage does not crash or falsely report a save', () => {
 Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('blocked'); } });
 assert.equal(readPreference('camera'), null);
 assert.equal(writePreference('camera', '{}'), false);
 assert.equal(removePreference('camera'), false);
 delete globalThis.localStorage;
});
test('preferences round trip and removal', () => {
 const values = new Map(); globalThis.localStorage = { getItem:k => values.get(k) ?? null, setItem:(k,v) => values.set(k,v), removeItem:k => values.delete(k) };
 assert.equal(writePreference('review', 'Demo'), true); assert.equal(readPreference('review'), 'Demo'); assert.equal(removePreference('review'), true); assert.equal(readPreference('review'), null); delete globalThis.localStorage;
});
