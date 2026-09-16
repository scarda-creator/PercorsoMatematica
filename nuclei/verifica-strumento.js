/* verifica-strumento.js — la scheda si apre e si misura, non si chiede a nessuno se va bene.
 * Dedalo, 2026-09-12.
 *
 * PERCHE' ESISTE, e la ragione e' misurata due volte. Il 10 settembre un modello ha
 * dichiarato di aver scritto un file di 52.347 caratteri che non esisteva; il 12, sulla
 * stessa catena, ne ha scritto uno vero solo perche' il compito era minimo. Non e' un
 * modello cattivo: e' che un generatore DEGRADA IN MILLANTERIA quando il compito cresce,
 * e la millanteria e' invisibile a chi legge il riassunto invece del disco.
 *
 * La conseguenza di progetto non e' cercare un modello migliore. E' rendere IRRILEVANTE
 * cio' che il generatore dichiara: qui conta solo cosa c'e' nel file. Questo e' lo strato
 * che rende sicuro delegare — senza, delegare e' scommettere.
 *
 * Uso:
 *   node verifica-strumento.js strumenti/serie-geometrica.json
 *   node verifica-strumento.js --tutte
 *   node verifica-strumento.js --json          # per chi lo chiama da uno script
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const DIR = path.join(__dirname, 'strumenti');
const EST = '.json';
const PYTHON = process.env.NAVICELLA_PY || 'python';
const MATEMATICA = path.join(__dirname, '..', '..', '..',
                             '00-capitano', 'scripts', 'verifica-matematica.py');
const CAMPI = ['nome', 'riga', 'serve', 'esempio'];

/* Un esempio EVOCATO invece che svolto e' il difetto piu' frequente e il meno visibile:
 * la frase suona bene e non insegna niente. Il segno oggettivo e' che non contiene
 * matematica — nessun $…$ — oppure apre con una formula di rito. */
const EVOCATIVO = /^\s*(si usa|si incontra|compare spesso|è utile|serve spesso|ad esempio in|tipicamente)/i;

/* Le schede sono JSON, non oggetti JavaScript, e la ragione e' misurata il 2026-09-12.
 * Nella prima stesura erano letterali JS con stringhe fra apostrofi: su tre schede
 * generate da un modello delegato, TRE sono state rifiutate, e sempre per la stessa cosa
 * — «l'uguaglianza», «l'ordine», «un'angolo». L'apostrofo e' ovunque in italiano, e in
 * una stringa delimitata da apostrofi va protetto; dentro un brief che gia' chiede di
 * raddoppiare i backslash del LaTeX, la regola diventa contraddittoria e nessuno la
 * azzecca. Il difetto non era del modello: era del formato, cioe' mio.
 *
 * JSON toglie la classe intera. Le stringhe stanno fra virgolette doppie, gli apostrofi
 * sono liberi, e c'e' un parser vero che dice riga e colonna invece di un generico
 * «Unexpected identifier». Resta una sola regola di scrittura — i backslash del LaTeX si
 * raddoppiano — e una sola e' una regola che si impara. */
function apri(via) {
  const testo = fs.readFileSync(via, 'utf8');
  return { ogg: JSON.parse(testo), testo };
}

function dollari(s) {
  // $ non preceduti da backslash. Devono essere pari: uno spaiato manda in vacca il
  // typeset dell'intero pannello, e a schermo si vede il sorgente LaTeX.
  return (s.match(/(^|[^\\])\$/g) || []).length;
}

function tagliNudi(s) {
  // `<` e `>` nudi finiscono in innerHTML e l'HTML li legge come tag: il pezzo di
  // formula dopo di loro sparisce in silenzio. Il template chiede \lt e \gt.
  return (s.match(/[<>](?![a-zA-Z\/!])/g) || []).length +
         (s.match(/(?<![a-zA-Z"'])[<>]\s*\d/g) || []).length;
}

function verifica(file) {
  const via = path.join(DIR, file);
  const guai = [];
  let s, testo;
  try { ({ ogg: s, testo } = apri(via)); }
  catch (e) { return { file, guai: ['non e\' JSON valido: ' + e.message] }; }

  if (!s || typeof s !== 'object' || Array.isArray(s)) {
    return { file, guai: ['non e\' un oggetto: il file deve contenere { … } e nient\'altro'] };
  }

  for (const k of CAMPI) {
    if (typeof s[k] !== 'string' || !s[k].trim()) guai.push('manca il campo `' + k + '`');
  }

  // o `pieno` o `debito`, mai nessuno dei due: e' la regola contro il debito muto
  const hasPieno = s.pieno && typeof s.pieno === 'object';
  const hasDebito = typeof s.debito === 'string' && s.debito.trim();
  if (!hasPieno && !hasDebito) {
    guai.push('ne\' `pieno` ne\' `debito`: dove sta la trattazione completa va sempre detto');
  }
  if (hasPieno && hasDebito) guai.push('`pieno` e `debito` insieme: scegliere');
  if (hasPieno) {
    for (const k of ['file', 'tappa', 'come']) {
      if (!s.pieno[k]) guai.push('`pieno` senza `' + k + '`');
    }
    if (s.pieno.file) {
      const dove = path.join(__dirname, s.pieno.file);
      if (!fs.existsSync(dove)) {
        guai.push('`pieno.file` punta a un nucleo che non esiste: ' + s.pieno.file);
      } else if (s.pieno.tappa) {
        const h = fs.readFileSync(dove, 'utf8');
        const re = new RegExp("num\\s*:\\s*'" + s.pieno.tappa.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "'");
        if (!re.test(h)) guai.push('`pieno.tappa` ' + s.pieno.tappa + ' non esiste in ' + s.pieno.file);
      }
    }
  }

  // `riga` e' UNA riga: una frase sola. Il punto interno si conta solo se seguito da
  // spazio e maiuscola, cosi' «$1/(1-q)$.» e le abbreviazioni non contano.
  if (typeof s.riga === 'string') {
    const frasi = (s.riga.trim().replace(/\.$/, '').match(/\.\s+[A-Z(]/g) || []).length + 1;
    if (frasi > 1) guai.push('`riga` ha ' + frasi + ' frasi: se ne servono due, sono due strumenti');
  }

  // ogni taglio, quello di default e quelli per corso, va misurato allo stesso modo
  const tagli = [['(default)', s]];
  if (s.qui && typeof s.qui === 'object') {
    for (const c of Object.keys(s.qui)) tagli.push([c, s.qui[c]]);
  }
  for (const [dove, t] of tagli) {
    for (const k of ['serve', 'esempio']) {
      const v = t && t[k];
      if (typeof v !== 'string' || !v.trim()) {
        if (dove !== '(default)') guai.push('taglio `' + dove + '` senza `' + k + '`');
        continue;
      }
      if (dollari(v) % 2) guai.push(dove + ' · `' + k + '`: $ spaiato, il pannello non fa typeset');
      const nudi = tagliNudi(v);
      if (nudi) guai.push(dove + ' · `' + k + '`: ' + nudi + ' fra < e > nudi (usare \\lt \\gt)');
    }
    const es = t && t.esempio;
    if (typeof es === 'string' && es.trim()) {
      if (!dollari(es)) guai.push(dove + ' · `esempio` senza una formula: e\' evocato, non svolto');
      if (EVOCATIVO.test(es)) guai.push(dove + ' · `esempio` comincia evocando invece di svolgere');
    }
  }
  /* `riga` va misurata come gli altri campi. Fino al collaudo del 12-09 non lo era, e
   * una scheda con `$|q| < 1$` nella riga passava: il `<` nudo e' esattamente il difetto
   * che fa sparire in silenzio il pezzo di formula che lo segue, e stava nel campo che
   * si legge per primo. Un verificatore con un buco nel campo piu' visibile e' peggio di
   * nessun verificatore, perche' il suo OK viene creduto. */
  if (typeof s.riga === 'string') {
    if (dollari(s.riga) % 2) guai.push('`riga`: $ spaiato');
    const nudi = tagliNudi(s.riga);
    if (nudi) guai.push('`riga`: ' + nudi + ' fra < e > nudi (usare \\lt \\gt)');
  }

  /* ---- e infine la MATEMATICA, che nessun controllo di forma puo' vedere ----------
   * Chiesto da Giuseppe il 12-09: «ho bisogno che la navicella produca cose esattamente
   * come le ho approvate e soprattutto corrette, cosi' da non dover impiegare tempo sulla
   * costruzione ma solo sullo studio». Una scheda che passa la forma e sbaglia il conto
   * gli sposta il lavoro invece di toglierglielo — e il 12-09 e' successo due volte su
   * tre. Qui si chiama sympy, che i conti li sa fare; la spiegazione del doppio cancello
   * sta in 00-capitano/scripts/verifica-matematica.py. */
  if (!Array.isArray(s.controllo) || !s.controllo.length) {
    guai.push('manca `controllo`: senza asserzioni verificabili nessuno puo\' dire se la ' +
              'matematica di questa scheda e\' giusta, e «sembra giusta» non e\' un criterio');
  } else {
    /* `--json`, non il testo decorato. Prima passata: leggevo le righe stampate e le
     * ritagliavo con una regex sul carattere ✗ — che sulla console di Windows arriva
     * trasfigurato, quindi la regex non trovava niente e il guaio diventava un inutile
     * «matematica: NO _rotta.json». Un verificatore che sa cos'e' sbagliato e non riesce
     * a DIRLO fa perdere tempo esattamente come uno che non lo sa. */
    const r = spawnSync(PYTHON, [MATEMATICA, via, '--json'],
                        { encoding: 'utf8', env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
    if (r.error || r.status === 2) {
      guai.push('il verificatore matematico non si e\' potuto eseguire: ' +
                String(r.error || r.stderr || '').trim().split('\n')[0] +
                ' (serve sympy: python -m pip install sympy)');
    } else if (r.status !== 0) {
      let letto = null;
      try { letto = JSON.parse(r.stdout); } catch (e) { /* sotto */ }
      if (letto) {
        for (const f of letto) {
          for (const riga of (f.righe || [])) {
            if (!riga.regge) guai.push('matematica · ' + riga.asserzione + ' — ' + riga.detto);
          }
        }
      } else {
        guai.push('matematica: il verificatore non ha risposto in JSON — ' +
                  String(r.stderr || r.stdout || '').trim().split('\n').pop());
      }
    }
  }

  return { file, guai, nome: s.nome, tagli: tagli.length,
           asserzioni: Array.isArray(s.controllo) ? s.controllo.length : 0 };
}

function main() {
  const arg = process.argv.slice(2);
  const json = arg.includes('--json');
  let files = arg.filter(a => !a.startsWith('--')).map(a => path.basename(a));
  if (!files.length || arg.includes('--tutte')) {
    if (!fs.existsSync(DIR)) { console.log('nessun repertorio: ' + DIR); return 0; }
    files = fs.readdirSync(DIR).filter(f => f.endsWith(EST));
  }
  if (!files.length) { console.log('repertorio vuoto'); return 0; }

  const esiti = files.map(verifica);
  if (json) { console.log(JSON.stringify(esiti, null, 1)); return esiti.some(e => e.guai.length) ? 1 : 0; }

  let rotte = 0;
  for (const e of esiti) {
    if (!e.guai.length) console.log('  OK   %s — %s (%d tagli, %d asserzioni verificate)',
                                     e.file, e.nome, e.tagli, e.asserzioni);
    else {
      rotte++;
      console.log('  NO   %s', e.file);
      for (const g of e.guai) console.log('         · %s', g);
    }
  }
  console.log('\n%d su %d passano.', esiti.length - rotte, esiti.length);
  return rotte ? 1 : 0;
}

process.exit(main());
