/* esame-tag.js — marchia i teoremi e le dimostrazioni RICHIESTI agli esami (Dedalo, 2026-07-21).
 *
 * Si include in ogni nucleo con <script defer src="esame-tag.js"></script>. Come progresso.js,
 * non tocca il contenuto: aggancia i titoli delle sezioni già scritte e ci appende un badge.
 *
 * FONTI (nessun requisito è inventato):
 *  - Analisi Vettoriale, prof. Terracina: programma in 4 parti + struttura del secondo esonero,
 *    da `percorso-matematica/01-mappa-argonauta.md` §4 (ricostruito da pagina del corso e da
 *    scritti reali: 20240704 De Marchis+Terracina, 20250127).
 *  - Metodi e Modelli, canale 3 (Caprini/Esposito): programma ufficiale in
 *    `02-accademico/corsi/metodi-e-modelli/programma-ufficiale.md` + verdetto sugli
 *    ~19 scritti reali 2023-2026 in `01-mappa-argonauta.md` §1-2 (blocco A complessa 50%,
 *    blocco B funzionale 50%).
 *
 * Le frequenze (es. 19/19) vengono dal conteggio dell'Argonauta sugli scritti, non da stime.
 *
 * REGOLA: chiave = numero nucleo + numero tappa; `titolo` (opzionale) restringe a una sezione
 * il cui <h3> contiene quella stringa. Senza `titolo`, il badge va sull'intestazione della tappa.
 */
(function () {
  'use strict';

  var AV = 'Analisi Vettoriale', ME = 'Metodi';

  // corso: 'av' | 'metodi' | 'entrambi' ; prova: 'scritto' | 'orale' | 'scritto+orale'
  var REQ = [
    /* ---------------- ANALISI VETTORIALE ---------------- */
    { n: '00', t: '01', corso: 'av', prova: 'orale', et: 'AV · orale', nota: 'Topologia di Rⁿ: aperto, chiuso, compatto, connesso (Parte I.1)' },
    { n: '00', t: '05', corso: 'av', prova: 'orale', et: 'AV · orale', titolo: 'Weierstrass', nota: 'Continuità su compatti e teorema di Weierstrass (Parte I.2)' },
    { n: '01', t: '02', corso: 'av', prova: 'scritto+orale', et: 'AV · scritto+orale', nota: 'Differenziabilità, gradiente, jacobiana (Parte I.3)' },
    { n: '01', t: '04', corso: 'av', prova: 'orale', et: 'AV · orale', titolo: 'catena', nota: 'Regola della catena e differenziale totale (Parte I.4)' },
    { n: '01', t: '06', corso: 'av', prova: 'scritto+orale', et: 'AV · scritto+orale', titolo: 'Taylor', nota: 'Formula di Taylor in più variabili; Hessiana e Schwarz (Parte I.5)' },
    { n: '02', t: '01', corso: 'av', prova: 'scritto+orale', et: 'AV · scritto+orale', nota: 'Teorema di Dini / funzione implicita (Parte I.4) — dimostrazione richiesta all’orale' },
    { n: '02', t: '03', corso: 'av', prova: 'scritto', et: 'AV · scritto · Es.2', nota: 'Estremi liberi: criterio sull’Hessiana (Parte I.6)' },
    { n: '02', t: '04', corso: 'av', prova: 'scritto+orale', et: 'AV · scritto · Es.2', nota: 'Moltiplicatori di Lagrange, estremi vincolati (Parte I.6) — sistematico nel secondo esonero' },
    { n: '03', t: '01', corso: 'av', prova: 'scritto', et: 'AV · scritto', nota: 'Curve: parametrizzazione, lunghezza, invarianza (Parte II.8)' },
    { n: '03', t: '02', corso: 'av', prova: 'scritto', et: 'AV · scritto', nota: 'Integrali di linea scalare e vettoriale (Parte II.8)' },
    { n: '03', t: '03', corso: 'av', prova: 'scritto', et: 'AV · scritto · Es.3', nota: 'Superfici: parametrizzazione, normale, area (Parte II.9)' },
    { n: '03', t: '04', corso: 'av', prova: 'scritto', et: 'AV · scritto · Es.3', nota: 'Integrale di flusso e orientazione (Parte II.9)' },
    { n: '04', t: '03', corso: 'av', prova: 'orale', et: 'AV · orale', nota: 'grad, div, rot e le identità (Parte II.10)' },
    { n: '04', t: '05', corso: 'av', prova: 'scritto+orale', et: 'AV · scritto+orale', nota: 'Campi conservativi, potenziale, forme chiuse ed esatte (Parte II.10)' },
    { n: '04', t: '06', corso: 'av', prova: 'orale', et: 'AV · orale ★', nota: 'Irrotazionale ⇏ conservativo: il ruolo della semplice connessione (lemma di Poincaré)' },
    { n: '05', t: '01', corso: 'av', prova: 'scritto+orale', et: 'AV · scritto+orale ★', nota: 'Teorema di Green nel piano (Parte II.11) — dimostrazione richiesta' },
    { n: '05', t: '02', corso: 'av', prova: 'scritto+orale', et: 'AV · scritto+orale ★', nota: 'Teorema della divergenza / Gauss (Parte II.11) — dimostrazione richiesta' },
    { n: '05', t: '03', corso: 'av', prova: 'scritto+orale', et: 'AV · scritto · Es.3 ★', nota: 'Teorema di Stokes (Parte II.11) — sistematico nel secondo esonero' },
    { n: '06', t: '01', corso: 'av', prova: 'scritto+orale', et: 'AV · scritto+orale ★', nota: 'Problema di Cauchy: esistenza e unicità (Picard–Lindelöf), soluzione massimale (Parte IV.15)' },
    { n: '06', t: '02', corso: 'av', prova: 'scritto', et: 'AV · scritto · Es.5', nota: 'EDO risolubili: separabili, lineari, Bernoulli, Eulero (Parte IV.16-17)' },
    { n: '06', t: '04', corso: 'av', prova: 'scritto', et: 'AV · scritto · Es.5', nota: 'Equazioni autonome: equilibri, stabilità, ritratto di fase (Parte IV.16)' },
    { n: '07', t: '01', corso: 'av', prova: 'scritto+orale', et: 'AV · scritto · Es.4 ★', nota: 'Convergenza puntuale e uniforme di successioni di funzioni (Parte III.12)' },
    { n: '07', t: '02', corso: 'av', prova: 'scritto+orale', et: 'AV · scritto+orale', nota: 'Criterio di Weierstrass (convergenza totale) (Parte III.14)' },
    { n: '07', t: '03', corso: 'av', prova: 'orale', et: 'AV · orale ★', nota: 'Continuità, integrabilità, derivabilità del limite uniforme (Parte III.13) — dimostrazioni richieste' },
    { n: '07', t: '04', corso: 'av', prova: 'scritto', et: 'AV · scritto · Es.4', nota: 'Serie di potenze, raggio di convergenza, Cauchy–Hadamard (Parte III.14)' },

    /* ---------------- METODI — blocco A, analisi complessa (~50%) ---------------- */
    { n: '11', t: '01', corso: 'metodi', prova: 'scritto+orale', et: 'Metodi · A3 · 19/19', nota: 'Cauchy–Riemann: enunciato e derivazione' },
    { n: '11', t: '02', corso: 'metodi', prova: 'scritto', et: 'Metodi · A3 · scritto', nota: 'Funzioni armoniche e armonica coniugata: costruzione (tipo d’esame in crescita)' },
    { n: '11', t: '03', corso: 'metodi', prova: 'scritto+orale', et: 'Metodi · A4 · scritto', nota: 'Funzioni polidrome: determinazione, taglio, punto di diramazione' },
    { n: '12', t: '01', corso: 'metodi', prova: 'orale', et: 'Metodi · orale ★', nota: 'Teorema di Cauchy e deformazione dei cammini' },
    { n: '12', t: '02', corso: 'metodi', prova: 'scritto+orale', et: 'Metodi · A1 · scritto+orale ★', nota: 'Formula integrale di Cauchy e formula per le derivate' },
    { n: '12', t: '03', corso: 'metodi', prova: 'orale', et: 'Metodi · orale', nota: 'Analiticità: olomorfa ⇒ sviluppabile in serie di potenze' },
    { n: '12', t: '04', corso: 'metodi', prova: 'scritto', et: 'Metodi · A1 · 19/19 ★', nota: 'Serie di Laurent in anelli diversi; classificazione delle singolarità — presente in TUTTI gli scritti' },
    { n: '13', t: '01', corso: 'metodi', prova: 'scritto', et: 'Metodi · A1 · 19/19 ★', nota: 'Calcolo dei residui (polo semplice, multiplo, quoziente)' },
    { n: '13', t: '02', corso: 'metodi', prova: 'scritto+orale', et: 'Metodi · A1 · 19/19 ★', nota: 'Teorema dei residui — enunciato, dimostrazione e uso' },
    { n: '13', t: '03', corso: 'metodi', prova: 'scritto', et: 'Metodi · A2 · 19/19 ★', nota: 'Integrali reali per contorni: i 4 sottotipi, lemma di Jordan, semipiano corretto' },
    { n: '13', t: '04', corso: 'metodi', prova: 'scritto', et: 'Metodi · A2 · scritto', nota: 'Poli sull’asse reale: valor principale e mezzo residuo (nel programma ufficiale)' },

    /* ---------------- METODI — blocco B, analisi funzionale (~50%) ---------------- */
    { n: '08', t: '02', corso: 'metodi', prova: 'orale', et: 'Metodi · B · orale', nota: 'Completezza e spazi di Banach: prerequisito valutato' },
    { n: '09', t: '01', corso: 'metodi', prova: 'scritto+orale', et: 'Metodi · B5 · scritto', nota: 'Prodotto scalare in L², proiezione ortogonale, miglior approssimazione' },
    { n: '09', t: '02', corso: 'metodi', prova: 'scritto+orale', et: 'Metodi · B3 · scritto+orale ★', nota: 'Bessel e Parseval: enunciato e dimostrazione' },
    { n: '09', t: '03', corso: 'metodi', prova: 'scritto+orale', et: 'Metodi · B3 · scritto ★', nota: 'Serie di Fourier e convergenza (L², Dirichlet puntuale, uniforme, Gibbs)' },
    { n: '09', t: '04', corso: 'metodi', prova: 'scritto', et: 'Metodi · B3 · scritto', nota: 'Calcolo dei coefficienti e somma di serie numeriche via Parseval' },
    { n: '15', t: '01', corso: 'metodi', prova: 'scritto+orale', et: 'Metodi · B2 · scritto', nota: 'Distribuzioni: δ, δ′, derivata distribuzionale' },
    { n: '15', t: '02', corso: 'metodi', prova: 'scritto+orale', et: 'Metodi · B3 · scritto ★', nota: 'Trasformata di Fourier: proprietà, Plancherel, convoluzione' },
    { n: '15', t: '03', corso: 'metodi', prova: 'scritto', et: 'Metodi · B2 · scritto ★', nota: 'Funzione di Green per EDO e condizioni di giunzione — trabocchetto δ′' },
    { n: '15', t: '04', corso: 'metodi', prova: 'scritto', et: 'Metodi · B4 · scritto ★', nota: 'EDP per separazione di variabili + Fourier (calore, onde)' },
    { n: '16', t: '01', corso: 'metodi', prova: 'scritto+orale', et: 'Metodi · B1 · scritto ★', nota: 'Operatori autoaggiunti: autovalori reali, autovettori ortogonali' },
    { n: '16', t: '02', corso: 'metodi', prova: 'scritto+orale', et: 'Metodi · B1 · 19/19 ★', nota: 'Teorema spettrale e proiettori — trabocchetto: autovettori NON ortonormali' },
    { n: '16', t: '03', corso: 'metodi', prova: 'scritto+orale', et: 'Metodi · B1 · scritto', nota: 'Sturm–Liouville: autofunzioni ortogonali col peso' },
    { n: '16', t: '04', corso: 'metodi', prova: 'scritto', et: 'Metodi · B2 · scritto', nota: 'Funzione di Green via spettro; risolvente' },
    { n: '17', t: '02', corso: 'metodi', prova: 'scritto', et: 'Metodi · B4 · scritto', nota: 'Equazione del calore: nucleo gaussiano, smorzamento dei modi' },
    { n: '17', t: '03', corso: 'metodi', prova: 'scritto', et: 'Metodi · B4 · scritto', nota: 'Equazione delle onde: d’Alembert, dominio di dipendenza' },
    /* ---------------- aggiunte del 2026-07-21 (buchi colmati) ---------------- */
    { n: "18", t: "01", corso: "av", prova: "scritto", et: "AV · scritto · Es.1 ★", nota: "Integrali doppi: domini normali e teorema di Fubini (Parte II.7) — Esercizio 1 sistematico" },
    { n: "18", t: "02", corso: "av", prova: "scritto+orale", et: "AV · scritto · Es.1 ★", nota: "Cambio di variabili e jacobiano; coordinate polari (Parte II.7)" },
    { n: "18", t: "03", corso: "av", prova: "scritto", et: "AV · scritto · Es.1", nota: "Integrali tripli in cilindriche e sferiche; volumi, masse, momenti (Parte II.7)" },
    { n: "09", t: "02", corso: "metodi", prova: "scritto", et: "Metodi · B5 · scritto", titolo: "Gram", nota: "Gram–Schmidt in L²: ortonormalizzazione (blocco B5, ~4 scritti su 19)" },
    { n: "19", t: "02", corso: "metodi", prova: "orale", et: "Metodi · orale (programma)", nota: "Metodo di Laplace — nel programma ufficiale del canale 3, mai comparso negli scritti" },
    { n: "19", t: "03", corso: "metodi", prova: "orale", et: "Metodi · orale (programma)", nota: "Fase stazionaria e punto di sella — nel programma ufficiale del canale 3" }
  ];

  var CSS = [
    '.pm-esame{display:inline-flex;align-items:center;gap:6px;font-size:.63rem;font-weight:700;',
    'letter-spacing:.5px;text-transform:uppercase;padding:3px 9px;border-radius:20px;',
    'background:#3a2410;border:1px solid #7a4a18;color:#f0a95a;white-space:nowrap;vertical-align:middle}',
    '.pm-esame.metodi{background:#1a2a3a;border-color:#2b5680;color:#7ab8e0}',
    '.pm-esame.stella{background:#3f2010;border-color:#9a4a1a;color:#ffb072}',
    '.pm-esame-riga{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:10px 0 2px}',
    '.pm-esame-nota{font-size:.82rem;color:#b9c4d1;font-style:italic}',
    '.pm-esame-hdr{margin-top:10px;padding:9px 13px;border-radius:10px;background:#191c22;',
    'border:1px solid #2b333d;border-left:3px solid #d8a13a}',
    '.pm-esame-hdr .t{font-size:.7rem;text-transform:uppercase;letter-spacing:.8px;color:#d8a13a;font-weight:700}'
  ].join('');
  (function () { var s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); })();

  var NN = (function () {
    var m = (location.pathname.split('/').pop() || '').match(/^(\d\d)-/);
    return m ? m[1] : null;
  })();
  if (!NN) return;

  function badge(r) {
    var b = document.createElement('span');
    b.className = 'pm-esame' + (r.corso === 'metodi' ? ' metodi' : '') + (/★/.test(r.et) ? ' stella' : '');
    b.textContent = '◈ ' + r.et;
    b.title = r.nota + (/★/.test(r.et) ? ' — richiesto con dimostrazione' : '');
    return b;
  }

  function applica() {
    var tappa = (location.hash || '#00').replace('#', '') || '00';
    var main = document.getElementById('main'); if (!main) return;
    var reg = REQ.filter(function (r) { return r.n === NN && r.t === tappa; });
    if (!reg.length) return;

    reg.forEach(function (r) {
      if (r.titolo) {                                   // badge su una sezione precisa
        var sez = Array.prototype.filter.call(main.querySelectorAll('section.section > h3'), function (h) {
          return h.textContent.indexOf(r.titolo) >= 0;
        })[0];
        if (sez && !sez.querySelector('.pm-esame')) sez.appendChild(badge(r));
        return;
      }
      var head = main.querySelector('.sfhead');          // badge sull'intestazione della tappa
      if (!head || head.querySelector('.pm-esame-hdr')) return;
      var box = document.createElement('div'); box.className = 'pm-esame-hdr';
      var riga = document.createElement('div'); riga.className = 'pm-esame-riga';
      riga.innerHTML = '<span class="t">richiesto all’esame</span>';
      riga.appendChild(badge(r));
      box.appendChild(riga);
      var n = document.createElement('div'); n.className = 'pm-esame-nota'; n.textContent = r.nota;
      box.appendChild(n);
      head.appendChild(box);
    });
  }

  window.addEventListener('DOMContentLoaded', function () { setTimeout(applica, 40); });
  window.addEventListener('hashchange', function () { setTimeout(applica, 40); });
  window.PM_Esame = { requisiti: REQ };
})();
