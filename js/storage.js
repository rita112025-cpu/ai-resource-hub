// storage.js - namespaced localStorage with migration
const NS = 'ai-resource-hub';
export const KEYS = {
  astraFav: `${NS}:astra:favorites`,
  codexFav: `${NS}:codex:favorites`,
  codexInstalled: `${NS}:codex:installed`,
  theme: `${NS}:theme`,
  hub: `${NS}:hub`
};

function safeGet(key){
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeSet(key, val){
  try { localStorage.setItem(key, val); } catch(e){ console.warn('storage set failed', key, e); }
}
function parseSet(raw){
  try {
    const arr = JSON.parse(raw);
    if(Array.isArray(arr)) return new Set(arr);
  } catch {}
  return new Set();
}

export function getAstraFavorites(){
  return parseSet(safeGet(KEYS.astraFav));
}
export function setAstraFavorites(set){
  safeSet(KEYS.astraFav, JSON.stringify([...set]));
}
export function getCodexFavorites(){
  return parseSet(safeGet(KEYS.codexFav));
}
export function setCodexFavorites(set){
  safeSet(KEYS.codexFav, JSON.stringify([...set]));
}
export function getCodexInstalled(){
  return parseSet(safeGet(KEYS.codexInstalled));
}
export function setCodexInstalled(set){
  safeSet(KEYS.codexInstalled, JSON.stringify([...set]));
}
export function getTheme(){
  return safeGet(KEYS.theme);
}
export function setTheme(theme){
  safeSet(KEYS.theme, theme);
}

// Migration from old keys (same origin only, cannot cross repo path)
// Astra old: astra-3d-favorites, astra-theme
// Codex old: codex-favorites, codex-skills-favorites, codex-installed, codex-skills-installed, codex-theme, theme
export function migrateIfNeeded(){
  let migrated = [];
  try {
    const oldAstraFav = safeGet('astra-3d-favorites');
    if(oldAstraFav && !safeGet(KEYS.astraFav)){
      safeSet(KEYS.astraFav, oldAstraFav);
      migrated.push('astra-3d-favorites -> '+KEYS.astraFav);
    }
    const oldCodexFav1 = safeGet('codex-favorites');
    const oldCodexFav2 = safeGet('codex-skills-favorites');
    const oldCodexFav = oldCodexFav2 || oldCodexFav1;
    if(oldCodexFav && !safeGet(KEYS.codexFav)){
      safeSet(KEYS.codexFav, oldCodexFav);
      migrated.push('codex-favorites -> '+KEYS.codexFav);
    }
    const oldInst1 = safeGet('codex-installed');
    const oldInst2 = safeGet('codex-skills-installed');
    const oldInst = oldInst2 || oldInst1;
    if(oldInst && !safeGet(KEYS.codexInstalled)){
      safeSet(KEYS.codexInstalled, oldInst);
      migrated.push('codex-installed -> '+KEYS.codexInstalled);
    }
    const oldTheme = safeGet('astra-theme') || safeGet('codex-theme') || safeGet('theme');
    if(oldTheme && !safeGet(KEYS.theme)){
      safeSet(KEYS.theme, oldTheme);
      migrated.push('old theme -> '+KEYS.theme);
    }
    if(migrated.length) console.log('[storage] migrated', migrated);
  } catch(e){
    console.warn('[storage] migration failed', e);
  }
  return migrated;
}

// For README explanation: cross-repo (different GitHub Pages path) cannot auto-read old localStorage due to different path origin.
// Actually same origin https://rita112025-cpu.github.io but different pathname: /astra-3d-resource-hub/ vs /ai-resource-hub/ share same origin, localStorage is origin-scoped, not path-scoped, so migration WILL work if user visited both on same browser.
// We still document limitation: if user cleared data or uses different browser, manual export/import needed.
