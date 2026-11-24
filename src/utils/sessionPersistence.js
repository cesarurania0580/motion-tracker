// Where student work is kept between page loads.
//
// - The live autosave lives in sessionStorage: it survives a refresh or a crash
//   in the same tab, but a newly opened tab or browser starts clean.
// - A recovery copy lives in localStorage for RECOVERY_TTL_MS. It is never
//   loaded on its own; the welcome dialog offers it as an opt-in.
// - Preferences (language) are kept apart from work so they still carry over.
export const SESSION_KEY = 'physTracker_session';
export const RECOVERY_KEY = 'physTracker_recovery';
export const PREFS_KEY = 'physTracker_prefs';
export const LEGACY_KEY = 'physTracker_autosave';
export const RECOVERY_TTL_MS = 24 * 60 * 60 * 1000;

// Resolved at call time so a blocked or missing storage area never breaks loading.
export function storageArea(name) {
  try {return globalThis[name] || null;} catch {return null;}
}

function readJson(area, key) {
  try {
    const raw = area?.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {return null;}
}
function remove(area, key) {
  try {area?.removeItem?.(key);} catch {/* storage unavailable */}
}

// Same notion of "work worth restoring" the welcome dialog uses.
export function hasWork(data) {
  if (!data || typeof data !== 'object') return false;
  const points = (Array.isArray(data.objects) && data.objects.some(o => o?.points?.length > 0)) ||
    (Array.isArray(data.points) && data.points.length > 0);
  return Boolean(points || data.origin || data.lineProfile || data.pixelsPerMeter || data.wavelengthCalibration);
}

function freshRecovery(entry, now) {
  return entry && Number.isFinite(entry.savedAt) && entry.savedAt <= now &&
    now - entry.savedAt < RECOVERY_TTL_MS && hasWork(entry.data);
}

// Reads what a page load should start from. Saves from older versions move to
// the recovery copy instead of loading automatically.
export function readStartup({session = storageArea('sessionStorage'), local = storageArea('localStorage'), now = Date.now()} = {}) {
  const legacy = readJson(local, LEGACY_KEY);
  if (legacy) {
    if (hasWork(legacy)) {
      try {local.setItem(RECOVERY_KEY, JSON.stringify({savedAt: now, data: legacy}));} catch {/* storage unavailable */}
    }
    remove(local, LEGACY_KEY);
  }
  const prefs = readJson(local, PREFS_KEY) || (legacy?.language ? {language: legacy.language} : {});
  const data = readJson(session, SESSION_KEY);
  const entry = readJson(local, RECOVERY_KEY);
  const recoveryFresh = freshRecovery(entry, now);
  if (entry && !recoveryFresh) remove(local, RECOVERY_KEY);
  // A refreshed tab already holds its work, so recovery is only offered to a new session.
  const recoverySavedAt = !hasWork(data) && recoveryFresh ? entry.savedAt : null;
  return {data, prefs, recoverySavedAt};
}

export function readRecovery({local = storageArea('localStorage'), now = Date.now()} = {}) {
  const entry = readJson(local, RECOVERY_KEY);
  return freshRecovery(entry, now) ? entry.data : null;
}

// Throws when the live autosave cannot be written, so the caller can report it.
// The recovery copy is only replaced once this session has its own work, so
// opening the app does not erase what a student might still want to recover.
export function writeAutosave(data, {session = storageArea('sessionStorage'), local = storageArea('localStorage'), now = Date.now()} = {}) {
  if (!session) throw new Error('sessionStorage unavailable');
  session.setItem(SESSION_KEY, JSON.stringify(data));
  try {
    if (local && hasWork(data)) local.setItem(RECOVERY_KEY, JSON.stringify({savedAt: now, data}));
    if (local && data.language) local.setItem(PREFS_KEY, JSON.stringify({language: data.language}));
  } catch {/* the live autosave succeeded; recovery is best effort */}
}

export function clearWork({session = storageArea('sessionStorage'), local = storageArea('localStorage')} = {}) {
  remove(session, SESSION_KEY);
  remove(local, RECOVERY_KEY);
  remove(local, LEGACY_KEY);
}

// "2 hours ago" / "hace 2 horas", for the welcome dialog's recovery link.
export function savedAgo(savedAt, language = 'en', now = Date.now()) {
  const minutes = Math.max(0, Math.round((now - savedAt) / 60000));
  const format = new Intl.RelativeTimeFormat(language === 'es' ? 'es' : 'en', {numeric: 'auto'});
  if (minutes < 1) return language === 'es' ? 'hace un momento' : 'just now';
  if (minutes < 60) return format.format(-minutes, 'minute');
  return format.format(-Math.round(minutes / 60), 'hour');
}
