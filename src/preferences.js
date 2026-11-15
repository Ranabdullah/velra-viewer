// Browser settings are optional: private mode, quotas and damaged JSON must not
// stop the showroom or report a save that did not happen.
export function readPreference(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
export function writePreference(key, value) {
  try { localStorage.setItem(key, value); return true; } catch { return false; }
}
export function removePreference(key) {
  try { localStorage.removeItem(key); return true; } catch { return false; }
}
