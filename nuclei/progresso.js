/* progresso.js — memoria dei progressi del percorso-matematica (Dedalo, 2026-07-21).
 *
 * Si include in ogni nucleo con <script defer src="progresso.js"></script> nel <head>.
 * NON tocca il contenuto dei nuclei: si aggancia da fuori a ciò che già esiste
 * (showTappa, i pulsanti .reveal-btn, i blocchi .collaudo-item). Un nucleo scritto
 * domani eredita il tracciamento senza saperlo.
 *
 * Tre cose registra, come chiesto:
 *   1. avanzamento   — quali tappe sono state aperte, quando
 *   2. autovalutazione — su ogni collaudo/esercizio: «so farlo» / «incerto» / «da rivedere»
 *   3. ripasso spaziato — ogni voce valutata entra in una coda con la sua scadenza (SM-2 leggero)
 *
 * Archivio: una sola chiave localStorage, 'pm-progresso-v1'. L'app (percorso-app.html)
 * legge la stessa chiave: nessun server, nessun account, esportabile in JSON.
 */
(function () {
  'use strict';
  var KEY = 'pm-progresso-v1';

  // ---------- archivio ----------
  function vuoto() { return { v: 1, nuclei: {}, voci: {}, opts: { perGiorno: 10 }, storico: {} }; }
  function carica() {
    try { var d = JSON.parse(localStorage.getItem(KEY) || 'null'); return d && d.v ? d : vuoto(); }
    catch (e) { return vuoto(); }
  }
  function salva(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }
  var D = carica();

  var oggi = function () { return new Date().toISOString().slice(0, 10); };
  var GIORNO = 86400000;

  // ---------- SM-2 leggero -------------------------------------------------
  // Tre esiti invece dei sei di SuperMemo: la granularità fine è rumore quando
  // si valuta da soli. «so farlo» allunga, «incerto» tiene corto, «da rivedere»
  // riazzera. La facilità (ef) si muove piano e non scende sotto 1.3.
  var PASSI = [1, 3, 7, 16, 35, 75];
  function pianifica(voce, esito) {
    var ef = voce.ef || 2.5;
    if (esito === 'so') { ef = Math.min(2.9, ef + 0.1); voce.n = (voce.n || 0) + 1; }
    else if (esito === 'incerto') { ef = Math.max(1.3, ef - 0.15); voce.n = Math.max(1, voce.n || 1); }
    else { ef = Math.max(1.3, ef - 0.25); voce.n = 0; voce.lapse = (voce.lapse || 0) + 1; }
    voce.ef = Math.round(ef * 100) / 100;
    var base = PASSI[Math.min(voce.n, PASSI.length - 1)];
    var giorni = voce.n === 0 ? 1 : Math.max(1, Math.round(base * (ef / 2.5)));
    voce.int = giorni;
    voce.due = Date.now() + giorni * GIORNO;
    voce.ultimo = Date.now();
    voce.esito = esito;
    return voce;
  }

  // ---------- identità del nucleo e della tappa ----------
  var NN = (function () {
    var m = (location.pathname.split('/').pop() || '').match(/^(\d\d)-/);
    return m ? m[1] : '??';
  })();
  var titoloNucleo = (function () {
    var b = document.querySelector('.banner b');
    return b ? b.textContent.trim() : 'Nucleo ' + NN;
  })();
  function tappaCorrente() { return (location.hash || '#00').replace('#', '') || '00'; }

  function segnaTappa(num, titolo) {
    var n = D.nuclei[NN] || (D.nuclei[NN] = { titolo: titoloNucleo, tappe: {} });
    n.titolo = titoloNucleo;
    if (!n.tappe[num]) n.tappe[num] = { visto: Date.now(), titolo: titolo || '' };
    else n.tappe[num].visto = Date.now();
    n.ultimo = Date.now();
    salva(D);
  }

  function idVoce(tappa, indice, tipo) { return NN + '#' + tappa + '#' + tipo + indice; }

  function valuta(id, esito, meta) {
    var v = D.voci[id] || { nucleo: NN, ef: 2.5, n: 0 };
    if (meta) { v.tappa = meta.tappa; v.titolo = meta.titolo; v.tipo = meta.tipo; v.nucleoTitolo = titoloNucleo; }
    pianifica(v, esito);
    D.voci[id] = v;
    var g = oggi();
    D.storico[g] = (D.storico[g] || 0) + 1;
    salva(D);
    return v;
  }

  // ---------- aggancio a showTappa (avanzamento) ----------
  function agganciaTappe() {
    if (typeof window.showTappa !== 'function') return;
    var orig = window.showTappa;
    window.showTappa = function (num) {
      var r = orig.apply(this, arguments);
      try {
        var h = document.querySelector('.sfhead h1');
        segnaTappa(num, h ? h.textContent.replace(/^\S+\s·\s/, '') : '');
        setTimeout(decora, 0);
      } catch (e) {}
      return r;
    };
  }

  // ---------- pulsanti di autovalutazione ----------
  var CSS = [
    '.pm-val{display:flex;gap:6px;align-items:center;margin-top:10px;flex-wrap:wrap}',
    '.pm-val .pm-lab{font-size:.72rem;letter-spacing:.4px;text-transform:uppercase;color:#8b95a5;margin-right:2px}',
    '.pm-b{border:1px solid #2b333d;background:#1c232d;color:#b9c4d1;border-radius:8px;',
    'padding:5px 11px;font:inherit;font-size:.82rem;cursor:pointer;transition:.12s}',
    '.pm-b:hover{border-color:#4c8dff;color:#eef3f8}',
    '.pm-b.so.on{background:#10331b;border-color:#2ea043;color:#5fd980}',
    '.pm-b.incerto.on{background:#332a10;border-color:#d8a13a;color:#e0b85a}',
    '.pm-b.rivedere.on{background:#33161a;border-color:#c1443f;color:#ff8b86}',
    '.pm-quando{font-size:.76rem;color:#8b95a5;margin-left:4px}'
  ].join('');
  (function () { var s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); })();

  function quando(v) {
    var gg = Math.max(0, Math.round((v.due - Date.now()) / GIORNO));
    return gg === 0 ? 'rivedi oggi' : gg === 1 ? 'rivedi domani' : 'rivedi fra ' + gg + ' giorni';
  }

  function barra(id, meta) {
    var wrap = document.createElement('div'); wrap.className = 'pm-val';
    var lab = document.createElement('span'); lab.className = 'pm-lab'; lab.textContent = 'e tu?';
    wrap.appendChild(lab);
    var info = document.createElement('span'); info.className = 'pm-quando';
    var esistente = D.voci[id];
    [['so', 'so farlo'], ['incerto', 'incerto'], ['rivedere', 'da rivedere']].forEach(function (b) {
      var btn = document.createElement('button');
      btn.className = 'pm-b ' + b[0] + (esistente && esistente.esito === b[0] ? ' on' : '');
      btn.textContent = b[1];
      btn.onclick = function () {
        var v = valuta(id, b[0], meta);
        Array.prototype.forEach.call(wrap.querySelectorAll('.pm-b'), function (x) { x.classList.remove('on'); });
        btn.classList.add('on');
        info.textContent = '· ' + quando(v);
      };
      wrap.appendChild(btn);
    });
    if (esistente) info.textContent = '· ' + quando(esistente);
    wrap.appendChild(info);
    return wrap;
  }

  // Aggiunge la barra a ogni collaudo e a ogni esercizio della tappa aperta.
  // Idempotente: se c'è già, non la rimette.
  function decora() {
    var tappa = tappaCorrente();
    var main = document.getElementById('main'); if (!main) return;
    var titoloDi = function (sec) { var h = sec.querySelector('h3'); return h ? h.textContent.replace(/\s+/g, ' ').trim() : ''; };

    Array.prototype.forEach.call(main.querySelectorAll('.collaudo-item'), function (it, i) {
      if (it.querySelector('.pm-val')) return;
      var sec = it.closest('section.section');
      it.appendChild(barra(idVoce(tappa, i, 'c'), { tappa: tappa, tipo: 'collaudo', titolo: titoloDi(sec) }));
    });

    Array.prototype.forEach.call(main.querySelectorAll('section.section'), function (sec, i) {
      if (!sec.querySelector('.testo')) return;             // solo i blocchi esercizio
      if (sec.querySelector('.pm-val')) return;
      sec.appendChild(barra(idVoce(tappa, i, 'e'), { tappa: tappa, tipo: 'esercizio', titolo: titoloDi(sec) }));
    });
  }

  // ---------- avvio ----------
  agganciaTappe();
  window.addEventListener('DOMContentLoaded', function () { setTimeout(decora, 30); });
  window.addEventListener('hashchange', function () { setTimeout(decora, 30); });

  // API minima, usata dall'app
  window.PM_Progresso = {
    leggi: function () { return carica(); },
    scrivi: function (d) { D = d; salva(D); },
    valuta: valuta,
    chiave: KEY
  };
})();
