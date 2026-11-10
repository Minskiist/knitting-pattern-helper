// i18n.js – käännökset (FI / EN) ja kielivalinta
// Plain script (no modules / build step). Shares globals with the other files.

// ── Language (FI / EN) ───────────────────────────────────────────────────
// Every visible text lives here. Add new strings to BOTH languages.
const I18N = {
  fi: {
    appTitle: 'Neulekaavioapuri',
    tabKnit: 'Neulo',
    tabDesign: 'Suunnittele',
    knitIntroTitle: 'Neulo valmiista kaaviosta',
    knitIntroText: 'Lataa kaavion kuva ja seuraa sitä kerros kerrallaan.',
    designIntroTitle: 'Suunnittele oma neulekaavio',
    designIntroText: 'Mitoita kaavio laskimella ja piirrä se editorissa.',
    makeChart: 'Tee kaavio →',
    editorTitle: 'Kaavioeditori',
    edNewGrid: 'Luo uusi ruudukko',
    edEmpty: 'Luo ruudukko yllä tai laskimen Tee kaavio -napilla.',
    edPaint: 'Maalaa',
    edFill: 'Täytä alue',
    edUndo: '↶ Kumoa',
    edClear: 'Tyhjennä',
    edSizeInfo: '{s} silmukkaa × {r} kerrosta',
    edCellInfo: 'Silmukka {s}, kerros {r}',
    edConfirmReplace: 'Uusi ruudukko korvaa nykyisen kaavion. Jatketaanko?',
    colWhite: 'Valkoinen',
    colLightGray: 'Vaaleanharmaa',
    colDarkGray: 'Tummanharmaa',
    colBlack: 'Musta',
    colRed: 'Punainen',
    colBlue: 'Sininen',
    colYellow: 'Keltainen',
    colGreen: 'Vihreä',
    dismiss: 'Sulje',
    welcomeTitle: 'Tervetuloa!',
    welcome1: 'Lataa kaavion kuva ja valitse neulontasuunta',
    welcome2: 'Vedä sininen laatikko kaavion päälle ja anna kerrosten määrä',
    welcome3: 'Etene kerros kerrallaan napeilla Seuraava / Edellinen (tai välilyönnillä ja nuolinäppäimillä)',
    setupTitle: 'Lataa kaavio',
    chartImage: 'Kaavion kuva',
    chooseFile: 'Valitse kuva',
    noFile: 'Ei valittua kuvaa',
    rowDirection: 'Neulontasuunta',
    bottomUp: 'Alhaalta ylös (tavallinen)',
    topDown: 'Ylhäältä alas',
    nextCalib: 'Seuraavaksi: rajaa kaavio →',
    noFileAlert: 'Valitse ensin kaavion kuva.',
    rowsLabel: 'Kerroksia:',
    stitchesLabel: 'Silmukoita:',
    back: '← Takaisin',
    startKnitting: 'Aloita neulominen →',
    calib1: 'Vedä sininen laatikko kaavioalueen päälle',
    calib2: 'Säädä kokoa kulmista ja reunoista, kunnes se osuu tarkasti',
    calib3: 'Anna kerrosten ja silmukoiden määrä',
    calib4: 'Paina <strong>Aloita neulominen</strong>, kun olet valmis!',
    zoomOut: 'Loitonna (-)',
    zoomIn: 'Lähennä (+)',
    fitWidth: 'Sovita leveyteen',
    row: 'Kerros',
    recalibrate: 'Rajaa uudelleen',
    changeChart: 'Vaihda kaavio',
    chartAlt: 'Neulekaavio',
    prev: '← Edellinen',
    next: 'Seuraava →',
    calcTitle: 'Älykäs laskin',
    calcIntro: 'Syötä neuletiheys ja tavoitemitat, niin laskin kertoo, montako silmukkaa ja kerrosta kaavioon tarvitaan.',
    calcGauge: 'Neuletiheys',
    calcTarget: 'Tavoitemitat',
    calcResults: 'Tulokset',
    calcStGaugeL: 'Silmukkaa / 10 cm',
    calcRowGaugeL: 'Kerrosta / 10 cm',
    calcWidthL: 'Leveys (cm)',
    calcHeightL: 'Korkeus (cm)',
    resStitches: 'Silmukoita',
    resRows: 'Kerroksia',
    resGrid: 'Kaavion koko',
    resReal: 'Arvioitu koko',
    calcFillAll: 'Täytä kaikki kentät positiivisilla luvuilla.',
    calcTotal: 'Kaaviossa on noin {n} neulottavaa silmukkaa.',
    calcPattern: 'Kuvio',
    calcMethod: 'Neulontatapa',
    methodRound: 'Suljettuna',
    methodFlat: 'Tasona',
    calcStRepeatL: 'Kuviokerta (s)',
    calcRowRepeatL: 'Kuviokerta (krs)',
    calcEdgeL: 'Reunasilmukat yhteensä',
    optional: 'vapaaehtoinen',
    chooseStitches: 'Valitse silmukkamäärä',
    chooseRows: 'Valitse kerrosmäärä',
    repeatOne: '{n} kuviokerta',
    repeatMany: '{n} kuviokertaa',
    fitsExactly: 'täsmää',
    plusEdge: '+ {n} reunas.',
    calcNote: 'Muista, että kirjoneule ja palmikot joustavat vähemmän kuin sileä neulos. Tee mallitilkku samalla tekniikalla, jolla aiot neuloa.',
  },
  en: {
    appTitle: 'Knitting Pattern Helper',
    tabKnit: 'Knit',
    tabDesign: 'Design',
    knitIntroTitle: 'Knit from a ready-made chart',
    knitIntroText: 'Upload a chart image and follow it row by row.',
    designIntroTitle: 'Design your own knitting chart',
    designIntroText: 'Size your chart with the calculator and draw it in the editor.',
    makeChart: 'Make chart →',
    editorTitle: 'Chart editor',
    edNewGrid: 'Create new grid',
    edEmpty: 'Create a grid above or with the calculator\'s Make chart button.',
    edPaint: 'Paint',
    edFill: 'Fill area',
    edUndo: '↶ Undo',
    edClear: 'Clear',
    edSizeInfo: '{s} stitches × {r} rows',
    edCellInfo: 'Stitch {s}, row {r}',
    edConfirmReplace: 'A new grid will replace your current chart. Continue?',
    colWhite: 'White',
    colLightGray: 'Light grey',
    colDarkGray: 'Dark grey',
    colBlack: 'Black',
    colRed: 'Red',
    colBlue: 'Blue',
    colYellow: 'Yellow',
    colGreen: 'Green',
    dismiss: 'Dismiss',
    welcomeTitle: 'Welcome!',
    welcome1: 'Upload your chart image and pick a row direction',
    welcome2: 'Drag the blue box to cover the chart area and enter your row count',
    welcome3: 'Use Next / Prev (or Space / Arrow keys) to follow along row by row',
    setupTitle: 'Set up your pattern',
    chartImage: 'Chart image',
    chooseFile: 'Choose image',
    noFile: 'No image chosen',
    rowDirection: 'Row direction',
    bottomUp: 'Bottom to top (standard)',
    topDown: 'Top to bottom',
    nextCalib: 'Next: Set chart area →',
    noFileAlert: 'Please choose a chart image first.',
    rowsLabel: 'Rows:',
    stitchesLabel: 'Stitches:',
    back: '← Back',
    startKnitting: 'Start knitting →',
    calib1: 'Drag the blue box to cover the chart area',
    calib2: 'Resize with the corner & edge handles until it fits precisely',
    calib3: 'Enter your row count and stitch count',
    calib4: 'Click <strong>Start knitting</strong> when you\'re ready!',
    zoomOut: 'Zoom out (-)',
    zoomIn: 'Zoom in (+)',
    fitWidth: 'Fit width',
    row: 'Row',
    recalibrate: 'Recalibrate',
    changeChart: 'Change chart',
    chartAlt: 'Knitting chart',
    prev: '← Prev',
    next: 'Next →',
    calcTitle: 'Smart calculator',
    calcIntro: 'Enter your gauge and target measurements to see how many stitches and rows your chart needs.',
    calcGauge: 'Gauge',
    calcTarget: 'Target size',
    calcResults: 'Results',
    calcStGaugeL: 'Stitches / 10 cm',
    calcRowGaugeL: 'Rows / 10 cm',
    calcWidthL: 'Width (cm)',
    calcHeightL: 'Height (cm)',
    resStitches: 'Stitches',
    resRows: 'Rows',
    resGrid: 'Chart size',
    resReal: 'Estimated size',
    calcFillAll: 'Fill in all fields with positive numbers.',
    calcTotal: 'This chart has about {n} stitches to knit.',
    calcPattern: 'Pattern',
    calcMethod: 'Knitting method',
    methodRound: 'In the round',
    methodFlat: 'Flat',
    calcStRepeatL: 'Repeat (stitches)',
    calcRowRepeatL: 'Repeat (rows)',
    calcEdgeL: 'Edge stitches in total',
    optional: 'optional',
    chooseStitches: 'Choose stitch count',
    chooseRows: 'Choose row count',
    repeatOne: '{n} repeat',
    repeatMany: '{n} repeats',
    fitsExactly: 'exact fit',
    plusEdge: '+ {n} edge',
    calcNote: 'Remember that colourwork and cables have less stretch than plain stockinette. Knit your swatch in the same technique you plan to use.',
  },
};

let lang = 'fi';
const t = key => (I18N[lang] && I18N[lang][key]) ?? I18N.en[key] ?? key;
const locale = () => (lang === 'fi' ? 'fi-FI' : 'en-GB');

function detectLanguage() {
  try {
    const saved = localStorage.getItem('kph-lang');
    if (saved && I18N[saved]) return saved;
  } catch (e) { /* storage unavailable */ }
  const nav = (navigator.language || 'en').toLowerCase();
  return nav.startsWith('fi') ? 'fi' : 'en';
}

function setLanguage(newLang) {
  if (!I18N[newLang]) return;
  lang = newLang;
  try { localStorage.setItem('kph-lang', newLang); } catch (e) { /* ignore */ }
  applyTranslations();
}

function applyTranslations() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    if (el.id === 'fileName' && el.dataset.hasFile) return;
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => el.innerHTML = t(el.dataset.i18nHtml));
  document.querySelectorAll('[data-i18n-title]').forEach(el => el.title = t(el.dataset.i18nTitle));
  document.querySelectorAll('[data-i18n-alt]').forEach(el => el.alt = t(el.dataset.i18nAlt));
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => el.placeholder = t(el.dataset.i18nPlaceholder));
  document.querySelectorAll('.lang-btn').forEach(b => {
    const on = b.dataset.lang === lang;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', on);
  });
  updateCalculator();
  updateEditorUI();
  if (document.getElementById('viewer').style.display === 'flex') updateHighlight();
}


