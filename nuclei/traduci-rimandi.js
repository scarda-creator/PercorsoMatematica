/* traduci-rimandi.js — i rimandi testuali «nucleo NN» chiamano i nuclei con la sigla
 * che hanno oggi, non con quella che avevano quando la frase e' stata scritta.
 * Mnemosyne, 2026-10-17.
 *
 * PERCHE' ESISTE
 *   Riallineando le sigle di Metodi e Meccanica Statistica alla mappa (11 -> me-01,
 *   12b -> me-03, 22 -> ms-05 …) sono diventati sbagliati 189 rimandi che stavano
 *   nella prosa della prima epoca: «la mossa e' quella del nucleo 12», «principio del
 *   massimo, nucleo 12». Prima puntavano a una sigla che esisteva; ora puntano a un
 *   numero che non designa piu' niente, e `audit-rimandi.js` li dichiara INESISTENTI.
 *
 *   Il debito era gia' li' — il PARADIGMA vieta i rimandi fra movimenti e vuole al
 *   loro posto i pop-up degli strumenti — e riscriverli uno per uno e' lavoro di
 *   prosa, cioe' della coda, movimento per movimento. Ma rendere SBAGLIATO un rimando
 *   che prima era solo vietato e' un danno che ho fatto io riallineando, e si chiude
 *   qui: la traduzione non tocca il senso della frase, scambia un'etichetta con
 *   l'etichetta corrente dello STESSO nucleo.
 *
 * COME SA CHI E' CHI
 *   Non da una tabella scritta a mano: dalle mappe. Un movimento che si chiama `me-03`
 *   e punta al file `12b-laurent.html` dice, con quelle due informazioni insieme, che
 *   «12b» e «me-03» sono due nomi dello stesso nucleo. Si traduce solo quando il nome
 *   del file porta una sigla numerica e la mappa ne dichiara una diversa.
 *
 * USO
 *   node traduci-rimandi.js --secco     conta, non scrive
 *   node traduci-rimandi.js            scrive e rimonta i nuclei toccati
 */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const dir = __dirname;
const base = path.join(dir, '..');
const cont = path.join(dir, 'contenuti');
const secco = process.argv.includes('--secco');

/* vecchia sigla (dal nome del file) -> sigla di oggi (dalla mappa del corso) */
const TRAD = {};
for (const d of fs.readdirSync(base)) {
  const mp = path.join(base, d, 'mappa.json');
  if (!fs.existsSync(mp)) continue;
  for (const m of JSON.parse(fs.readFileSync(mp, 'utf8')).movimenti || []) {
    const nucleo = (m.nucleo || '').trim();
    if (!nucleo) continue;
    const f = nucleo.match(/^(\d\d[a-z]?)-/);          // solo i nomi di file numerici
    if (f && f[1] !== m.id) TRAD[f[1]] = m.id;
  }
}
const sigle = Object.keys(TRAD).sort((a, b) => b.length - a.length);  // «12b» prima di «12»
if (!sigle.length) { console.log('== traduci-rimandi ==  nessuna sigla da tradurre.'); process.exit(0); }

console.log('== traduci-rimandi ==' + (secco ? '  (SECCO)' : ''));
console.log('  dizionario: ' + sigle.map(s => s + '->' + TRAD[s]).join(' · '));

/* «nucleo 12», «nuclei 12 e 13», «dal nucleo 07»: si traduce solo il numero che segue
   la parola nucleo/nuclei, mai un numero nudo — in questa prosa i numeri sono anche
   pagine, tappe, esponenti e anni, e una sostituzione cieca li toccherebbe tutti. */
const toccati = [];
let totale = 0;
for (const f of fs.readdirSync(cont).filter(x => x.endsWith('.js'))) {
  const p = path.join(cont, f);
  let s = fs.readFileSync(p, 'utf8');
  const prima = s;
  let n = 0;
  for (const v of sigle) {
    const re = new RegExp('(nucle[oi]\\s+)' + v + '(?![0-9a-z])', 'g');
    s = s.replace(re, (m0, pre) => { n++; return pre + TRAD[v]; });
  }
  if (n) {
    totale += n;
    console.log('  ' + f.padEnd(40) + n + ' rimand' + (n === 1 ? 'o' : 'i'));
    if (!secco) { fs.writeFileSync(p, s); toccati.push(f); }
  }
  void prima;
}
console.log('  totale: ' + totale + ' rimandi tradotti in ' +
            (secco ? '(secco)' : toccati.length + ' file'));
if (secco || !toccati.length) process.exit(0);

for (const f of toccati) {
  const r = cp.spawnSync(process.execPath, [path.join(dir, 'assembla-nucleo.js'), path.join('contenuti', f)],
    { cwd: dir, encoding: 'utf8' });
  if (r.status !== 0) console.log('  ! rimontaggio fallito per ' + f + ': ' + (r.stderr || '').trim().slice(0, 120));
}
console.log('  rimontati ' + toccati.length + ' nuclei. Ora: node indice-nuclei.js');
