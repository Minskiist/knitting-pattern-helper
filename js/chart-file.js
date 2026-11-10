// chart-file.js – kaavion tallennus: automaattinen tallennus selaimeen,
// vienti / tuonti tiedostona (.json) ja kuvana (.png).
// Plain script (no modules / build step). Shares globals with the other files.
//
// File format (version 1):
// {
//   "app": "knitting-pattern-helper", "version": 1,
//   "stitches": 88, "rows": 84,
//   "palette": ["#ffffff", ...],          // index → colour
//   "cells": "0003...",                   // one digit per cell (palette index),
//                                         // row 1 first, each row from stitch 1 (right) to the left
//   "savedAt": "2026-11-10T13:00:00.000Z"
// }

const AUTOSAVE_KEY = 'kph-chart';
const FILE_APP_ID = 'knitting-pattern-helper';

function chartToData() {
  return {
    app: FILE_APP_ID,
    version: 1,
    stitches: editor.cols,
    rows: editor.rows,
    palette: PALETTE.map(p => p.hex),
    cells: Array.from(editor.cells, v => v.toString(36)).join(''),
    savedAt: new Date().toISOString(),
  };
}

// Returns {cols, rows, cells} or null if the data is not a valid chart
function dataToChart(d) {
  if (!d || d.app !== FILE_APP_ID || d.version !== 1) return null;
  const cols = clampSize(d.stitches), rows = clampSize(d.rows);
  if (!cols || !rows || cols !== d.stitches || rows !== d.rows) return null;
  if (typeof d.cells !== 'string' || d.cells.length !== cols * rows) return null;
  const cells = new Uint8Array(cols * rows);
  for (let i = 0; i < cells.length; i++) {
    const v = parseInt(d.cells[i], 36);
    if (!(v >= 0 && v < PALETTE.length)) return null;
    cells[i] = v;
  }
  return { cols, rows, cells };
}

function loadChart(chart) {
  editor.cols = chart.cols;
  editor.rows = chart.rows;
  editor.cells = chart.cells;
  editor.history = [];
  document.getElementById('edCols').value = chart.cols;
  document.getElementById('edRows').value = chart.rows;
  document.getElementById('edWorkspace').hidden = false;
  document.getElementById('edEmpty').hidden = true;
  updateEditorUI();
  drawEditor();
}

// ── Autosave (this browser only) ────────────────────────────────────────────
// Changes are saved shortly after drawing, and immediately when a stroke
// ends or the page is hidden / closed (reload, tab close, app switch on a
// phone) – otherwise the very last change could be lost.
let autosaveTimer = null;
let autosavePending = false;

function scheduleAutosave() {
  autosavePending = true;
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(autosaveNow, 300);
}

function flushAutosave() {
  if (autosavePending) autosaveNow();
}

function autosaveNow() {
  clearTimeout(autosaveTimer);
  autosavePending = false;
  if (!editor.cells) return;
  try {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(chartToData()));
    setSaveStatus('saveStatusSaved');
  } catch (e) {
    setSaveStatus('saveStatusFailed');
  }
}

function restoreAutosave() {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return false;
    const chart = dataToChart(JSON.parse(raw));
    if (!chart) return false;
    loadChart(chart);
    setSaveStatus('saveStatusSaved');
    return true;
  } catch (e) {
    return false;
  }
}

let saveStatusKey = '';
function setSaveStatus(key) {
  saveStatusKey = key;
  const el = document.getElementById('edSaveStatus');
  if (el) el.textContent = key ? t(key) : '';
}

edCanvas.addEventListener('pointerup', flushAutosave);
window.addEventListener('pagehide', flushAutosave);
window.addEventListener('beforeunload', flushAutosave);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') flushAutosave();
});

// ── Download helpers ────────────────────────────────────────────────────────
function chartFileName(ext) {
  return `${t('fileBaseName')}-${editor.cols}x${editor.rows}.${ext}`;
}

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportChartFile() {
  if (!editor.cells) return;
  const json = JSON.stringify(chartToData(), null, 2);
  downloadBlob(new Blob([json], { type: 'application/json' }), chartFileName('json'));
}

// PNG with white background and margin, cell size 20 px (smaller for huge charts)
function chartToPngBlob() {
  const cs = Math.max(8, Math.min(20, Math.floor(4000 / Math.max(editor.cols, editor.rows))));
  const pad = 16;
  const W = editor.cols * cs + ED_NUM_RIGHT + pad * 2;
  const H = editor.rows * cs + ED_NUM_BOTTOM + pad * 2;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  ctx.translate(pad, pad);
  renderChart(ctx, cs);
  return new Promise(resolve => c.toBlob(resolve, 'image/png'));
}

async function exportChartPng() {
  if (!editor.cells) return;
  downloadBlob(await chartToPngBlob(), chartFileName('png'));
}

// ── Import ──────────────────────────────────────────────────────────────────
document.getElementById('edImportInput').addEventListener('change', e => {
  const file = e.target.files[0];
  e.target.value = '';           // allow choosing the same file again
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    let chart = null;
    try { chart = dataToChart(JSON.parse(reader.result)); } catch (err) { chart = null; }
    if (!chart) { alert(t('importInvalid')); return; }
    if (editorHasDrawing() && !confirm(t('edConfirmReplace'))) return;
    loadChart(chart);
  };
  reader.readAsText(file);
});
