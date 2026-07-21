/* quiz-innesti.js — porta il quiz di Meccanica al livello del percorso (Dedalo, 2026-07-21).
 *
 * Tre innesti, nessuna riscrittura: il motore del quiz e i 457 item restano intatti.
 * Ci si aggancia DA FUORI alle funzioni globali che il quiz già espone.
 *
 *  1. FIGURE      — le dimostrazioni con una geometria ricevono un disegno nella soluzione
 *                   modello (motore-plot.js, lo stesso del percorso-matematica).
 *  2. RIPASSO     — l'autovalutazione «non fatta / parziale / fatta bene» che il quiz già
 *                   raccoglie viene tradotta in una scadenza SM-2 e scritta nello STESSO
 *                   archivio dell'app (`pm-progresso-v1`): le lavagne entrano nella coda «Oggi».
 *  3. PROGRAMMA   — ogni domanda mostra a quale voce del programma ufficiale appartiene
 *                   (Pisano, canale Pet-Z, AA 2025/26 — `01-banca-dati/programma-ufficiale.txt`).
 *
 * Perché innestare invece di riscrivere: il quiz INTERROGA (cloze su un passaggio, ordinamento
 * dei passaggi, lavagna), il nucleo del percorso INSEGNA. Per un orale la forma giusta è la prima.
 */
(function () {
  'use strict';

  /* ============ 1. PROGRAMMA UFFICIALE (fonte: PDF Pisano AA 2025/26) ============ */
  var PROGRAMMA = {
    grandezze:    '1-2 · Grandezze fisiche · Richiami di calcolo vettoriale',
    cinematica:   '3 · Cinematica',
    relativa:     '3 · Cinematica dei moti relativi · Trasformazioni di Galileo',
    dinamica:     '4 · I principi della dinamica',
    applicazioni: '5 · Applicazioni dei principi della dinamica',
    energia:      '6 · Energia e lavoro',
    sistemi:      '7 · Dinamica dei sistemi',
    rigidi:       '8 · Corpi rigidi',
    gravitazione: '9 · Gravitazione',
    fluidi:       '10 · Meccanica dei fluidi',
    onde:         '11 · Onde'
  };
  var POOL_ORD = ['grandezze','cinematica','relativa','dinamica','applicazioni','energia',
                  'sistemi','rigidi','gravitazione','fluidi','onde'];

  /* ============ 2. FIGURE — solo dove la geometria È l'argomento ============
     Chiave = il campo `topic` della lavagna, esatto. Se un topic non è qui, nessuna figura:
     meglio nessun disegno che un disegno che non aggiunge nulla. */
  var FIG = {
    'Potenziale efficace e classificazione delle orbite': {
      spec: {kind:'func2d', xr:[0.25,6], yr:[-0.62,0.55], height:340,
        title:'U_eff(r) = -k/r + L^2/(2mr^2): la barriera centrifuga decide il tipo di orbita',
        curves:[{f:'-1/x+0.5/(x*x)', col:'#5eead4', width:2.6, label:'U_eff'},
                {f:'-1/x', col:'#4d5a6b', width:1.4, dash:true, label:'-k/r'},
                {f:'0.5/(x*x)', col:'#4d5a6b', width:1.4, dash:true, label:'L²/2mr²'},
                {f:'0.18', col:'#ff6b6b', width:1.6, dash:true, label:'E>0 iperbole'},
                {f:'-0.22', col:'#d8a13a', width:1.6, dash:true, label:'E<0 ellisse'},
                {f:'-0.5', col:'#b98cff', width:1.6, dash:true, label:'E=U_min circolare'}],
        marks:[{x:1, y:-0.5, label:'orbita circolare', col:'#b98cff', up:false}]},
      leggi: 'Il minimo di U_eff è l\'orbita <b>circolare</b>; una retta orizzontale a quota E taglia la curva nei <b>punti di inversione</b>. E&lt;0 ne dà due (ellisse, moto limitato), E=0 uno (parabola), E&gt;0 uno solo con fuga all\'infinito (iperbole). La barriera centrifuga L²/2mr² è ciò che impedisce la caduta sul centro per L≠0: <b>la classificazione delle orbite si legge come un problema unidimensionale</b>.'
    },
    'Diagrammi di energia potenziale e stabilità': {
      spec: {kind:'func2d', xr:[-2.2,3.2], yr:[-2.6,3.4], height:330,
        title:'U(x): minimo = equilibrio stabile, massimo = instabile, flesso = indifferente',
        curves:[{f:'pow(x,4)/4-pow(x,3)/3-x*x+1', col:'#5eead4', width:2.6, label:'U(x)'},
                {f:'1.6', col:'#d8a13a', width:1.5, dash:true, label:'E: due punti di inversione'}],
        marks:[{x:-1, y:0.4167, label:'stabile', col:'#4c8dff', up:true},
               {x:0, y:1, label:'instabile', col:'#ff6b6b', up:true},
               {x:2, y:-1.667, label:'stabile', col:'#4c8dff'}]},
      leggi: 'La forza è <b>F = -dU/dx</b>: dove la curva scende verso destra la forza spinge a destra. Nei <b>minimi</b> ogni spostamento genera una forza di richiamo (equilibrio <b>stabile</b>, e lì valgono le piccole oscillazioni con ω²=U\'\'/m); nei <b>massimi</b> la forza allontana (<b>instabile</b>). La retta orizzontale E incontra U nei <b>punti di inversione</b>: fra loro il moto è limitato, e la regione con U&gt;E è proibita. <b>Tutto il moto unidimensionale si legge da questo disegno senza risolvere nulla.</b>'
    },
    'Piccole oscillazioni attorno a un minimo': {
      spec: {kind:'func2d', xr:[0.6,3.4], yr:[-1.3,1.6], height:320,
        title:'U(x) e la sua parabola osculatrice nel minimo',
        curves:[{f:'pow(x,4)/4-pow(x,3)/3-x*x+1', col:'#5eead4', width:2.4, label:'U(x) vera'},
                {f:'-1.6667+3*(x-2)*(x-2)', col:'#b98cff', width:2.2, dash:true, label:'½U\'\'(x₀)(x-x₀)²'}],
        marks:[{x:2, y:-1.667, label:'x₀ minimo', col:'#d8a13a', up:false}]},
      leggi: 'Vicino al minimo le due curve sono <b>indistinguibili</b>: è il Taylor al secondo ordine, con il termine lineare nullo perché U\'(x₀)=0. Il moto è quindi armonico con <b>ω²=U\'\'(x₀)/m</b>, e l\'approssimazione peggiora visibilmente allontanandosi — cioè quando l\'ampiezza cresce. <b>È la ragione per cui l\'oscillatore armonico è ovunque in fisica</b>: non perché i sistemi siano armonici, ma perché ogni minimo lo è al secondo ordine.'
    },
    'Oscillatore smorzato: i tre regimi': {
      spec: {kind:'func2d', xr:[0,12], yr:[-1.15,1.15], height:330,
        title:'sotto-, criticamente e sovra-smorzato: stessa condizione iniziale',
        curves:[{f:'exp(-0.15*x)*cos(1.5*x)', col:'#5eead4', width:2.2, label:'sottosmorzato γ<ω₀'},
                {f:'(1+1.5*x)*exp(-1.5*x)', col:'#d8a13a', width:2.2, label:'critico γ=ω₀'},
                {f:'1.15*exp(-0.6*x)-0.15*exp(-4.6*x)', col:'#b98cff', width:2.2, label:'sovrasmorzato γ>ω₀'},
                {f:'0', col:'#4d5a6b', width:1, dash:true}]},
      leggi: 'Tre soluzioni della <b>stessa</b> equazione, distinte solo dal segno di γ²-ω₀². Il <b>sottosmorzato</b> oscilla dentro l\'inviluppo e⁻ᵞᵗ; il <b>critico</b> torna a zero nel tempo più breve <b>senza</b> oscillare — ed è per questo che si progettano così ammortizzatori e strumenti di misura; il <b>sovrasmorzato</b> striscia lentamente, più lento del critico. <b>Il caso critico è il più rapido: controintuitivo e chiesto spesso.</b>'
    },
    'Fattore Q e larghezza della risonanza': {
      spec: {kind:'func2d', xr:[0,2.4], yr:[-0.6,13.5], height:340,
        title:'ampiezza a regime al variare della forzante, per tre valori di Q',
        curves:[{f:'1/sqrt(pow(1-x*x,2)+pow(x/2,2))', col:'#5eead4', width:2.2, label:'Q=2'},
                {f:'1/sqrt(pow(1-x*x,2)+pow(x/5,2))', col:'#4c8dff', width:2.2, label:'Q=5'},
                {f:'1/sqrt(pow(1-x*x,2)+pow(x/12,2))', col:'#b98cff', width:2.4, label:'Q=12'}],
        marks:[{x:1, y:12, label:'picco ≈ Q', col:'#d8a13a', up:true, left:true}]},
      leggi: 'Più alto è <b>Q</b>, più il picco è alto e <b>stretto</b>: l\'ampiezza massima cresce come Q e la larghezza a metà altezza si stringe come ω₀/Q — il prodotto resta costante. Nota che il massimo <b>non</b> cade esattamente in ω₀ ma leggermente sotto (ω_ris = √(ω₀²-2γ²)), e lo scarto è visibile solo per Q piccolo. <b>Q è insieme il guadagno alla risonanza e il numero di oscillazioni prima dello smorzamento</b>: la stessa quantità letta nel dominio delle frequenze o in quello dei tempi.'
    },
    'Teorema di Huygens–Steiner': {
      spec: {kind:'func2d', xr:[-2.6,2.6], yr:[-2.2,2.2], equal:true, height:330, ticks:false,
        title:'I = I_cm + M d^2: il momento cresce come il QUADRATO della distanza',
        curves:[{f:'0*x-99', col:'#0e1117', width:0.1}],
        rings:[{r:1.5, x:0, y:0, col:'#5eead4', width:2.2, label:'corpo'}],
        segs:[{x1:0, y1:0, x2:2.1, y2:0, col:'#d8a13a', width:2.4, arrow:true, label:'d', lx:1.05, ly:0.22}],
        marks:[{x:0, y:0, label:'asse per il CM', col:'#b98cff', up:true, left:true},
               {x:2.1, y:0, label:'asse parallelo', col:'#ff9b6b', up:true}]},
      leggi: 'I due assi sono <b>paralleli</b> e distano d; il primo passa per il <b>centro di massa</b>. Il teorema dice I = I_cm + Md², e le due letture che valgono l\'esercizio sono: <b>(1)</b> il momento d\'inerzia è <b>minimo</b> rispetto all\'asse baricentrale — qualunque altro asse parallelo costa di più, sempre; <b>(2)</b> il termine aggiunto è Md², <b>quadratico</b>: raddoppiare la distanza quadruplica il contributo. Il teorema <b>non</b> vale fra due assi generici: uno dei due deve passare per il CM (errore d\'esame classico).'
    },
    'Gara di rotolamento sul piano inclinato': {
      spec: {kind:'func2d', xr:[0,2.2], yr:[0,3.4], height:330,
        title:'spazio percorso nel tempo: vince chi ha il momento d\'inerzia relativo piu piccolo',
        curves:[{f:'0.5*(1/(1+0))*9.8*0.5*x*x', col:'#8fa0b5', width:1.8, dash:true, label:'senza rotolare (k=0)'},
                {f:'0.5*(1/(1+0.5))*9.8*0.5*x*x', col:'#5eead4', width:2.2, label:'cilindro pieno k=1/2'},
                {f:'0.5*(1/(1+0.4))*9.8*0.5*x*x', col:'#4c8dff', width:2.2, label:'sfera piena k=2/5'},
                {f:'0.5*(1/(1+1))*9.8*0.5*x*x', col:'#b98cff', width:2.2, label:'anello k=1'}]},
      leggi: 'Con I = kMR², l\'accelerazione è a = g·sinθ/(1+k): <b>non dipende né dalla massa né dal raggio</b>, solo dalla <b>forma</b> attraverso k. Vince la sfera (k=2/5), poi il cilindro (1/2), ultimo l\'anello (1), che ha tutta la massa lontana dall\'asse. La curva grigia è il corpo che scivola senza rotolare: batte tutti, perché non deve pagare energia cinetica di rotazione. <b>La domanda d\'esame è sempre «e se cambio massa/raggio?»: la risposta è che non cambia nulla.</b>'
    },
    'Moto del proiettile': {
      spec: {kind:'curve', x:'0.5*x', y:'0', tr:[0,1], xr:[0,11], yr:[0,3.2], height:320,
        title:'traiettorie a parita di velocita iniziale: la gittata massima e a 45 gradi'},
      alt: {kind:'func2d', xr:[0,10.6], yr:[0,4.3], height:330,
        title:'traiettorie a parita di modulo della velocita iniziale (v=10 m/s)',
        curves:[{f:'x*tan(0.5236)-9.8*x*x/(2*100*pow(cos(0.5236),2))', col:'#5eead4', width:2.2, label:'30°'},
                {f:'x*tan(0.7854)-9.8*x*x/(2*100*pow(cos(0.7854),2))', col:'#d8a13a', width:2.6, label:'45° — gittata max'},
                {f:'x*tan(1.0472)-9.8*x*x/(2*100*pow(cos(1.0472),2))', col:'#4c8dff', width:2.2, label:'60°'},
                {f:'0', col:'#4d5a6b', width:1.2}]},
      leggi: 'Le tre parabole hanno lo <b>stesso</b> modulo di velocità iniziale e angoli diversi. La gittata R = v²sin(2θ)/g è massima a <b>45°</b>, e angoli complementari (30° e 60°) danno la <b>stessa gittata</b> con traiettorie diverse — quella alta impiega più tempo. Il moto è la composizione di un uniforme in orizzontale e di un uniformemente accelerato in verticale: <b>l\'indipendenza dei moti è ciò che rende la traiettoria una parabola</b>.'
    },
    'Pendolo semplice e isocronismo': {
      spec: {kind:'phase', fx:'y', fy:'-sin(x)', xr:[-6.6,6.6], yr:[-2.8,2.8], n:17, height:340,
        seeds:[[0,0.6],[0,1.2],[0,1.9],[0,2.35],[3.14159,0.05]],
        title:'ritratto di fase del pendolo: oscillazioni, separatrice, rotazioni'},
      leggi: 'Vicino all\'origine le traiettorie sono <b>ellissi</b>: piccole oscillazioni isocrone, T=2π√(l/g) indipendente dall\'ampiezza. Allargandosi le curve si <b>deformano</b> — il periodo cresce con l\'ampiezza, e l\'isocronismo è solo un\'approssimazione. La curva che passa per (±π, 0) è la <b>separatrice</b>: il moto che arriva alla verticale in un tempo infinito. Oltre, il pendolo <b>ruota</b> invece di oscillare. <b>Chiedere «fino a che ampiezza vale T=2π√(l/g)?» significa chiedere quanto ci si allontana dal centro di questo disegno.</b>'
    },
    'Velocità limite in caduta viscosa': {
      spec: {kind:'func2d', xr:[0,6], yr:[0,11], height:320,
        title:'v(t) tende alla velocita limite in modo esponenziale',
        curves:[{f:'9.8*(1-exp(-x))', col:'#5eead4', width:2.4, label:'v(t) con attrito viscoso'},
                {f:'9.8', col:'#d8a13a', width:1.6, dash:true, label:'v_lim = mg/b'},
                {f:'9.8*x', col:'#8fa0b5', width:1.4, dash:true, label:'caduta libera'}]},
      leggi: 'All\'inizio la curva è <b>tangente</b> alla caduta libera: per v piccola l\'attrito è trascurabile e vale a=g. Poi la resistenza cresce con v finché eguaglia il peso: da lì <b>accelerazione nulla</b> e velocità costante v_lim=mg/b. Il tempo caratteristico τ=m/b dice quanto ci mette: dopo 3τ si è al 95% del limite. <b>La velocità limite non si raggiunge mai esattamente</b> — è un asintoto — ed è il tipo di dettaglio che all\'orale distingue chi ha capito da chi ricorda.'
    },
    'Onde stazionarie e quantizzazione dei modi': {
      spec: {kind:'func2d', xr:[0,1], yr:[-1.35,1.35], height:320,
        title:'corda fissa agli estremi: solo lunghezze d\'onda che ci stanno un numero intero di volte',
        curves:[{f:'sin(PI*x)', col:'#5eead4', width:2.2, label:'n=1 fondamentale'},
                {f:'sin(2*PI*x)', col:'#4c8dff', width:2.2, label:'n=2'},
                {f:'sin(3*PI*x)', col:'#b98cff', width:2.2, label:'n=3'},
                {f:'0', col:'#4d5a6b', width:1, dash:true}]},
      leggi: 'Le condizioni al bordo y(0)=y(L)=0 ammettono <b>solo</b> le lunghezze d\'onda λ_n=2L/n, quindi frequenze ν_n=nv/2L: multipli interi della fondamentale. <b>La quantizzazione non viene dalla fisica ma dal bordo</b> — è lo stesso meccanismo che nella buca di potenziale quantistica dà i livelli di energia. L\'n-esimo modo ha <b>n-1 nodi interni</b>: contarli è il modo più rapido per riconoscerlo. Il timbro di uno strumento è il peso relativo di queste armoniche.'
    },
    'Battimenti': {
      spec: {kind:'func2d', xr:[0,32], yr:[-2.3,2.3], height:320,
        title:'somma di due frequenze vicine: portante veloce dentro un inviluppo lento',
        curves:[{f:'cos(3*x)+cos(3.4*x)', col:'#5eead4', width:1.6, label:'somma'},
                {f:'2*cos(0.2*x)', col:'#d8a13a', width:1.8, dash:true, label:'inviluppo'},
                {f:'-2*cos(0.2*x)', col:'#d8a13a', width:1.8, dash:true}]},
      leggi: 'La somma di due armoniche vicine si riscrive come <b>una</b> oscillazione alla frequenza media, modulata da un inviluppo alla <b>semidifferenza</b>. L\'orecchio non sente due note ma una sola che pulsa: e poiché l\'intensità dipende dall\'ampiezza al quadrato, i battimenti udibili sono <b>due</b> per periodo dell\'inviluppo — la frequenza di battimento è |ν₁-ν₂|, non la sua metà. <b>È l\'errore di fattore 2 più frequente su questo argomento.</b>'
    },
    'Legge di Stevino': {
      spec: {kind:'func2d', xr:[0,4], yr:[0,5.2], height:310,
        title:'p(h) = p0 + rho g h: lineare nella profondita, indipendente dalla forma',
        curves:[{f:'1+x', col:'#5eead4', width:2.4, label:'p(h)'},
                {f:'1', col:'#d8a13a', width:1.6, dash:true, label:'p₀ in superficie'}]},
      leggi: 'La pressione cresce <b>linearmente</b> con la profondità e non dipende né dalla forma né dal volume del recipiente: è il <b>paradosso idrostatico</b>. Il gradiente è ρg, quindi in acqua servono circa 10 m per aggiungere un\'atmosfera. Due conseguenze da avere pronte: superfici alla stessa quota in un fluido <b>connesso</b> hanno la stessa pressione (vasi comunicanti), e la forza su una parete cresce col <b>quadrato</b> della profondità perché si integra un profilo lineare.'
    },
    'Formula barometrica (atmosfera isoterma)': {
      spec: {kind:'func2d', xr:[0,26], yr:[0,1.1], height:310,
        title:'p(z) = p0 exp(-z/H): decadimento esponenziale, non lineare',
        curves:[{f:'exp(-x/8.5)', col:'#5eead4', width:2.4, label:'atmosfera isoterma'},
                {f:'max(0,1-x/8.5)', col:'#8fa0b5', width:1.6, dash:true, label:'se fosse lineare (fluido incomprimibile)'}]},
      leggi: 'La differenza con Stevino è che <b>la densità di un gas dipende dalla pressione</b>: sostituendo ρ=pM/RT nell\'equazione idrostatica si ottiene un\'equazione differenziale, e la soluzione è <b>esponenziale</b> invece che lineare. L\'altezza di scala H=RT/Mg vale circa 8,5 km: ogni 8,5 km la pressione si divide per e. <b>Il liquido dà una retta, il gas un esponenziale, e la ragione è la comprimibilità</b> — è la domanda che collega i due risultati.'
    },
    'Teorema delle accelerazioni e Coriolis': {
      spec: {kind:'curve', x:'0.42*t*cos(1.15*t)', y:'-0.42*t*sin(1.15*t)', tr:[0,7.2],
        xr:[-3.2,3.2], yr:[-3.2,3.2], equal:true, height:340,
        title:'moto RETTILINEO uniforme visto da un riferimento rotante'},
      leggi: 'La traiettoria disegnata è quella di un corpo su cui <b>non agisce alcuna forza</b>: nel riferimento fisso va dritto a velocità costante. Vista dal riferimento <b>rotante</b> diventa una spirale che curva sempre dallo stesso lato. Per spiegare quella curvatura senza forze reali, l\'osservatore rotante deve introdurre due termini apparenti: la <b>centrifuga</b> (radiale, dipende dalla posizione) e <b>Coriolis</b> $-2m\\,\\vec\\omega\\times\\vec v$ (dipende dalla <b>velocità</b>, ed è quella che incurva). <b>La domanda d\'esame</b> è sempre distinguerle: la centrifuga agisce anche su un corpo fermo nel riferimento rotante, Coriolis solo su uno in movimento. La deviazione verso est di un grave in caduta e la rotazione del piano del pendolo di Foucault sono questa stessa figura, sulla Terra.'
    },
    'Urto elastico 1D: velocità finali e casi limite': {
      spec: {kind:'func2d', xr:[0.05,5], yr:[-1.15,2.15], height:330,
        title:'velocita finali (in unita di v1) al variare del rapporto di massa m2/m1',
        curves:[{f:'(1-x)/(1+x)', col:'#5eead4', width:2.4, label:'v1\' (proiettile)'},
                {f:'2/(1+x)', col:'#d8a13a', width:2.4, label:'v2\' (bersaglio)'},
                {f:'0', col:'#4d5a6b', width:1.2, dash:true}],
        marks:[{x:1, y:0, label:'m1=m2: si scambiano', col:'#b98cff', up:true}]},
      leggi: 'Tre casi limite che vanno letti sul grafico e non memorizzati. <b>(1)</b> A $m_2/m_1=1$ le curve si incrociano a $v_1\'=0$ e $v_2\'=v_1$: masse uguali si <b>scambiano</b> la velocità (il biliardo). <b>(2)</b> Per $m_2\\ll m_1$ (sinistra): $v_1\'\\to v_1$ e $v_2\'\\to 2v_1$ — il bersaglio leggero schizza via al <b>doppio</b> della velocità, e il proiettile pesante non se ne accorge. <b>(3)</b> Per $m_2\\gg m_1$ (destra): $v_1\'\\to-v_1$, rimbalzo con inversione, e $v_2\'\\to0$ — la palla contro il muro. <b>Il segno di $v_1\'$ cambia esattamente a $m_1=m_2$</b>: è la soglia fra «prosegue» e «torna indietro», ed è la domanda più frequente su questo argomento.'
    },
    'Seconda legge di Keplero dal momento angolare': {
      spec: {kind:'curve', x:'2.2*cos(t)-1.396', y:'1.7*sin(t)', tr:[0,6.2832],
        xr:[-4.1,1.5], yr:[-2.2,2.2], equal:true, height:330,
        title:'aree uguali in tempi uguali: vicino al fuoco l\'arco e piu lungo',
        segs:[{x1:0,y1:0,x2:0.804,y2:0,col:'#5eead4',width:2},{x1:0,y1:0,x2:0.60,y2:0.93,col:'#5eead4',width:2},
              {x1:0,y1:0,x2:-3.596,y2:0,col:'#d8a13a',width:2},{x1:0,y1:0,x2:-3.53,y2:0.35,col:'#d8a13a',width:2}],
        marks:[{x:0,y:0,label:'fuoco (Sole)',col:'#ffffff',up:true}]},
      leggi: 'I due settori — quello stretto e lungo vicino al fuoco, quello largo e corto lontano — hanno la <b>stessa area</b> e vengono percorsi nello <b>stesso tempo</b>. La ragione è in una riga: la velocità areolare è $\\frac{dA}{dt}=\\frac{L}{2m}$, e $L$ si conserva perché la forza è <b>centrale</b> (momento nullo rispetto al fuoco). <b>Quindi la seconda legge di Keplero non è un fatto sulla gravità</b>: vale per <i>qualunque</i> forza centrale, anche una molla. È la prima legge (l\'orbita è un\'ellisse) a richiedere specificamente il $1/r^2$. Conseguenza immediata: al perielio il pianeta va <b>più veloce</b>, perché per coprire la stessa area con un raggio corto serve un arco lungo.'
    },
    'Effetto Doppler e regola dei segni': {
      spec: {kind:'func2d', xr:[-0.75,0.75], yr:[0,4.2], height:330,
        title:'frequenza percepita (in unita di f0) al variare della velocita, in unita di c',
        curves:[{f:'1/(1-x)', col:'#5eead4', width:2.4, label:'sorgente in moto'},
                {f:'1+x', col:'#d8a13a', width:2.4, label:'osservatore in moto'},
                {f:'1', col:'#4d5a6b', width:1.2, dash:true}],
        marks:[{x:0,y:1,label:'fermi: f=f0',col:'#b98cff',up:true}]},
      leggi: 'Le due curve <b>non coincidono</b>, ed è il punto dell\'esercizio: nel caso acustico conta chi si muove <b>rispetto al mezzo</b>. Se si muove la <b>sorgente</b> la frequenza va come $\\frac{1}{1-v/c}$ e <b>diverge</b> quando $v\\to c$ (è il muro del suono: i fronti d\'onda si accumulano). Se si muove l\'<b>osservatore</b> va come $1+v/c$, che è lineare e non diverge mai. Per $v\\ll c$ le due coincidono al primo ordine — ed è per questo che la differenza sfugge se non si guarda il grafico. <b>Regola dei segni:</b> avvicinarsi alza la frequenza, allontanarsi la abbassa; in formula si sceglie il segno che rende $f\'>f_0$ in avvicinamento. <b>Nel caso della luce non c\'è mezzo</b> e la formula relativistica è simmetrica: dipende solo dalla velocità relativa.'
    },
    'Riflessione a estremo fisso e a estremo libero': {
      spec: {kind:'func2d', xr:[-4,4], yr:[-1.35,1.35], height:300, w:430,
        title:'estremo FISSO: l\'onda riflessa torna capovolta',
        curves:[{f:'exp(-4*pow(x+2,2))', col:'#5eead4', width:2, label:'incidente'},
                {f:'-exp(-4*pow(x-2,2))', col:'#ff6b6b', width:2, label:'riflessa (invertita)'},
                {f:'0', col:'#4d5a6b', width:1, dash:true}]},
      alt2: true,
      leggi: 'A un estremo <b>fisso</b> lo spostamento deve essere nullo in ogni istante: l\'unico modo perché incidente e riflessa si sommino a zero in quel punto è che la riflessa sia <b>capovolta</b> — sfasamento di $\\pi$. A un estremo <b>libero</b>, invece, la condizione è sulla <b>pendenza</b> (nessuna forza trasversale, $\\partial y/\\partial x=0$): lì la riflessa torna <b>diritta</b>, e nel punto di riflessione l\'ampiezza <b>raddoppia</b>. <b>Il ragionamento non va memorizzato, va rifatto ogni volta:</b> si scrive la condizione al bordo e si guarda cosa impone. È lo stesso schema che nel nucleo delle onde stazionarie decide dove stanno nodi e ventri — e in ottica dà lo sfasamento nella riflessione su un mezzo più denso.'
    },
    'Teorema del guscio sferico': {
      spec: {kind:'func2d', xr:[0,4], yr:[0,1.15], height:330,
        title:'campo gravitazionale di una sfera piena omogenea, dentro e fuori',
        curves:[{f:'x<1 ? x : 1/(x*x)', col:'#5eead4', width:2.6, label:'g(r)'},
                {f:'1/(x*x)', col:'#8fa0b5', width:1.4, dash:true, label:'estensione di 1/r² (falsa dentro)'}],
        marks:[{x:1,y:1,label:'superficie: massimo',col:'#d8a13a',up:true}]},
      leggi: 'Fuori dalla sfera il campo è <b>identico</b> a quello di tutta la massa concentrata nel centro: è la prima parte del teorema, ed è la ragione per cui si può trattare la Terra come un punto. Dentro, il guscio esterno al punto <b>non contribuisce</b> (il suo campo interno è esattamente nullo) e agisce solo la massa più interna, che per densità costante cresce come $r^3$: quindi $g\\propto M(r)/r^2\\propto r$, <b>lineare</b>. Il massimo è <b>sulla superficie</b>. <b>Due conseguenze da avere pronte:</b> in un tunnel diametrale il moto sarebbe armonico (forza di richiamo proporzionale a $r$), con periodo uguale a quello di un satellite radente; e la curva tratteggiata mostra l\'errore che si commette applicando $1/r^2$ all\'interno — diverge invece di annullarsi.'
    },
    'Effetto Venturi ed efflusso di Torricelli': {
      spec: {kind:'func2d', xr:[0.3,2.2], yr:[-1.2,3.6], height:330,
        title:'in una strozzatura la velocita sale e la pressione SCENDE',
        curves:[{f:'1/x', col:'#5eead4', width:2.4, label:'v ∝ 1/A (continuità)'},
                {f:'3-0.5/(x*x)', col:'#d8a13a', width:2.4, label:'p = p₀ - ½ρv² (Bernoulli)'}],
        marks:[{x:0.5,y:2,label:'strozzatura: v alta, p bassa',col:'#ff9b6b',up:true}]},
      leggi: 'Due leggi in una figura. L\'<b>equazione di continuità</b> $A v=$ cost impone che dove la sezione si stringe la velocità salga (curva verde, iperbole). <b>Bernoulli</b> impone poi che dove la velocità sale la pressione <b>scenda</b> (curva oro). L\'effetto è controintuitivo — ci si aspetta che «schiacciando» il fluido la pressione aumenti — e invece l\'energia si sposta da pressione a cinetica. <b>È il principio del tubo di Venturi</b> (si misura la portata dalla differenza di pressione), della portanza, e del perché due navi affiancate si attirano. <b>Torricelli è lo stesso conto con la strozzatura all\'aperto:</b> $v=\\sqrt{2gh}$ — la velocità d\'efflusso è quella di un grave caduto dall\'altezza del pelo libero, e non dipende dalla densità del liquido.'
    }

  };

  /* ============ 3. RIPASSO SPAZIATO — stesso archivio dell'app ============ */
  var KEY = 'pm-progresso-v1', GIORNO = 86400000, NUC = '90';
  var PASSI = [1, 3, 7, 16, 35, 75];
  function leggi() { try { var d = JSON.parse(localStorage.getItem(KEY) || 'null'); return d && d.v ? d : {v:1,nuclei:{},voci:{},opts:{perGiorno:10},storico:{}}; } catch (e) { return {v:1,nuclei:{},voci:{},opts:{perGiorno:10},storico:{}}; } }
  function scrivi(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }
  function pianifica(v, esito) {
    var ef = v.ef || 2.5;
    if (esito === 'so') { ef = Math.min(2.9, ef + 0.1); v.n = (v.n || 0) + 1; }
    else if (esito === 'incerto') { ef = Math.max(1.3, ef - 0.15); v.n = Math.max(1, v.n || 1); }
    else { ef = Math.max(1.3, ef - 0.25); v.n = 0; v.lapse = (v.lapse || 0) + 1; }
    v.ef = Math.round(ef * 100) / 100;
    var base = PASSI[Math.min(v.n, PASSI.length - 1)];
    var gg = v.n === 0 ? 1 : Math.max(1, Math.round(base * (v.ef / 2.5)));
    v.int = gg; v.due = Date.now() + gg * GIORNO; v.ultimo = Date.now(); v.esito = esito;
    return v;
  }
  function tappaDi(pool) { var i = POOL_ORD.indexOf(pool); return (i < 0 ? 0 : i + 1) < 10 ? '0' + (i + 1) : String(i + 1); }

  function registraRipasso(q, esitoQuiz) {
    var mappa = { no: 'rivedere', part: 'incerto', yes: 'so' };
    var esito = mappa[esitoQuiz]; if (!esito) return null;
    var D = leggi();
    var pool = q._pool || '?';
    var id = NUC + '#' + tappaDi(pool) + '#L' + (q.topic || '').slice(0, 40);
    var v = D.voci[id] || { nucleo: NUC, ef: 2.5, n: 0 };
    v.tappa = tappaDi(pool); v.tipo = 'lavagna'; v.titolo = q.topic || 'dimostrazione';
    v.nucleoTitolo = 'Meccanica — dimostrazioni per l’orale';
    pianifica(v, esito);
    D.voci[id] = v;
    var n = D.nuclei[NUC] || (D.nuclei[NUC] = { titolo: 'Meccanica — orale', tappe: {} });
    n.titolo = 'Meccanica — orale';
    n.tappe[tappaDi(pool)] = { visto: Date.now(), titolo: (PROGRAMMA[pool] || pool) };
    n.ultimo = Date.now();
    var g = new Date().toISOString().slice(0, 10);
    D.storico[g] = (D.storico[g] || 0) + 1;
    scrivi(D);
    return v;
  }

  /* ============ stile degli innesti ============ */
  var CSS = [
    '.mx-fig{margin:18px 0 4px;background:#111722;border:1px solid #26303f;border-radius:12px;padding:12px}',
    '.mx-fig .mx-leg{margin-top:10px;background:#161d29;border:1px solid #26303f;border-left:3px solid #4a8fc7;',
    'border-radius:0 10px 10px 0;padding:10px 13px;font-size:.92rem;line-height:1.5;color:#b9c4d1}',
    '.mx-fig .mx-leg b{color:#7ab8e0}',
    '.mx-prog{display:inline-block;font-size:.66rem;font-weight:700;letter-spacing:.5px;text-transform:uppercase;',
    'padding:3px 9px;border-radius:20px;background:#3a2410;border:1px solid #7a4a18;color:#f0a95a;margin-left:8px}',
    '.mx-due{margin-top:8px;font-size:.86rem;color:#7ab8e0}'
  ].join('');
  (function () { var s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); })();

  /* ============ innesto A: figura nella soluzione modello ============ */
  function innestaFigura(q) {
    var F = FIG[q && q.topic]; if (!F) return;
    var host = document.getElementById('ovProof'); if (!host) return;
    if (host.querySelector('.mx-fig')) return;
    var box = document.createElement('div'); box.className = 'mx-fig';
    var canvasHost = document.createElement('div');
    box.appendChild(canvasHost);
    if (F.leggi) {
      var l = document.createElement('div'); l.className = 'mx-leg';
      l.innerHTML = '<b>Come si legge.</b> ' + F.leggi;
      box.appendChild(l);
    }
    host.appendChild(box);
    var spec = F.alt || F.spec;
    if (spec.w === undefined) spec.w = 560;
    if (window.PM_Plot) window.PM_Plot.render(canvasHost, spec);
    else canvasHost.innerHTML = '<div style="color:#ff6b6b;font:13px Georgia">motore-plot.js non caricato</div>';
  }

  /* ============ avvio: si aggancia alle funzioni globali del quiz ============ */
  function aggancia() {
    if (typeof window.openOverlay === 'function' && !window.openOverlay.__mx) {
      var orig = window.openOverlay;
      window.openOverlay = function (q) { var r = orig.apply(this, arguments); try { innestaFigura(q); } catch (e) {} return r; };
      window.openOverlay.__mx = true;
    }
    if (typeof window.recordEval === 'function' && !window.recordEval.__mx) {
      var origE = window.recordEval;
      window.recordEval = function (val) {
        var q = window.currentLav;
        var r = origE.apply(this, arguments);
        try {
          var v = registraRipasso(q, val);
          if (v) {
            var fb = document.getElementById('feedback');
            if (fb) {
              var gg = Math.max(0, Math.round((v.due - Date.now()) / GIORNO));
              var d = document.createElement('div'); d.className = 'mx-due';
              d.textContent = '◈ In coda per il ripasso: ' + (gg <= 1 ? 'domani' : 'fra ' + gg + ' giorni') + '. La ritrovi nell’app, scheda «Oggi».';
              fb.appendChild(d);
            }
          }
        } catch (e) {}
        return r;
      };
      window.recordEval.__mx = true;
    }
  }

  /* ============ innesto C: badge del programma sull'intestazione ============ */
  function badgeProgramma() {
    var el = document.getElementById('qTopic'); if (!el) return;
    var pool = null, txt = el.textContent || '';
    for (var k in PROGRAMMA) { /* il quiz scrive «nome pool · topic» */ }
    // il pool corrente sta nello stato del quiz
    try { pool = window.state && window.state.queue && window.state.queue[window.state.idx] ? window.state.queue[window.state.idx]._pool : null; } catch (e) {}
    var vecchio = document.getElementById('mxProg'); if (vecchio) vecchio.remove();
    if (!pool || !PROGRAMMA[pool]) return;
    var b = document.createElement('span'); b.id = 'mxProg'; b.className = 'mx-prog';
    b.textContent = '◈ programma ' + PROGRAMMA[pool];
    b.title = 'Voce del programma ufficiale (Pisano, canale Pet-Z, AA 2025/26). Meccanica è un ORALE: tutto il programma è materia d’esame, e le lavagne sono ciò che devi saper fare davanti alla lavagna.';
    el.parentNode.insertBefore(b, el.nextSibling);
  }

  window.addEventListener('DOMContentLoaded', function () {
    aggancia();
    // il badge si aggiorna a ogni domanda: osservo il nodo che il quiz riscrive
    var t = document.getElementById('qTopic');
    if (t && window.MutationObserver) {
      new MutationObserver(function () { setTimeout(badgeProgramma, 0); }).observe(t, { childList: true, characterData: true, subtree: true });
    }
    setTimeout(badgeProgramma, 300);
  });
  setTimeout(aggancia, 0);

  window.MX = { figure: FIG, programma: PROGRAMMA, registraRipasso: registraRipasso };
})();
