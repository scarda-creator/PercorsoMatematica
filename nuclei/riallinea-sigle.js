/* riallinea-sigle.js — la sigla di un nucleo e' quella che la mappa del corso gli da'.
 * Mnemosyne, 2026-10-17. Giuseppe: «fai un check al corso di metodi? i movimenti sono
 * tutti mischiati e si ripetono, metti un po' d'ordine».
 *
 * COS'ERA MISCHIATO (misurato su Metodi, non in astratto)
 *   La mappa di Metodi dichiara sedici movimenti me-00…me-12. Undici di quei movimenti
 *   puntano a nuclei nati per Analisi Vettoriale, che hanno conservato la sigla di
 *   allora: `me-01` apriva una pagina intitolata «Movimento 11», `me-03` una intitolata
 *   «Movimento 12b», `me-11` una intitolata «Movimento 17». Nello scaffale dell'app,
 *   che legge il titolo dall'indice, Metodi compariva quindi con due numerazioni
 *   sovrapposte — 11, 12, 12b, 13, 14, 19, 15, 16, 17 accanto a me-00, me-08, me-09b,
 *   me-10b, me-12 — ordinate alfabeticamente: i numeri complessi, che sono il PRIMO
 *   movimento del corso, finivano in fondo alla sezione, dopo i residui.
 *
 *   E due voci dicevano lo stesso numero: `14-continuazione` si intitolava «14 — …» e
 *   `19-asintotica` «14-bis — …». Due pagine diverse, due sigle diverse (14 e 19), lo
 *   stesso numero stampato in testa. Ecco il «si ripetono»: non erano duplicati, erano
 *   due etichette che mentivano.
 *
 * COSA FA, E COSA NON FA
 *   Allinea `nn`, `titolo` e `banner` del META — e la riga `id:` della testa
 *   /*MOVIMENTO — alla sigla che il movimento ha nella mappa del suo corso, e rimonta
 *   l'HTML. Aggiorna anche la tabella `MOVIMENTI` di `indice-nuclei.js`, dove la chiave
 *   e' la sigla: senza quel passo i nuclei rinominati finirebbero con `mov: 0`, cioe'
 *   nell'indice e invisibili nell'app.
 *
 *   NON rinomina i FILE. I nomi dei file sono citati da `copertura-esame.html`,
 *   `mappa-percorso.html`, `ragnatela-dati.js`, dal campo `pieno.file` delle schede
 *   degli strumenti e da qualunque indirizzo che Giuseppe abbia salvato: rinominarli e'
 *   una decisione sua, non una riparazione. La sigla visibile e il nome del file possono
 *   divergere senza che niente si rompa — e' il titolo che lui legge.
 *
 * USO
 *   node riallinea-sigle.js --secco metodi      dice cosa cambierebbe
 *   node riallinea-sigle.js metodi              scrive e rimonta
 *   (senza nome di corso: passa tutte le mappe)
 */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const dir = __dirname;                         // …/nuclei
const base = path.join(dir, '..');             // …/percorso-matematica
const cont = path.join(dir, 'contenuti');
const secco = process.argv.includes('--secco');
const corsi = process.argv.slice(2).filter(a => !a.startsWith('--'));

/* Il campo di appartenenza, per il banner: la stessa tabella di omologa-titoli.js,
   perche' due tabelle che dicono la stessa cosa divergono al primo cambiamento. */
const CAMPO = {
  'analisi-vettoriale': 'Analisi Vettoriale',
  'metodi': 'Metodi e Modelli',
  'metodi-e-modelli': 'Metodi e Modelli',
  'meccanica': 'Meccanica',
  'meccanica-statistica': 'Meccanica Statistica',
  'geometria': 'Geometria',
  'elettromagnetismo': 'Elettromagnetismo',
  'geometria-differenziale': 'Geometria Differenziale',
  'meccanica-quantistica': 'Meccanica Quantistica',
  'astrofisica': 'Astrofisica',
  'topologia': 'Topologia'
};

function mappeDaFare() {
  const tutte = fs.readdirSync(base)
    .filter(d => fs.existsSync(path.join(base, d, 'mappa.json')));
  return (corsi.length ? tutte.filter(d => corsi.includes(d)) : tutte);
}

/* contenuti/<slug>.js a partire dal nome dell'HTML dichiarato nella mappa */
function sorgenteDi(nucleoHtml) {
  const js = nucleoHtml.replace(/\.html$/, '.js');
  const p = path.join(cont, js);
  return fs.existsSync(p) ? p : null;
}

const cambi = [];                              // {file, da, a, corso}

for (const corso of mappeDaFare()) {
  const mappa = JSON.parse(fs.readFileSync(path.join(base, corso, 'mappa.json'), 'utf8'));
  for (const mov of (mappa.movimenti || [])) {
    const nucleo = (mov.nucleo || '').trim();
    if (!nucleo) continue;                     // non ancora scritto: niente da allineare
    const src = sorgenteDi(nucleo);
    if (!src) { console.log('  ! ' + corso + '/' + mov.id + ': manca ' + nucleo.replace(/\.html$/, '.js')); continue; }
    const testo = fs.readFileSync(src, 'utf8');
    const mMeta = testo.match(/\/\*META\s*([\s\S]*?)META\*\//);
    if (!mMeta) { console.log('  ! ' + src + ': nessun blocco META'); continue; }
    let meta;
    try { meta = JSON.parse(mMeta[1]); }
    catch (e) { console.log('  ! ' + src + ': META illeggibile (' + e.message + ')'); continue; }
    if (meta.nn === mov.id) continue;           // gia' allineato: idempotente
    cambi.push({ src, nucleo, meta, metaGrezzo: mMeta[1], da: meta.nn, a: mov.id, corso });
  }
}

if (!cambi.length) {
  console.log('== riallinea-sigle ==  niente da fare: ogni nucleo porta la sigla della sua mappa.');
  process.exit(0);
}

console.log('== riallinea-sigle ==' + (secco ? '  (SECCO: non scrivo)' : ''));
const toccati = [];
for (const c of cambi) {
  const campo = CAMPO[c.meta.corso] || CAMPO[c.corso] || c.corso;
  /* Il corpo del titolo e' cio' che sta dopo il primo em-dash: la sigla vecchia sta
     prima, e non si prova a indovinarla con un regex sulla sigla (era «14-bis» in un
     caso, cioe' nemmeno uguale al suo `nn`). Si taglia al separatore, che e' unico. */
  const vecchio = c.meta.titolo || '';
  const i = vecchio.indexOf('—');
  const corpo = (i >= 0 ? vecchio.slice(i + 1) : vecchio).trim();
  const titolo = 'Movimento ' + c.a + ' — ' + corpo;
  const banner = 'TENGRI · ' + campo + ' · Movimento <b>' + c.a + ' — ' + corpo + '</b>';
  console.log('  ' + c.corso.padEnd(10) + String(c.da).padEnd(7) + ' -> ' +
              String(c.a).padEnd(7) + ' ' + corpo.slice(0, 56));
  if (secco) continue;

  const nuovoMeta = Object.assign({}, c.meta, { nn: c.a, titolo, banner });
  let testo = fs.readFileSync(c.src, 'utf8');
  testo = testo.replace(/\/\*META\s*[\s\S]*?META\*\//,
    '/*META\n' + JSON.stringify(nuovoMeta, null, 1) + '\nMETA*/');
  /* la testa /*MOVIMENTO porta la stessa sigla nella riga `id:`: se resta quella
     vecchia, il nucleo dice due cose di se' in due punti della stessa pagina. */
  testo = testo.replace(/(\/\*MOVIMENTO[\s\S]{0,40}?id:\s*)([^\s—-]+)/,
    (m, pre, sigla) => pre + c.a);
  fs.writeFileSync(c.src, testo);
  toccati.push(c);
}

if (secco) process.exit(0);

/* La tabella MOVIMENTI di indice-nuclei.js e' indicizzata per sigla: la chiave vecchia
   va sostituita, non aggiunta, altrimenti resta una riga che non corrisponde a nessun
   nucleo e il nucleo nuovo prende `mov: 0` — dentro l'indice e invisibile nell'app. */
const vIdx = path.join(dir, 'indice-nuclei.js');
let idx = fs.readFileSync(vIdx, 'utf8');
let sostituite = 0;
for (const c of toccati) {
  const re = new RegExp("'" + c.da.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "'(\\s*):");
  if (re.test(idx)) { idx = idx.replace(re, "'" + c.a + "'$1:"); sostituite++; }
  else console.log('  ! la tabella MOVIMENTI non aveva la chiave ' + c.da + ' — da guardare a mano');
}
fs.writeFileSync(vIdx, idx);
console.log('  tabella MOVIMENTI: ' + sostituite + ' chiavi riscritte');

for (const c of toccati) {
  const r = cp.spawnSync(process.execPath,
    [path.join(dir, 'assembla-nucleo.js'), path.join('contenuti', path.basename(c.src))],
    { cwd: dir, encoding: 'utf8' });
  console.log('  ' + (r.stdout || r.stderr || '').trim());
}
console.log('  ora: node indice-nuclei.js  e  casa-corso.py sulle mappe toccate');
