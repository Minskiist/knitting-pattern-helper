// app.js – välilehdet ja käynnistys. Ladataan viimeisenä.
// Plain script (no modules / build step). Shares globals with the other files.

// ── Tabs (Neulo / Suunnittele) ──────────────────────────────────────────────
let activeTab = 'knit';

function setTab(tab) {
  if (tab !== 'knit' && tab !== 'design') return;
  activeTab = tab;
  document.getElementById('tabKnit').hidden   = tab !== 'knit';
  document.getElementById('tabDesign').hidden = tab !== 'design';
  document.querySelectorAll('.tab').forEach(b => {
    const on = b.dataset.tab === tab;
    b.classList.toggle('active', on);
    b.setAttribute('aria-selected', on);
  });
  try { localStorage.setItem('kph-tab', tab); } catch (e) { /* ignore */ }
  updateHeaderHeight();
  // The tracker measures the image, so refresh it when it becomes visible again
  if (tab === 'knit' && document.getElementById('viewer').style.display === 'flex') updateHighlight();
  // The editor canvas sizes itself to its container, which has no width while hidden
  if (tab === 'design') drawEditor();
}

// Full-height views (rajaus, seuranta) fill the space below the header,
// whose height changes when the tabs wrap on a phone.
function updateHeaderHeight() {
  const h = document.querySelector('header').offsetHeight;
  document.documentElement.style.setProperty('--header-h', h + 'px');
}
window.addEventListener('resize', updateHeaderHeight);

// ── Start ───────────────────────────────────────────────────────────────────
lang = detectLanguage();
restoreCalcState();
applyTranslations();
restoreAutosave();
let savedTab = 'knit';
try { savedTab = localStorage.getItem('kph-tab') || 'knit'; } catch (e) { /* ignore */ }
setTab(savedTab);
