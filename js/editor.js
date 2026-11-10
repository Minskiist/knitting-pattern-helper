// editor.js – Suunnittele-välilehden kaavioeditori: ruudukko, värit, maalaus, täyttö
// Plain script (no modules / build step). Shares globals with the other files.
//
// Coordinates follow knitting chart convention:
//   stitch 1 is the RIGHTMOST column, row 1 is the BOTTOM row.
// cells[row * cols + stitch] holds a palette index (0 = white / background).

// ── Palette ─────────────────────────────────────────────────────────────────
const PALETTE = [
  { key: 'colWhite',     hex: '#ffffff' },
  { key: 'colLightGray', hex: '#c9c9c9' },
  { key: 'colDarkGray',  hex: '#6e6e6e' },
  { key: 'colBlack',     hex: '#1f1f1f' },
  { key: 'colRed',       hex: '#d1342f' },
  { key: 'colBlue',      hex: '#2357b8' },
  { key: 'colYellow',    hex: '#f2c230' },
  { key: 'colGreen',     hex: '#2f8f46' },
];

const EDITOR_MAX = 300;   // max stitches / rows
const HISTORY_MAX = 50;   // undo steps

// ── State ───────────────────────────────────────────────────────────────────
const editor = {
  cols: 0,
  rows: 0,
  cells: null,      // Uint8Array
  tool: 'paint',    // 'paint' | 'fill'
  color: 3,         // black
  history: [],
  cell: 20,         // px per cell (computed)
  painting: false,
};

const edCanvas = document.getElementById('edCanvas');
const edCtx = edCanvas.getContext('2d');

// Space for row numbers (right) and stitch numbers (bottom)
const ED_NUM_RIGHT = 30;
const ED_NUM_BOTTOM = 22;

// ── Grid creation ───────────────────────────────────────────────────────────
function clampSize(v) {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(EDITOR_MAX, Math.max(1, n)) : null;
}

function editorHasDrawing() {
  return !!editor.cells && editor.cells.some(v => v !== 0);
}

// Creates an empty grid. Asks before throwing away an existing drawing.
function createGrid(cols, rows) {
  cols = clampSize(cols); rows = clampSize(rows);
  if (!cols || !rows) return false;
  if (editorHasDrawing() && !confirm(t('edConfirmReplace'))) return false;
  editor.cols = cols;
  editor.rows = rows;
  editor.cells = new Uint8Array(cols * rows);
  editor.history = [];
  document.getElementById('edCols').value = cols;
  document.getElementById('edRows').value = rows;
  document.getElementById('edWorkspace').hidden = false;
  document.getElementById('edEmpty').hidden = true;
  updateEditorUI();
  drawEditor();
  return true;
}

function createGridFromInputs() {
  createGrid(document.getElementById('edCols').value, document.getElementById('edRows').value);
}

// Called from the calculator's "Tee kaavio" button
function makeChartFromCalculator() {
  if (chosenSt == null || chosenRow == null) return;
  if (createGrid(chosenSt, chosenRow)) {
    document.getElementById('editorPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// ── Drawing ─────────────────────────────────────────────────────────────────
function computeCellSize() {
  const wrap = document.getElementById('edCanvasWrap');
  const avail = Math.max(120, wrap.clientWidth - ED_NUM_RIGHT - 4);
  return Math.max(8, Math.min(28, Math.floor(avail / editor.cols)));
}

function drawEditor() {
  if (!editor.cells) return;
  const cs = editor.cell = computeCellSize();
  const { cols, rows, cells } = editor;
  const gw = cols * cs, gh = rows * cs;
  const W = gw + ED_NUM_RIGHT, H = gh + ED_NUM_BOTTOM;
  const dpr = window.devicePixelRatio || 1;
  edCanvas.width = W * dpr;
  edCanvas.height = H * dpr;
  edCanvas.style.width = W + 'px';
  edCanvas.style.height = H + 'px';
  const ctx = edCtx;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);

  // Cells
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.fillStyle = PALETTE[cells[r * cols + c]].hex;
      ctx.fillRect((cols - 1 - c) * cs, (rows - 1 - r) * cs, cs, cs);
    }
  }

  // Grid lines: thin every cell, stronger every 10th (counted from stitch 1 / row 1)
  ctx.lineWidth = 1;
  for (let i = 0; i <= cols; i++) {
    const x = gw - i * cs + 0.5;
    ctx.strokeStyle = i % 10 === 0 ? '#555' : '#bdb3bb';
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, gh); ctx.stroke();
  }
  for (let i = 0; i <= rows; i++) {
    const y = gh - i * cs + 0.5;
    ctx.strokeStyle = i % 10 === 0 ? '#555' : '#bdb3bb';
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(gw, y); ctx.stroke();
  }

  // Numbers: rows on the right (bottom → top), stitches below (right → left)
  const every = cs >= 18 ? 1 : 5;
  const show = (n, max) => n === 1 || n === max || n % every === 0;
  ctx.fillStyle = '#6b5568';
  ctx.font = `${Math.min(11, Math.max(9, cs - 8))}px system-ui, sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  for (let r = 1; r <= rows; r++) {
    if (show(r, rows)) ctx.fillText(String(r), gw + 5, gh - (r - 0.5) * cs);
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (let c = 1; c <= cols; c++) {
    if (show(c, cols)) ctx.fillText(String(c), gw - (c - 0.5) * cs, gh + 5);
  }
}

// ── Pointer → cell ──────────────────────────────────────────────────────────
function cellAt(e) {
  const rect = edCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left, y = e.clientY - rect.top;
  const cs = editor.cell;
  const colFromLeft = Math.floor(x / cs), rowFromTop = Math.floor(y / cs);
  if (colFromLeft < 0 || colFromLeft >= editor.cols || rowFromTop < 0 || rowFromTop >= editor.rows) return null;
  return { c: editor.cols - 1 - colFromLeft, r: editor.rows - 1 - rowFromTop };
}

function pushHistory() {
  editor.history.push(editor.cells.slice());
  if (editor.history.length > HISTORY_MAX) editor.history.shift();
  updateEditorUI();
}

function paintCell(pos) {
  const i = pos.r * editor.cols + pos.c;
  if (editor.cells[i] === editor.color) return;
  editor.cells[i] = editor.color;
  drawEditor();
}

// Fills the connected area (up/down/left/right) that has the same colour
function floodFill(pos) {
  const { cols, rows, cells } = editor;
  const target = cells[pos.r * cols + pos.c];
  const color = editor.color;
  if (target === color) return false;
  const stack = [[pos.c, pos.r]];
  while (stack.length) {
    const [c, r] = stack.pop();
    if (c < 0 || c >= cols || r < 0 || r >= rows) continue;
    const i = r * cols + c;
    if (cells[i] !== target) continue;
    cells[i] = color;
    stack.push([c + 1, r], [c - 1, r], [c, r + 1], [c, r - 1]);
  }
  return true;
}

edCanvas.addEventListener('pointerdown', e => {
  const pos = cellAt(e);
  if (!pos) return;
  e.preventDefault();
  if (editor.tool === 'fill') {
    const before = editor.cells.slice();
    if (floodFill(pos)) {
      editor.history.push(before);
      if (editor.history.length > HISTORY_MAX) editor.history.shift();
      updateEditorUI();
      drawEditor();
    }
    return;
  }
  pushHistory();
  editor.painting = true;
  edCanvas.setPointerCapture(e.pointerId);
  paintCell(pos);
});

edCanvas.addEventListener('pointermove', e => {
  const pos = cellAt(e);
  updateCellInfo(pos);
  if (!editor.painting || !pos) return;
  paintCell(pos);
});

const stopPainting = () => {
  if (!editor.painting) return;
  editor.painting = false;
  // Drop the history entry if the stroke changed nothing
  const last = editor.history[editor.history.length - 1];
  if (last && last.every((v, i) => v === editor.cells[i])) { editor.history.pop(); updateEditorUI(); }
};
edCanvas.addEventListener('pointerup', stopPainting);
edCanvas.addEventListener('pointercancel', stopPainting);
edCanvas.addEventListener('pointerleave', () => updateCellInfo(null));

// ── Tools, colours, undo ────────────────────────────────────────────────────
function setEditorTool(tool) {
  editor.tool = tool;
  updateEditorUI();
}

function setEditorColor(idx) {
  editor.color = idx;
  updateEditorUI();
}

function undoEditor() {
  const prev = editor.history.pop();
  if (!prev) return;
  editor.cells = prev;
  updateEditorUI();
  drawEditor();
}

function clearEditor() {
  if (!editorHasDrawing()) return;
  pushHistory();
  editor.cells.fill(0);
  drawEditor();
}

function updateCellInfo(pos) {
  const el = document.getElementById('edCellInfo');
  el.textContent = pos ? t('edCellInfo').replace('{s}', pos.c + 1).replace('{r}', pos.r + 1) : '';
}

function buildPalette() {
  const wrap = document.getElementById('edPalette');
  wrap.innerHTML = '';
  PALETTE.forEach((p, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'swatch';
    b.style.background = p.hex;
    b.dataset.idx = i;
    b.setAttribute('role', 'radio');
    b.onclick = () => setEditorColor(i);
    wrap.appendChild(b);
  });
}

// Refresh button states and translated labels (also called on language change)
function updateEditorUI() {
  document.querySelectorAll('#edPalette .swatch').forEach(b => {
    const i = Number(b.dataset.idx);
    const on = i === editor.color;
    b.classList.toggle('selected', on);
    b.setAttribute('aria-checked', on);
    b.title = t(PALETTE[i].key);
    b.setAttribute('aria-label', t(PALETTE[i].key));
  });
  document.getElementById('edToolPaint').classList.toggle('active', editor.tool === 'paint');
  document.getElementById('edToolFill').classList.toggle('active', editor.tool === 'fill');
  document.getElementById('edUndo').disabled = editor.history.length === 0;
  const size = document.getElementById('edSizeInfo');
  size.textContent = editor.cells ? t('edSizeInfo').replace('{s}', editor.cols).replace('{r}', editor.rows) : '';
  const btn = document.getElementById('calcMakeChart');
  if (btn) btn.disabled = chosenSt == null || chosenRow == null;
}

// Ctrl/Cmd+Z undo on the design tab
document.addEventListener('keydown', e => {
  if (activeTab !== 'design') return;
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undoEditor(); }
});

let edResizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(edResizeTimer);
  edResizeTimer = setTimeout(drawEditor, 100);
});

buildPalette();
