/* verifica-ordine.js — un cancello solo per «i movimenti sono in ordine e non si ripetono».
 * Mnemosyne, 2026-10-17, per la voce di coda sul riallineamento degli indici.
 *
 * Controlla tre cose insieme, e sono le tre facce dello stesso disordine che Giuseppe
 * ha visto nello scaffale di Metodi:
 *
 *   1. SIGLA   ogni nucleo che una mappa referenzia porta, nel proprio META, la sigla
 *              che quella mappa gli da'. Finche' no, il corso si presenta con due
 *              numerazioni sovrapposte (me-01 nella casa, «Movimento 11» nella pagina).
 *   1b. ID      l'`id:` nella testa /*MOVIMENTO coincide con quello che la mappa da' al
 *              nucleo. Aggiunto il 2026-10-27: il controllo 1 guardava `nn` nel META e
 *              diceva «114/114 allineate» mentre QUATTORDICI nuclei portavano un id
 *              doppiato — `me-01-01`, `ms-05-05` — uscito da uno script di rinumerazione
 *              il 17-10. Un id malformato non si vede leggendo la pagina e rompe ogni
 *              organo che risolve il movimento dal file invece che dalla mappa.
 *   2. INDICE  nessun nucleo finisce con `mov: 0`, che vuol dire: sta nell'indice ed e'
 *              invisibile nell'app.
 *   3. RIMANDI nessun rimando testuale «nucleo NN» nella prosa punta a una sigla che
 *              non esiste piu'. E' la faccia del «si ripetono»: due pagine che dicono
 *              lo stesso numero, o un numero che non designa niente.
 *
 * Stampa un verdetto secco in ultima riga — ORDINATO oppure DA ORDINARE — perche' a
 * leggerlo e' la condizione di fine di una voce della coda, non una persona.
 *
 * USO   node verifica-ordine.js            tutti i corsi
 *       node verifica-ordine.js metodi     un corso solo (i controlli 2 e 3 restano globali)
 */
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const base = path.join(dir, '..');
const cont = path.join(dir, 'contenuti');
const soloCorsi = process.argv.slice(2).filter(a => !a.startsWith('--'));

let guai = 0;

/* 1b. l'`id:` della testa MOVIMENTO contro la mappa (vedi sopra). */
{
  const nuc2mov = {};
  for (const d of fs.readdirSync(path.join(dir, '..'), { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const mp = path.join(dir, '..', d.name, 'mappa.json');
    if (!fs.existsSync(mp)) continue;
    try {
      (JSON.parse(fs.readFileSync(mp, 'utf8')).movimenti || []).forEach(v => {
        if (v.nucleo) nuc2mov[v.nucleo] = v.id;
      });
    } catch (e) { /* lo segnala il controllo 1 */ }
  }
  let storti = 0;
  for (const [html, atteso] of Object.entries(nuc2mov)) {
    const js = path.join(cont, html.replace(/\.html$/, '.js'));
    if (!fs.existsSync(js)) continue;
    const m = fs.readFileSync(js, 'utf8').match(/^id:\s*(\S+)/m);
    if (!m) continue;
    if (m[1] !== atteso) {
      console.log('  id storto: ' + html.replace(/\.html$/, '.js') + ' porta `' + m[1] +
                  '` ma la mappa dice `' + atteso + '`');
      storti++; guai++;
    }
  }
  if (!storti) console.log('  id: tutti coincidono con la mappa');
}
const dice = (s) => console.log(s);

/* ---------- 1. la sigla del META contro la sigla della mappa ---------- */
const SIGLA_DI_FILE = {};        // 'contenuti/11-olomorfe.js' -> 'me-01' (dalla mappa)
const VIVE = new Set();          // tutte le sigle che oggi designano un nucleo
for (const d of fs.readdirSync(base)) {
  const mp = path.join(base, d, 'mappa.json');
  if (!fs.existsSync(mp)) continue;
  if (soloCorsi.length && !soloCorsi.includes(d)) continue;
  for (const m of JSON.parse(fs.readFileSync(mp, 'utf8')).movimenti || []) {
    const nucleo = (m.nucleo || '').trim();
    if (!nucleo) continue;
    SIGLA_DI_FILE[nucleo.replace(/\.html$/, '.js')] = m.id;
  }
}
let fuori = 0;
for (const [js, atteso] of Object.entries(SIGLA_DI_FILE)) {
  const p = path.join(cont, js);
  if (!fs.existsSync(p)) { dice('  ! manca il contenuto ' + js); guai++; continue; }
  const m = fs.readFileSync(p, 'utf8').match(/\/\*META\s*([\s\S]*?)META\*\//);
  if (!m) { dice('  ! ' + js + ': nessun META'); guai++; continue; }
  let nn;
  try { nn = JSON.parse(m[1]).nn; } catch (e) { dice('  ! ' + js + ': META illeggibile'); guai++; continue; }
  if (nn !== atteso) { dice('  SIGLA  ' + js.padEnd(38) + 'dichiara «' + nn + '», la mappa dice «' + atteso + '»'); fuori++; }
}
if (fuori) guai += fuori;
dice('  sigle: ' + (Object.keys(SIGLA_DI_FILE).length - fuori) + '/' +
     Object.keys(SIGLA_DI_FILE).length + ' allineate alla mappa');

/* ---------- 2. nessun nucleo invisibile nell'app ---------- */
const vIdx = path.join(base, 'nuclei-indice.json');
if (!fs.existsSync(vIdx)) { dice('  ! nuclei-indice.json assente: rigenerarlo'); guai++; }
else {
  const idx = JSON.parse(fs.readFileSync(vIdx, 'utf8'));
  idx.nuclei.forEach(n => { if (n.nn) VIVE.add(n.nn); });
  const ciechi = idx.nuclei.filter(n => !n.mov);
  if (ciechi.length) {
    dice('  INDICE ' + ciechi.length + ' nuclei con mov:0 (invisibili nell\'app): ' +
         ciechi.map(n => n.nn).join(', '));
    guai += ciechi.length;
  } else dice('  indice: nessun nucleo invisibile (' + idx.nuclei.length + ' nuclei)');
}

/* ---------- 3. i rimandi testuali puntano a sigle che esistono ---------- */
let morti = 0;
const perFile = {};
for (const f of fs.readdirSync(cont).filter(x => x.endsWith('.js'))) {
  const s = fs.readFileSync(path.join(cont, f), 'utf8');
  const re = /nucle[oi]\s+((?:[a-z]{2}-)?\d\d[a-z]?)(?![0-9a-z])/g;
  let m;
  while ((m = re.exec(s)) !== null) {
    if (!VIVE.has(m[1])) { morti++; perFile[f] = (perFile[f] || 0) + 1; }
  }
}
if (morti) {
  dice('  RIMANDI ' + morti + ' rimandi a sigle che non esistono piu\':');
  for (const [f, n] of Object.entries(perFile).sort((a, b) => b[1] - a[1]).slice(0, 8))
    dice('     ' + f.padEnd(40) + n);
  guai += morti;
} else dice('  rimandi: nessuno punta a una sigla inesistente');

dice('');
dice(guai ? 'DA ORDINARE' : 'ORDINATO');
process.exit(0);
