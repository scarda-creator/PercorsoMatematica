/* sw.js — service worker del percorso-matematica (Dedalo, 2026-07-21).
 * Scopo: rendere l'app installabile e usabile OFFLINE (treno, aula, metro).
 * Strategia: cache-first sui file del percorso, network-first solo per l'indice
 * (così un nucleo nuovo appare senza dover svuotare la cache).
 * I progressi NON passano di qui: vivono in localStorage, non nella cache.
 */
var VER = 'pm-v5';
var BASE = [
  './',
  'percorso-app.html',
  'nuclei-indice.js',
  'mappa-percorso.html',
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

  // l'indice dei nuclei: prima la rete, così i nuclei nuovi si vedono subito
  if (req.url.indexOf('nuclei-indice') >= 0) {
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
