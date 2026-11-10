// tracker.js – Neulo-välilehti: kaavion lataus, rajaus ja seuranta
// Plain script (no modules / build step). Shares globals with the other files.

// ── State ────────────────────────────────────────────────────────────────
let currentRow   = 0;
let totalRows    = 20;
let totalCols    = 10;
let zoomLevel    = 1;
let direction    = 'bottom-up';
let imageDataUrl = null;   // data URL stored for canvas drawing
let calibData    = null;   // {xFrac, yFrac, wFrac, hFrac} fractions of natural image
let cachedImg    = null;   // offscreen Image for canvas draw

// Calibration drag state
let selRectPos = {x: 0, y: 0, w: 100, h: 100}; // px relative to calibImg
let dragState  = null;

// ── DOM refs ─────────────────────────────────────────────────────────────
const chartImg      = document.getElementById('chartImg');
const chartImgSharp = document.getElementById('chartImgSharp');
const highlight     = document.getElementById('highlight');
const rowInfo       = document.getElementById('rowInfo');
const progressFill  = document.getElementById('progressFill');
const btnPrev       = document.getElementById('btnPrev');
const btnNext       = document.getElementById('btnNext');
const zoomLabel     = document.getElementById('zoomLabel');
const zoomCanvas    = document.getElementById('zoomCanvas');

// ── Welcome ──────────────────────────────────────────────────────────────
function dismissWelcome() {
  document.getElementById('welcome').style.display = 'none';
}

// The intro heading belongs to the start view only
function showKnitIntro(show) {
  document.getElementById('knitIntro').hidden = !show;
}

// ── Direction ────────────────────────────────────────────────────────────
function setDirection(dir) {
  direction = dir;
  document.getElementById('btnBottomUp').classList.toggle('active', dir === 'bottom-up');
  document.getElementById('btnTopDown').classList.toggle('active',  dir === 'top-down');
}

// ── Setup → Calibration ──────────────────────────────────────────────────
function loadForCalibration() {
  const file = document.getElementById('imageInput').files[0];
  if (!file) { alert(t('noFileAlert')); return; }

  const reader = new FileReader();
  reader.onload = e => {
    imageDataUrl = e.target.result;

    // Pre-cache image for canvas drawing
    cachedImg = new Image();
    cachedImg.src = imageDataUrl;

    const calibImgEl = document.getElementById('calibImg');
    calibImgEl.onload = () => {
      dismissWelcome();
      showKnitIntro(false);
      document.getElementById('setupPanel').style.display = 'none';
        document.getElementById('calibPanel').style.display = 'flex';
      // Wait one frame so clientWidth/Height are available after layout
      requestAnimationFrame(() => {
        fitCalibImage();
        initSelRect();
        updateDividers();
        calibData = null;
        saveTrackerSession({
          image: imageDataUrl, fileName: file.name, direction,
          calib: null, draft: selRectFractions(), currentRow: 0, stage: 'calib',
          rows: Math.max(1, parseInt(document.getElementById('calibRowCount').value) || 20),
          cols: Math.max(1, parseInt(document.getElementById('calibColCount').value) || 10),
        });
        updateResumeButton();
      });
    };
    calibImgEl.src = imageDataUrl;
  };
  reader.readAsDataURL(file);
}

function fitCalibImage() {
  const container = document.querySelector('.calib-image-area');
  const calibImgEl = document.getElementById('calibImg');
  const available = container.clientWidth - 40;
  const scale = Math.min(1, available / calibImgEl.naturalWidth);
  calibImgEl.style.width  = Math.round(calibImgEl.naturalWidth  * scale) + 'px';
  calibImgEl.style.height = Math.round(calibImgEl.naturalHeight * scale) + 'px';
}

// ── Calibration rect init ────────────────────────────────────────────────
function initSelRect() {
  const calibImgEl = document.getElementById('calibImg');
  const w = calibImgEl.clientWidth;
  const h = calibImgEl.clientHeight;
  const m = 0.1; // 10% margin on each side
  selRectPos = { x: w * m, y: h * m, w: w * (1 - 2*m), h: h * (1 - 2*m) };
  applySelRect();
}

function applySelRect() {
  const el = document.getElementById('selRect');
  el.style.left   = selRectPos.x + 'px';
  el.style.top    = selRectPos.y + 'px';
  el.style.width  = selRectPos.w + 'px';
  el.style.height = selRectPos.h + 'px';
  updateDividers();
}

function updateDividers() {
  const container = document.getElementById('rowDividers');
  const rows = Math.max(1, parseInt(document.getElementById('calibRowCount').value) || 20);
  const cols = Math.max(1, parseInt(document.getElementById('calibColCount').value) || 10);
  container.innerHTML = '';
  for (let i = 1; i < rows; i++) {
    const line = document.createElement('div');
    line.className = 'row-divider-line';
    line.style.top = (i / rows * 100) + '%';
    container.appendChild(line);
  }
  for (let i = 1; i < cols; i++) {
    const line = document.createElement('div');
    line.className = 'col-divider-line';
    line.style.left = (i / cols * 100) + '%';
    container.appendChild(line);
  }
}

// ── Calibration drag / resize ────────────────────────────────────────────
(function initCalibDrag() {
  const getImgSize = () => {
    const el = document.getElementById('calibImg');
    return { w: el.clientWidth, h: el.clientHeight };
  };

  function startDrag(e, type, dir) {
    const pt = eventPoint(e);
    dragState = { type, dir, startX: pt.x, startY: pt.y, orig: {...selRectPos} };
    e.preventDefault();
  }

  document.getElementById('selRect').addEventListener('mousedown', e => {
    if (e.target.classList.contains('sel-handle')) return;
    startDrag(e, 'move', null);
  });
  document.getElementById('selRect').addEventListener('touchstart', e => {
    if (e.target.classList.contains('sel-handle')) return;
    startDrag(e, 'move', null);
  }, {passive: false});

  document.querySelectorAll('.sel-handle').forEach(h => {
    h.addEventListener('mousedown', e => {
      e.stopPropagation();
      startDrag(e, 'resize', h.dataset.dir);
    });
    h.addEventListener('touchstart', e => {
      e.stopPropagation();
      startDrag(e, 'resize', h.dataset.dir);
    }, {passive: false});
  });

  function onMove(e) {
    if (!dragState) return;
    e.preventDefault();
    const pt  = eventPoint(e);
    const dx  = pt.x - dragState.startX;
    const dy  = pt.y - dragState.startY;
    const bounds = getImgSize();
    const MIN = 30;

    if (dragState.type === 'move') {
      selRectPos.x = Math.max(0, Math.min(bounds.w - selRectPos.w, dragState.orig.x + dx));
      selRectPos.y = Math.max(0, Math.min(bounds.h - selRectPos.h, dragState.orig.y + dy));
    } else {
      let {x, y, w, h} = dragState.orig;
      const dir = dragState.dir;
      if (dir.includes('e')) w = Math.max(MIN, w + dx);
      if (dir.includes('s')) h = Math.max(MIN, h + dy);
      if (dir.includes('w')) { x += dx; w = Math.max(MIN, w - dx); }
      if (dir.includes('n')) { y += dy; h = Math.max(MIN, h - dy); }
      // Clamp within image
      if (x < 0)          { w += x; x = 0; }
      if (y < 0)          { h += y; y = 0; }
      if (x + w > bounds.w) w = bounds.w - x;
      if (y + h > bounds.h) h = bounds.h - y;
      selRectPos = {x, y, w, h};
    }
    applySelRect();
  }

  function onEnd() {
    if (dragState) saveCalibDraft();
    dragState = null;
  }

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup',   onEnd);
  document.addEventListener('touchmove', onMove, {passive: false});
  document.addEventListener('touchend',  onEnd);
})();

function eventPoint(e) {
  if (e.touches && e.touches.length) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  return { x: e.clientX, y: e.clientY };
}

// ── Calibration → Knitting ───────────────────────────────────────────────
function startKnitting() {
  const calibImgEl = document.getElementById('calibImg');
  const imgW = calibImgEl.clientWidth;
  const imgH = calibImgEl.clientHeight;

  calibData = {
    xFrac: selRectPos.x / imgW,
    yFrac: selRectPos.y / imgH,
    wFrac: selRectPos.w / imgW,
    hFrac: selRectPos.h / imgH,
  };
  const newRows = Math.max(1, parseInt(document.getElementById('calibRowCount').value) || 20);
  // Recalibrating the same chart keeps your place; a new chart starts from row 1
  const keepRow = trackerSession && trackerSession.stage === 'calib' && trackerSession.calib;
  currentRow = keepRow ? Math.min(currentRow, newRows - 1) : 0;
  totalRows  = newRows;
  totalCols  = Math.max(1, parseInt(document.getElementById('calibColCount').value) || 10);
  saveTrackerSession({ calib: calibData, draft: null, rows: totalRows, cols: totalCols, currentRow, stage: 'knit' });

  chartImg.src      = imageDataUrl;
  chartImgSharp.src = imageDataUrl;

  const go = () => {
    document.getElementById('calibPanel').style.display = 'none';
    document.getElementById('viewer').style.display = 'flex';
    resetZoom();
  };

  if (chartImg.complete && chartImg.naturalWidth > 0) {
    go();
  } else {
    chartImg.onload = go;
  }
}

// ── Back navigation ───────────────────────────────────────────────────────
function backToSetup() {
  document.getElementById('viewer').style.display   = 'none';
  document.getElementById('calibPanel').style.display = 'none';
  document.getElementById('setupPanel').style.display = 'block';
  showKnitIntro(true);
  if (trackerSession) saveTrackerSession({ stage: 'setup' });
  updateResumeButton();
}

function backToCalib() {
  document.getElementById('viewer').style.display   = 'none';
  document.getElementById('calibPanel').style.display = 'flex';
  saveTrackerSession({ stage: 'calib', draft: selRectFractions() });
}

// ── Zoom ──────────────────────────────────────────────────────────────────
function zoom(delta) {
  zoomLevel = Math.max(0.1, Math.min(8, zoomLevel + delta));
  applyZoom();
}

function resetZoom() {
  const container = document.getElementById('imageContainer');
  const available = container.clientWidth - 40;
  const natural   = chartImg.naturalWidth;
  zoomLevel = natural > 0 ? Math.min(1, available / natural) : 1;
  applyZoom();
}

function applyZoom() {
  const w = Math.round(chartImg.naturalWidth  * zoomLevel) + 'px';
  const h = Math.round(chartImg.naturalHeight * zoomLevel) + 'px';
  chartImg.style.width       = w;
  chartImg.style.height      = h;
  chartImgSharp.style.width  = w;
  chartImgSharp.style.height = h;
  zoomLabel.textContent = Math.round(zoomLevel * 100) + '%';
  updateHighlight();
}

// ── Row highlight ─────────────────────────────────────────────────────────
function updateHighlight() {
  const imgW = chartImg.clientWidth;
  const imgH = chartImg.clientHeight;
  if (!imgW || !imgH) return;

  const areaLeft = (calibData ? calibData.xFrac : 0) * imgW;
  const areaTop  = (calibData ? calibData.yFrac : 0) * imgH;
  const areaW    = (calibData ? calibData.wFrac : 1) * imgW;
  const areaH    = (calibData ? calibData.hFrac : 1) * imgH;

  const rowH   = areaH / totalRows;
  const visIdx = direction === 'bottom-up' ? totalRows - 1 - currentRow : currentRow;
  const rowTop = areaTop + visIdx * rowH;

  // Clip sharp image to active row within calibrated area
  chartImgSharp.style.clipPath =
    `inset(${rowTop}px ${imgW - areaLeft - areaW}px ${imgH - rowTop - rowH}px ${areaLeft}px)`;

  // Highlight border constrained to calibrated width
  highlight.style.top    = rowTop + 'px';
  highlight.style.height = rowH + 'px';
  highlight.style.left   = areaLeft + 'px';
  highlight.style.right  = (imgW - areaLeft - areaW) + 'px';
  highlight.style.width  = 'auto';

  // Zoomed canvas overlay on active row
  drawZoomCanvas(areaLeft, areaTop, areaW, areaH, rowTop, rowH);

  rowInfo.textContent      = `${t('row')} ${currentRow + 1} / ${totalRows}`;
  progressFill.style.width = (currentRow / Math.max(totalRows - 1, 1) * 100) + '%';
  btnPrev.disabled = currentRow === 0;
  btnNext.disabled = currentRow === totalRows - 1;
}

// ── Zoom canvas ───────────────────────────────────────────────────────────
function drawZoomCanvas(areaLeft, areaTop, areaW, areaH, rowTop, rowH) {
  if (!cachedImg || !cachedImg.complete || !cachedImg.naturalWidth) return;

  const ZOOM = 1.35; // vertical zoom only — full width always stays visible

  const imgW = chartImg.clientWidth;
  const imgH = chartImg.clientHeight;
  const natW = cachedImg.naturalWidth;
  const natH = cachedImg.naturalHeight;
  const sX   = natW / imgW;
  const sY   = natH / imgH;

  zoomCanvas.style.left    = areaLeft + 'px';
  zoomCanvas.style.top     = rowTop   + 'px';
  zoomCanvas.style.width   = areaW    + 'px';
  zoomCanvas.style.height  = rowH     + 'px';
  zoomCanvas.style.display = 'block';

  const dpr = window.devicePixelRatio || 1;
  const cw  = Math.max(1, Math.round(areaW * dpr));
  const ch  = Math.max(1, Math.round(rowH  * dpr));
  if (zoomCanvas.width !== cw || zoomCanvas.height !== ch) {
    zoomCanvas.width  = cw;
    zoomCanvas.height = ch;
  }

  const ctx = zoomCanvas.getContext('2d');
  ctx.clearRect(0, 0, cw, ch);

  // Full width, zoom only vertically (no horizontal clipping)
  const srcX = areaLeft * sX;
  const srcW = areaW    * sX;
  const srcH = (rowH / ZOOM) * sY;
  const srcY = (rowTop + (rowH - rowH / ZOOM) / 2) * sY;

  ctx.drawImage(cachedImg, srcX, srcY, srcW, srcH, 0, 0, cw, ch);

  // Draw stitch grid with complementary color of the dominant row color
  if (totalCols > 1) {
    const [r, g, b] = dominantColor(ctx, cw, ch);
    ctx.strokeStyle = complementColor(r, g, b);
    ctx.lineWidth   = dpr;
    for (let i = 1; i < totalCols; i++) {
      const x = Math.round(i / totalCols * cw) + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, ch);
      ctx.stroke();
    }
  }
}

// Returns [r, g, b] of the most frequent quantized color in the canvas region
function dominantColor(ctx, w, h) {
  const data = ctx.getImageData(0, 0, w, h).data;
  const counts = {};
  // Sample every 5th pixel for speed
  for (let i = 0; i < data.length; i += 4 * 5) {
    const key = (data[i] & 0xE0) << 16 | (data[i+1] & 0xE0) << 8 | (data[i+2] & 0xE0);
    counts[key] = (counts[key] || 0) + 1;
  }
  let best = 0x808080, bestN = 0;
  for (const [k, n] of Object.entries(counts)) {
    if (n > bestN) { bestN = n; best = +k; }
  }
  return [(best >> 16) & 0xFF, (best >> 8) & 0xFF, best & 0xFF];
}

// Returns an hsla() string that is the complementary color of [r,g,b], semi-transparent
function complementColor(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d < 0.08) {
    // Near-achromatic: flip to opposite lightness
    const v = Math.round((l > 0.5 ? 0.15 : 0.85) * 255);
    return `rgba(${v},${v},${v},0.35)`;
  }
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  switch (max) {
    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
    case g: h = ((b - r) / d + 2) / 6; break;
    default: h = ((r - g) / d + 4) / 6;
  }
  h = (h + 0.5) % 1; // rotate 180°
  return `hsla(${Math.round(h*360)},${Math.round(s*100)}%,${Math.round(l*100)}%,0.35)`;
}

// ── Navigation ────────────────────────────────────────────────────────────
function nextRow() {
  if (currentRow < totalRows - 1) { currentRow++; updateHighlight(); scrollToRow(); saveTrackerSession({ currentRow }); }
}

function prevRow() {
  if (currentRow > 0) { currentRow--; updateHighlight(); scrollToRow(); saveTrackerSession({ currentRow }); }
}

function scrollToRow() {
  const container = document.getElementById('imageContainer');
  const imgH    = chartImg.clientHeight;
  const areaTop = (calibData ? calibData.yFrac : 0) * imgH;
  const areaH   = (calibData ? calibData.hFrac : 1) * imgH;
  const rowH    = areaH / totalRows;
  const visIdx  = direction === 'bottom-up' ? totalRows - 1 - currentRow : currentRow;
  const rowTop  = areaTop + visIdx * rowH;
  const target  = rowTop - container.clientHeight / 2 + rowH / 2;
  container.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
}

// ── File picker label ─────────────────────────────────────────────────────
document.getElementById('imageInput').addEventListener('change', e => {
  const el = document.getElementById('fileName');
  const file = e.target.files[0];
  if (file) { el.textContent = file.name; el.dataset.hasFile = '1'; }
  else { delete el.dataset.hasFile; el.textContent = t('noFile'); }
});

// ── Keyboard shortcuts ────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (activeTab !== 'knit') return;
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
  switch (e.key) {
    case 'ArrowRight': case 'ArrowDown': case ' ':
      e.preventDefault(); nextRow(); break;
    case 'ArrowLeft': case 'ArrowUp':
      e.preventDefault(); prevRow(); break;
    case '+': case '=': zoom(+0.25); break;
    case '-':           zoom(-0.25); break;
  }
});
