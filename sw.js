/* sw.js — service worker del percorso-matematica (Dedalo, 2026-07-21).
 * Scopo: rendere l'app installabile e usabile OFFLINE (treno, aula, metro).
 * Strategia: cache-first sui file del percorso, network-first solo per l'indice
 * (così un nucleo nuovo appare senza dover svuotare la cache).
 * I progressi NON passano di qui: vivono in localStorage, non nella cache.
 */
var VER = 'pm-v6';
var BASE = [
  './',
  'index.html',
  'percorso-app.html',
  'nuclei-indice.js',
  'mappa-percorso.html',
  'geometria/',
  'nuclei/motore-plot.js',
  'nuclei/progresso.js',
  'nuclei/esame-tag.js',
  'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css',
  'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js',
  'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(VER).then(function (c) {
      // addAll fallisce tutto se un solo file manca: qui i singoli add sono tolleranti
      return Promise.all(BASE.map(function (u) {
        return c.add(new Request(u, { mode: u.indexOf('http') === 0 ? 'no-cors' : 'same-origin' })).catch(function () {});
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (k) {
      return Promise.all(k.filter(function (x) { return x !== VER; }).map(function (x) { return caches.delete(x); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  // CIÒ CHE CAMBIA DA SOLO: prima la rete, con la cache come rete di salvataggio.
  // Perché (29-08-2026, quando i quiz sono stati riuniti sotto il percorso): i quiz
  // crescono OGNI NOTTE — Analisi Vettoriale è passata da 370 a 521 domande in un
  // mese. Con la strategia cache-first, il primo quiz aperto sul telefono restava
  // congelato per sempre: le domande nuove esistevano sul sito e non arrivavano mai
  // a chi le deve studiare, a meno di alzare VER a mano dopo ogni notte. Cioè
  // esattamente il difetto che `pubblica-quiz.py` esiste per impedire, spostato di
  // un passo più in là — dal server al telefono.
  // I nuclei NON stanno qui: sono scritti una volta e non cambiano, e per loro la
  // cache-first è quel che serve in metro. Offline resta tutto comunque: se la rete
  // manca, si serve la copia in cache.
  var via = new URL(req.url, self.location.href).pathname;
  var vivo = via.indexOf('/Quiz_') >= 0 ||          // i quattro quiz
             via.indexOf('nuclei-indice') >= 0 ||   // l'elenco dei nuclei
             /(^|\/)(index\.html)?$/.test(via) ||   // la home e le sue sottocartelle
             via.indexOf('stato.html') >= 0;        // il cruscotto dei lavori
  if (vivo) {
    e.respondWith(
      fetch(req).then(function (r) {
        var copia = r.clone();
        caches.open(VER).then(function (c) { c.put(req, copia); });
        return r;
      }).catch(function () { return caches.match(req); })
    );
    return;
  }

  // tutto il resto: cache-first, e ciò che si scarica finisce in cache per la volta dopo
  e.respondWith(
    caches.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (r) {
        if (r && (r.status === 200 || r.type === 'opaque')) {
          var copia = r.clone();
          caches.open(VER).then(function (c) { c.put(req, copia); });
        }
        return r;
      }).catch(function () { return caches.match('percorso-app.html'); });
    })
  );
});
