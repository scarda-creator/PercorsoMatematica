/* estrai-contenuto.js — l'inverso esatto di assembla-nucleo.js.
 * Dedalo, 2026-09-12.
 *
 * PERCHE' ESISTE. I nuclei 00-09 sono nati prima dell'assemblatore (21-07) e portano
 * l'impalcatura dentro: sono monolitici. I nuclei 10-22 hanno il contenuto separato in
 * `contenuti/NN.js` e l'HTML si rigenera. Finche' i primi dieci restano monolitici,
 * ogni lavoro su di loro e' lavoro a mano dentro 100kB di HTML — ed e' esattamente il
 * modo in cui si propagano i difetti che l'assemblatore era nato per fermare.
 *
 * E porta una risposta, che vale piu' dello script. Stavo per delegare questa
 * conversione a un modello debole via OmniRoute. **Non e' lavoro da modello**: il META
 * si ricava dall'HTML stesso e il corpo di TAPPE si taglia fra due indici. Un modello,
 * anche forte, qui puo' solo introdurre errori che una `slice` non fa — e costa. Il
 * primo strato della piramide non e' «il modello piu' economico»: e' **nessun modello**.
 *
 * La prova che l'estrazione e' fedele non e' che il file «sembra giusto»: si estrae, si
 * riassembla, e si controlla che la SOSTANZA sia tutta ancora li'.
 *
 * Non byte per byte, e la ragione e' misurata: i nuclei su disco sono stati montati con
 * un template che da allora e' cresciuto (le schede-strumento), quindi rimontarli li
 * AGGIORNA — 34.889 byte contro 38.964 sul nucleo 22, e la differenza e' tutta
 * impalcatura nuova. Pretendere l'identita' byte a byte vorrebbe dire dichiarare rotta
 * un'estrazione perfetta. Il criterio e' invece: il corpo delle tappe ricompare verbatim
 * nel rimontato, e nessuna tappa e' sparita per strada. L'originale torna sempre al suo
 * posto: questo script non aggiorna niente, misura soltanto.
 *
 * Uso:
 *   node estrai-contenuto.js 00-topologia.html          # estrae e verifica il giro
 *   node estrai-contenuto.js --tutti                    # tutti i monolitici
 *   node estrai-contenuto.js 00-topologia.html --prova  # verifica soltanto, non scrive
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const DIR = __dirname;
const CONT = path.join(DIR, 'contenuti');

/* Il corpo di TAPPE sta fra `var TAPPE = [` e la riga `];` che lo chiude allo stesso
 * livello di parentesi. Contarle a mano invece di usare una regex: dentro ci sono
 * `[` e `]` a decine, dentro stringhe e dentro LaTeX, e una regex non distingue. */
function corpoTappe(html) {
  const apre = html.indexOf('var TAPPE = [');
  if (apre < 0) return null;
  let i = apre + 'var TAPPE = ['.length;
  const inizio = i;
  let liv = 1, s = null, esc = false, cmt = null;
  while (i < html.length && liv > 0) {
    const c = html[i], due = html.substr(i, 2);
    if (esc) { esc = false; i++; continue; }
    if (s) {
      if (c === '\\') esc = true;
      else if (c === s) s = null;
      i++; continue;
    }
    if (cmt) {
      if (cmt === '//' && c === '\n') cmt = null;
      else if (cmt === '/*' && due === '*/') { cmt = null; i += 2; continue; }
      i++; continue;
    }
    if (due === '//' || due === '/*') { cmt = due; i += 2; continue; }
    if (c === '"' || c === "'" || c === '`') { s = c; i++; continue; }
    if (c === '[') liv++;
    else if (c === ']') liv--;
    i++;
  }
  if (liv !== 0) return null;
  return { testo: html.slice(inizio, i - 1), da: apre, a: i };
}

function fraTag(html, tag) {
  const m = html.match(new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)</' + tag + '>'));
  return m ? m[1].trim() : null;
}

/* Il META non si inventa: ogni campo si legge da dove il template lo aveva messo. */
function meta(html, file) {
  const nn = (file.match(/^(\d+[a-z]?)/) || [])[1];
  const titolo = fraTag(html, 'title');
  const banner = fraTag(html, 'div class="banner"') ||
                 (html.match(/<div class="banner"[^>]*>([\s\S]*?)<\/div>/) || [])[1];
  const nome = (html.match(/data-nome="([^"]*)"/) || [])[1] ||
               (titolo && titolo.split('—').slice(1).join('—').trim()) || titolo;
  return { nn, file, titolo, nome, banner: banner && banner.trim() };
}

function estrai(file, soloProva) {
  const via = path.join(DIR, file);
  const html = fs.readFileSync(via, 'utf8');
  const c = corpoTappe(html);
  if (!c) return { file, ok: false, perche: 'non trovo il corpo di var TAPPE = [ … ];' };

  const M = meta(html, file);
  for (const k of ['nn', 'titolo', 'nome', 'banner']) {
    if (!M[k]) return { file, ok: false, perche: 'campo META non ricavabile dall\'HTML: ' + k };
  }

  const fuori = path.join(CONT, file.replace(/\.html$/, '.js'));
  const testo = '/*META\n' + JSON.stringify(M, null, 1) + '\nMETA*/\n' + c.testo;

  // il giro: si scrive in un posto di prova, si riassembla, si misura cosa e' arrivato.
  const prova = fuori + '.prova';
  fs.mkdirSync(CONT, { recursive: true });
  fs.writeFileSync(prova, testo);
  const salvato = html;
  let delta = 0;
  try {
    execFileSync(process.execPath, [path.join(DIR, 'assembla-nucleo.js'), prova],
                 { cwd: DIR, stdio: 'pipe' });
    const rigenerato = fs.readFileSync(via, 'utf8');
    fs.writeFileSync(via, salvato);           // l'originale torna sempre al suo posto
    fs.unlinkSync(prova);
    delta = rigenerato.length - salvato.length;

    if (rigenerato.indexOf(c.testo) < 0) {
      return { file, ok: false, perche: 'il corpo delle tappe non ricompare verbatim nel ' +
               'rimontato: l\'estrazione ha tagliato o alterato qualcosa' };
    }
    const a = tappeNum(salvato), b = tappeNum(rigenerato);
    if (a.join(',') !== b.join(',')) {
      return { file, ok: false, perche: 'tappe diverse fra originale e rimontato:\n' +
               '    originale:  ' + a.join(' ') + '\n    rimontato:  ' + b.join(' ') };
    }
    if (!a.length) {
      return { file, ok: false, perche: 'zero tappe riconosciute: la forma del file non e\' ' +
               'quella che questo script sa leggere, e un contatore a zero non e\' un\'assenza' };
    }
  } catch (e) {
    try { fs.writeFileSync(via, salvato); } catch (_) {}
    try { fs.unlinkSync(prova); } catch (_) {}
    return { file, ok: false, perche: 'l\'assemblatore ha rifiutato: ' +
             String(e.stderr || e.message).trim().split('\n')[0] };
  }

  if (!soloProva) fs.writeFileSync(fuori, testo);
  return { file, ok: true, dove: path.relative(DIR, fuori), byte: testo.length,
           tappe: tappeNum(salvato).length, delta: delta, scritto: !soloProva };
}

/* I `num:'NN'` di primo livello. Servono a dire «non ne ho persa nessuna» senza
 * eseguire il contenuto, che contiene R`...` e non si puo' valutare qui. */
function tappeNum(t) {
  return [...t.matchAll(/\bnum\s*:\s*'([^']+)'/g)].map(x => x[1]);
}

function main() {
  const arg = process.argv.slice(2);
  const soloProva = arg.includes('--prova');
  let files = arg.filter(a => !a.startsWith('--'));
  if (arg.includes('--tutti') || !files.length) {
    files = fs.readdirSync(DIR).filter(f => /^\d+[a-z]?-.*\.html$/.test(f))
              .filter(f => !fs.existsSync(path.join(CONT, f.replace(/\.html$/, '.js'))));
  }
  if (!files.length) { console.log('nessun nucleo monolitico: tutti hanno gia\' il contenuto separato'); return 0; }

  let rotti = 0;
  for (const f of files) {
    const r = estrai(f, soloProva);
    if (r.ok) console.log('  OK   %s -> %s  (%d byte, %d tappe; rimontato %s%d)%s',
                          f, r.dove, r.byte, r.tappe,
                          r.delta >= 0 ? '+' : '', r.delta,
                          r.scritto ? '' : '  [solo prova, non scritto]');
    else { rotti++; console.log('  NO   %s — %s', f, r.perche); }
  }
  console.log('\n%d su %d passano il round-trip.', files.length - rotti, files.length);
  return rotti ? 1 : 0;
}

process.exit(main());
