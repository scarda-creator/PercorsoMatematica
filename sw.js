/* sw.js — service worker di Tengri (Dedalo, 2026-07-21).
 * Scopo: rendere l'app installabile e usabile OFFLINE (treno, aula, metro).
 * Strategia: cache-first sui file del percorso, network-first solo per l'indice
 * (così un nucleo nuovo appare senza dover svuotare la cache).
 * I progressi NON passano di qui: vivono in localStorage, non nella cache.
 */
/* VER alzato a 'tengri-v7' il 2026-09-20 col battesimo della casa: le pagine di
   primo livello sono cache-first, e senza questo salto chi ha gia' l'app installata
   avrebbe continuato a leggere il nome vecchio dalla copia in cache.

   VER alzato a 'tengri-v8' il 2026-10-08, e stavolta il salto da solo non bastava.
   Il 07-10 ho riparato i pop-up di tutti i nuclei, pubblicato, e verificato alla
   fonte che il sito servisse le pagine nuove. Per Giuseppe non funzionava lo stesso:
   l'app installata gli serviva la copia in cache, e la mia prova girava su file://
   dove un service worker non esiste. Verde sul disco, vecchio sul suo schermo.
   La causa vera non e' questa versione mancata: e' la riga qui sotto che diceva «i
   nuclei sono scritti una volta e non cambiano». Non e' piu' vero da settembre — la
   coda notturna li riscrive, e io ne ho rimontati settantaquattro in un colpo. */
var VER = 'tengri-v8';
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
  // I NUCLEI STANNO QUI DENTRO dal 2026-10-08, e prima no. La riga di prima diceva
  // che «sono scritti una volta e non cambiano»: era vero a luglio, quando il
  // percorso era finito e fermo. Da settembre la coda notturna li riscrive — P1, P2,
  // P4 e P6 hanno rifatto decine di movimenti — e il 07-10 ne ho rimontati 74 in un
  // colpo per riparare i pop-up. Con la cache-first, ogni nucleo gia' aperto restava
  // congelato sul telefono di Giuseppe FINO AL PROSSIMO salto di VER fatto a mano:
  // cioe' il lavoro arrivava sul sito e non a lui, che e' lo stesso difetto che
  // `pubblica-quiz.py` esiste per impedire, spostato di un passo piu' in la'.
  // Offline non si perde niente: se la rete manca si serve la copia in cache, come
  // prima. Si paga una richiesta di rete quando la rete c'e'.
  var via = new URL(req.url, self.location.href).pathname;
  var vivo = via.indexOf('/Quiz_') >= 0 ||          // i quattro quiz
             via.indexOf('nuclei-indice') >= 0 ||   // l'elenco dei nuclei
             via.indexOf('/nuclei/') >= 0 ||        // i movimenti: cambiano ogni notte
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
