# La ragnatela — specifica

Progetto di Dedalo, 2026-10-02, su direttiva di Giuseppe della stessa sera. Sostituisce
`mappa-percorso.html` e `carta-delle-rotte.html`, che sono due pagine per una cosa sola.

## Che cosa ha chiesto, parole sue

> «la sezione della mappa non dev'essere come è adesso ma dev'essere incorporata con le rotte
> in una visuale più sferica con al centro la tesi, non solo come l'ho pensata fino ad adesso
> ma con tutte le idee interessanti. di base vorrei fosse una ragnatela che non solo fa capire
> quanto tutto è connesso ma mi funge anche da ponte per collegare le idee a tutto il
> precedente. è importante che tu aggiunga un tasto home per tornare subito nella pagine
> iniziale, che avrà in alto lo scaffale e in basso la mappa»

E, il 2026-10-02: **«la sezione percorso è obsoleta con i movimenti, adesso semplicemente ogni
movimento è una materia»** — l'unità di organizzazione è la materia, non il movimento di un
percorso unico.

Due decisioni di forma, prese da lui con le opzioni davanti:
- **raggiera 2D a orbite**, non sfera 3D. Motivo suo nella scelta: il peso sul telefono e la
  leggibilità dei nomi. Le orbite sono `tesi → idee → materie → nuclei`.
- **il campo per scrivere un'idea sta dentro il sito**, non lo si dice a Dedalo. Gli ho
  dichiarato il limite (il browser non scrive nel repo) e ha confermato la scelta: quindi il
  limite lo risolve l'implementazione, non si rinegozia la scelta.

## Che cosa NON si costruisce da zero: l'anima

Il grafo esiste. `00-capitano/anima/` tiene **133 documenti e 1010 legami**, costruito e
collaudato, con l'iniezione automatica staccata per scelta di Mnemosyne. La ragnatela è la
**faccia visibile dell'anima ri-radicata sulla tesi**: non un motore nuovo, una vista nuova.

Chi costruisce parta da `anima-dati.js` e da `00-capitano/scripts/anima-grafo.py`, e **non
reinventi il calcolo dei legami**.

Le altre due sorgenti, già sul disco:
- `carta-delle-rotte.html` contiene l'array `NUCLEI` con gli archi **nucleo → materia di
  destinazione** («Differenziabilità» → «Meccanica quantistica»). Sono gli archi che fanno
  capire «quanto tutto è connesso», e vanno estratti in dato invece di restare dentro una
  pagina.
- `02-accademico/tesi/` ha le idee vere, già scritte e dense: `direzione-e-destinazioni.md`
  (le destinazioni: Parigi, ETH, SISSA, Vienna, Amsterdam/Delft, UK — con i perché),
  `hopfield-rsb-eth-findings.md` (34 kB: il ponte Hopfield/RSB/ETH, i blocchi tecnici, il
  verdetto sul ponte), `hopfield-rsb-eth-documento.md`, `ricerca-statistica-cervello.md`.

## Le quattro orbite

| orbita | nodi | da dove vengono |
|---|---|---|
| centro | **la tesi** | una voce sola, scritta a mano: è il nodo che non si deduce |
| 1 | **le idee** | titoli di secondo livello dei documenti di `02-accademico/tesi/`, il quaderno di Chirone, le idee aggiunte dal campo |
| 2 | **le materie** | le sei aperte + Analisi Vettoriale e Geometria, chiuse (in grigio) |
| 3 | **i nuclei** | `nuclei-indice.js`, **collassati**: si aprono cliccando la materia |

L'orbita 3 resta chiusa per default. Settantasette nodi aperti insieme sono una matassa, e la
richiesta è «fa capire quanto tutto è connesso», non «mostra tutto insieme».

## Gli archi, e sono di tre specie — si distinguono a vista

1. **portante** (linea piena): la materia serve l'idea. Es. Meccanica Statistica → vetri di
   spin → tesi.
2. **ponte** (linea tratteggiata): i quindici ponti dell'atlante di Chirone, che collegano due
   materie fra loro. Sono l'ossatura del «quanto tutto è connesso».
3. **traccia** (linea sottile, accesa solo al passaggio): i legami dell'anima fra documenti.
   Sono molti e servono da sfondo, non da struttura.

## Il campo «nuova idea» — come si fa durare

La parte che decide se lo userà. Tre passi, in quest'ordine:

1. **localStorage, subito.** Appena premi salva, l'idea è salva sul telefono. Funziona offline
   e fuori casa, e non si perde niente mai.
2. **consegna a Oceano.** La pagina prova un `POST` a `oceano_server.py`, la bocca che ascolta
   sulla rete di casa su `0.0.0.0:8077` e deposita in `00-capitano/intake/in-arrivo/`. Da lì
   `oceano.py` la assorbe al successivo SessionStart. Se il POST riesce, la voce si marca
   **«arrivata a casa»** e resta visibile come tale.
3. **ritenta da sé.** Le idee non consegnate restano in coda e la pagina ritenta a ogni
   caricamento. Quindi: scrivi un'idea in treno, rientri a casa, apri il sito una volta, e
   l'idea è nel repo senza che nessuno travasi niente.

Perché non il resto: il browser non può committare, e un token di GitHub su un sito pubblico
è un segreto esposto. Oceano risolve il problema con un organo che c'è già, a costo zero, e
senza aprire una porta su internet.

## La home

Una pagina sola, due fasce, come ha chiesto: **scaffale in alto, ragnatela in basso.** La
ragnatela nella home è la vista d'insieme con le orbite 0-2; cliccando si entra nella pagina
intera dove si aprono i nuclei.

`Percorso` si ritira. **Ma non prima che la ragnatela sia online**: un indirizzo si ritira
quando c'è dove mandare chi lo apriva, ed è la lezione dei tre indirizzi dei quiz ritirati il
29-08. Oggi è già uscito dalla barra di navigazione; il file resta.

## Il tasto Home — FATTO il 2026-10-02

In `nav-tengri.js`. `⌂ Home` è la prima voce ed è **un link sempre**, anche quando sei già
nella home: è un tasto di ritorno, non una voce di menu, e chi è dentro un nucleo cerca la
parola «home», non il nome della stanza. Collaudato simulando il percorso di un nucleo: la
base relativa esce giusta (`../index.html`).

## Condizione di fine

- la ragnatela si apre dalla home e dalla barra, e `mappa-percorso.html` e
  `carta-delle-rotte.html` rimandano a lei;
- i nodi delle orbite 0-2 sono **generati**, non scritti a mano, tranne il centro;
- un'idea scritta dal campo compare nella ragnatela dopo un giro di Oceano;
- la pagina si apre e si legge su un telefono, e i nomi dei nodi si leggono senza zoom.

## Quello che costa, e con che cosa compete

Il monte è uno. Il ciclo notturno sta lavorando su **P3 · Elettromagnetismo, che ha una data:
Giuseppe studia dal 6 ottobre**. Ogni ora spesa qui è un'ora non spesa lì, perché il ciclo si
fa da parte quando Giuseppe è in sessione. Questa specifica è scritta perché il lavoro non
dipenda dalla sessione in cui è stato pensato — **quando costruire lo decide lui.**
