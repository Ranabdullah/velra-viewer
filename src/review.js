import { readPreference, writePreference } from './preferences.js';

const status = document.getElementById('approval-status');
const button = document.getElementById('btn-confirm-sign');
const key = 'velra_handover_approved';
if (status) {
 status.setAttribute('role', 'status');
 status.setAttribute('aria-live', 'polite');
 const saved = readPreference(key);
 status.textContent = saved ? `LOCAL REVIEW SAVED: ${saved}` : 'No local review saved. Stored on this browser only; not a verified signature.';
}
button?.addEventListener('click', () => {
 if (!status) return;
 if (![...document.querySelectorAll('.signoff-checkbox')].every(cb => cb.checked)) {
  status.textContent = 'Review and tick every checklist item first.'; return;
 }
 const input = document.getElementById('sign-name');
 const name = input?.value.trim();
 if (!name) { status.textContent = 'Enter your name to save a local review.'; input?.focus(); return; }
 const record = `${name} on ${new Date().toLocaleString('en-IE')}`;
 status.textContent = writePreference(key, record)
  ? `LOCAL REVIEW SAVED: ${record}`
  : 'Review not saved: browser storage unavailable.';
});
