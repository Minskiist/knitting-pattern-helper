// tracker-session.js – Neulo-välilehden muisti: kuva, suunta, rajaus ja nykyinen
// kerros tallentuvat selaimeen, ja sovellus jatkaa siitä mihin jäätiin.
// Plain script (no modules / build step). Shares globals with the other files.
//
// The chart image can be several megabytes, which is too much for
// localStorage, so the session lives in IndexedDB (database "kph", store "kv",
// key "tracker"):
// {
//   image: "data:image/png;base64,…", fileName: "kaavio.png",
//   direction: "bottom-up" | "top-down",
//   rows: 20, cols: 10,
//   calib: {xFrac, yFrac, wFrac, hFrac} | null,   // confirmed chart area
//   draft: {xFrac, yFrac, wFrac, hFrac} | null,   // blue box while calibrating
//   currentRow: 0,
//   stage: "setup" | "calib" | "knit"
// }

const TRACKER_DB = 'kph';
const TRACKER_STORE = 'kv';
const TRACKER_KEY = 'tracker';

let trackerSession = null;      // in-memory copy of what is stored
let trackerNeedsFit = false;    // restored while the Neulo tab was hidden

// One shared connection; writes are queued so they land in order
// (rapid row changes must never be overwritten by an older state).
let trackerDbPromise = null;
let trackerWriteChain = Promise.resolve();

function openTrackerDb() {
  if (!trackerDbPromise) {
    trackerDbPromise = new Promise((resolve, reject) => {
      if (!window.indexedDB) { reject(new Error('no indexedDB')); return; }
      const req = indexedDB.open(TRACKER_DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(TRACKER_STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return trackerDbPromise;
}

async function idbGet(key) {
  const db = await openTrackerDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(TRACKER_STORE).objectStore(TRACKER_STORE).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(key, value) {
  const db = await openTrackerDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TRACKER_STORE, 'readwrite');
    tx.objectStore(TRACKER_STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Merge changes into the session and store it. Failures (private mode,
// storage full) are ignored: the app keeps working, it just won't remember.
function saveTrackerSession(changes) {
  trackerSession = { ...(trackerSession || {}), ...changes };
  const snapshot = trackerSession;
  trackerWriteChain = trackerWriteChain
    .then(() => idbPut(TRACKER_KEY, snapshot))
    .catch(() => {});
}

// Current blue box as fractions of the image
function selRectFractions() {
  const img = document.getElementById('calibImg');
  const w = img.clientWidth, h = img.clientHeight;
  if (!w || !h) return null;
  return { xFrac: selRectPos.x / w, yFrac: selRectPos.y / h, wFrac: selRectPos.w / w, hFrac: selRectPos.h / h };
}

function applySelRectFractions(f) {
  const img = document.getElementById('calibImg');
  const w = img.clientWidth, h = img.clientHeight;
  selRectPos = { x: f.xFrac * w, y: f.yFrac * h, w: f.wFrac * w, h: f.hFrac * h };
  applySelRect();
}

function saveCalibDraft() {
  if (!trackerSession || trackerSession.stage !== 'calib') return;
  saveTrackerSession({
    draft: selRectFractions(),
    rows: Math.max(1, parseInt(document.getElementById('calibRowCount').value) || 20),
    cols: Math.max(1, parseInt(document.getElementById('calibColCount').value) || 10),
  });
}

// ── Restore ─────────────────────────────────────────────────────────────────
function loadImageInto(el, src) {
  return new Promise(resolve => {
    el.onload = () => resolve();
    el.onerror = () => resolve();
    el.src = src;
  });
}

async function resumeTrackerSession(s) {
  imageDataUrl = s.image;
  cachedImg = new Image();
  cachedImg.src = imageDataUrl;
  setDirection(s.direction === 'top-down' ? 'top-down' : 'bottom-up');
  document.getElementById('calibRowCount').value = s.rows || 20;
  document.getElementById('calibColCount').value = s.cols || 10;
  const nameEl = document.getElementById('fileName');
  if (s.fileName) { nameEl.textContent = s.fileName; nameEl.dataset.hasFile = '1'; }

  dismissWelcome();
  showKnitIntro(false);
  document.getElementById('setupPanel').style.display = 'none';
  await loadImageInto(document.getElementById('calibImg'), imageDataUrl);

  if (s.stage === 'knit' && s.calib) {
    calibData  = s.calib;
    totalRows  = Math.max(1, s.rows || 20);
    totalCols  = Math.max(1, s.cols || 10);
    currentRow = Math.min(Math.max(0, s.currentRow || 0), totalRows - 1);
    await Promise.all([loadImageInto(chartImg, imageDataUrl), loadImageInto(chartImgSharp, imageDataUrl)]);
    document.getElementById('calibPanel').style.display = 'none';
    document.getElementById('viewer').style.display = 'flex';
  } else {
    document.getElementById('viewer').style.display = 'none';
    document.getElementById('calibPanel').style.display = 'flex';
  }
  trackerNeedsFit = true;
  if (activeTab === 'knit') refreshTrackerView();
}

// Lay out the restored view. Needs the Neulo tab to be visible (sizes are 0 while hidden).
function refreshTrackerView() {
  const viewerOn = document.getElementById('viewer').style.display === 'flex';
  const calibOn = document.getElementById('calibPanel').style.display === 'flex';
  if (trackerNeedsFit) {
    trackerNeedsFit = false;
    if (viewerOn) {
      resetZoom();
      requestAnimationFrame(scrollToRow);
    } else if (calibOn) {
      fitCalibImage();
      const f = (trackerSession && (trackerSession.draft || trackerSession.calib));
      if (f) applySelRectFractions(f); else initSelRect();
    }
    return;
  }
  if (viewerOn) updateHighlight();
}

function updateResumeButton() {
  const btn = document.getElementById('resumeBtn');
  const s = trackerSession;
  const show = !!(s && s.image && s.stage === 'setup');
  btn.hidden = !show;
  if (show) btn.textContent = t('resumeChart').replace('{name}', s.fileName || '');
}

function resumeFromButton() {
  const s = trackerSession;
  if (!s || !s.image) return;
  saveTrackerSession({ stage: s.calib ? 'knit' : 'calib' });
  resumeTrackerSession(trackerSession);
}

window.addEventListener('DOMContentLoaded', async () => {
  let s = null;
  try { s = await idbGet(TRACKER_KEY); } catch (e) { s = null; }
  if (!s || typeof s.image !== 'string') return;
  trackerSession = s;
  if (s.stage === 'calib' || s.stage === 'knit') resumeTrackerSession(s);
  else updateResumeButton();
});
