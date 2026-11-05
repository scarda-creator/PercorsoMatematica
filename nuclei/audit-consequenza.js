#!/usr/bin/env node
/* audit-consequenza.js — il cancello dell'ORDINE DEL CONTENUTO. Dedalo, 2026-11-02.
 *
 * PERCHE' ESISTE, e il conto e' stato pagato tre volte
 *   Giuseppe, il 2026-11-02, su Metodi: «visto che e' l'ennesima volta che capita questa
 *   cosa potresti dargli un occhio tu? ... deve essere consequenziale, non per blocco di
 *   argomento. anche se si parla di autovalori, che senso ha mettere Sturm-Liouville e
 *   Green agli operatori finito dimensionali?».
 *
 *   Il caso: `me-07` (operatori lineari e teoria spettrale) ha come unico prerequisito
 *   `me-06`, gli spazi di Hilbert FINITO-dimensionali, e porta due tappe intere intitolate
 *   «Sturm-Liouville: da dove vengono le basi della fisica» (1244 parole) e «La funzione di
 *   Green nella base spettrale» (678). Per leggerle servono L^2, le famiglie di polinomi
 *   ortogonali, le ODE del secondo ordine e la nozione di funzione di Green: tutte cose che
 *   il corso introduce DOPO, in `me-08`, `me-11` e `me-12`. E `me-08` ha gia' una tappa
 *   intitolata «La seconda strada per le stesse tre famiglie: Sturm-Liouville»: quindi non
 *   era solo fuori ordine, era detto due volte, e la prima senza i prerequisiti.
 *
 * PERCHE' NESSUN CANCELLO LO VEDEVA
 *   `audit-rimandi.js` cattura i rimandi ESPLICITI — la sigla `me-12` scritta dentro `me-07`
 *   — e li porta a zero. Ma un movimento puo' anticipare un argomento senza nominare mai il
 *   movimento che lo possiede: spiega la funzione di Green e non dice «vedi me-12». Quello
 *   e' il rimando invisibile, ed e' peggio del visibile, perche' chi legge non ha nemmeno
 *   l'avviso che sta leggendo fuori tempo.
 *
 *   `verifica-mappa.py` controlla il grafo delle DIPENDENZE DICHIARATE e dice che non ci
 *   sono cicli. Non puo' dire niente su cosa c'e' scritto dentro: per lui `me-07` dipende
 *   da `me-06` e basta, perche' e' quello che la mappa dichiara.
 *
 * COME FUNZIONA, e perche' l'unita' e' la TAPPA
 *   La proprieta' di ogni argomento si legge dal campo `chiavi` della mappa: il movimento
 *   che dichiara `funzione di green` fra le sue chiavi e' il PADRONE di quell'argomento.
 *   L'ordine di lettura si legge dal grafo `serve`, come lo calcola `verifica-mappa.py`.
 *
 *   Poi: per ogni tappa si guarda il suo TITOLO e il suo META — cioe' l'etichetta che
 *   Giuseppe vede, e che gli dice di cosa parla il blocco che sta per leggere. Se quella
 *   etichetta nomina un argomento di un movimento SUCCESSIVO, la tappa e' fuori posto, e
 *   non c'e' ambiguita': una tappa intitolata «Sturm-Liouville» dentro un movimento che
 *   viene prima di chi possiede Sturm-Liouville e' un blocco tematico messo dove non va.
 *
 *   L'unita' e' la tappa e non la frase per una ragione precisa: **una menzione di passaggio
 *   e' legittima e anzi voluta** — e' esattamente cio' che i pop-up `data-str` servono a
 *   coprire. Cio' che non e' legittimo e' spendere un blocco di lettura su un argomento che
 *   il lettore non puo' ancora ricevere. Flaggare le frasi darebbe centinaia di rilievi veri
 *   e inutili; flaggare le tappe da' i pochi che si possono riparare.
 *
 *   Il secondo rilievo, piu' debole, e' il CONTRABBANDO: una tappa il cui titolo non nomina
 *   niente ma il cui corpo spende piu' di `SOGLIA_CORPO` occorrenze su un argomento di un
 *   movimento successivo. Non ferma il cancello: si elenca.
 *
 *   Il terzo e' l'ARGOMENTO SENZA PADRONE: un termine trattato a lungo da qualche parte e
 *   che nessun movimento dichiara fra le sue `chiavi`. E' il buco per cui questo controllo
 *   non poteva nascere prima: `sturm` non e' nelle chiavi di NESSUN movimento di Metodi, ne'
 *   di me-07 che ne fa una tappa, ne' di me-08 che ne fa un'altra. Un argomento senza
 *   padrone e' invisibile a qualunque metro di ordine.
 *
 * USO
 *   node audit-consequenza.js                      tutti i corsi
 *   node audit-consequenza.js metodi               un corso solo
 *   node audit-consequenza.js --senza-padrone      solo il terzo rilievo
 *   Uscita 1 se ci sono ANTICIPAZIONI (tappe fuori posto), 0 altrimenti.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const QUI = __dirname;
const PM = path.dirname(QUI);
const CONT = path.join(QUI, 'contenuti');

// Una tappa di cornice guarda avanti per mestiere: «Dove riappare», «Il senso e le rotte»,
// «Dove questo movimento sblocca» esistono PER dire cosa viene dopo. Flaggarle vorrebbe
// dire chiedere a una sezione di anticipazione di non anticipare. Sono le stesse famiglie
// che usano audit-rimandi.js e misura-nuclei.py: tenerle allineate conta, perche' due
// cancelli che litigano su cosa sia una tappa di lavoro danno due numeri diversi.
const CORNICE = /(Di cosa parla|Perch[eé] questo (?:nucleo|movimento)|Esercizi|Collaudo|Palestra|Il senso|La lingua del corso|Dove (?:questo movimento sblocca|riappare))/i;

// Sotto quante occorrenze nel corpo non e' contrabbando ma una menzione. Tarata sui
// movimenti che Giuseppe ha approvato: in `me-12`, che possiede «funzione di green», la
// tappa che la introduce ne ha 9; nelle tappe che la citano di passaggio altrove si sta
// fra 1 e 4. Otto sta sopra il passaggio e sotto la trattazione.
const SOGLIA_CORPO = 8;

// Una chiave troppo comune diventa rumore: `polo`, `taglio`, `peso` compaiono in prosa che
// non parla di quell'argomento. Il primo tentativo filtrava per LUNGHEZZA (sotto i nove
// caratteri via) e si e' rivelato il filtro sbagliato: buttava `laurent`, `feynman`,
// `residuo` — nomi propri e termini tecnici precisi, cioe' esattamente le chiavi che
// funzionano — e teneva dentro parole lunghe e vaghe. Peggio: `laurent` cosi' scartato
// diventava un falso «argomento senza padrone», pur essendo dichiarato da `me-03`. Quindi
// si filtra per AMBIGUITA', con un elenco curato, e la soglia di lunghezza resta solo per
// escludere le sigle di due o tre lettere.
const CHIAVE_MINIMA = 5;
const TROPPO_COMUNI = new Set(['analitic', 'olomorf', 'polidrom', 'singolarita', 'taglio',
  'corona', 'primitiva', 'norma', 'peso', 'spettro', 'simmetrico', 'distribuzione',
  'convoluzione', 'completezza', 'olomorfia', 'lebesgue', 'heaviside', 'prescrizione',
  'unitario', 'hermitiano', 'autovalore', 'autovettore', 'autofunzione', 'propagatore',
  'feynman', 'residuo', 'polo', 'zeri di una funzione', 'quasi ovunque', 'l2']);

// Le parole che aprono una frase in italiano non sono argomenti: una tappa intitolata
// «Perche serve l'integrale» non introduce un argomento chiamato «Perche». Si scartano
// dai candidati senza padrone, e si scarta anche la prima parola del titolo, che e'
// maiuscola per ortografia e non perche' sia un nome proprio.
const PAROLE_DI_FRASE = new Set(['perche', 'quando', 'come', 'dove', 'quale', 'quello',
  'quella', 'questo', 'questa', 'dalla', 'nella', 'sulla', 'senza', 'prima', 'dopo',
  'tutto', 'tutte', 'ogni', 'alcune', 'altre', 'altro', 'ancora', 'anche', 'meglio',
  'invece', 'contro', 'verso', 'oltre', 'sotto', 'sopra', 'due', 'tre', 'palestra']);

function piano(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/['’‘\-]/g, ' ').replace(/\s+/g, ' ').trim();
}

/* UNA CHIAVE SI CERCA A PAROLA INTERA, non come sottostringa. Il difetto peggiore del
 * primo giro, misurato il 2026-11-02: `fibra` (chiave di `gd-11`, la fibrazione di Hopf)
 * e' sottostringa di `fibrato`, quindi OGNI tappa di `gd-07` intitolata «Il fibrato
 * tangente...» risultava anticipare gd-11 — cinque rilievi falsi su un movimento giusto, e
 * su un corso che Giuseppe sta leggendo adesso. Stesso meccanismo per `faraday`: la
 * «gabbia di Faraday» di em-04 non anticipa la legge di Faraday di em-10, e' un'altra cosa
 * con lo stesso nome proprio — quello resta un falso positivo che nessuna macchina puo'
 * sciogliere, ed e' giusto dirlo invece di fingere di averlo risolto. */
function contieneParola(testo, chiave) {
  const i = testo.indexOf(chiave);
  if (i < 0) return false;
  const prima = i === 0 ? ' ' : testo[i - 1];
  const dopo = i + chiave.length >= testo.length ? ' ' : testo[i + chiave.length];
  return !/[a-z0-9]/.test(prima) && !/[a-z0-9]/.test(dopo);
}

/* SINGOLARE E PLURALE SONO LO STESSO ARGOMENTO, e «di» non e' «delle». Il confronto a
 * parola intera, da solo, mancava due anticipazioni vere dentro `me-09`:
 *   «Funzioni di Green per EDO»          non combaciava con la chiave `funzione di green`
 *   «EDP per separazione di variabili»   non combaciava con `separazione delle variabili`
 * — e sono due tappe da mille parole ciascuna, in un movimento che viene cinque livelli
 * prima di chi possiede quegli argomenti. Un metro che perde il caso grosso per una `i`
 * finale e' un metro che da' ragione a chi lo usa.
 *
 * Si confrontano quindi le RADICI: si buttano le parole di servizio e si tronca il resto a
 * sei caratteri. La troncatura e' la stessa cosa che fa un lettore quando riconosce
 * «funzioni» e «funzione» come la stessa parola, e non apre la porta ai falsi positivi che
 * il confronto per sottostringa apriva: `fibra` resta `fibra` e `fibrato` diventa `fibrat`,
 * che sono radici DIVERSE e non combaciano. Il confronto resta esatto, cambia l'unita'. */
const PAROLE_DI_SERVIZIO = new Set(['di', 'del', 'dei', 'della', 'delle', 'dello', 'degli',
  'la', 'le', 'il', 'lo', 'gli', 'un', 'una', 'uno', 'e', 'ed', 'in', 'a', 'al', 'ai',
  'alla', 'alle', 'per', 'con', 'su', 'sul', 'come', 'che', 'da', 'dal', 'dalla']);

function radici(s) {
  return piano(s).split(' ')
    .filter(w => w && !PAROLE_DI_SERVIZIO.has(w))
    .map(w => w.slice(0, 6));
}

function contieneArgomento(testo, chiave) {
  if (contieneParola(testo, chiave)) return true;
  const rk = radici(chiave);
  if (!rk.length) return false;
  const rt = new Set(radici(testo));
  return rk.every(r => rt.has(r));
}

function mappe() {
  return fs.readdirSync(PM)
    .map(d => path.join(PM, d, 'mappa.json'))
    .filter(p => fs.existsSync(p));
}

/* L'ordine di lettura: Kahn sul grafo `serve`, a parita' di livello l'ordine della mappa.
 * Si usa il GRAFO e non la posizione nell'elenco, perche' l'elenco e' una comodita' e il
 * grafo e' il dato: su Metodi `me-06` non dipende da `me-05` — sono due rami paralleli —
 * e misurare l'anticipazione sulla posizione nell'elenco direbbe che me-06 «viene dopo»
 * me-05, che e' falso e produrrebbe rilievi inventati fra rami che non si vedono. */
function ordineDiLettura(movimenti) {
  const id2i = new Map(movimenti.map((m, i) => [m.id, i]));
  const livello = new Map();
  function profondita(id, visti) {
    if (livello.has(id)) return livello.get(id);
    if (visti.has(id)) return 0;
    visti.add(id);
    const m = movimenti[id2i.get(id)];
    const padri = (m && m.serve) || [];
    const l = padri.length
      ? 1 + Math.max(...padri.map(p => id2i.has(p) ? profondita(p, visti) : 0))
      : 0;
    livello.set(id, l);
    return l;
  }
  movimenti.forEach(m => profondita(m.id, new Set()));
  // `prima.get(a).has(b)` = b e' raggiungibile da a risalendo i `serve`, cioe' b viene prima
  const antenati = new Map();
  function risali(id, acc) {
    const m = movimenti[id2i.get(id)];
    for (const p of (m && m.serve) || []) {
      if (!acc.has(p) && id2i.has(p)) { acc.add(p); risali(p, acc); }
    }
    return acc;
  }
  movimenti.forEach(m => antenati.set(m.id, risali(m.id, new Set())));
  return { livello, antenati };
}

/* Le tappe di un nucleo. DUE FORMATI, e vanno letti entrambi: i nuclei scritti fino a
 * settembre usano `{ num:'01', title:'...', meta:'...'`, quelli nuovi `{num:"01",
 * titolo:"..."`. Leggerne uno solo e' il difetto che il 02-11 ha fatto sembrare me-08 e
 * me-09b privi di tappe — cioe' avrebbe escluso dal controllo proprio i due movimenti che
 * possiedono gli argomenti anticipati. */
function tappe(testo) {
  const fuori = [];
  const re = /\{\s*num:\s*['"]([0-9a-z]+)['"]\s*,\s*(?:title|titolo):\s*['"]((?:[^'"\\]|\\.)*)['"](?:\s*,\s*meta:\s*['"]((?:[^'"\\]|\\.)*)['"])?/g;
  let m; const tagli = [];
  while ((m = re.exec(testo)) !== null) {
    tagli.push({ num: m[1], titolo: m[2], meta: m[3] || '', da: m.index });
  }
  tagli.forEach((t, i) => {
    t.corpo = testo.slice(t.da, i + 1 < tagli.length ? tagli[i + 1].da : testo.length);
    fuori.push(t);
  });
  return fuori;
}

/* IL CORPO E' IL FILE MENO LE TRE TESTE, e NON «tutto cio' che viene dopo la chiusura del
 * blocco CONTROLLO».
 * Pagato il 2026-11-02, scrivendo questo stesso organo. In quattro nuclei di Metodi —
 * `me-00`, `me-08`, `me-09b`, `me-10b` — il blocco delle asserzioni sta al 73-79% del file,
 * cioe' DOPO il corpo e non prima: tagliare dalla sua chiusura lascia
 * DODICI byte. L'organo leggeva quattro nuclei vuoti e taceva, ed e' per questo che non
 * vedeva che `me-08` possiede Sturm-Liouville — cioe' proprio il caso per cui e' nato.
 * Si tolgono i blocchi per quello che sono, dovunque stiano: e' cio' che fa
 * `misura-nuclei.py` (RE_CTRL.sub) e il motivo per cui i suoi numeri su me-08 erano giusti. */
function corpoDi(via) {
  if (!fs.existsSync(via)) return null;
  return fs.readFileSync(via, 'utf8')
    .replace(/\/\*META[\s\S]*?META\*\//g, ' ')
    .replace(/\/\*MOVIMENTO[\s\S]*?MOVIMENTO\*\//g, ' ')
    .replace(/\/\*CONTROLLO[\s\S]*?CONTROLLO\*\//g, ' ');
}

let anticipazioni = 0, contrabbandi = 0, senzaPadrone = 0;
const soloSenzaPadrone = process.argv.includes('--senza-padrone');
const corsoChiesto = process.argv.slice(2).find(a => !a.startsWith('--'));

for (const via of mappe()) {
  const corso = path.basename(path.dirname(via));
  if (corsoChiesto && corso !== corsoChiesto) continue;
  const d = JSON.parse(fs.readFileSync(via, 'utf8'));
  const mv = (d.movimenti || []).filter(m => m.nucleo);
  if (mv.length < 2) continue;
  const { livello, antenati } = ordineDiLettura(d.movimenti || []);

  /* CHI POSSIEDE COSA, e il padrone e' il PRIMO IN ORDINE DI LETTURA che lo dichiara.
   * Non il primo nell'elenco della mappa: l'elenco e' una comodita' editoriale. E non
   * l'ultimo, che e' l'errore in cui sono caduto: `gd-18`, l'ultimo movimento di geodiff,
   * dichiara `compattezza` fra le sue chiavi perche' la usa negli esercizi — e cosi' ogni
   * tappa del corso che parla di compattezza «anticipava» l'ultimo movimento. Un movimento
   * che RICAPITOLA non possiede: possiede chi INTRODUCE, e chi introduce viene prima. */
  const padrone = new Map();
  const perLettura = (d.movimenti || []).slice()
    .sort((a, b) => (livello.get(a.id) - livello.get(b.id)));
  for (const m of perLettura) {
    for (const c of (m.chiavi || [])) {
      const k = piano(c);
      if (k.length < CHIAVE_MINIMA || TROPPO_COMUNI.has(k)) continue;
      if (!padrone.has(k)) padrone.set(k, m.id);
    }
  }

  const righe = [];
  for (const m of mv) {
    const t = corpoDi(path.join(CONT, m.nucleo.replace('.html', '.js')));
    if (t === null) continue;
    for (const tp of tappe(t)) {
      if (CORNICE.test(tp.titolo)) continue;
      // SOLO IL TITOLO, non il meta. Il titolo dice di cosa E' la tappa; il meta elenca
      // cio' che tocca, e nominare la' un termine che verra' spiegato dopo e' normale e
      // anzi utile. Contando anche il meta i rilievi su tutto lo scaffale erano 160 — un
      // metro che segnala tutto non si usa, ed e' il difetto gemello di quello che non
      // segnala niente. Il discriminante e' quello che Giuseppe ha nominato: «che senso ha
      // mettere Sturm-Liouville agli operatori finito dimensionali?» — il problema non e'
      // che la parola compaia, e' che il BLOCCO SIA DI QUELL'ARGOMENTO.
      const etichetta = piano(tp.titolo);
      const corpo = piano(tp.corpo.replace(/<[^>]+>/g, ' '));
      for (const [k, chi] of padrone) {
        if (chi === m.id) continue;
        // QUANDO «chi» VIENE DOPO «m». Il primo tentativo chiedeva che `m` fosse fra gli
        // antenati di `chi` — che per arrivare a `chi` si dovesse passare da `m`. Troppo
        // stretto, e il caso che l'ha mostrato e' proprio quello da cui l'organo e' nato:
        // `me-07` e' un RAMO MORTO del grafo (nessuno lo dichiara in `serve` tranne
        // `me-09b`), quindi «me-12 viene dopo me-07» non era derivabile e la tappa di me-07
        // intitolata «La funzione di Green nella base spettrale» non veniva segnalata.
        //
        // Il test giusto e' piu' debole e dice la cosa che conta per chi legge: `chi` non e'
        // un prerequisito di `m`, e sta PIU' IN PROFONDITA' nel grafo. Un argomento che
        // richiede sei livelli di prerequisiti non puo' essere ricevuto dentro un movimento
        // che ne richiede uno, su qualunque ramo stia — e se i due rami sono paralleli, il
        // rilievo resta vero, perche' comunque il lettore a quel punto non ha quel che serve.
        const anc = antenati.get(chi);
        const dopo = anc && !anc.has(m.id)
          ? livello.get(chi) > livello.get(m.id)
          : (anc ? anc.has(m.id) : false);
        if (!dopo) continue;
        if (contieneArgomento(etichetta, k)) {
          righe.push({ tipo: 'ANTICIPAZIONE', mov: m.id, tappa: tp.num,
            titolo: tp.titolo, k, chi,
            parole: (tp.corpo.replace(/<[^>]+>/g, ' ').match(/\w+/g) || []).length });
        } else {
          const n = contieneParola(corpo, k) ? corpo.split(k).length - 1 : 0;
          if (n >= SOGLIA_CORPO) {
            righe.push({ tipo: 'contrabbando', mov: m.id, tappa: tp.num,
              titolo: tp.titolo, k, chi, n });
          }
        }
      }
    }
  }

  // argomenti senza padrone: un termine che una tappa mette nel TITOLO e che nessuno
  // dichiara fra le chiavi. Si guardano solo i titoli, perche' un titolo e' una
  // dichiarazione di argomento: se un movimento intitola una tappa a qualcosa, quel
  // qualcosa e' un argomento del corso e deve avere un padrone.
  const orfani = new Map();
  for (const m of mv) {
    const t = corpoDi(path.join(CONT, m.nucleo.replace('.html', '.js')));
    if (t === null) continue;
    for (const tp of tappe(t)) {
      if (CORNICE.test(tp.titolo)) continue;
      // i nomi propri nel titolo sono i candidati: maiuscola, almeno cinque lettere. Non si
      // scarta la prima parola per posizione — ci avevo provato, e saltava proprio «Sturm»
      // in «Sturm-Liouville: da dove vengono le basi della fisica», cioe' il caso da cui
      // tutto questo e' partito. Chi apre una frase e' gia' escluso da PAROLE_DI_FRASE.
      const parole = tp.titolo.match(/[A-Z][a-zà-ü]{4,}/g) || [];
      for (const w of parole) {
        const k = piano(w);
        if (PAROLE_DI_FRASE.has(k)) continue;
        if ([...padrone.keys()].some(p => p.includes(k) || k.includes(p))) continue;
        if (!orfani.has(k)) orfani.set(k, []);
        orfani.get(k).push(m.id + '/' + tp.num);
      }
    }
  }

  const ant = righe.filter(r => r.tipo === 'ANTICIPAZIONE');
  const con = righe.filter(r => r.tipo === 'contrabbando');
  const orf = [...orfani.entries()].filter(([, dove]) => dove.length >= 2);
  anticipazioni += ant.length; contrabbandi += con.length; senzaPadrone += orf.length;

  if (!ant.length && !con.length && !orf.length) continue;
  console.log('\n== ' + (d.titolo || corso) + ' ==');
  if (!soloSenzaPadrone) {
    for (const r of ant) {
      console.log('  ANTICIPAZIONE  ' + r.mov + '/' + r.tappa + '  (' + r.parole + ' parole)');
      console.log('      «' + r.titolo + '»');
      console.log('      nomina «' + r.k + '», che e\' di ' + r.chi + ' — e ' + r.chi +
                  ' viene DOPO ' + r.mov + ' nel grafo `serve`');
    }
    for (const r of con) {
      console.log('  contrabbando   ' + r.mov + '/' + r.tappa + '  «' + r.titolo.slice(0, 54) +
                  '»  ' + r.n + '× «' + r.k + '» (di ' + r.chi + ')');
    }
  }
  for (const [k, dove] of orf) {
    console.log('  senza padrone  «' + k + '» intitola tappe in ' + dove.join(', ') +
                ' e non e\' nelle `chiavi` di nessun movimento');
  }
}

console.log('\n=== AUDIT DELLA CONSEQUENZA ===');
console.log('anticipazioni (tappe fuori posto): ' + anticipazioni);
console.log('contrabbandi (corpo oltre ' + SOGLIA_CORPO + ' occorrenze): ' + contrabbandi);
console.log('argomenti senza padrone: ' + senzaPadrone);
if (!anticipazioni) {
  console.log('\nCONSEQUENZIALE — nessuna tappa spende un blocco su cio\' che viene dopo.');
}
process.exit(anticipazioni ? 1 : 0);
