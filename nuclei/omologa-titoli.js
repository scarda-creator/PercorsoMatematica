/* omologa-titoli.js — un solo modo di scrivere il titolo di un movimento.
 * Dedalo, 2026-09-19. Giuseppe: «aggiustassi e omologassi tutti i titoli dei nuclei…
 * controlla anche le formule nei titoli, vedo che spesso si rompono».
 *
 * COS'ERA ROTTO (sui 63 titoli veri, non in astratto)
 *   - due intestazioni diverse: «PERCORSO-MATEMATICA · Movimento II · Nucleo 09 — …
 *     · Metodi Matematici della Fisica» accanto a «TENGRI · Elettromagnetismo ·
 *     Movimento em-06 — …». Due epoche di costruzione rimaste sovrapposte;
 *   - accenti in ASCII: «perche'», «meta'» — testo valido, quindi nessun controllo
 *     li vedeva, e si leggevano solo a occhio;
 *   - apostrofo dritto in 11 titoli e tipografico negli altri;
 *   - matematica scritta in tre modi: `R^n` (mai reso: in un titolo il LaTeX non lo
 *     tocca nessuno), `Rⁿ`, `Lp`;
 *   - `&amp;` dove tutti gli altri scrivono «e», e uno «0 —» dove gli altri hanno «00 —».
 *
 * LA FORMA UNICA
 *   titolo:  Movimento <sigla> — <Corpo>
 *   nome:    <Corpo>
 *   banner:  TENGRI · <Campo> · Movimento <b><sigla> — <Corpo></b>
 *   dove <sigla> e' quella che il movimento gia' porta (em-06, 12b, 02-bis…), e
 *   <Campo> viene dalla sezione dell'indice: nessuno dei due si inventa qui.
 *
 * PERCHE' TOCCA LE SORGENTI E NON GLI HTML
 *   `indice-nuclei.js` copia il banner dell'HTML nell'indice, e lo scaffale, l'app e
 *   la mappa leggono l'indice. Ma l'HTML lo rigenera `assembla-nucleo.js` dal META in
 *   `contenuti/`: correggere l'HTML vorrebbe dire correggere una copia, e ritrovarsi
 *   il titolo vecchio al primo rimontaggio.
 *
 * USO
 *   node omologa-titoli.js --secco   dice cosa cambierebbe, senza scrivere
 *   node omologa-titoli.js           riscrive i META e rimonta i nuclei toccati
 */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const dir = __dirname;
const cont = path.join(dir, 'contenuti');
const secco = process.argv.includes('--secco');

/* Il campo di appartenenza viene dalla sezione dell'indice: e' la stessa divisione
   per campo su cui e' costruito lo scaffale, quindi non puo' divergerne. */
const CAMPO = {
  1: 'Analisi Vettoriale', 2: 'Analisi Vettoriale',
  3: 'Metodi e Modelli', 4: 'Metodi e Modelli',
  5: 'Meccanica',
  6: 'Meccanica Statistica', 9: 'Meccanica Statistica',
  7: 'Geometria',
  8: 'Elettromagnetismo',
  10: 'Geometria Differenziale'
};
let MOV = {};
try {
  const idx = JSON.parse(fs.readFileSync(path.join(dir, '..', 'nuclei-indice.json'), 'utf8'));
  idx.nuclei.forEach(n => { if (n.nn) MOV[n.nn] = n.mov; });
} catch (e) { console.error('indice non leggibile: ' + e.message); process.exit(2); }

/* --- le regole, una per riga, tutte reversibili a mente --- */
const ENTITA = {
  '&amp;': '&', '&mdash;': '—', '&ndash;': '–', '&laquo;': '«', '&raquo;': '»',
  '&rsquo;': '’', '&lsquo;': '‘', '&nbsp;': ' ', '&agrave;': 'à', '&egrave;': 'è',
  '&eacute;': 'é', '&igrave;': 'ì', '&ograve;': 'ò', '&ugrave;': 'ù',
  '&sup2;': '²', '&sup3;': '³', '&deg;': '°', '&times;': '×', '&middot;': '·'
};
const ACCENTI = {
  "perche'": 'perché', "poiche'": 'poiché', "benche'": 'benché', "finche'": 'finché',
  "affinche'": 'affinché', "nonche'": 'nonché', "cioe'": 'cioè', "e'": 'è',
  "piu'": 'più', "cosi'": 'così', "gia'": 'già', "pero'": 'però', "percio'": 'perciò',
  "puo'": 'può', "meta'": 'metà', "qualita'": 'qualità', "verita'": 'verità',
  "liberta'": 'libertà', "realta'": 'realtà', "unita'": 'unità', "attivita'": 'attività',
  "identita'": 'identità', "possibilita'": 'possibilità', "probabilita'": 'probabilità',
  "densita'": 'densità', "velocita'": 'velocità', "quantita'": 'quantità',
  "necessita'": 'necessità', "sara'": 'sarà', "verra'": 'verrà', "fara'": 'farà',
  "andra'": 'andrà', "citta'": 'città'
};
/* La matematica di un titolo non viene mai renderizzata: si scrive in unicode o non
   si scrive. `$R^n$` in un titolo resta scritto `$R^n$` sotto gli occhi di chi legge. */
const MATE = [
  [/\$([^$]*)\$/g, '$1'],            // via i dollari: qui dentro non rendono nulla
  // niente \b dopo un apice unicode: `ⁿ` non e' un carattere di parola e il confine
  // non scatta mai — la sostituzione sembrava fatta e non lo era
  [/\bR\^n\b/g, 'ℝⁿ'], [/\bR\^\{n\}/g, 'ℝⁿ'], [/\bRⁿ/g, 'ℝⁿ'],
  [/\bR\^2\b/g, 'ℝ²'], [/\bR\^3\b/g, 'ℝ³'], [/\bR²/g, 'ℝ²'], [/\bR³/g, 'ℝ³'],
  [/\bS\^1\b/g, 'S¹'], [/\bS\^2\b/g, 'S²'], [/\bS\^3\b/g, 'S³'],
  [/\bL\^2\b/g, 'L²'], [/\bL\^p\b/g, 'Lᵖ'], [/\bLp\b/g, 'Lᵖ'],
  [/\bL<sup>p<\/sup>/g, 'Lᵖ'], [/\bL<sup>2<\/sup>/g, 'L²']
];
/* I cognomi accoppiati portano il trattino lungo. Tabella esplicita e non regola
   automatica: «coarse-graining» non e' due fisici. */
const COPPIE = ['Cauchy-Riemann', 'Sturm-Liouville', 'Gram-Schmidt', 'Bose-Einstein',
  'Fermi-Dirac', 'Maxwell-Boltzmann', 'Biot-Savart', 'Clausius-Mossotti',
  'Lennard-Jones', 'Gibbs-Duhem', 'Navier-Stokes', 'Levi-Civita'];

function normalizza(t) {
  t = String(t || '');
  for (const e in ENTITA) t = t.split(e).join(ENTITA[e]);
  t = t.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
  for (const a in ACCENTI) {
    t = t.replace(new RegExp('\\b' + a.slice(0, -1).replace(/'/g, "\\'") + "'", 'gi'),
      m => (m[0] === m[0].toUpperCase() ? ACCENTI[a][0].toUpperCase() + ACCENTI[a].slice(1) : ACCENTI[a]));
  }
  MATE.forEach(([re, to]) => { t = t.replace(re, to); });
  COPPIE.forEach(c => { t = t.split(c).join(c.replace('-', '–')); });
  t = t.replace(/([A-Za-zàèéìòùÀÈÉÌÒÙ])'([A-Za-zàèéìòù])/g, '$1’$2'); // apostrofo tipografico
  t = t.replace(/\s+&\s+/g, ' e ');                                   // «Hilbert & Fourier»
  t = t.replace(/\s*[-–]\s*[-–]\s*/g, ' — ').replace(/\s+/g, ' ').trim();
  return t;
}

function spezza(titolo) {
  /* «Nucleo 09 — Hilbert…» / «Movimento em-06 — L'energia…» -> sigla + corpo */
  let t = normalizza(titolo).replace(/^(?:Nucleo|Movimento)\s+/i, '');
  const i = t.indexOf(' — ');
  if (i < 0) return { sigla: null, corpo: t };
  let sigla = t.slice(0, i).trim();
  let corpo = t.slice(i + 3).trim();
  if (/^\d$/.test(sigla)) sigla = '0' + sigla;      // «0 —» dove tutti gli altri hanno «00 —»
  corpo = corpo.charAt(0).toUpperCase() + corpo.slice(1);
  return { sigla, corpo };
}

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

let tocchi = [], guasti = [];
for (const f of fs.readdirSync(cont).filter(x => x.endsWith('.js'))) {
  const p = path.join(cont, f);
  const src = fs.readFileSync(p, 'utf8');
  const m = src.match(/\/\*META\s*([\s\S]*?)\s*META\*\//);
  if (!m) { guasti.push(f + ': niente header META'); continue; }
  let C;
  try { C = JSON.parse(m[1]); } catch (e) { guasti.push(f + ': META non e\' JSON — ' + e.message); continue; }

  const { sigla, corpo } = spezza(C.titolo);
  if (!sigla) { guasti.push(f + ': titolo senza sigla («' + C.titolo + '»)'); continue; }
  if (/[\\]/.test(corpo)) { guasti.push(f + ': backslash nel titolo, va riscritto a mano — «' + corpo + '»'); continue; }

  const mov = MOV[C.nn];
  const campo = CAMPO[mov];
  if (!campo) { guasti.push(f + ': nn «' + C.nn + '» non e\' in nessuna sezione dell\'indice'); continue; }

  const nuovo = {
    titolo: 'Movimento ' + sigla + ' — ' + corpo,
    nome: corpo,
    banner: 'TENGRI · ' + campo + ' · Movimento <b>' + esc(sigla) + ' — ' + esc(corpo) + '</b>'
  };
  if (C.titolo === nuovo.titolo && C.nome === nuovo.nome && C.banner === nuovo.banner) continue;

  const prima = C.titolo;
  Object.assign(C, nuovo);
  tocchi.push({ f, html: C.file, prima, dopo: nuovo.titolo });
  if (!secco) {
    fs.writeFileSync(p, src.slice(0, m.index) + '/*META\n' + JSON.stringify(C, null, 1) +
      '\nMETA*/' + src.slice(m.index + m[0].length));
  }
}

console.log('== omologa-titoli ==');
tocchi.forEach(t => { console.log('  ' + t.f + '\n      prima: ' + t.prima + '\n      dopo:  ' + t.dopo); });
console.log('\n' + tocchi.length + ' titoli riscritti' + (secco ? ' (--secco: non scrivo)' : ''));
if (guasti.length) { console.log('\nDA GUARDARE A MANO (' + guasti.length + '):'); guasti.forEach(g => console.log('  ! ' + g)); }

if (!secco && tocchi.length) {
  console.log('\nrimonto i nuclei toccati…');
  let ko = 0;
  for (const t of tocchi) {
    const r = cp.spawnSync(process.execPath, [path.join(dir, 'assembla-nucleo.js'),
      path.join(cont, t.f)], { encoding: 'utf8' });
    if (r.status !== 0) { ko++; console.log('  x ' + t.f + ': ' + (r.stderr || '').trim().split('\n')[0]); }
  }
  console.log('  rimontati ' + (tocchi.length - ko) + '/' + tocchi.length);
  if (ko) process.exit(1);
}
process.exit(guasti.length ? 1 : 0);
