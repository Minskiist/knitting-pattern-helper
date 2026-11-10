// calculator.js – Suunnittele-välilehden älykäs laskin
// Plain script (no modules / build step). Shares globals with the other files.

// ── Smart calculator ─────────────────────────────────────────────────────
// Gauge is given per 10 cm. Without a pattern repeat, counts are rounded
// to the nearest whole number. With a repeat, the two nearest counts that
// fit the repeat are offered and the knitter picks one:
//   stitches = k × stitch repeat (+ edge stitches when knitting flat)
//   rows     = m × row repeat
const calcIds = ['calcStGauge', 'calcRowGauge', 'calcWidth', 'calcHeight',
                 'calcStRepeat', 'calcRowRepeat', 'calcEdge'];
const fmtCm = n => n.toLocaleString(locale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fmtInt = n => n.toLocaleString(locale());

let knitMethod = 'round';
let chosenSt = null;   // selected stitch count (null = closest)
let chosenRow = null;  // selected row count (null = closest)

function readNumber(id, { allowZero = false } = {}) {
  const v = parseFloat(String(document.getElementById(id).value).replace(',', '.'));
  if (!Number.isFinite(v)) return null;
  return (allowZero ? v >= 0 : v > 0) ? v : null;
}

// Counts that fit `repeat` (+ `extra`) nearest to `target`.
// Returns 1 option when the target fits exactly, otherwise 2 (below/above).
function fitOptions(target, repeat, extra = 0) {
  if (!repeat) return [{ count: Math.max(1, Math.round(target)), reps: null }];
  const exact = (target - extra) / repeat;
  const low = Math.max(1, Math.floor(exact + 1e-9));
  if (Math.abs(exact - low) < 1e-9) return [{ count: low * repeat + extra, reps: low, exact: true }];
  return [low, low + 1].map(k => ({ count: k * repeat + extra, reps: k }));
}

function closest(options, target) {
  return options.reduce((best, o) =>
    Math.abs(o.count - target) < Math.abs(best.count - target) ? o : best).count;
}

function setKnitMethod(method) {
  knitMethod = method;
  document.getElementById('btnRound').classList.toggle('active', method === 'round');
  document.getElementById('btnFlat').classList.toggle('active',  method === 'flat');
  document.getElementById('edgeField').hidden = method !== 'flat';
  chosenSt = null;
  updateCalculator();
}

function renderOptions(listId, options, selected, gaugePer10, onPick, edge = 0) {
  const list = document.getElementById(listId);
  list.innerHTML = '';
  options.forEach(o => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'calc-option' + (o.count === selected ? ' selected' : '') + (o.exact ? ' exact' : '');
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', o.count === selected);
    let reps = t(o.reps === 1 ? 'repeatOne' : 'repeatMany').replace('{n}', fmtInt(o.reps));
    if (edge > 0) reps += ' ' + t('plusEdge').replace('{n}', fmtInt(edge));
    const cm = `${fmtCm(o.count / (gaugePer10 / 10))} cm`;
    b.innerHTML = `<strong>${fmtInt(o.count)}</strong>${reps} · ${cm}${o.exact ? ' · ' + t('fitsExactly') : ''}`;
    b.onclick = () => onPick(o.count);
    list.appendChild(b);
  });
}

function updateCalculator() {
  const out = id => document.getElementById(id);
  const stG = readNumber('calcStGauge'), rowG = readNumber('calcRowGauge');
  const w = readNumber('calcWidth'), h = readNumber('calcHeight');
  const stRep = readNumber('calcStRepeat'), rowRep = readNumber('calcRowRepeat');
  const edge = knitMethod === 'flat' ? (readNumber('calcEdge', { allowZero: true }) || 0) : 0;

  if ([stG, rowG, w, h].some(v => v === null)) {
    ['calcStitches', 'calcRows', 'calcGridSize', 'calcRealSize'].forEach(id => out(id).textContent = '–');
    out('calcTotal').textContent = t('calcFillAll');
    out('calcOptions').hidden = true;
    chosenSt = chosenRow = null;
    if (typeof updateEditorUI === 'function') updateEditorUI();
    return;
  }

  const stTarget = stG / 10 * w, rowTarget = rowG / 10 * h;
  const stOpts  = fitOptions(stTarget, stRep ? Math.round(stRep) : null, Math.round(edge));
  const rowOpts = fitOptions(rowTarget, rowRep ? Math.round(rowRep) : null);

  if (!stOpts.some(o => o.count === chosenSt))  chosenSt  = closest(stOpts, stTarget);
  if (!rowOpts.some(o => o.count === chosenRow)) chosenRow = closest(rowOpts, rowTarget);

  out('calcOptions').hidden = !stRep && !rowRep;
  out('stOptionGroup').hidden = !stRep;
  out('rowOptionGroup').hidden = !rowRep;
  if (stRep)  renderOptions('stOptions',  stOpts,  chosenSt,  stG,  c => { chosenSt = c;  updateCalculator(); }, Math.round(edge));
  if (rowRep) renderOptions('rowOptions', rowOpts, chosenRow, rowG, c => { chosenRow = c; updateCalculator(); });

  const stitches = chosenSt, rows = chosenRow;
  out('calcStitches').textContent = fmtInt(stitches);
  out('calcRows').textContent     = fmtInt(rows);
  out('calcGridSize').textContent = `${stitches} × ${rows}`;
  out('calcRealSize').textContent = `${fmtCm(stitches / (stG / 10))} × ${fmtCm(rows / (rowG / 10))} cm`;
  out('calcTotal').innerHTML = t('calcTotal').replace('{n}', `<strong>${fmtInt(stitches * rows)}</strong>`);
  if (typeof updateEditorUI === 'function') updateEditorUI();
}

calcIds.forEach(id => document.getElementById(id).addEventListener('input', () => {
  chosenSt = null; chosenRow = null; updateCalculator();
}));
