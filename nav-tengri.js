/* nav-tengri.js — la barra che tiene insieme la casa. Dedalo, 2026-09-19.
 *
 * PERCHE' ESISTE
 *   I 66 nuclei non avevano un solo link: ne' alla home, ne' al movimento accanto.
 *   Si arrivava a `nuclei/em-14-relativita.html` e da li' l'unica via d'uscita era il
 *   tasto indietro del browser - che dalla schermata Home dell'app installata non
 *   c'e'. Giuseppe: «vorrei innanzitutto aggiungessi i pulsanti di avanti e indietro
 *   tra home, percorso, mappa eccetera».
 *
 * COME
 *   Un file solo, incluso da ogni pagina, che si inietta da se'. Niente da ricordarsi
 *   quando si aggiunge una pagina: si aggiunge lo script e la barra c'e'.
 *   - le due frecce usano la history VERA del browser, non una finta pila interna:
 *     cosi' funzionano anche i gesti del telefono e il tasto indietro di sistema;
 *   - dentro un nucleo compaiono anche «movimento precedente / successivo» DELLO
 *     STESSO CAMPO, letti da `nuclei-indice.js`: l'ordine non e' scritto qui, e
 *     quindi non puo' andare fuori sincrono con l'indice;
 *   - se la pagina ha gia' una sua barra appiccicata in alto (i quiz ce l'hanno),
 *     questa si fa da parte e resta statica invece di coprirla.
 */
(function () {
  if (window.__TGN__) return;
  window.__TGN__ = true;

  /* Dove sono: i nuclei stanno un piano sotto, come le cartelle dei corsi. */
  var p = location.pathname.replace(/\\/g, "/");
  var sotto = /\/(nuclei|analisi-vettoriale|metodi|meccanica|geometria|elettromagnetismo|geometria-differenziale|meccanica-statistica)\//.test(p);
  var base = sotto ? "../" : "";
  var dentroNucleo = /\/nuclei\/[^/]+\.html$/.test(p);

  var VOCI = [
    ["Scaffale", "index.html"],
    ["Percorso", "percorso-app.html"],
    ["Mappa", "mappa-percorso.html"],
    ["Rotte", "carta-delle-rotte.html"]
  ];

  var css = document.createElement("style");
  css.textContent = [
    ".tgn{display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:8px 14px;",
    "  background:rgba(12,16,22,.94);border-bottom:1px solid #2b333d;z-index:9999;",
    "  font:14px/1.4 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#eef3f8}",
    ".tgn.appesa{position:sticky;top:0;backdrop-filter:blur(8px)}",
    ".tgn b,.tgn a,.tgn button{background:#161b22;border:1px solid #2b333d;color:#eef3f8;",
    "  border-radius:9px;padding:5px 11px;font-size:.85rem;cursor:pointer;text-decoration:none;",
    "  font-weight:500;transition:.14s;display:inline-flex;align-items:center;gap:5px}",
    ".tgn a:hover,.tgn button:hover{border-color:#5eead4;color:#fff}",
    ".tgn b{border-color:#5eead4;color:#5eead4;cursor:default}",
    /* Il marchio: non e' un bottone, e' il nome della casa. Nessun bordo, nessun
       riquadro - e sparisce sotto i 420px, dove ogni pixel serve alle voci. */
    ".tgn .marchio{background:none;border:0;padding:0 10px 0 4px;color:#5eead4;",
    "  font:600 .95rem/1 Georgia,'Times New Roman',serif;letter-spacing:.14em;",
    "  text-transform:uppercase;cursor:default;user-select:none}",
    "@media(max-width:420px){.tgn .marchio{display:none}}",
    ".tgn .sp{flex:1;min-width:8px}",
    ".tgn .vicini{display:flex;gap:6px;flex-wrap:wrap}",
    ".tgn .vicini a{max-width:min(42vw,300px);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    "@media(max-width:640px){.tgn .vicini{width:100%;order:9}}"
  ].join("");
  document.head.appendChild(css);

  var bar = document.createElement("div");
  bar.className = "tgn";
  var qui = p.split("/").pop() || "index.html";
  bar.innerHTML =
    '<span class="marchio" title="Tengri — la casa dello studio">Tengri</span>' +
    '<button data-tgn="back" title="Indietro">&#8592;</button>' +
    '<button data-tgn="fwd" title="Avanti">&#8594;</button>' +
    VOCI.map(function (v) {
      return (!sotto && v[1] === qui)
        ? "<b>" + v[0] + "</b>"
        : '<a href="' + base + v[1] + '">' + v[0] + "</a>";
    }).join("") +
    '<span class="sp"></span><span class="vicini" id="tgn-vicini"></span>';

  function attacca() {
    document.body.insertBefore(bar, document.body.firstChild);
    bar.querySelector('[data-tgn="back"]').onclick = function () { history.back(); };
    bar.querySelector('[data-tgn="fwd"]').onclick = function () { history.forward(); };
    /* Se la pagina ha gia' qualcosa di appiccicato in alto - l'HUD dei quiz - la
       nostra barra resta statica: due barre sovrapposte nascondono quella sotto,
       e quella sotto e' l'unica che conta mentre si risponde. */
    var scontro = false;
    var figli = document.body.children;
    for (var i = 1; i < Math.min(figli.length, 25); i++) {
      var s = getComputedStyle(figli[i]);
      if ((s.position === "sticky" || s.position === "fixed") && parseFloat(s.top || "999") < 60) {
        scontro = true; break;
      }
    }
    if (!scontro) bar.classList.add("appesa");
    if (dentroNucleo) vicini();
  }

  /* I due movimenti accanto, dentro lo stesso campo. */
  function vicini() {
    function disegna() {
      var IDX = window.PM_INDICE;
      if (!IDX || !IDX.nuclei) return;
      var file = "nuclei/" + (p.split("/").pop());
      var io_ = -1;
      for (var i = 0; i < IDX.nuclei.length; i++) {
        if ((IDX.nuclei[i].file || "").replace(/\\/g, "/") === file) { io_ = i; break; }
      }
      if (io_ < 0) return;
      var mov = IDX.nuclei[io_].mov;
      var stesso = IDX.nuclei.filter(function (n) {
        return n.mov === mov && (n.file || "").indexOf("nuclei/") === 0;
      });
      var k = stesso.indexOf(IDX.nuclei[io_]);
      var box = document.getElementById("tgn-vicini");
      var h = "";
      if (k > 0) {
        h += '<a href="' + base + stesso[k - 1].file.split("/").pop() +
             '" title="' + testo(stesso[k - 1].titolo) + '">&#8592; ' +
             breve(stesso[k - 1].titolo) + "</a>";
      }
      if (k >= 0 && k < stesso.length - 1) {
        h += '<a href="' + base + stesso[k + 1].file.split("/").pop() +
             '" title="' + testo(stesso[k + 1].titolo) + '">' +
             breve(stesso[k + 1].titolo) + " &#8594;</a>";
      }
      box.innerHTML = h;
    }
    if (window.PM_INDICE) return disegna();
    var s = document.createElement("script");
    s.src = base + "nuclei-indice.js";
    s.onload = disegna;
    document.head.appendChild(s);
  }

  /* I titoli portano la numerazione davanti («7 — Residui: ...»): nella barra basta
     quella e la prima manciata di parole, il resto sta nel tooltip. */
  function testo(t) { return String(t || "").replace(/"/g, "&quot;"); }
  function breve(t) {
    t = String(t || "");
    var i = t.indexOf(":");
    if (i > 0 && i < 60) t = t.slice(0, i);
    return testo(t.length > 44 ? t.slice(0, 42) + "…" : t);
  }

  if (document.body) attacca();
  else document.addEventListener("DOMContentLoaded", attacca);
})();
