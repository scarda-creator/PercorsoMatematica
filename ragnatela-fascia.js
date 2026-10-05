/* ragnatela-fascia.js — la ragnatela in piccolo, in fondo alla home. Dedalo, 2026-10-05.
 *
 * PERCHE' ESISTE
 *   Giuseppe, 2026-10-02: «e' importante che tu aggiunga un tasto home per tornare subito
 *   nella pagina iniziale, che avra' IN ALTO LO SCAFFALE E IN BASSO LA MAPPA». Lo scaffale
 *   c'era; la mappa in basso no. Questo file disegna la fascia.
 *
 * COSA MOSTRA, E COSA NO
 *   Le orbite 0-2: la tesi al centro, le idee, le materie, e i sei ponti pesati. **Non i
 *   nuclei**: settantasette nodi in una fascia alta trecento pixel sono una macchia, e la
 *   fascia serve a dare il colpo d'occhio — «quanto tutto e' connesso» — non a navigare.
 *   Per navigare si apre `ragnatela.html`, dove i nuclei si aprono materia per materia.
 *
 *   E' quindi una VISTA, non una copia: condivide il dato (`ragnatela-dati.js`) e non la
 *   logica. Tenere due disegni che leggono lo stesso dato costa poco; tenere due dati che
 *   dicono la stessa cosa e' il modo in cui le pagine divergono.
 *
 * SI INIETTA DA SE', come `nav-tengri.js`: la home include lo script e la fascia appare.
 * Se il dato non c'e' non succede niente e non si lascia un buco con un titolo sopra.
 */
(function () {
  if (window.__FASCIA__) return;
  window.__FASCIA__ = true;
  var R = window.RAGNATELA;
  var casa = document.getElementById("fascia-ragnatela");
  if (!R || !casa) return;

  var NS = "http://www.w3.org/2000/svg";
  var W = 1000, H = 560, CX = 500, CY = 280;
  var RI = 118, RM = 215;   /* raggi: idee e materie. Piu' stretti che nella pagina
                               intera, perche' qui l'altezza e' meta' della larghezza. */

  function el(tag, attr) {
    var n = document.createElementNS(NS, tag);
    for (var k in attr) if (attr[k] !== null) n.setAttribute(k, attr[k]);
    return n;
  }

  /* lo stesso ordine della pagina intera, e per la stessa ragione: l'arco piu' pesante
     deve risultare corto. Si ricalcola invece di importarlo — venti righe duplicate
     valgono meno di una dipendenza fra due pagine che devono poter vivere separate. */
  function ordine() {
    var peso = {};
    R.archi.forEach(function (a) {
      if (a.specie !== "ponte") return;
      peso[a.a + "|" + a.b] = a.peso; peso[a.b + "|" + a.a] = a.peso;
    });
    function w(x, y) { return peso[x + "|" + y] || 0; }
    var id = R.materie.map(function (m) { return m.id; });
    var ponti = R.archi.filter(function (a) { return a.specie === "ponte"; })
                       .sort(function (p, q) { return q.peso - p.peso; });
    if (!ponti.length) return id;
    var cat = [ponti[0].a, ponti[0].b];
    var fuori = id.filter(function (x) { return cat.indexOf(x) < 0; });
    while (fuori.length) {
      var best = null, bw = -1, capo = null;
      fuori.forEach(function (x) {
        [["t", cat[0]], ["c", cat[cat.length - 1]]].forEach(function (c) {
          var v = w(x, c[1]);
          if (v > bw) { bw = v; best = x; capo = c[0]; }
        });
      });
      if (capo === "t") cat.unshift(best); else cat.push(best);
      fuori = fuori.filter(function (x) { return x !== best; });
    }
    return cat;
  }

  function posti(ids, r, sf) {
    var o = {};
    ids.forEach(function (x, i) {
      var a = -Math.PI / 2 + sf + 2 * Math.PI * i / ids.length;
      o[x] = { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) * 0.88, ang: a };
    });
    return o;
    /* il fattore 0.88 sulla y schiaccia appena l'anello: in una fascia larga il doppio
       dell'altezza un cerchio perfetto spreca i lati e stringe sopra e sotto. */
  }

  var ord = ordine();
  var pm = posti(ord, RM, 0);
  var pi = posti(R.idee.map(function (i) { return i.id; }), RI, Math.PI / Math.max(1, R.idee.length));
  var per = {};
  R.materie.concat(R.idee).forEach(function (o) { per[o.id] = o; });

  var svg = el("svg", { viewBox: "0 0 " + W + " " + H, role: "img",
                        "aria-label": "la ragnatela del percorso, vista d'insieme",
                        style: "width:100%;height:auto;display:block" });

  /* gli archi, sotto tutto */
  function curva(a, b, k) {
    var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    return "M" + a.x.toFixed(1) + "," + a.y.toFixed(1) +
           " Q" + (CX + (mx - CX) * k).toFixed(1) + "," + (CY + (my - CY) * k).toFixed(1) +
           " " + b.x.toFixed(1) + "," + b.y.toFixed(1);
  }
  function dove(id) { return pm[id] || pi[id] || { x: CX, y: CY }; }

  var ponti = R.archi.filter(function (a) { return a.specie === "ponte"; });
  var maxP = Math.max.apply(null, ponti.map(function (a) { return a.peso || 1; }).concat([1]));
  ponti.forEach(function (a) {
    svg.appendChild(el("path", {
      d: curva(dove(a.a), dove(a.b), 0.42), fill: "none", stroke: "#5eead4",
      "stroke-dasharray": "6 5", opacity: "0.45",
      "stroke-width": (1.3 + 4.4 * (a.peso || 1) / maxP).toFixed(2)
    }));
  });
  R.archi.filter(function (a) { return a.specie === "portante"; }).forEach(function (a) {
    var A = a.a === "tesi" ? { x: CX, y: CY } : dove(a.a);
    var B = a.b === "tesi" ? { x: CX, y: CY } : dove(a.b);
    svg.appendChild(el("path", { d: curva(A, B, 0.82), fill: "none",
                                 stroke: "#b98cff", "stroke-width": 1, opacity: "0.34" }));
  });

  /* il centro, aperto come nella pagina intera: e' la direttiva, non uno stile */
  svg.appendChild(el("circle", { cx: CX, cy: CY, r: 66, fill: "#11191c",
                                 stroke: "#5eead4", "stroke-width": 2,
                                 "stroke-dasharray": "12 10" }));
  var tt = el("text", { x: CX, y: CY - 2, "text-anchor": "middle",
                        style: "font-size:17px;font-weight:700;fill:#5eead4" });
  tt.textContent = "la tesi";
  svg.appendChild(tt);
  var ts = el("text", { x: CX, y: CY + 19, "text-anchor": "middle",
                        style: "font-size:11px;fill:#9fb0c0" });
  ts.textContent = "in formazione";
  svg.appendChild(ts);

  /* le idee */
  var TINTA = { numerica: "#5eead4", analitica: "#b98cff", esplorativa: "#4c8dff" };
  R.idee.forEach(function (i) {
    var p = pi[i.id];
    if (!p) return;
    svg.appendChild(el("circle", { cx: p.x, cy: p.y, r: 13,
                                   fill: TINTA[(i.natura || "").split(/[ ;]/)[0]] || "#9fb0c0",
                                   stroke: "#0e1117", "stroke-width": 2 }));
    var s = el("text", { x: p.x, y: p.y + 4, "text-anchor": "middle",
                         style: "font-size:9.5px;font-weight:700;fill:#0e1117" });
    s.textContent = i.sigla || "";
    svg.appendChild(s);
  });

  /* le materie: cliccabili, e portano alla ragnatela intera con la materia aperta */
  ord.forEach(function (mid) {
    var m = per[mid], p = pm[mid];
    if (!m || !p) return;
    var chiusa = m.stato === "chiusa";
    var a = el("a", { href: "ragnatela.html#" + mid });
    a.appendChild(el("circle", { cx: p.x, cy: p.y, r: chiusa ? 15 : 22,
                                 fill: chiusa ? "#232c37" : "#18222c",
                                 stroke: chiusa ? "#5b6878" : "#5eead4", "stroke-width": 2 }));
    var n = el("text", { x: p.x, y: p.y + 4, "text-anchor": "middle",
                         style: "font-size:" + (chiusa ? 10 : 12) + "px;font-weight:600;fill:" +
                                (chiusa ? "#5b6878" : "#eef3f8") });
    n.textContent = m.nuclei.length || "·";
    a.appendChild(n);
    var corto = m.nome.replace("Meccanica ", "M. ").replace("Geometria Differenziale", "Geom. Diff.")
                      .replace("Analisi Vettoriale", "An. Vett.").replace(" e Modelli", "");
    var t = el("text", { x: p.x, y: p.y + (p.y < CY ? -(chiusa ? 22 : 30) : (chiusa ? 29 : 37)),
                         "text-anchor": "middle",
                         style: "font-size:11.5px;fill:" + (chiusa ? "#5b6878" : "#b9c4d1") });
    t.textContent = corto;
    a.appendChild(t);
    svg.appendChild(a);
  });

  casa.appendChild(svg);
})();
