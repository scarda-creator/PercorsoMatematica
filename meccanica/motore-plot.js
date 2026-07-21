/* motore-plot.js — visualizzazioni del percorso-matematica (Dedalo, 2026-07-20).
 * Canvas puro, zero librerie esterne, self-contained. Il blocco {t:'plot',...} del
 * motore dei nuclei chiama PM_Plot.render(container, spec).
 * kind:
 *   func2d   {f, xr:[a,b], yr?}                      y=f(x)
 *   curve    {x, y, tr:[a,b]}                        curva parametrica (x(t),y(t))
 *   field2d  {fx, fy, xr, yr, n?}                    campo vettoriale (frecce normalizzate)
 *   contour  {f, xr, yr, levels:[...]}               insiemi/curve di livello f(x,y)=c
 *   phase    {fx, fy, xr, yr, seeds:[[x,y]...], n?}  ritratto di fase EDO (campo + traiettorie RK4)
 *   surface3d{f, xr, yr, n?}                          superficie z=f(x,y), RUOTABILE (trascina)
 * Comune: {title, xlabel, ylabel, height?}
 */
(function () {
  /* palette allineata ai nuclei (bg #0e1117, accent #4c8dff, pro #b98cff, gram #5eead4) */
  var COL = { bg: '#121821', axis: '#4d5a6b', grid: '#212a36', ink: '#c9d4e0',
              c1: '#5eead4', c2: '#d8a13a', c3: '#b98cff', c4: '#4c8dff', warn: '#ff6b6b' };

  function fn2(expr) { return new Function('x', 'y',
    'var {sin,cos,tan,exp,log,log2,sqrt,cbrt,abs,pow,sign,atan,atan2,asin,acos,sinh,cosh,tanh,PI,E,min,max,floor,round,hypot}=Math; return (' + expr + ');'); }
  function fn1(expr) { return new Function('x',
    'var {sin,cos,tan,exp,log,sqrt,cbrt,abs,pow,sign,atan,asin,acos,sinh,cosh,tanh,PI,E,min,max,hypot}=Math; return (' + expr + ');'); }
  function fnt(expr) { return new Function('t',
    'var {sin,cos,tan,exp,log,sqrt,abs,pow,atan,PI,E,hypot}=Math; return (' + expr + ');'); }

  function mkCanvas(host, w, h) {
    var c = document.createElement('canvas');
    var dpr = window.devicePixelRatio || 1;
    c.width = w * dpr; c.height = h * dpr; c.style.width = w + 'px'; c.style.height = h + 'px';
    c.style.display = 'block'; c.style.borderRadius = '10px'; c.style.background = COL.bg;
    host.appendChild(c);
    var g = c.getContext('2d'); g.scale(dpr, dpr);
    return { c: c, g: g, w: w, h: h };
  }

  // mappa mondo->pixel per i 2D.
  // equal=true -> scala ISOMETRICA (un'unità x = un'unità y): senza, i cerchi
  // diventano ellissi e ogni figura metrica (palle, norme, tangenze) mente.
  function mapper(w, h, xr, yr, pad, equal) {
    var x0 = xr[0], x1 = xr[1], y0 = yr[0], y1 = yr[1];
    if (equal) {
      var s = Math.min((w - 2 * pad) / (x1 - x0), (h - 2 * pad) / (y1 - y0));
      var mx = (x0 + x1) / 2, my = (y0 + y1) / 2, cx = w / 2, cy = h / 2;
      return {
        X: function (x) { return cx + (x - mx) * s; },
        Y: function (y) { return cy - (y - my) * s; },
        x0: x0, x1: x1, y0: y0, y1: y1,
        // estremi effettivamente visibili nel riquadro (per griglia e assi)
        vx0: mx - (cx - pad) / s, vx1: mx + (cx - pad) / s,
        vy0: my - (cy - pad) / s, vy1: my + (cy - pad) / s
      };
    }
    return {
      X: function (x) { return pad + (x - x0) / (x1 - x0) * (w - 2 * pad); },
      Y: function (y) { return h - pad - (y - y0) / (y1 - y0) * (h - 2 * pad); },
      x0: x0, x1: x1, y0: y0, y1: y1, vx0: x0, vx1: x1, vy0: y0, vy1: y1
    };
  }

  function axes2d(g, m, w, h, pad, ticks) {
    g.strokeStyle = COL.grid; g.lineWidth = 1; g.font = '11px Georgia';
    var stepX = niceStep(m.vx1 - m.vx0), stepY = niceStep(m.vy1 - m.vy0);
    var x, y, px, py;
    for (x = Math.ceil(m.vx0 / stepX) * stepX; x <= m.vx1 + 1e-9; x += stepX) {
      px = m.X(x); g.beginPath(); g.moveTo(px, pad); g.lineTo(px, h - pad); g.stroke();
    }
    for (y = Math.ceil(m.vy0 / stepY) * stepY; y <= m.vy1 + 1e-9; y += stepY) {
      py = m.Y(y); g.beginPath(); g.moveTo(pad, py); g.lineTo(w - pad, py); g.stroke();
    }
    g.strokeStyle = COL.axis; g.lineWidth = 1.4;
    var hasY0 = m.vy0 <= 0 && m.vy1 >= 0, hasX0 = m.vx0 <= 0 && m.vx1 >= 0;
    if (hasY0) { py = m.Y(0); g.beginPath(); g.moveTo(pad, py); g.lineTo(w - pad, py); g.stroke(); }
    if (hasX0) { px = m.X(0); g.beginPath(); g.moveTo(px, pad); g.lineTo(px, h - pad); g.stroke(); }
    if (ticks !== false) {   // numeri sugli assi: senza, la scala non si legge
      g.fillStyle = COL.axis; g.font = '10px Georgia'; g.textAlign = 'center';
      if (hasY0) { py = m.Y(0);
        for (x = Math.ceil(m.vx0 / stepX) * stepX; x <= m.vx1 + 1e-9; x += stepX) {
          if (Math.abs(x) < 1e-9) continue; px = m.X(x);
          if (px < pad + 6 || px > w - pad - 6) continue;
          g.fillText(fmt(x), px, Math.min(h - pad - 4, py + 13)); } }
      if (hasX0) { px = m.X(0); g.textAlign = 'right';
        for (y = Math.ceil(m.vy0 / stepY) * stepY; y <= m.vy1 + 1e-9; y += stepY) {
          if (Math.abs(y) < 1e-9) continue; py = m.Y(y);
          if (py < pad + 6 || py > h - pad - 6) continue;
          g.fillText(fmt(y), Math.max(pad + 22, px - 5), py + 3); } }
      g.textAlign = 'left';
    }
  }
  function fmt(v) { var r = Math.round(v * 100) / 100; return String(r); }
  function niceStep(range) { var raw = range / 6, p = Math.pow(10, Math.floor(Math.log10(raw))), n = raw / p;
    return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * p; }

  function arrow(g, x1, y1, x2, y2, col) {
    g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    var a = Math.atan2(y2 - y1, x2 - x1), s = 5;
    g.beginPath(); g.moveTo(x2, y2);
    g.lineTo(x2 - s * Math.cos(a - 0.4), y2 - s * Math.sin(a - 0.4));
    g.lineTo(x2 - s * Math.cos(a + 0.4), y2 - s * Math.sin(a + 0.4));
    g.closePath(); g.fill();
  }

  // ---- 2D kinds ----
  function draw2d(host, spec) {
    var h = spec.height || 320, w = spec.w || Math.min(560, host.clientWidth || 560), pad = 34;
    var xr = spec.xr || [-3, 3];
    var f, ys, yr = spec.yr;
    if (spec.kind === 'func2d') {
      f = fn1(spec.f); ys = [];
      var N = 400;
      for (var i = 0; i <= N; i++) { var x = xr[0] + (xr[1] - xr[0]) * i / N; var y = f(x); if (isFinite(y)) ys.push(y); }
      if (!yr) { var lo = Math.min.apply(null, ys), hi = Math.max.apply(null, ys); var pd = (hi - lo) * 0.12 || 1; yr = [lo - pd, hi + pd]; }
    }
    if (!yr) yr = spec.yr || [-3, 3];
    // isometria di default per i kind "metrici" (dove il cerchio DEVE essere un cerchio)
    var eq = spec.equal !== undefined ? spec.equal
           : (spec.kind === 'contour' || spec.kind === 'curve' || spec.kind === 'field2d' || spec.kind === 'phase');
    if (eq) {   // riquadro aderente: niente banda vuota attorno alla figura
      var sx0 = xr[1] - xr[0], sy0 = yr[1] - yr[0];
      var tw = 2 * pad + (h - 2 * pad) * sx0 / sy0;
      if (tw <= w) w = tw; else h = 2 * pad + (w - 2 * pad) * sy0 / sx0;
    }
    var cv = mkCanvas(host, w, h), g = cv.g, m = mapper(w, h, xr, yr, pad, eq);
    axes2d(g, m, w, h, pad, spec.ticks);
    if (spec.kind === 'func2d') {
      // una o più curve y=f(x). spec.curves=[{f, col, label, dash, width}] disegna una famiglia;
      // altrimenti la singola spec.f. Le curve condividono assi/scala.
      var famiglia = spec.curves || [{ f: spec.f, col: COL.c1 }];
      var legF = [];
      famiglia.forEach(function (C, ci) {
        var fc = fn1(C.f), NN = 600, started = false;
        var col = C.col || [COL.c1, COL.c2, COL.c3, COL.c4, COL.warn][ci % 5];
        g.strokeStyle = col; g.lineWidth = C.width || 2.2; g.setLineDash(C.dash ? [5, 4] : []);
        g.beginPath();
        for (var i2 = 0; i2 <= NN; i2++) { var x = xr[0] + (xr[1] - xr[0]) * i2 / NN, y = fc(x);
          if (!isFinite(y) || y < yr[0] - 50 || y > yr[1] + 50) { started = false; continue; }
          var px = m.X(x), py = m.Y(y); if (!started) { g.moveTo(px, py); started = true; } else g.lineTo(px, py); }
        g.stroke(); g.setLineDash([]);
        if (C.label) legF.push({ t: C.label, c: col });
      });
      if (legF.length) legend(g, legF, pad, w);
    } else if (spec.kind === 'curve') {
      var X = fnt(spec.x), Y = fnt(spec.y), tr = spec.tr || [0, 2 * Math.PI];
      g.strokeStyle = COL.c3; g.lineWidth = 2.2; g.beginPath();
      for (var k = 0; k <= 500; k++) { var t = tr[0] + (tr[1] - tr[0]) * k / 500, px = m.X(X(t)), py = m.Y(Y(t));
        k ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke();
    } else if (spec.kind === 'field2d' || spec.kind === 'phase') {
      var fx = fn2(spec.fx), fy = fn2(spec.fy), n = spec.n || 15;
      var cw = (xr[1] - xr[0]) / n, ch = (yr[1] - yr[0]) / n, cell = Math.min((w - 2 * pad) / n, (h - 2 * pad) / n) * 0.42;
      for (var ix = 0; ix < n; ix++) for (var iy = 0; iy < n; iy++) {
        var xx = xr[0] + (ix + 0.5) * cw, yy = yr[0] + (iy + 0.5) * ch, vx = fx(xx, yy), vy = fy(xx, yy), mag = Math.hypot(vx, vy);
        if (!isFinite(mag) || mag < 1e-9) continue; var ux = vx / mag * cell, uy = vy / mag * cell;
        var col = spec.kind === 'phase' ? COL.grid2 || '#3a3560' : mixMag(mag);
        arrow(g, m.X(xx) - ux / 2, m.Y(yy) + uy / 2, m.X(xx) + ux / 2, m.Y(yy) - uy / 2, spec.kind === 'phase' ? '#4d4770' : col);
      }
      if (spec.kind === 'phase' && spec.seeds) {
        spec.seeds.forEach(function (s, si) {
          [1, -1].forEach(function (dir) {
            g.strokeStyle = [COL.c1, COL.c2, COL.c4, COL.c3][si % 4]; g.lineWidth = 2; g.beginPath();
            var x = s[0], y = s[1], dt = 0.012 * dir, first = true;
            for (var st = 0; st < 3000; st++) {
              var k1x = fx(x, y), k1y = fy(x, y), k2x = fx(x + dt / 2 * k1x, y + dt / 2 * k1y), k2y = fy(x + dt / 2 * k1x, y + dt / 2 * k1y);
              var k3x = fx(x + dt / 2 * k2x, y + dt / 2 * k2y), k3y = fy(x + dt / 2 * k2x, y + dt / 2 * k2y), k4x = fx(x + dt * k3x, y + dt * k3y), k4y = fy(x + dt * k3x, y + dt * k3y);
              x += dt / 6 * (k1x + 2 * k2x + 2 * k3x + k4x); y += dt / 6 * (k1y + 2 * k2y + 2 * k3y + k4y);
              if (!isFinite(x) || !isFinite(y) || x < xr[0] || x > xr[1] || y < yr[0] || y > yr[1]) break;
              var px = m.X(x), py = m.Y(y); first ? (g.moveTo(px, py), first = false) : g.lineTo(px, py);
            } g.stroke();
          });
          g.fillStyle = '#fff'; g.beginPath(); g.arc(m.X(s[0]), m.Y(s[1]), 3, 0, 7); g.fill();
        });
      }
    } else if (spec.kind === 'contour') {
      // strati: quello base (spec.f) + eventuali spec.overlays [{f, levels, col, label, dash}]
      var strati = [{ f: spec.f, levels: spec.levels || [0.5, 1, 2, 3], col: spec.col, label: spec.label, dash: spec.dash }];
      if (spec.overlays) strati = strati.concat(spec.overlays);
      var G = 90, leg = [];
      strati.forEach(function (S, si) {
        var F = fn2(S.f), vals = [];
        for (var a = 0; a <= G; a++) { vals[a] = []; for (var b = 0; b <= G; b++) { var X2 = xr[0] + (xr[1] - xr[0]) * a / G, Y2 = yr[0] + (yr[1] - yr[0]) * b / G; vals[a][b] = F(X2, Y2); } }
        var lv = S.levels || [1];
        lv.forEach(function (L, li) {
          var col = S.col || [COL.c1, COL.c2, COL.c4, COL.c3, COL.warn][(strati.length > 1 ? si : li) % 5];
          g.strokeStyle = col; g.lineWidth = S.width || 1.8;
          g.setLineDash(S.dash ? [5, 4] : []);
          g.beginPath();
          for (var a = 0; a < G; a++) for (var b = 0; b < G; b++) marchCell(g, m, vals, a, b, G, xr, yr, L);
          g.stroke(); g.setLineDash([]);
          if (S.label && li === 0) leg.push({ t: S.label, c: col });
        });
      });
      // campo gradiente sovrapposto ai livelli: spec.grad = {fx, fy, n?}. Le frecce sono
      // ORTOGONALI alle curve di livello — è il fatto geometrico del gradiente, in una figura sola.
      if (spec.grad) {
        var gfx = fn2(spec.grad.fx), gfy = fn2(spec.grad.fy), ng = spec.grad.n || 11;
        var cwg = (xr[1] - xr[0]) / ng, chg = (yr[1] - yr[0]) / ng;
        var cellg = Math.min((w - 2 * pad) / ng, (h - 2 * pad) / ng) * 0.44;
        for (var gx = 0; gx < ng; gx++) for (var gy = 0; gy < ng; gy++) {
          var xg = xr[0] + (gx + 0.5) * cwg, yg = yr[0] + (gy + 0.5) * chg;
          var vx = gfx(xg, yg), vy = gfy(xg, yg), mg = Math.hypot(vx, vy);
          if (!isFinite(mg) || mg < 1e-9) continue;
          var ax = vx / mg * cellg, ay = vy / mg * cellg;
          arrow(g, m.X(xg), m.Y(yg), m.X(xg) + ax, m.Y(yg) - ay, spec.grad.col || '#e0a94a');
        }
        if (spec.grad.label) leg.push({ t: spec.grad.label, c: spec.grad.col || '#e0a94a' });
      }
      if (leg.length) legend(g, leg, pad, w);
    }
    // rings: [{r, x?, y?, col?, dash?, label?}] — cammini circolari di riferimento (circuitazione)
    if (spec.rings) spec.rings.forEach(function (R) {
      var cxr = R.x || 0, cyr = R.y || 0, col = R.col || '#ff9b6b';
      g.strokeStyle = col; g.lineWidth = R.width || 2; g.setLineDash(R.dash ? [5, 4] : []);
      g.beginPath();
      for (var a = 0; a <= 64; a++) { var th = a / 64 * 2 * Math.PI, px = m.X(cxr + R.r * Math.cos(th)), py = m.Y(cyr + R.r * Math.sin(th)); a ? g.lineTo(px, py) : g.moveTo(px, py); }
      g.stroke(); g.setLineDash([]);
    });
    // segs: [{x1,y1,x2,y2, col?, width?, dash?, arrow?, label?, lx?, ly?}] — segmenti retti.
    // Nati per la GEOMETRIA di Hilbert (vettore, proiezione, errore ortogonale): il disegno
    // in cui l'ortogonalità è un angolo retto e non una formula. `arrow` mette la punta in (x2,y2).
    if (spec.segs) spec.segs.forEach(function (S) {
      var col = S.col || '#ffffff';
      var X1 = m.X(S.x1), Y1 = m.Y(S.y1), X2 = m.X(S.x2), Y2 = m.Y(S.y2);
      g.setLineDash(S.dash ? [5, 4] : []);
      if (S.arrow) { arrow(g, X1, Y1, X2, Y2, col); }
      else { g.strokeStyle = col; g.lineWidth = S.width || 2.2; g.beginPath(); g.moveTo(X1, Y1); g.lineTo(X2, Y2); g.stroke(); }
      g.setLineDash([]);
      if (S.label) {
        g.font = '12px Georgia'; g.fillStyle = col; g.textAlign = 'center';
        g.fillText(S.label, m.X(S.lx !== undefined ? S.lx : (S.x1 + S.x2) / 2),
                            m.Y(S.ly !== undefined ? S.ly : (S.y1 + S.y2) / 2));
        g.textAlign = 'left';
      }
    });
    // marks: [{x, y, label?, col?, hollow?}] — punti notevoli (ottimi, tangenze, punti critici)
    if (spec.marks) spec.marks.forEach(function (P) {
      var px = m.X(P.x), py = m.Y(P.y), col = P.col || '#ffffff';
      g.beginPath(); g.arc(px, py, 4.5, 0, 7);
      if (P.hollow) { g.strokeStyle = col; g.lineWidth = 2; g.stroke(); g.fillStyle = COL.bg; g.fill(); g.stroke(); }
      else { g.fillStyle = col; g.fill(); g.strokeStyle = COL.bg; g.lineWidth = 1.5; g.stroke(); }
      if (P.label) {
        g.font = '11px Georgia'; g.fillStyle = col; g.textAlign = P.left ? 'right' : 'left';
        g.fillText(P.label, px + (P.left ? -8 : 8), py + (P.up ? -8 : 14));
        g.textAlign = 'left';
      }
    });
    if (spec.title) caption(host, spec.title);
    return cv;
  }
  function mixMag(mag) { var t = Math.min(1, mag / 3); return t > 0.6 ? COL.c2 : COL.c1; }
  function marchCell(g, m, v, a, b, G, xr, yr, L) {
    function P(a, b) { return { x: xr[0] + (xr[1] - xr[0]) * a / G, y: yr[0] + (yr[1] - yr[0]) * b / G, v: v[a][b] }; }
    var p = [P(a, b), P(a + 1, b), P(a + 1, b + 1), P(a, b + 1)], pts = [];
    for (var e = 0; e < 4; e++) { var q = p[e], r = p[(e + 1) % 4];
      if ((q.v - L) * (r.v - L) < 0) { var t = (L - q.v) / (r.v - q.v); pts.push({ x: q.x + t * (r.x - q.x), y: q.y + t * (r.y - q.y) }); } }
    if (pts.length >= 2) { g.moveTo(m.X(pts[0].x), m.Y(pts[0].y)); g.lineTo(m.X(pts[1].x), m.Y(pts[1].y)); }
  }

  // ---- 3D surface (ruotabile) ----
  function draw3d(host, spec) {
    var h = spec.height || 380, w = spec.w || Math.min(560, host.clientWidth || 560);
    var cv = mkCanvas(host, w, h), g = cv.g;
    var F = fn2(spec.f), xr = spec.xr || [-2, 2], yr = spec.yr || [-2, 2], n = spec.n || 32;
    var pts = [], zmin = 1e9, zmax = -1e9, i, j;
    for (i = 0; i <= n; i++) { pts[i] = []; for (j = 0; j <= n; j++) {
      var x = xr[0] + (xr[1] - xr[0]) * i / n, y = yr[0] + (yr[1] - yr[0]) * j / n, z = F(x, y);
      if (!isFinite(z)) z = NaN; else { if (z < zmin) zmin = z; if (z > zmax) zmax = z; }
      pts[i][j] = { x: x, y: y, z: z }; } }
    var zr = (zmax - zmin) || 1;
    var state = { yaw: spec.yaw !== undefined ? spec.yaw : 0.7,
                  pitch: spec.pitch !== undefined ? spec.pitch : 0.5 };
    var zs = spec.zscale !== undefined ? spec.zscale : 1.6;
    function render() {
      g.clearRect(0, 0, w, h);
      var cy = Math.cos(state.yaw), sy = Math.sin(state.yaw), cp = Math.cos(state.pitch), sp = Math.sin(state.pitch);
      var cx = (xr[0] + xr[1]) / 2, cyy = (yr[0] + yr[1]) / 2, czz = (zmin + zmax) / 2;
      var sx = (xr[1] - xr[0]) / 2 || 1, syy = (yr[1] - yr[0]) / 2 || 1;
      function proj(P) {
        var X = (P.x - cx) / sx, Y = (P.y - cyy) / syy, Z = (P.z - czz) / zr * zs;
        var x1 = X * cy - Y * sy, y1 = X * sy + Y * cy;         // yaw
        var y2 = y1 * cp - Z * sp, z2 = y1 * sp + Z * cp;       // pitch
        var scale = Math.min(w, h) * 0.32;
        return { px: w / 2 + x1 * scale, py: h / 2 - z2 * scale + 10, depth: y2, z: P.z };
      }
      var quads = [];
      for (i = 0; i < n; i++) for (j = 0; j < n; j++) {
        var a = pts[i][j], b = pts[i + 1][j], c = pts[i + 1][j + 1], d = pts[i][j + 1];
        if ([a, b, c, d].some(function (p) { return isNaN(p.z); })) continue;
        var A = proj(a), B = proj(b), C = proj(c), D = proj(d);
        quads.push({ q: [A, B, C, D], depth: (A.depth + B.depth + C.depth + D.depth) / 4, z: (a.z + b.z + c.z + d.z) / 4 });
      }
      // piano tangente in (x0,y0): z = z0 + fx*(x-x0) + fy*(y-y0), gradiente numerico.
      // I quad del piano entrano nello STESSO array: il painter li interleava con la superficie
      // → occlusione corretta (dove la superficie sta davanti al piano, lo copre e viceversa).
      var tp = null;
      if (spec.tangent) {
        var x0 = spec.tangent.x0, y0 = spec.tangent.y0, sp2 = spec.tangent.span || (xr[1] - xr[0]) * 0.28;
        var z0 = F(x0, y0), ep = (xr[1] - xr[0]) * 1e-3;
        var fxg = (F(x0 + ep, y0) - F(x0 - ep, y0)) / (2 * ep);
        var fyg = (F(x0, y0 + ep) - F(x0, y0 - ep)) / (2 * ep);
        var pln = function (x, y) { return { x: x, y: y, z: z0 + fxg * (x - x0) + fyg * (y - y0) }; };
        var m2 = 7;
        for (i = 0; i < m2; i++) for (j = 0; j < m2; j++) {
          var xa = x0 - sp2 + 2 * sp2 * i / m2, xb = x0 - sp2 + 2 * sp2 * (i + 1) / m2;
          var ya = y0 - sp2 + 2 * sp2 * j / m2, yb = y0 - sp2 + 2 * sp2 * (j + 1) / m2;
          var PA = proj(pln(xa, ya)), PB = proj(pln(xb, ya)), PC = proj(pln(xb, yb)), PD = proj(pln(xa, yb));
          quads.push({ q: [PA, PB, PC, PD], depth: (PA.depth + PB.depth + PC.depth + PD.depth) / 4, plane: true });
        }
        tp = proj({ x: x0, y: y0, z: z0 });
      }
      quads.sort(function (u, v) { return u.depth - v.depth; });          // painter (retro->fronte)
      quads.forEach(function (Q) {
        if (Q.plane) {                                                    // piano tangente: azzurro traslucido
          g.fillStyle = 'rgba(94,234,212,0.20)'; g.strokeStyle = 'rgba(94,234,212,0.55)'; g.lineWidth = 0.7;
        } else {
          var t = (Q.z - zmin) / zr;                                      // colore per altezza
          var col = lerpCol([60, 40, 120], [230, 170, 80], t);
          g.fillStyle = 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',0.82)';
          g.strokeStyle = 'rgba(20,16,40,0.55)'; g.lineWidth = 0.6;
        }
        g.beginPath(); g.moveTo(Q.q[0].px, Q.q[0].py);
        for (var k = 1; k < 4; k++) g.lineTo(Q.q[k].px, Q.q[k].py); g.closePath(); g.fill(); g.stroke();
      });
      if (tp) { g.fillStyle = '#ffffff'; g.strokeStyle = '#0e1117'; g.lineWidth = 1.5;
        g.beginPath(); g.arc(tp.px, tp.py, 4, 0, 7); g.fill(); g.stroke(); }
      g.fillStyle = COL.axis; g.font = '11px Georgia';
      g.fillText('↻ trascina per ruotare', 12, h - 12);
    }
    render();
    var drag = false, lx, ly;
    cv.c.style.cursor = 'grab';
    cv.c.addEventListener('mousedown', function (e) { drag = true; lx = e.clientX; ly = e.clientY; cv.c.style.cursor = 'grabbing'; });
    window.addEventListener('mouseup', function () { drag = false; cv.c.style.cursor = 'grab'; });
    window.addEventListener('mousemove', function (e) { if (!drag) return; state.yaw += (e.clientX - lx) * 0.01; state.pitch += (e.clientY - ly) * 0.01; state.pitch = Math.max(-1.4, Math.min(1.4, state.pitch)); lx = e.clientX; ly = e.clientY; render(); });
    if (spec.title) caption(host, spec.title);
    return cv;
  }
  function lerpCol(a, b, t) { t = Math.max(0, Math.min(1, t)); return [0, 1, 2].map(function (i) { return Math.round(a[i] + (b[i] - a[i]) * t); }); }

  // ---- curva 3D parametrica (x(t),y(t),z(t)), ruotabile: riusa la camera yaw/pitch di draw3d ----
  function draw3dcurve(host, spec) {
    var h = spec.height || 380, w = spec.w || Math.min(560, host.clientWidth || 560);
    var cv = mkCanvas(host, w, h), g = cv.g;
    var X = fnt(spec.x), Y = fnt(spec.y), Z = fnt(spec.z || '0'), tr = spec.tr || [0, 2 * Math.PI], N = spec.n || 400;
    var P = [], i, bb = { x0: 1e9, x1: -1e9, y0: 1e9, y1: -1e9, z0: 1e9, z1: -1e9 };
    for (i = 0; i <= N; i++) { var t = tr[0] + (tr[1] - tr[0]) * i / N, p = { x: X(t), y: Y(t), z: Z(t) };
      P.push(p); bb.x0 = Math.min(bb.x0, p.x); bb.x1 = Math.max(bb.x1, p.x);
      bb.y0 = Math.min(bb.y0, p.y); bb.y1 = Math.max(bb.y1, p.y); bb.z0 = Math.min(bb.z0, p.z); bb.z1 = Math.max(bb.z1, p.z); }
    var cx = (bb.x0 + bb.x1) / 2, cyy = (bb.y0 + bb.y1) / 2, czz = (bb.z0 + bb.z1) / 2;
    var sc = Math.max(bb.x1 - bb.x0, bb.y1 - bb.y0, bb.z1 - bb.z0) / 2 || 1;
    var state = { yaw: spec.yaw !== undefined ? spec.yaw : 0.7, pitch: spec.pitch !== undefined ? spec.pitch : 0.5 };
    function proj(p, cyaw, syaw, cp, sp) {
      var Xn = (p.x - cx) / sc, Yn = (p.y - cyy) / sc, Zn = (p.z - czz) / sc;
      var x1 = Xn * cyaw - Yn * syaw, y1 = Xn * syaw + Yn * cyaw;
      var y2 = y1 * cp - Zn * sp, z2 = y1 * sp + Zn * cp;
      var scale = Math.min(w, h) * 0.34;
      return { px: w / 2 + x1 * scale, py: h / 2 - z2 * scale + 10 };
    }
    function render() {
      g.clearRect(0, 0, w, h);
      var cyaw = Math.cos(state.yaw), syaw = Math.sin(state.yaw), cp = Math.cos(state.pitch), sp = Math.sin(state.pitch);
      // assi di riferimento leggeri (x,y,z) dall'origine relativa
      var O = proj({ x: cx, y: cyy, z: bb.z0 }, cyaw, syaw, cp, sp);
      g.strokeStyle = COL.grid; g.lineWidth = 1;
      [['x', bb.x1], ['y', bb.y1]].forEach(function (ax) {
        var e = { x: cx, y: cyy, z: bb.z0 }; e[ax[0]] = ax[1];
        var Pe = proj(e, cyaw, syaw, cp, sp); g.beginPath(); g.moveTo(O.px, O.py); g.lineTo(Pe.px, Pe.py); g.stroke();
      });
      g.strokeStyle = spec.col || COL.c3; g.lineWidth = 2.4; g.beginPath();
      for (var k = 0; k <= N; k++) { var q = proj(P[k], cyaw, syaw, cp, sp); k ? g.lineTo(q.px, q.py) : g.moveTo(q.px, q.py); }
      g.stroke();
      if (spec.mark3d) { var mp = proj(spec.mark3d, cyaw, syaw, cp, sp);
        g.fillStyle = '#fff'; g.strokeStyle = COL.bg; g.lineWidth = 1.5; g.beginPath(); g.arc(mp.px, mp.py, 4, 0, 7); g.fill(); g.stroke(); }
      g.fillStyle = COL.axis; g.font = '11px Georgia'; g.fillText('↻ trascina per ruotare', 12, h - 12);
    }
    render();
    var drag = false, lx, ly; cv.c.style.cursor = 'grab';
    cv.c.addEventListener('mousedown', function (e) { drag = true; lx = e.clientX; ly = e.clientY; cv.c.style.cursor = 'grabbing'; });
    window.addEventListener('mouseup', function () { drag = false; cv.c.style.cursor = 'grab'; });
    window.addEventListener('mousemove', function (e) { if (!drag) return; state.yaw += (e.clientX - lx) * 0.01; state.pitch += (e.clientY - ly) * 0.01; state.pitch = Math.max(-1.4, Math.min(1.4, state.pitch)); lx = e.clientX; ly = e.clientY; render(); });
    if (spec.title) caption(host, spec.title);
    return cv;
  }

  function legend(g, items, pad, w) {
    g.font = '12px Georgia'; g.textAlign = 'left';
    var y = pad - 16 < 12 ? 14 : pad - 14;
    var x = pad + 2;
    items.forEach(function (it) {
      g.strokeStyle = it.c; g.lineWidth = 2.4;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + 16, y); g.stroke();
      g.fillStyle = COL.ink; g.fillText(it.t, x + 21, y + 4);
      x += 21 + g.measureText(it.t).width + 16;
    });
  }

  function caption(host, txt) {
    var d = document.createElement('div'); d.textContent = txt;
    d.style.cssText = 'text-align:center;color:#8b86a0;font:italic 13px Georgia;margin:6px 0 2px';
    host.appendChild(d);
  }

  // ---- SUPERFICIE PARAMETRICA Phi(u,v), ruotabile ----------------------------
  // Il buco che restava dal 20 luglio: surface3d disegna solo GRAFICI z=f(x,y),
  // quindi niente sfere, cilindri, tori, nastri. Qui la superficie e' data da tre
  // funzioni x(u,v), y(u,v), z(u,v): il dominio e' il rettangolo (u,v), l'immagine
  // e' qualunque cosa. Opzioni:
  //   normal:{u0,v0,len?}  -> vettore normale N = Phi_u x Phi_v (numerico) nel punto
  //   field:{fx,fy,fz,nu?,nv?} -> frecce del campo sui punti della superficie (flusso)
  //   uWrap / vWrap -> chiude la maglia (sfera: vWrap sui meridiani)
  function draw3dparam(host, spec) {
    var h = spec.height || 400, w = spec.w || Math.min(560, host.clientWidth || 560);
    var cv = mkCanvas(host, w, h), g = cv.g;
    function fuv(e) { return new Function('u', 'v',
      'var {sin,cos,tan,exp,log,sqrt,cbrt,abs,pow,sign,atan,atan2,asin,acos,sinh,cosh,tanh,PI,E,min,max,hypot}=Math; return (' + e + ');'); }
    var FX = fuv(spec.x), FY = fuv(spec.y), FZ = fuv(spec.z);
    var ur = spec.ur || [0, Math.PI], vr = spec.vr || [0, 2 * Math.PI];
    var nu = spec.nu || 26, nv = spec.nv || 34;
    function P(u, v) { return { x: FX(u, v), y: FY(u, v), z: FZ(u, v) }; }
    var pts = [], i, j, bb = { x0: 1e9, x1: -1e9, y0: 1e9, y1: -1e9, z0: 1e9, z1: -1e9 };
    for (i = 0; i <= nu; i++) { pts[i] = []; for (j = 0; j <= nv; j++) {
      var u = ur[0] + (ur[1] - ur[0]) * i / nu, v = vr[0] + (vr[1] - vr[0]) * j / nv, p = P(u, v);
      p.u = u; p.v = v; pts[i][j] = p;
      bb.x0 = Math.min(bb.x0, p.x); bb.x1 = Math.max(bb.x1, p.x);
      bb.y0 = Math.min(bb.y0, p.y); bb.y1 = Math.max(bb.y1, p.y);
      bb.z0 = Math.min(bb.z0, p.z); bb.z1 = Math.max(bb.z1, p.z); } }
    var cx = (bb.x0 + bb.x1) / 2, cyy = (bb.y0 + bb.y1) / 2, czz = (bb.z0 + bb.z1) / 2;
    var sc = Math.max(bb.x1 - bb.x0, bb.y1 - bb.y0, bb.z1 - bb.z0) / 2 || 1;
    var state = { yaw: spec.yaw !== undefined ? spec.yaw : 0.7,
                  pitch: spec.pitch !== undefined ? spec.pitch : 0.45 };
    // normale numerica in (u0,v0): prodotto vettoriale delle derivate parziali
    function normale(u0, v0) {
      var e = 1e-4;
      var pu = { x: (FX(u0 + e, v0) - FX(u0 - e, v0)) / (2 * e), y: (FY(u0 + e, v0) - FY(u0 - e, v0)) / (2 * e), z: (FZ(u0 + e, v0) - FZ(u0 - e, v0)) / (2 * e) };
      var pv = { x: (FX(u0, v0 + e) - FX(u0, v0 - e)) / (2 * e), y: (FY(u0, v0 + e) - FY(u0, v0 - e)) / (2 * e), z: (FZ(u0, v0 + e) - FZ(u0, v0 - e)) / (2 * e) };
      var N = { x: pu.y * pv.z - pu.z * pv.y, y: pu.z * pv.x - pu.x * pv.z, z: pu.x * pv.y - pu.y * pv.x };
      var m = Math.hypot(N.x, N.y, N.z) || 1;
      return { x: N.x / m, y: N.y / m, z: N.z / m, pu: pu, pv: pv };
    }
    function render() {
      g.clearRect(0, 0, w, h);
      var cyaw = Math.cos(state.yaw), syaw = Math.sin(state.yaw), cp = Math.cos(state.pitch), sp = Math.sin(state.pitch);
      function proj(p) {
        var Xn = (p.x - cx) / sc, Yn = (p.y - cyy) / sc, Zn = (p.z - czz) / sc;
        var x1 = Xn * cyaw - Yn * syaw, y1 = Xn * syaw + Yn * cyaw;
        var y2 = y1 * cp - Zn * sp, z2 = y1 * sp + Zn * cp;
        var scale = Math.min(w, h) * 0.34;
        return { px: w / 2 + x1 * scale, py: h / 2 - z2 * scale + 8, depth: y2 };
      }
      var items = [];
      for (i = 0; i < nu; i++) for (j = 0; j < nv; j++) {
        var a = pts[i][j], b = pts[i + 1][j], c = pts[i + 1][j + 1], d = pts[i][j + 1];
        if ([a, b, c, d].some(function (p) { return !isFinite(p.x) || !isFinite(p.y) || !isFinite(p.z); })) continue;
        var A = proj(a), B = proj(b), C = proj(c), D = proj(d);
        // tinta per altezza z (come surface3d, per continuita' visiva col resto del percorso)
        var t = (( a.z + b.z + c.z + d.z) / 4 - bb.z0) / ((bb.z1 - bb.z0) || 1);
        items.push({ kind: 'q', q: [A, B, C, D], depth: (A.depth + B.depth + C.depth + D.depth) / 4, t: t });
      }
      // campo vettoriale sulla superficie (flusso): frecce nei punti della maglia
      if (spec.field) {
        var GX = fn3(spec.field.fx), GY = fn3(spec.field.fy), GZ = fn3(spec.field.fz);
        var fu = spec.field.nu || 6, fv = spec.field.nv || 10, L = spec.field.len || 0.42 * sc;
        for (i = 0; i <= fu; i++) for (j = 0; j < fv; j++) {
          var uu = ur[0] + (ur[1] - ur[0]) * i / fu, vv = vr[0] + (vr[1] - vr[0]) * j / fv;
          var p0 = P(uu, vv), Vx = GX(p0.x, p0.y, p0.z), Vy = GY(p0.x, p0.y, p0.z), Vz = GZ(p0.x, p0.y, p0.z);
          var mg = Math.hypot(Vx, Vy, Vz); if (!isFinite(mg) || mg < 1e-9) continue;
          var p1 = { x: p0.x + Vx / mg * L, y: p0.y + Vy / mg * L, z: p0.z + Vz / mg * L };
          var Q0 = proj(p0), Q1 = proj(p1);
          items.push({ kind: 'a', a: Q0, b: Q1, depth: (Q0.depth + Q1.depth) / 2, col: spec.field.col || '#e0a94a' });
        }
      }
      // normale nei punti scelti: spec.normal accetta un oggetto o un ARRAY di punti
      // (l'array serve al nastro di Moebius, dove il senso della figura e' proprio
      //  confrontare la normale in punti diversi dello stesso giro).
      if (spec.normal) {
        var listaN = spec.normal.length ? spec.normal : [spec.normal];
        listaN.forEach(function (nn) {
          var N = normale(nn.u0, nn.v0);
          var s0 = nn.flip ? -1 : 1;
          var p0n = P(nn.u0, nn.v0);
          var LN = (nn.len || 0.75) * sc;
          var p1n = { x: p0n.x + s0 * N.x * LN, y: p0n.y + s0 * N.y * LN, z: p0n.z + s0 * N.z * LN };
          var R0 = proj(p0n), R1 = proj(p1n);
          items.push({ kind: 'a', a: R0, b: R1, depth: (R0.depth + R1.depth) / 2 + 1e6, col: nn.col || '#ffffff', wide: true });
          items.push({ kind: 'p', a: R0, depth: R0.depth + 1e6 });
        });
      }
      // curve disegnate SULLA superficie: spec.curves3d=[{x,y,z (in t), tr, col, width, n}]
      // Nate per i cammini chiusi (i due cappi del toro, il bordo condiviso di due
      // superfici in Stokes): ogni segmento entra nel depth-sort, quindi la parte di
      // curva che passa dietro viene coperta dalla superficie. E' la differenza fra
      // "una curva sopra il disegno" e "una curva sulla figura".
      if (spec.curves3d) spec.curves3d.forEach(function (C) {
        var CX = fnt2(C.x), CY = fnt2(C.y), CZ = fnt2(C.z), tr = C.tr || [0, 6.28319], NN = C.n || 120;
        var prev = null;
        for (var s2 = 0; s2 <= NN; s2++) {
          var t = tr[0] + (tr[1] - tr[0]) * s2 / NN;
          var q = proj({ x: CX(t), y: CY(t), z: CZ(t) });
          if (prev) items.push({ kind: 'l', a: prev, b: q, depth: (prev.depth + q.depth) / 2 + 1e-3,
                                 col: C.col || '#ff9b6b', width: C.width || 2.6 });
          prev = q;
        }
      });
      items.sort(function (A2, B2) { return A2.depth - B2.depth; });
      items.forEach(function (it) {
        if (it.kind === 'q') {
          var col = lerpCol([60, 40, 120], [230, 170, 80], it.t);
          g.fillStyle = 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',' + (spec.alpha || 0.86) + ')';
          g.strokeStyle = 'rgba(20,16,40,0.5)'; g.lineWidth = 0.6;
          g.beginPath(); g.moveTo(it.q[0].px, it.q[0].py);
          for (var k = 1; k < 4; k++) g.lineTo(it.q[k].px, it.q[k].py);
          g.closePath(); g.fill(); g.stroke();
        } else if (it.kind === 'a') {
          g.lineWidth = it.wide ? 2.6 : 1.6;
          arrow(g, it.a.px, it.a.py, it.b.px, it.b.py, it.col);
        } else if (it.kind === 'l') {
          g.strokeStyle = it.col; g.lineWidth = it.width;
          g.beginPath(); g.moveTo(it.a.px, it.a.py); g.lineTo(it.b.px, it.b.py); g.stroke();
        } else if (it.kind === 'p') {
          g.fillStyle = '#ffffff'; g.strokeStyle = '#0e1117'; g.lineWidth = 1.4;
          g.beginPath(); g.arc(it.a.px, it.a.py, 4, 0, 7); g.fill(); g.stroke();
        }
      });
      g.fillStyle = COL.axis; g.font = '11px Georgia';
      g.fillText('↻ trascina per ruotare', 12, h - 12);
    }
    function fnt2(e) { return new Function('t',
      'var {sin,cos,tan,exp,log,sqrt,abs,pow,sign,atan,atan2,PI,E,min,max,hypot}=Math; return (' + e + ');'); }
    function fn3(e) { return new Function('x', 'y', 'z',
      'var {sin,cos,tan,exp,log,sqrt,abs,pow,sign,atan,atan2,PI,E,min,max,hypot}=Math; return (' + e + ');'); }
    render();
    var drag = false, lx, ly;
    cv.c.style.cursor = 'grab';
    cv.c.addEventListener('mousedown', function (e) { drag = true; lx = e.clientX; ly = e.clientY; cv.c.style.cursor = 'grabbing'; });
    window.addEventListener('mouseup', function () { drag = false; cv.c.style.cursor = 'grab'; });
    window.addEventListener('mousemove', function (e) {
      if (!drag) return; state.yaw += (e.clientX - lx) * 0.01; state.pitch += (e.clientY - ly) * 0.01;
      state.pitch = Math.max(-1.4, Math.min(1.4, state.pitch)); lx = e.clientX; ly = e.clientY; render();
    });
    if (spec.title) caption(host, spec.title);
    return cv;
  }

  window.PM_Plot = {
    render: function (host, spec) {
      host.style.margin = '14px auto';
      try { return spec.kind === 'surface3d' ? draw3d(host, spec)
                 : spec.kind === 'param3d' ? draw3dparam(host, spec)
                 : spec.kind === 'curve3d' ? draw3dcurve(host, spec)
                 : draw2d(host, spec); }
      catch (e) { host.innerHTML = '<div style="color:#ff6b6b;font:13px Georgia">plot: ' + e.message + '</div>'; }
    }
  };
})();
