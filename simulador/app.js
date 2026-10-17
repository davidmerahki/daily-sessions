/*
 * app.js — interfaz del simulador: lienzo tipo Vensim + tablero.
 * Depende de motor.js (window.Motor) y modelo.js (window.Modelo).
 */
(function () {
  'use strict';
  const $ = (s, el = document) => el.querySelector(s);
  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') n.className = v; else if (k === 'text') n.textContent = v; else n.setAttribute(k, v === true ? '' : v);
    }
    for (const k of kids) if (k !== null && k !== undefined && k !== false) n.append(k);
    return n;
  };
  const SVGNS = 'http://www.w3.org/2000/svg';
  const sv = (tag, attrs = {}, ...kids) => {
    const n = document.createElementNS(SVGNS, tag);
    for (const [k, v] of Object.entries(attrs)) if (v !== null && v !== undefined) n.setAttribute(k, v);
    for (const k of kids) if (k) n.append(k);
    return n;
  };
  const N = Modelo.norm;
  const clon = (o) => JSON.parse(JSON.stringify(o));
  const almacen = {
    leer(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } },
    escribir(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } },
    borrar(k) { try { localStorage.removeItem(k); } catch (e) { /* sin almacenamiento */ } },
  };

  // ---------------------------------------------------------- formatos
  const TILDES = { fraccion: 'fracción', prospeccion: 'prospección', conversion: 'conversión', duracion: 'duración',
    institucion: 'institución', academicas: 'académicas', academica: 'académica', expansion: 'expansión',
    reduccion: 'reducción', atraccion: 'atracción', maxima: 'máxima', maximo: 'máximo', emision: 'emisión',
    certificacion: 'certificación', adopcion: 'adopción', busqueda: 'búsqueda', busquedas: 'búsquedas',
    habito: 'hábito', percepcion: 'percepción', dias: 'días', contratacion: 'contratación',
    incorporacion: 'incorporación', extension: 'extensión', exito: 'éxito', mas: 'más', tamano: 'tamaño',
    numero: 'número', decision: 'decisión', informacion: 'información', rotacion: 'rotación',
    capacitacion: 'capacitación', vicerrectoria: 'vicerrectoría', rectoria: 'rectoría', educacion: 'educación',
    innovacion: 'innovación', segun: 'según', tambien: 'también', aun: 'aún', esten: 'estén', area: 'área' };
  const tildes = (txt) => String(txt).replace(/[A-Za-z]+/g, (w) => {
    const t = TILDES[w.toLowerCase()];
    return !t ? w : w[0] === w[0].toUpperCase() ? t[0].toUpperCase() + t.slice(1) : t;
  });
  const etiqueta = (n) => { const s = tildes(n); return s.charAt(0).toUpperCase() + s.slice(1); };
  const nf = (d) => new Intl.NumberFormat('es', { maximumFractionDigits: d });
  const fmt = (v) => {
    if (v === undefined || v === null || !isFinite(v)) return '—';
    const a = Math.abs(v);
    if (a >= 1e6) return nf(2).format(v / 1e6) + ' M';
    if (a >= 1e4) return nf(1).format(v / 1e3) + ' mil';
    if (a >= 100) return nf(0).format(v);
    if (a >= 1) return nf(1).format(v);
    if (a === 0) return '0';
    if (a < 0.01) return v.toExponential(1).replace('.', ',');
    return nf(3).format(v);
  };
  const UNID = { Month: 'meses', Dmnl: '', Institucion: 'inst.', Unidad: 'unid.', Docente: 'docentes', Credencial: 'cred.',
    Persona: 'personas', Empresa: 'empresas', Busqueda: 'búsq.', Uso: 'usos', Contratacion: 'contrat.', Dia: 'días' };
  const fmtUnidad = (u) => String(u || '').replace(/\(([^)]*)\)/g, (m, d) => d.split('*').join('/'))
    .replace(/[A-Za-z]+/g, (w) => (w === 'Month' ? 'mes' : w in UNID ? UNID[w] : w)).replace(/\*/g, '·').trim();
  const fmtValor = (c, v) => {
    const u = c.unidades;
    if (u === '1/Month') return nf(2).format(v * 100) + ' %/mes';
    if (u === 'Dmnl' && c.rango && c.rango.max !== null && c.rango.max <= 1) return nf(0).format(v * 100) + ' %';
    if (u === 'Dmnl') return '×' + nf(1).format(v);
    if (u === 'Month') return nf(0).format(v) + ' meses';
    return nf(v < 10 ? 2 : 0).format(v) + ' ' + fmtUnidad(u);
  };
  const lineas = (texto, max = 16) => {
    const out = []; let cur = '';
    for (const w of String(texto).split(' ')) {
      if (cur && (cur + ' ' + w).length > max) { out.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w;
    }
    if (cur) out.push(cur);
    return out.length ? out : [''];
  };

  // ------------------------------------------------------------ estado
  const CFG_EMB = JSON.parse($('#config').textContent || '{}');
  const S = {
    M: null, cfg: null, vista: 0, herr: 'sel', sel: [], cam: { x: 0, y: 0, k: 1 },
    hist: [], fut: [], histFoco: false,
    comp: null, res: null, probs: [], errSim: null, minis: true,
    guardado: '', guardando: false, soloLectura: false, artifact: null, downloads: null,
    pestana: 'lienzo', tableroSucio: true, arr: null, espacio: false,
  };
  const CLAVE_BORRADOR = () => 'lienzo:' + (S.cfg && S.cfg.titulo || 'modelo');
  const vistaAct = () => S.M.vistas[S.vista];
  const itemsVista = () => vistaAct().items;
  const item = (id) => itemsVista().find((x) => x.id === id);
  const textoMdl = () => Modelo.aMdl(clon(S.M));
  // lo que se guarda: el modelo y la configuración del tablero (gráficos agregados o quitados)
  const estadoGuardable = () => textoMdl() + '\n' + JSON.stringify(S.cfg);

  // ----------------------------------------------------------- historial
  function pushHist() {
    S.hist.push(JSON.stringify({ M: S.M, vista: S.vista, sel: S.sel }));
    if (S.hist.length > 120) S.hist.shift();
    S.fut = [];
    pintarHerramientas();
  }
  function restaurar(snap) {
    const o = JSON.parse(snap);
    S.M = o.M; S.vista = Math.min(o.vista, S.M.vistas.length - 1); S.sel = o.sel.filter((id) => item(id));
    cambio({ estructura: true });
  }
  function deshacer() { if (!S.hist.length) return; S.fut.push(JSON.stringify({ M: S.M, vista: S.vista, sel: S.sel })); restaurar(S.hist.pop()); }
  function rehacer() { if (!S.fut.length) return; S.hist.push(JSON.stringify({ M: S.M, vista: S.vista, sel: S.sel })); restaurar(S.fut.pop()); }

  // ------------------------------------------------------------ cambios
  let tSim = null, tBorrador = null;
  function cambio({ estructura = false, inspector = estructura } = {}) {
    Modelo.actualizarTasas(S.M);
    pintarLienzo();
    if (estructura) pintarVistas();
    if (inspector) pintarInspector();
    pintarHerramientas();
    clearTimeout(tSim); tSim = setTimeout(simular, 180);
    clearTimeout(tBorrador); tBorrador = setTimeout(guardarBorrador, 700);
    pintarGuardado();
  }

  // ----------------------------------------------------------- simulación
  function simular() {
    S.probs = Modelo.problemas(S.M);
    const errores = S.probs.filter((p) => p.nivel === 'error');
    S.errores = new Set(errores.map((p) => p.key));
    if (!S.M.orden.length) {
      S.errSim = 'Modelo vacío: crea un nivel o una variable para empezar.'; S.comp = null; S.res = null;
    } else if (errores.length) {
      S.errSim = `${errores.length} ${errores.length === 1 ? 'error impide' : 'errores impiden'} simular; se muestran los últimos resultados válidos.`;
    } else {
      try {
        const comp = Motor.leer(textoMdl());
        S.res = comp.simular();
        S.comp = comp; S.errSim = null;
        S.tableroSucio = true;
      } catch (e) {
        S.errSim = e.message;
      }
    }
    pintarLienzo(); pintarEstadoSim(); pintarProblemas(); pintarGraficoInspector(); pintarErrorInspector();
    if (S.pestana === 'tablero') montarTablero();
  }
  const serie = (key) => {
    if (!S.res || !S.M.vars[key]) return null;
    try { return S.res.serie(S.M.vars[key].nombre); } catch (e) { return null; }
  };

  // ============================================================ LIENZO
  const SVG = $('#lienzo'), MUNDO = $('#mundo');
  const CAPA = { tub: $('#capa-tub'), fle: $('#capa-fle'), nod: $('#capa-nod'), prev: $('#capa-prev') };

  function aplicarCam() {
    MUNDO.setAttribute('transform', `translate(${S.cam.x},${S.cam.y}) scale(${S.cam.k})`);
    $('#z-pct').textContent = Math.round(S.cam.k * 100) + '%';
  }
  function aMundo(e) {
    const r = SVG.getBoundingClientRect();
    return { x: (e.clientX - r.left - S.cam.x) / S.cam.k, y: (e.clientY - r.top - S.cam.y) / S.cam.k };
  }
  function zoom(f, cx, cy) {
    const r = SVG.getBoundingClientRect();
    if (cx === undefined) { cx = r.width / 2; cy = r.height / 2; }
    const k = Math.min(3, Math.max(0.2, S.cam.k * f));
    S.cam.x = cx - ((cx - S.cam.x) * k) / S.cam.k;
    S.cam.y = cy - ((cy - S.cam.y) * k) / S.cam.k;
    S.cam.k = k; aplicarCam();
  }
  function ajustar() {
    const its = itemsVista().filter((it) => it.t !== 'flecha');
    const r = SVG.getBoundingClientRect();
    if (r.width) S.ajustado = true;
    if (!its.length || !r.width) { S.cam = { x: r.width / 2 || 300, y: r.height / 2 || 200, k: 1 }; aplicarCam(); return; }
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const it of its) {
      const g = geo(it);
      x0 = Math.min(x0, it.x - g.w); x1 = Math.max(x1, it.x + g.w);
      y0 = Math.min(y0, it.y - g.h); y1 = Math.max(y1, it.y + g.h + (S.minis ? 22 : 0));
      if (it.t === 'valvula') { x0 = Math.min(x0, it.x + it.lx - 60); x1 = Math.max(x1, it.x + it.lx + 60); y1 = Math.max(y1, it.y + it.ly + 30); }
    }
    const pad = 40;
    const k = Math.min(1.4, Math.max(0.25, Math.min((r.width - 2 * pad) / (x1 - x0 || 1), (r.height - 2 * pad) / (y1 - y0 || 1))));
    S.cam = { k, x: (r.width - (x1 - x0) * k) / 2 - x0 * k, y: (r.height - (y1 - y0) * k) / 2 - y0 * k };
    aplicarCam();
  }

  /** Medio ancho y medio alto de un elemento (para anclar flechas y tuberías). */
  function geo(it) {
    if (it.t === 'nivel') {
      const v = S.M.vars[it.key];
      const ls = lineas(v ? v.nombre : '', 14);
      return { w: Math.max(it.w || 40, Math.max(...ls.map((l) => l.length)) * 3.4 + 10), h: Math.max(it.h || 20, ls.length * 7.5 + 8) };
    }
    if (it.t === 'var' || it.t === 'sombra') {
      const v = S.M.vars[it.key];
      const ls = lineas((it.t === 'sombra' ? '<' : '') + (v ? v.nombre : '') + (it.t === 'sombra' ? '>' : ''), 16);
      return { w: Math.max(...ls.map((l) => l.length)) * 3.3 + 5, h: ls.length * 7.5 + 2 };
    }
    if (it.t === 'valvula') return { w: 8, h: 8 };
    if (it.t === 'nube') return { w: 12, h: 9 };
    if (it.t === 'nota') return it.bucle ? { w: 14, h: 14 } : { w: Math.min(140, it.texto.length * 3.3 + 6), h: 9 };
    return { w: 10, h: 10 };
  }
  const dentro = (p, it) => { const g = geo(it); return Math.abs(p.x - it.x) <= g.w && Math.abs(p.y - it.y) <= g.h; };
  const qb = (p0, p1, p2, t) => ({ x: (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x, y: (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y });
  const blossom = (p0, p1, p2, a, b) => ({
    x: (1 - a) * (1 - b) * p0.x + (a * (1 - b) + b * (1 - a)) * p1.x + a * b * p2.x,
    y: (1 - a) * (1 - b) * p0.y + (a * (1 - b) + b * (1 - a)) * p1.y + a * b * p2.y,
  });
  function curvaFlecha(f, a, b) {
    const p0 = { x: a.x, y: a.y }, p2 = { x: b.x, y: b.y };
    // (cx, cy) es un punto por el que pasa la curva (convención de Vensim); de ahí sale el punto de control
    const p1 = f.cx !== null && f.cx !== undefined ? { x: 2 * f.cx - (a.x + b.x) / 2, y: 2 * f.cy - (a.y + b.y) / 2 } : { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const salida = (it, desde) => {
      let lo = desde ? 0 : 1, hi = desde ? 1 : 0;
      if (!dentro(qb(p0, p1, p2, lo), it)) return lo;
      for (let i = 0; i < 22; i++) { const m = (lo + hi) / 2; if (dentro(qb(p0, p1, p2, m), it)) lo = m; else hi = m; }
      return hi;
    };
    const t0 = salida(a, true), t1 = Math.max(t0 + 0.01, salida(b, false));
    const q0 = blossom(p0, p1, p2, t0, t0), q1 = blossom(p0, p1, p2, t0, t1), q2 = blossom(p0, p1, p2, t1, t1);
    return { q0, q1, q2, medio: qb(p0, p1, p2, 0.5), p0, p2 };
  }

  function pintarLienzo() {
    if (!S.M) return;
    const vista = vistaAct();
    const porId = new Map(vista.items.map((it) => [it.id, it]));
    const sel = new Set(S.sel);
    for (const c of Object.values(CAPA)) if (c !== CAPA.prev) c.replaceChildren();
    const errores = S.errores || new Set();

    // tuberías y válvulas
    for (const it of vista.items) {
      if (it.t !== 'valvula') continue;
      const d = porId.get(it.desde), h = porId.get(it.hacia);
      const pd = d ? anclaTub(d, it) : { x: it.x - 60, y: it.y }, ph = h ? anclaTub(h, it) : { x: it.x + 60, y: it.y };
      const dpath = `M${pd.x},${pd.y} L${it.x},${it.y} L${ph.x},${ph.y}`;
      const ang = Math.atan2(ph.y - it.y, ph.x - it.x);
      const g = sv('g', { 'data-id': it.id, class: sel.has(it.id) ? 'sel' : null });
      g.append(sv('path', { d: dpath, class: 'tub-ext' }), sv('path', { d: dpath, class: 'tub-int' }));
      const tip = { x: ph.x, y: ph.y };
      const bx = tip.x - Math.cos(ang) * 11, by = tip.y - Math.sin(ang) * 11;
      const nx = -Math.sin(ang) * 7, ny = Math.cos(ang) * 7;
      g.append(sv('polygon', { points: `${tip.x},${tip.y} ${bx + nx},${by + ny} ${bx - nx},${by - ny}`, class: 'tub-punta' }));
      CAPA.tub.append(g);
    }
    // flechas
    for (const it of vista.items) {
      if (it.t !== 'flecha') continue;
      const a = porId.get(it.de), b = porId.get(it.a);
      if (!a || !b) continue;
      const c = curvaFlecha(it, a, b);
      const d = `M${c.q0.x},${c.q0.y} Q${c.q1.x},${c.q1.y} ${c.q2.x},${c.q2.y}`;
      const g = sv('g', { 'data-id': it.id, class: sel.has(it.id) ? 'sel' : null });
      g.append(sv('path', { d, class: 'fle-hit' }));
      g.append(sv('path', { d, class: 'fle' + (it.inicial ? ' ini' : ''), 'marker-end': sel.has(it.id) ? 'url(#m-fle-sel)' : 'url(#m-fle)' }));
      if (it.pol) {
        const t = 0.82, p = qb(c.q0, c.q1, c.q2, t), q = qb(c.q0, c.q1, c.q2, t - 0.02);
        const dx = p.x - q.x, dy = p.y - q.y, len = Math.hypot(dx, dy) || 1;
        g.append(sv('text', { x: p.x - (dy / len) * 9, y: p.y + (dx / len) * 9 + 4, 'text-anchor': 'middle', class: 'pol' }, document.createTextNode(it.pol === '-' ? '−' : '+')));
      }
      if (sel.has(it.id) && S.sel.length === 1) g.append(sv('circle', { cx: c.medio.x, cy: c.medio.y, r: 5, class: 'asa', 'data-asa': it.id }));
      CAPA.fle.append(g);
    }
    // nodos
    for (const it of vista.items) {
      if (it.t === 'flecha') continue;
      const g = sv('g', { 'data-id': it.id, transform: `translate(${it.x},${it.y})` });
      const cls = [];
      if (sel.has(it.id)) cls.push('sel');
      const v = it.key ? S.M.vars[it.key] : null;
      if (v && errores.has(it.key)) cls.push('err');
      if (it.t === 'nivel') {
        const gg = geo(it);
        g.append(sv('rect', { x: -gg.w, y: -gg.h, width: 2 * gg.w, height: 2 * gg.h, rx: 3, class: 'n-caja' }));
        textoMultilinea(g, lineas(v.nombre, 14), 0, 0);
        mini(g, it.key, gg.h + 5, gg.w * 2);
      } else if (it.t === 'var' || it.t === 'sombra') {
        const gg = geo(it);
        const esConst = it.t === 'var' && esConstante(v);
        if (esConst) cls.push('n-const');
        if (it.t === 'sombra') cls.push('n-sombra');
        g.append(sv('rect', { x: -gg.w - 3, y: -gg.h - 2, width: 2 * gg.w + 6, height: 2 * gg.h + 4, rx: 6, class: 'n-fondo' }));
        textoMultilinea(g, lineas((it.t === 'sombra' ? '<' : '') + v.nombre + (it.t === 'sombra' ? '>' : ''), 16), 0, 0);
        if (it.t === 'var') {
          if (esConst) { if (S.minis) g.append(sv('text', { x: 0, y: gg.h + 11, 'text-anchor': 'middle', class: 'valor' }, document.createTextNode('= ' + fmt(parseFloat(v.ecuacion))))); }
          else mini(g, it.key, gg.h + 4, 56);
        }
      } else if (it.t === 'valvula') {
        const d = porId.get(it.desde), h = porId.get(it.hacia);
        const vert = d && h ? Math.abs(h.y - d.y) > Math.abs(h.x - d.x) : false;
        g.append(sv('path', { d: vert ? 'M-6,-7 L6,7 L-6,7 L6,-7 Z' : 'M-7,-6 L7,6 L7,-6 L-7,6 Z', class: 'valv' }));
        g.append(sv('circle', { r: 11, class: 'n-hit' }));
        const lg = sv('g', { transform: `translate(${it.lx},${it.ly})` });
        const ls = lineas(v.nombre, 16);
        // con varias líneas, el bloque crece alejándose de la válvula (hacia abajo o hacia arriba)
        const dy = Math.abs(it.lx) > Math.abs(it.ly) ? 0 : (ls.length - 1) * 7.5 * (it.ly < 0 ? -1 : 1);
        lg.append(sv('rect', { x: -Math.max(...ls.map((l) => l.length)) * 3.3 - 6, y: dy - ls.length * 7.5 - 2, width: Math.max(...ls.map((l) => l.length)) * 6.6 + 12, height: ls.length * 15 + 4, rx: 6, class: 'n-fondo' }));
        textoMultilinea(lg, ls, 0, dy);
        mini(lg, it.key, dy + ls.length * 7.5 + 4, 56);
        g.append(lg);
      } else if (it.t === 'nube') {
        g.append(sv('path', { d: 'M-11,5 a5,5 0 0 1 1,-9.5 a6.5,6.5 0 0 1 12,-1.5 a5.5,5.5 0 0 1 8.5,6 a4.5,4.5 0 0 1 -2,8 h-16 a4.5,4.5 0 0 1 -3.5,-3 z', class: 'nube' }));
      } else if (it.t === 'nota') {
        if (it.bucle) {
          g.append(sv('circle', { r: 13, class: 'bucle-c' }));
          g.append(sv('path', { d: it.horario ? 'M-9,-9 A13,13 0 0 1 9,-9' : 'M9,-9 A13,13 0 0 0 -9,-9', fill: 'none', stroke: 'var(--accent)', 'stroke-width': 1.4, 'marker-end': 'url(#m-fle-sel)' }));
          g.append(sv('text', { y: 4, 'text-anchor': 'middle', class: 'bucle-t' }, document.createTextNode(it.bucle)));
        } else {
          const gg = geo(it);
          g.append(sv('rect', { x: -gg.w - 4, y: -gg.h - 3, width: 2 * gg.w + 8, height: 2 * gg.h + 6, rx: 6, class: 'n-fondo' }));
          g.append(sv('text', { y: 4, 'text-anchor': 'middle', class: 'nota-t' }, document.createTextNode(it.texto)));
        }
      }
      if (v && errores.has(it.key)) { const gg = geo(it); g.append(sv('circle', { cx: gg.w + 4, cy: -gg.h, r: 3.5, class: 'err-dot' })); }
      if (v) g.append(sv('title', {}, document.createTextNode(tooltipVar(it.key))));
      if (cls.length) g.setAttribute('class', cls.join(' '));
      CAPA.nod.append(g);
    }
    SVG.classList.toggle('h-crear', S.herr !== 'sel');
  }

  function anclaTub(fin, valv) {
    if (fin.t === 'nube') {
      const dx = valv.x - fin.x, dy = valv.y - fin.y, L = Math.hypot(dx, dy) || 1;
      return { x: fin.x + (dx / L) * 13, y: fin.y + (dy / L) * 10 };
    }
    const g = geo(fin);
    const [x, y] = Modelo.ancla({ t: 'nivel', x: fin.x, y: fin.y, w: g.w, h: g.h }, valv);
    return { x, y };
  }
  function textoMultilinea(g, ls, x, y) {
    const y0 = y - ((ls.length - 1) * 15) / 2 + 4;
    ls.forEach((l, i) => g.append(sv('text', { x, y: y0 + i * 15, 'text-anchor': 'middle', class: 'n-txt' }, document.createTextNode(l))));
  }
  function mini(g, key, y, ancho) {
    if (!S.minis) return;
    const s = serie(key);
    if (!s || s.length < 2) return;
    let lo = Math.min(...s), hi = Math.max(...s);
    if (!isFinite(lo) || !isFinite(hi)) return;
    if (hi - lo < 1e-12) { lo -= 1; hi += 1; }
    const w = Math.min(ancho, 64), h = 14;
    const pts = s.map((v, i) => `${(-w / 2 + (w * i) / (s.length - 1)).toFixed(1)},${(y + h - ((v - lo) / (hi - lo)) * h).toFixed(1)}`).join(' ');
    g.append(sv('line', { x1: -w / 2, x2: w / 2, y1: y + h, y2: y + h, class: 'spark-base' }));
    g.append(sv('polyline', { points: pts, class: 'spark' }));
  }
  function esConstante(v) { return v && v.tipo === 'aux' && /^-?\s*(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(String(v.ecuacion).trim()); }
  function tooltipVar(key) {
    const v = S.M.vars[key];
    if (!v) return '';
    const s = serie(key);
    const fin = s ? ` · al final: ${fmt(s[s.length - 1])}` : '';
    const eq = v.tipo === 'nivel' ? `INTEG(${v.ecuacion}, ${v.inicial})` : v.ecuacion;
    return `${v.nombre}${v.unidades ? ' [' + v.unidades + ']' : ''}${fin}\n= ${eq}`;
  }

  // ------------------------------------------------------- herramientas
  const ICONOS = {
    sel: 'M5 3 L5 17 L9 13 L12 19 L14 18 L11 12 L16 12 Z',
    nivel: 'M3 6 H17 V14 H3 Z',
    flujo: 'M1 9 H6 M14 9 H19 M7 5 L13 13 L13 5 L7 13 Z M16 6 L19 9 L16 12',
    var: 'M10 4 A6 6 0 1 0 10.01 4 M7 10 H13',
    flecha: 'M3 15 Q8 3 16 8 M13 5 L16 8 L12 10',
    nota: 'M4 5 H16 M10 5 V16 M7 16 H13',
    borrar: 'M5 6 H15 M8 6 V4 H12 V6 M6 6 L7 17 H13 L14 6',
    deshacer: 'M7 6 L3 10 L7 14 M3 10 H12 A4 4 0 0 1 12 18 H9',
    rehacer: 'M13 6 L17 10 L13 14 M17 10 H8 A4 4 0 0 0 8 18 H11',
  };
  const HERR = [
    ['sel', 'Seleccionar y mover (V)'], ['nivel', 'Nivel / stock (S)'], ['flujo', 'Flujo (F): arrastra de un nivel o un espacio vacío a otro'],
    ['var', 'Variable auxiliar o constante (A)'], ['flecha', 'Flecha causal (C): arrastra de la causa al efecto'], ['nota', 'Comentario (T)'],
  ];
  const PISTAS = {
    nivel: 'Clic en el lienzo para crear un nivel. Esc para volver a seleccionar.',
    var: 'Clic en el lienzo para crear una variable. Esc para volver a seleccionar.',
    flujo: 'Arrastra desde un nivel (o un espacio vacío = nube) hasta otro nivel (o un espacio vacío).',
    flecha: 'Arrastra desde la causa hasta el efecto.',
    nota: 'Clic en el lienzo para escribir un comentario.',
  };
  function pintarHerramientas() {
    const box = $('#herramientas');
    if (!box.childElementCount) {
      const icono = (d) => { const s = sv('svg', { width: 20, height: 20, viewBox: '0 0 20 20', 'aria-hidden': 'true' }); s.append(sv('path', { d, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' })); return s; };
      for (const [h, t] of HERR) {
        const b = el('button', { type: 'button', 'data-h': h, title: t, 'aria-label': t, 'aria-pressed': 'false' }, icono(ICONOS[h]));
        b.addEventListener('click', () => usarHerr(h));
        box.append(b);
      }
      box.append(el('div', { class: 'sep' }));
      for (const [id, t, fn] of [['borrar', 'Eliminar selección (Supr)', borrarSel], ['deshacer', 'Deshacer (Ctrl+Z)', deshacer], ['rehacer', 'Rehacer (Ctrl+Shift+Z)', rehacer]]) {
        const b = el('button', { type: 'button', 'data-a': id, title: t, 'aria-label': t }, icono(ICONOS[id]));
        b.addEventListener('click', fn);
        box.append(b);
      }
    }
    box.querySelectorAll('[data-h]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.h === S.herr)));
    box.querySelector('[data-a=borrar]').disabled = !S.sel.length;
    box.querySelector('[data-a=deshacer]').disabled = !S.hist.length;
    box.querySelector('[data-a=rehacer]').disabled = !S.fut.length;
    const p = $('#pista');
    p.hidden = !PISTAS[S.herr];
    p.textContent = PISTAS[S.herr] || '';
  }
  function usarHerr(h) { S.herr = h; cancelarArrastre(); pintarHerramientas(); pintarLienzo(); }

  // ------------------------------------------------------ interacción
  const conectable = (it) => it && ['nivel', 'var', 'sombra', 'valvula'].includes(it.t);
  function bajoPuntero(e) {
    const n = document.elementFromPoint(e.clientX, e.clientY);
    const g = n && n.closest && n.closest('#lienzo [data-id]');
    return g ? item(g.dataset.id) : null;
  }
  function cancelarArrastre() { S.arr = null; CAPA.prev.replaceChildren(); SVG.classList.remove('h-pan'); }

  SVG.addEventListener('pointerdown', (e) => {
    if (!S.M) return;
    const p = aMundo(e);
    const asa = e.target.closest && e.target.closest('[data-asa]');
    const g = e.target.closest && e.target.closest('[data-id]');
    const it = g ? item(g.dataset.id) : null;
    SVG.setPointerCapture(e.pointerId);
    if (e.button === 1 || S.espacio) { S.arr = { tipo: 'pan', sx: e.clientX, sy: e.clientY, cx: S.cam.x, cy: S.cam.y }; SVG.classList.add('h-pan'); return; }
    if (asa) { S.arr = { tipo: 'curva', id: asa.dataset.asa, hist: false }; return; }
    switch (S.herr) {
      case 'sel':
        if (it) {
          if (e.shiftKey) S.sel = S.sel.includes(it.id) ? S.sel.filter((x) => x !== it.id) : [...S.sel, it.id];
          else if (!S.sel.includes(it.id)) S.sel = [it.id];
          const orig = new Map();
          for (const id of S.sel) { const x = item(id); if (x && x.t !== 'flecha') orig.set(id, { x: x.x, y: x.y }); }
          const fles = itemsVista().filter((f) => f.t === 'flecha' && f.cx !== null && f.cx !== undefined).map((f) => ({ f, cx: f.cx, cy: f.cy }));
          S.arr = { tipo: 'mover', x0: p.x, y0: p.y, orig, fles, movido: false };
          pintarLienzo(); pintarInspector(); pintarHerramientas();
        } else {
          if (!e.shiftKey && S.sel.length) { S.sel = []; pintarLienzo(); pintarInspector(); pintarHerramientas(); }
          S.arr = { tipo: 'pan', sx: e.clientX, sy: e.clientY, cx: S.cam.x, cy: S.cam.y }; SVG.classList.add('h-pan');
        }
        break;
      case 'nivel': case 'var': case 'nota':
        crear(S.herr, p); break;
      case 'flujo':
        S.arr = { tipo: 'flujo', desde: it && it.t === 'nivel' ? it.id : null, x0: it && it.t === 'nivel' ? it.x : p.x, y0: it && it.t === 'nivel' ? it.y : p.y, x: p.x, y: p.y };
        break;
      case 'flecha':
        if (conectable(it)) S.arr = { tipo: 'flecha', de: it.id, x: p.x, y: p.y };
        break;
    }
  });
  SVG.addEventListener('pointermove', (e) => {
    const A = S.arr;
    if (!A) return;
    const p = aMundo(e);
    if (A.tipo === 'pan') { S.cam.x = A.cx + e.clientX - A.sx; S.cam.y = A.cy + e.clientY - A.sy; aplicarCam(); return; }
    if (A.tipo === 'mover') {
      let dx = p.x - A.x0, dy = p.y - A.y0;
      if (!A.movido && Math.hypot(dx, dy) * S.cam.k < 3) return;
      if (!A.movido) { pushHist(); A.movido = true; }
      dx = Math.round(dx); dy = Math.round(dy);
      for (const [id, o] of A.orig) { const x = item(id); if (x) { x.x = o.x + dx; x.y = o.y + dy; } }
      for (const { f, cx, cy } of A.fles) {
        const n = (A.orig.has(f.de) ? 1 : 0) + (A.orig.has(f.a) ? 1 : 0);
        if (n) { f.cx = cx + (dx * n) / 2; f.cy = cy + (dy * n) / 2; }
      }
      pintarLienzo(); return;
    }
    if (A.tipo === 'curva') {
      const f = item(A.id);
      const a = item(f.de), b = item(f.a);
      if (!A.hist) { pushHist(); A.hist = true; }
      f.cx = Math.round(p.x); f.cy = Math.round(p.y);
      pintarLienzo(); return;
    }
    if (A.tipo === 'flujo' || A.tipo === 'flecha') {
      A.x = p.x; A.y = p.y;
      CAPA.prev.replaceChildren();
      const o = A.tipo === 'flecha' ? item(A.de) : { x: A.x0, y: A.y0 };
      CAPA.prev.append(sv('line', { x1: o.x, y1: o.y, x2: p.x, y2: p.y, class: A.tipo === 'flujo' ? 'prev-tub' : 'prev' }));
    }
  });
  SVG.addEventListener('pointerup', (e) => {
    const A = S.arr;
    if (!A) return;
    S.arr = null; CAPA.prev.replaceChildren(); SVG.classList.remove('h-pan');
    if (A.tipo === 'mover' && A.movido) cambio({});
    if (A.tipo === 'curva' && A.hist) cambio({});
    if (A.tipo === 'flujo') {
      const p = aMundo(e);
      const it = bajoPuntero(e);
      const hacia = it && it.t === 'nivel' ? it.id : null;
      if (Math.hypot(p.x - A.x0, p.y - A.y0) < 20 && !hacia) return;
      if (hacia && hacia === A.desde) return;
      crearFlujo(A.desde, { x: A.x0, y: A.y0 }, hacia, p);
    }
    if (A.tipo === 'flecha') {
      const it = bajoPuntero(e);
      if (conectable(it) && it.id !== A.de) crearFlecha(A.de, it.id);
    }
  });
  SVG.addEventListener('pointercancel', cancelarArrastre);
  SVG.addEventListener('dblclick', (e) => {
    const g = e.target.closest && e.target.closest('[data-id]');
    const it = g ? item(g.dataset.id) : null;
    if (!it) return;
    S.sel = [it.id]; pintarLienzo(); pintarInspector();
    const f = $('#insp-eq') || $('#insp-nota');
    if (f) { f.focus(); if (f.select) f.select(); }
  });
  SVG.addEventListener('wheel', (e) => {
    e.preventDefault();
    const r = SVG.getBoundingClientRect();
    if (e.ctrlKey || e.metaKey) zoom(Math.exp(-e.deltaY * 0.0022), e.clientX - r.left, e.clientY - r.top);
    else { S.cam.x -= e.deltaX; S.cam.y -= e.deltaY; aplicarCam(); }
  }, { passive: false });
  $('#z-mas').addEventListener('click', () => zoom(1.2));
  $('#z-menos').addEventListener('click', () => zoom(1 / 1.2));
  $('#z-ajustar').addEventListener('click', ajustar);
  $('#minis').addEventListener('change', (e) => { S.minis = e.target.checked; pintarLienzo(); });

  // ----------------------------------------------------------- creación
  function grupoVista() {
    const cuenta = new Map();
    for (const it of itemsVista()) {
      if (!it.key || it.t === 'sombra') continue;
      const g = S.M.vars[it.key] && S.M.vars[it.key].grupo;
      if (g) cuenta.set(g, (cuenta.get(g) || 0) + 1);
    }
    let mejor = '', n = 0;
    for (const [g, c] of cuenta) if (c > n) { mejor = g; n = c; }
    return mejor || vistaAct().nombre.replace(/^\d+\s+/, '');
  }
  function crear(tipo, p) {
    pushHist();
    const x = Math.round(p.x), y = Math.round(p.y);
    let it;
    if (tipo === 'nota') it = { id: Modelo.nuevoId(S.M), t: 'nota', texto: 'Comentario', x, y, bucle: null, horario: true };
    else {
      const nombre = Modelo.nuevoNombre(S.M, tipo === 'nivel' ? 'Nuevo nivel' : 'nueva variable');
      const k = Modelo.agregarVariable(S.M, tipo === 'nivel' ? 'nivel' : 'aux', nombre, grupoVista());
      if (tipo === 'var') S.M.vars[k].ecuacion = '';
      it = tipo === 'nivel' ? { id: Modelo.nuevoId(S.M), t: 'nivel', key: k, x, y, w: 40, h: 20 } : { id: Modelo.nuevoId(S.M), t: 'var', key: k, x, y, w: Modelo.medioAncho(nombre), h: 8 };
    }
    itemsVista().push(it);
    S.sel = [it.id]; S.herr = 'sel';
    cambio({ estructura: true });
    const f = tipo === 'nota' ? $('#insp-nota') : $('#insp-nombre');
    if (f) { f.focus(); f.select(); }
  }
  function crearFlujo(desdeId, p0, haciaId, p1) {
    pushHist();
    const items = itemsVista();
    const nube = (p) => { const n = { id: Modelo.nuevoId(S.M), t: 'nube', x: Math.round(p.x), y: Math.round(p.y) }; items.push(n); return n.id; };
    const dId = desdeId || nube(p0);
    const hId = haciaId || nube(p1);
    const d = item(dId), h = item(hId);
    const nombre = Modelo.nuevoNombre(S.M, 'nuevo flujo');
    const k = Modelo.agregarVariable(S.M, 'flujo', nombre, grupoVista());
    const vert = Math.abs(h.y - d.y) > Math.abs(h.x - d.x);
    const v = { id: Modelo.nuevoId(S.M), t: 'valvula', key: k, x: Math.round((d.x + h.x) / 2), y: Math.round((d.y + h.y) / 2), lx: vert ? 0 : 0, ly: vert ? 0 : 22, desde: dId, hacia: hId };
    if (vert) v.lx = 14 + Modelo.medioAncho(nombre);
    items.push(v);
    S.sel = [v.id];
    cambio({ estructura: true });
    const f = $('#insp-nombre');
    if (f) { f.focus(); f.select(); }
  }
  function crearFlecha(de, a) {
    const ya = itemsVista().find((f) => f.t === 'flecha' && f.de === de && f.a === a);
    if (ya) { S.sel = [ya.id]; pintarLienzo(); pintarInspector(); return; }
    pushHist();
    const b = item(a);
    const f = { id: Modelo.nuevoId(S.M), t: 'flecha', de, a, pol: '', cx: null, cy: null, inicial: b.t === 'nivel' };
    itemsVista().push(f);
    S.sel = [f.id];
    cambio({ estructura: true });
  }
  function borrarSel() {
    if (!S.sel.length) return;
    pushHist();
    for (const id of S.sel) Modelo.borrarItem(S.M, vistaAct(), id);
    S.sel = [];
    cambio({ estructura: true });
  }

  // ------------------------------------------------------------- vistas
  function pintarVistas() {
    const bar = $('#vistas-bar'); bar.replaceChildren();
    S.M.vistas.forEach((v, i) => {
      const b = el('button', { type: 'button', role: 'tab', class: 'vt', 'aria-selected': String(i === S.vista), title: 'Doble clic para renombrar', text: v.nombre });
      b.addEventListener('click', () => irVista(i));
      b.addEventListener('dblclick', () => renombrarVista(i, b));
      bar.append(b);
    });
    const mas = el('button', { type: 'button', class: 'vt vt-mas', title: 'Agregar una vista', 'aria-label': 'Agregar una vista', text: '+' });
    mas.addEventListener('click', () => { pushHist(); S.M.vistas.push({ nombre: `Vista ${S.M.vistas.length + 1}`, items: [] }); S.vista = S.M.vistas.length - 1; S.sel = []; cambio({ estructura: true }); ajustar(); });
    bar.append(mas);
  }
  function irVista(i) { if (i === S.vista) return; S.vista = i; S.sel = []; pintarVistas(); pintarLienzo(); pintarInspector(); ajustar(); pintarHerramientas(); }
  function renombrarVista(i, boton) {
    const inp = el('input', { class: 'vt-input', type: 'text', 'aria-label': 'Nombre de la vista' });
    inp.value = S.M.vistas[i].nombre;
    boton.replaceWith(inp); inp.focus(); inp.select();
    const fin = (ok) => {
      const n = inp.value.replace(/\s+/g, ' ').trim();
      if (ok && n && n !== S.M.vistas[i].nombre && !/[\r\n]/.test(n)) { pushHist(); S.M.vistas[i].nombre = n; cambio({ estructura: true }); } else pintarVistas();
    };
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') fin(true); if (e.key === 'Escape') fin(false); });
    inp.addEventListener('blur', () => fin(true));
  }
  function ir(key, itemId) {
    const defs = Modelo.definiciones(S.M);
    let vi = S.vista, id = itemId;
    if (key && !itemId) { const d = defs.get(key); if (!d) return; vi = d.vista; id = d.item.id; }
    if (vi !== S.vista) { S.vista = vi; pintarVistas(); }
    S.sel = id ? [id] : [];
    const it = item(id);
    if (it) {
      const r = SVG.getBoundingClientRect();
      const x = it.t === 'flecha' ? (item(it.de).x + item(it.a).x) / 2 : it.x, y = it.t === 'flecha' ? (item(it.de).y + item(it.a).y) / 2 : it.y;
      S.cam.x = r.width / 2 - x * S.cam.k; S.cam.y = r.height / 2 - y * S.cam.k; aplicarCam();
    }
    pintarLienzo(); pintarInspector(); pintarHerramientas();
    $('#lienzo-wrap').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  // ------------------------------------------------------------ inspector
  const FUNCS = [
    ['MIN(a, b)', 'MIN( , )'], ['MAX(a, b)', 'MAX( , )'], ['IF THEN ELSE(cond, sí, no)', 'IF THEN ELSE( , , )'],
    ['XIDZ(a, b, si b=0)', 'XIDZ( , , )'], ['ZIDZ(a, b)', 'ZIDZ( , )'], ['SMOOTH(entrada, tiempo)', 'SMOOTH( , )'],
    ['SMOOTH3(entrada, tiempo)', 'SMOOTH3( , )'], ['DELAY1(entrada, tiempo)', 'DELAY1( , )'], ['DELAY3(entrada, tiempo)', 'DELAY3( , )'],
    ['STEP(altura, tiempo)', 'STEP( , )'], ['RAMP(pendiente, inicio, fin)', 'RAMP( , , )'], ['PULSE(inicio, duración)', 'PULSE( , )'],
    ['EXP(x)', 'EXP( )'], ['LN(x)', 'LN( )'], ['ABS(x)', 'ABS( )'], ['INITIAL(x)', 'INITIAL( )'], ['Time', 'Time'],
  ];
  function insertar(campo, texto) {
    if (!campo) return;
    const a = campo.selectionStart ?? campo.value.length, b = campo.selectionEnd ?? campo.value.length;
    const antes = campo.value.slice(0, a), despues = campo.value.slice(b);
    const sep = antes && !/[\s(,*/+\-^]$/.test(antes) ? '' : '';
    campo.value = antes + sep + texto + despues;
    const pos = (antes + sep + texto).length;
    campo.focus(); campo.setSelectionRange(pos, pos);
    campo.dispatchEvent(new Event('input', { bubbles: true }));
  }
  function campo(etq, control, extra) {
    const id = control.id;
    return el('div', { class: 'campo' }, el('label', { for: id, text: etq }), control, extra || null);
  }
  function entradaTexto(id, valor, onFin, attrs = {}) {
    const i = el('input', { type: 'text', id, autocomplete: 'off', spellcheck: 'false', ...attrs });
    i.value = valor ?? '';
    i.addEventListener('change', () => onFin(i.value, i));
    i.addEventListener('keydown', (e) => { if (e.key === 'Enter') i.blur(); });
    return i;
  }
  function areaEcuacion(id, valor, onInput) {
    const t = el('textarea', { id, class: 'eq', spellcheck: 'false', autocomplete: 'off', rows: 3 });
    t.value = valor ?? '';
    t.addEventListener('focus', () => { S.histFoco = false; });
    t.addEventListener('input', () => { if (!S.histFoco) { pushHist(); S.histFoco = true; } onInput(t.value); });
    t.addEventListener('blur', () => { S.histFoco = false; });
    return t;
  }

  function pintarInspector() {
    const box = $('#inspector'); box.replaceChildren();
    if (!S.M) return;
    if (S.sel.length > 1) {
      box.append(el('div', { class: 'ins-head' }, el('h2', { text: `${S.sel.length} elementos` }), el('p', { class: 'ayuda nota', text: 'Arrástralos juntos o elimínalos.' })));
      const b = el('button', { type: 'button', class: 'btn peligro', text: 'Eliminar selección' }); b.addEventListener('click', borrarSel);
      box.append(b); return;
    }
    const it = S.sel.length ? item(S.sel[0]) : null;
    if (!it) return inspectorModelo(box);
    if (it.t === 'flecha') return inspectorFlecha(box, it);
    if (it.t === 'nota') return inspectorNota(box, it);
    if (it.t === 'nube') {
      box.append(el('div', { class: 'ins-head' }, el('span', { class: 'tipo-chip', text: 'Nube' }), el('h2', { text: 'Límite del modelo' })),
        el('p', { class: 'nota', text: 'Indica que el flujo viene de fuera del sistema o sale de él. Para conectar el flujo a un nivel, borra el flujo y vuelve a dibujarlo desde o hacia ese nivel.' }));
      return;
    }
    inspectorVariable(box, it);
  }

  function inspectorModelo(box) {
    const c = S.M.control;
    box.append(el('div', { class: 'ins-head' }, el('span', { class: 'tipo-chip', text: 'Modelo' }),
      el('h2', { text: `${S.M.orden.length} variables · ${S.M.vistas.length} ${S.M.vistas.length === 1 ? 'vista' : 'vistas'}` })));
    const num = (id, etq, valor, fn, attrs = {}) => {
      const i = el('input', { type: 'number', id, step: 'any', ...attrs }); i.value = valor;
      i.addEventListener('change', () => { const v = parseFloat(i.value); if (!isFinite(v)) { i.value = valor; return; } pushHist(); fn(v); cambio({}); });
      return el('div', { class: 'campo' }, el('label', { for: id, text: etq }), i);
    };
    box.append(el('div', { class: 'fila3' },
      num('c-ini', 'Inicio', c.inicial, (v) => { c.inicial = v; }),
      num('c-fin', 'Fin', c.final, (v) => { c.final = v; }),
      num('c-paso', 'Paso (dt)', c.paso, (v) => { if (v > 0) c.paso = v; }, { min: 0 })));
    const u = entradaTexto('c-unidad', c.unidad, (val) => { pushHist(); c.unidad = val.trim() || 'Month'; cambio({}); });
    const g = num('c-guardar', 'Guardar cada', c.guardar === null ? c.paso : c.guardar, (v) => { c.guardar = v > 0 ? v : null; });
    box.append(el('div', { class: 'fila3' }, campo('Unidad de tiempo', u), g));
    box.append(el('p', { class: 'campo ayuda', text: 'Usa un paso que sea potencia de 2 (1, 0,5, 0,25, 0,125…) y al menos 4 veces menor que la constante de tiempo más corta.' }));

    // buscador
    const q = el('input', { type: 'search', class: 'buscar', id: 'buscar', placeholder: 'Buscar variable…', 'aria-label': 'Buscar variable' });
    const lista = el('div', { class: 'lista-res' });
    const defs = Modelo.definiciones(S.M);
    const pintarRes = () => {
      lista.replaceChildren();
      const t = N(q.value);
      const keys = S.M.orden.filter((k) => !t || k.includes(t)).slice(0, 60);
      for (const k of keys) {
        const v = S.M.vars[k], d = defs.get(k);
        const b = el('button', { type: 'button' }, el('span', { text: v.nombre }), el('small', { text: `${{ nivel: 'nivel', flujo: 'flujo', aux: esConstante(v) ? 'constante' : 'auxiliar', tabla: 'tabla' }[v.tipo]} · ${d ? S.M.vistas[d.vista].nombre : 'sin vista'}` }));
        b.addEventListener('click', () => (d ? ir(k) : null));
        lista.append(b);
      }
    };
    q.addEventListener('input', pintarRes); pintarRes();
    box.append(el('div', { class: 'campo' }, el('span', { class: 'lbl', text: 'Variables' }), q, lista));

    const sinVista = S.M.orden.filter((k) => !defs.has(k));
    if (sinVista.length) {
      const b = el('button', { type: 'button', class: 'btn', text: `Colocar ${sinVista.length} sin vista aquí` });
      b.addEventListener('click', () => { pushHist(); colocarSinVista(sinVista); cambio({ estructura: true }); ajustar(); });
      box.append(b);
    }
    const borrarV = el('button', { type: 'button', class: 'btn peligro', text: `Eliminar la vista «${vistaAct().nombre}»`, disabled: S.M.vistas.length < 2 });
    borrarV.addEventListener('click', () => confirmar(`Eliminar la vista «${vistaAct().nombre}»`, 'Se borran también las variables definidas en ella (las sombras en otras vistas quedan sin definición).', 'Eliminar vista', () => {
      pushHist();
      const vista = vistaAct();
      for (const it of vista.items.slice()) if ((it.t === 'nivel' || it.t === 'var' || it.t === 'valvula') && it.key && S.M.vars[it.key]) Modelo.borrarVariable(S.M, it.key);
      S.M.vistas.splice(S.vista, 1); S.vista = 0; S.sel = [];
      cambio({ estructura: true }); ajustar();
    }));
    box.append(borrarV);
    box.append(el('div', { class: 'atajos' },
      el('span', {}, el('kbd', { text: 'V' }), ' seleccionar · ', el('kbd', { text: 'S' }), ' nivel · ', el('kbd', { text: 'F' }), ' flujo · ', el('kbd', { text: 'A' }), ' variable · ', el('kbd', { text: 'C' }), ' flecha · ', el('kbd', { text: 'T' }), ' comentario'),
      el('span', {}, el('kbd', { text: 'Supr' }), ' eliminar · ', el('kbd', { text: 'Ctrl+Z' }), ' deshacer · ', el('kbd', { text: 'Ctrl+S' }), ' guardar'),
      el('span', {}, 'Arrastra el fondo o usa la rueda para moverte; ', el('kbd', { text: 'Ctrl' }), ' + rueda para acercar.')));
  }

  function colocarSinVista(keys) {
    const items = itemsVista();
    let x0 = 0, y0 = 0;
    if (items.length) { y0 = Math.max(...items.filter((i) => i.y !== undefined).map((i) => i.y)) + 90; x0 = Math.min(...items.filter((i) => i.x !== undefined).map((i) => i.x)); }
    keys.forEach((k, i) => {
      const v = S.M.vars[k];
      const x = x0 + (i % 5) * 190, y = y0 + Math.floor(i / 5) * 80;
      if (v.tipo === 'nivel') items.push({ id: Modelo.nuevoId(S.M), t: 'nivel', key: k, x, y, w: 40, h: 20 });
      else items.push({ id: Modelo.nuevoId(S.M), t: 'var', key: k, x, y, w: Modelo.medioAncho(v.nombre), h: 8 });
      if (v.tipo === 'flujo') v.tipo = 'aux';
    });
  }

  function inspectorVariable(box, it) {
    const key = it.key, v = S.M.vars[key];
    if (!v) return;
    const tipoTxt = it.t === 'sombra' ? 'Sombra' : { nivel: 'Nivel (stock)', flujo: 'Flujo', aux: esConstante(v) ? 'Constante' : 'Variable auxiliar', tabla: 'Tabla (lookup)' }[v.tipo];
    const nombreErr = el('p', { class: 'error-txt', hidden: true });
    const nombre = entradaTexto('insp-nombre', v.nombre, (val, inp) => {
      const n = val.replace(/\s+/g, ' ').trim();
      if (n === v.nombre) return;
      const err = Modelo.errorNombre(S.M, n, key);
      if (err) { nombreErr.textContent = err; nombreErr.hidden = false; inp.value = v.nombre; return; }
      pushHist(); Modelo.renombrar(S.M, key, n); cambio({ estructura: true });
    });
    box.append(el('div', { class: 'ins-head' }, el('span', { class: 'tipo-chip', text: tipoTxt })));
    box.append(campo('Nombre', nombre, nombreErr));
    if (it.t === 'sombra') {
      const b = el('button', { type: 'button', class: 'btn', text: 'Ir a la definición' });
      b.addEventListener('click', () => ir(key));
      box.append(el('p', { class: 'nota', text: 'Una sombra muestra en esta vista una variable definida en otra. Lo que edites aquí cambia la variable original.' }), b);
    }

    // entradas disponibles (causas con flecha en esta vista)
    const porId = new Map(itemsVista().map((x) => [x.id, x]));
    const entradas = [];
    for (const f of itemsVista()) {
      if (f.t !== 'flecha' || f.a !== it.id) continue;
      const o = porId.get(f.de);
      if (o && o.key && !entradas.includes(o.key)) entradas.push(o.key);
    }
    const chipsEntradas = (campoDestino) => {
      if (!entradas.length) return el('p', { class: 'ayuda', text: 'Dibuja flechas hacia esta variable para tener sus causas a mano.' });
      const ch = el('div', { class: 'chips' });
      for (const k of entradas) {
        const b = el('button', { type: 'button', class: 'chip-var', text: S.M.vars[k].nombre, title: 'Insertar en la ecuación' });
        b.addEventListener('mousedown', (e) => e.preventDefault());
        b.addEventListener('click', () => insertar(campoDestino(), S.M.vars[k].nombre));
        ch.append(b);
      }
      return ch;
    };
    const selFunc = (campoDestino) => {
      const s = el('select', { 'aria-label': 'Insertar función' }, el('option', { value: '', text: 'Insertar función…' }));
      FUNCS.forEach(([t, ins]) => s.append(el('option', { value: ins, text: t })));
      s.addEventListener('change', () => { if (s.value) insertar(campoDestino(), s.value); s.value = ''; });
      return s;
    };

    if (v.tipo === 'nivel') {
      const fl = Modelo.flujosDe(S.M, key);
      const auto = Modelo.tasaAuto(S.M, key);
      const tasaBox = el('div', { class: 'campo' }, el('span', { class: 'lbl', text: 'Tasa neta (entradas − salidas)' }));
      if (!v.tasaManual) {
        tasaBox.append(el('div', { class: 'tasa', text: fl.entradas.length || fl.salidas.length ? auto : '0 (todavía no hay flujos conectados)' }));
        const b = el('button', { type: 'button', class: 'btn mini', text: 'Escribir la tasa a mano' });
        b.addEventListener('click', () => { pushHist(); v.tasaManual = true; cambio({ inspector: true }); });
        tasaBox.append(el('div', { class: 'fila' }, b));
      } else {
        const t = areaEcuacion('insp-tasa', v.ecuacion, (val) => { v.ecuacion = val; cambio({}); });
        const b = el('button', { type: 'button', class: 'btn mini', text: 'Usar los flujos dibujados' });
        b.addEventListener('click', () => { pushHist(); v.tasaManual = false; cambio({ inspector: true }); });
        tasaBox.append(t, el('div', { class: 'fila' }, b));
      }
      box.append(tasaBox);
      const ini = areaEcuacion('insp-eq', v.inicial, (val) => { v.inicial = val; cambio({}); });
      box.append(el('div', { class: 'campo' }, el('label', { for: 'insp-eq', text: 'Valor inicial' }), ini, el('div', { class: 'fila' }, selFunc(() => $('#insp-eq'))), chipsEntradas(() => $('#insp-eq'))));
    } else if (v.tipo === 'tabla') {
      const t = areaEcuacion('insp-eq', v.ecuacion, (val) => { v.ecuacion = val; cambio({}); });
      box.append(el('div', { class: 'campo' }, el('label', { for: 'insp-eq', text: 'Puntos de la tabla' }), t,
        el('p', { class: 'ayuda', text: 'Formato de Vensim: [(xmin,ymin)-(xmax,ymax)],(x1,y1),(x2,y2),… Se usa como función: nombre(x).' })));
    } else {
      const t = areaEcuacion('insp-eq', v.ecuacion, (val) => { v.ecuacion = val; cambio({}); pintarSliderConst(); });
      box.append(el('div', { class: 'campo' }, el('label', { for: 'insp-eq', text: v.tipo === 'flujo' ? 'Ecuación del flujo (por unidad de tiempo)' : 'Ecuación' }), t,
        el('div', { class: 'fila' }, selFunc(() => $('#insp-eq'))), chipsEntradas(() => $('#insp-eq'))));
    }
    box.append(el('div', { id: 'insp-errores', class: 'campo' }));

    // slider rápido para constantes
    const sliderBox = el('div', { id: 'insp-slider', class: 'campo' });
    box.append(sliderBox);
    const pintarSliderConst = () => {
      sliderBox.replaceChildren();
      if (!esConstante(v)) return;
      const val = parseFloat(v.ecuacion);
      const r = v.rango || {};
      const min = r.min ?? Math.min(0, val), max = r.max ?? (val ? Math.abs(val) * 2 : 1), paso = r.paso || (max - min) / 100 || 0.01;
      const s = el('input', { type: 'range', id: 'insp-rango', min, max, step: paso, 'aria-label': 'Valor' });
      s.value = val;
      s.addEventListener('pointerdown', () => { pushHist(); });
      s.addEventListener('keydown', () => { if (!S.histFoco) { pushHist(); S.histFoco = true; } });
      s.addEventListener('input', () => { v.ecuacion = String(+s.value); const eq = $('#insp-eq'); if (eq) eq.value = v.ecuacion; cambio({}); });
      sliderBox.append(el('span', { class: 'lbl', text: `Valor: ${v.ecuacion}` }), s);
    };
    pintarSliderConst();

    // unidades, rango y comentario
    const unidades = entradaTexto('insp-unidades', v.unidades, (val) => { pushHist(); v.unidades = val.trim(); cambio({}); });
    box.append(campo('Unidades', unidades));
    if (esConstante(v)) {
      const r = v.rango || { min: null, max: null, paso: null };
      const n = (id, etq, k) => {
        const i = el('input', { type: 'number', id, step: 'any', placeholder: '—' }); i.value = r[k] ?? '';
        i.addEventListener('change', () => {
          pushHist();
          const x = i.value === '' ? null : parseFloat(i.value);
          v.rango = { ...(v.rango || { min: null, max: null, paso: null }), [k]: isFinite(x) ? x : null };
          if (v.rango.min === null && v.rango.max === null && v.rango.paso === null) v.rango = null;
          cambio({}); pintarSliderConst();
        });
        return el('div', { class: 'campo' }, el('label', { for: id, text: etq }), i);
      };
      box.append(el('div', { class: 'campo' }, el('span', { class: 'lbl', text: 'Rango del slider' }),
        el('div', { class: 'fila3' }, n('insp-min', 'mín.', 'min'), n('insp-max', 'máx.', 'max'), n('insp-paso', 'paso', 'paso'))));
    }
    const com = el('textarea', { id: 'insp-com', rows: 2 }); com.value = v.comentario || '';
    com.addEventListener('change', () => { pushHist(); v.comentario = com.value; cambio({}); });
    box.append(campo('Comentario', com));

    // aux ↔ nivel
    if (it.t === 'var' && v.tipo === 'aux') {
      const b = el('button', { type: 'button', class: 'btn mini', text: 'Convertir en nivel' });
      b.addEventListener('click', () => { pushHist(); v.tipo = 'nivel'; v.inicial = v.ecuacion || '0'; v.ecuacion = '0'; v.tasaManual = false; it.t = 'nivel'; it.w = 40; it.h = 20; cambio({ estructura: true }); });
      box.append(el('div', { class: 'fila' }, b));
    } else if (it.t === 'nivel') {
      const fl = Modelo.flujosDe(S.M, key);
      const b = el('button', { type: 'button', class: 'btn mini', text: 'Convertir en variable', disabled: fl.entradas.length + fl.salidas.length > 0, title: 'Solo si no tiene flujos conectados' });
      b.addEventListener('click', () => { pushHist(); v.tipo = 'aux'; v.ecuacion = v.inicial; v.inicial = ''; it.t = 'var'; cambio({ estructura: true }); });
      box.append(el('div', { class: 'fila' }, b));
    }

    box.append(el('div', { id: 'insp-grafico', class: 'mini-chart campo' }));
    const borrar = el('button', { type: 'button', class: 'btn peligro', text: it.t === 'sombra' ? 'Quitar esta sombra' : 'Eliminar variable' });
    borrar.addEventListener('click', borrarSel);
    box.append(borrar);
    pintarErrorInspector(); pintarGraficoInspector();
  }

  function pintarErrorInspector() {
    const box = $('#insp-errores');
    if (!box) return;
    box.replaceChildren();
    const it = S.sel.length === 1 ? item(S.sel[0]) : null;
    if (!it || !it.key) return;
    const ps = Modelo.problemas(S.M).filter((p) => p.key === it.key);
    for (const p of ps) box.append(el('p', { class: p.nivel === 'error' ? 'error-txt' : 'ayuda', text: (p.nivel === 'error' ? '✕ ' : '! ') + p.texto }));
  }
  function pintarGraficoInspector() {
    const box = $('#insp-grafico');
    if (!box) return;
    box.replaceChildren();
    const it = S.sel.length === 1 ? item(S.sel[0]) : null;
    if (!it || !it.key) return;
    const s = serie(it.key);
    if (!s) return;
    const t = S.res.tiempo;
    const W = 300, H = 120, L = 46, R = 294, T = 8, B = 100;
    let lo = Math.min(0, ...s), hi = Math.max(...s);
    if (hi - lo < 1e-12) hi = lo + 1;
    const X = (i) => L + ((R - L) * i) / (s.length - 1), Y = (v) => B - ((B - T) * (v - lo)) / (hi - lo);
    const g = sv('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': `Trayectoria de ${S.M.vars[it.key].nombre}` });
    for (const v of [lo, (lo + hi) / 2, hi]) {
      g.append(sv('line', { x1: L, x2: R, y1: Y(v), y2: Y(v), class: v === lo ? 'basel' : 'gridl' }));
      g.append(sv('text', { x: L - 5, y: Y(v) + 3, 'text-anchor': 'end', class: 'ax' }, document.createTextNode(fmt(v))));
    }
    g.append(sv('text', { x: L, y: B + 14, class: 'ax' }, document.createTextNode(String(t[0]))));
    g.append(sv('text', { x: R, y: B + 14, 'text-anchor': 'end', class: 'ax' }, document.createTextNode(`${t[t.length - 1]} ${fmtUnidad(S.M.control.unidad)}`)));
    g.append(sv('path', { d: s.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(''), class: 'l-esc' }));
    g.append(sv('circle', { cx: X(s.length - 1), cy: Y(s[s.length - 1]), r: 4, class: 'dot' }));
    box.append(el('span', { class: 'lbl', text: `Simulación · al final: ${fmt(s[s.length - 1])} ${fmtUnidad(S.M.vars[it.key].unidades)}` }), g);
  }

  function inspectorFlecha(box, f) {
    const a = item(f.de), b = item(f.a);
    const na = a && a.key ? S.M.vars[a.key].nombre : '?', nb = b && b.key ? S.M.vars[b.key].nombre : '?';
    box.append(el('div', { class: 'ins-head' }, el('span', { class: 'tipo-chip', text: 'Flecha causal' }), el('h3', { text: `${na} → ${nb}` })));
    const seg = el('div', { class: 'seg2', role: 'group', 'aria-label': 'Polaridad' });
    for (const [p, t] of [['+', '+'], ['-', '−'], ['', 'sin signo']]) {
      const bt = el('button', { type: 'button', 'aria-pressed': String(f.pol === p), text: t });
      bt.addEventListener('click', () => { pushHist(); f.pol = p; cambio({ inspector: true }); });
      seg.append(bt);
    }
    box.append(el('div', { class: 'campo' }, el('span', { class: 'lbl', text: 'Polaridad' }), seg,
      el('p', { class: 'ayuda', text: '+ : si la causa sube, el efecto sube (respecto de lo que habría sido). − : se mueven en sentido contrario.' })));
    const usada = b && b.key && (S.M.vars[b.key].tipo === 'nivel' ? Modelo.usa(S.M, S.M.vars[b.key].inicial) : Modelo.usa(S.M, S.M.vars[b.key].ecuacion)).includes(a && a.key);
    if (!usada) box.append(el('p', { class: 'ayuda', text: `${nb} todavía no usa ${na} en su ecuación.` }));
    const recta = el('button', { type: 'button', class: 'btn mini', text: 'Enderezar' });
    recta.addEventListener('click', () => { pushHist(); f.cx = null; f.cy = null; cambio({}); });
    const borrar = el('button', { type: 'button', class: 'btn peligro', text: 'Eliminar flecha' });
    borrar.addEventListener('click', borrarSel);
    box.append(el('div', { class: 'fila' }, recta), el('p', { class: 'ayuda', text: 'Arrastra el punto azul para curvarla.' }), borrar);
  }

  function inspectorNota(box, n) {
    box.append(el('div', { class: 'ins-head' }, el('span', { class: 'tipo-chip', text: n.bucle ? 'Marcador de bucle' : 'Comentario' })));
    const t = el('input', { type: 'text', id: 'insp-nota' }); t.value = n.bucle || n.texto;
    t.addEventListener('focus', () => { S.histFoco = false; });
    t.addEventListener('input', () => {
      if (!S.histFoco) { pushHist(); S.histFoco = true; }
      if (n.bucle) n.bucle = (t.value.trim().toUpperCase().match(/^[RB]\d*/) || ['R'])[0]; else n.texto = t.value;
      cambio({});
    });
    box.append(campo(n.bucle ? 'Código (R1, B2…)' : 'Texto', t));
    const seg = el('div', { class: 'seg2', role: 'group', 'aria-label': 'Tipo' });
    for (const [k, txt] of [[null, 'Texto'], ['R', 'Bucle R'], ['B', 'Bucle B']]) {
      const b = el('button', { type: 'button', 'aria-pressed': String((n.bucle ? n.bucle[0] : null) === k), text: txt });
      b.addEventListener('click', () => { pushHist(); if (k) { n.bucle = k + ((n.bucle || '').slice(1) || ''); } else { n.texto = n.texto || 'Comentario'; n.bucle = null; } cambio({ inspector: true }); });
      seg.append(b);
    }
    box.append(el('div', { class: 'campo' }, el('span', { class: 'lbl', text: 'Tipo' }), seg));
    if (n.bucle) {
      const b = el('button', { type: 'button', class: 'btn mini', text: n.horario ? 'Sentido: horario' : 'Sentido: antihorario' });
      b.addEventListener('click', () => { pushHist(); n.horario = !n.horario; cambio({ inspector: true }); });
      box.append(b);
    }
    const borrar = el('button', { type: 'button', class: 'btn peligro', text: 'Eliminar' });
    borrar.addEventListener('click', borrarSel);
    box.append(borrar);
  }

  // ----------------------------------------------------------- problemas
  function pintarEstadoSim() {
    const e = $('#sim-estado');
    if (S.errSim) { e.textContent = S.errSim; e.classList.add('err'); }
    else if (S.res) { e.textContent = `Simulado de ${S.res.tiempo[0]} a ${S.res.tiempo[S.res.tiempo.length - 1]} ${fmtUnidad(S.M.control.unidad)} · ${S.M.orden.length} variables`; e.classList.remove('err'); }
    else e.textContent = '';
  }
  function pintarProblemas() {
    const box = $('#problemas'); box.replaceChildren();
    const ps = S.probs || [];
    const nErr = ps.filter((p) => p.nivel === 'error').length;
    const faltan = ps.filter((p) => p.falta).length;
    const head = el('div', { class: 'prob-head' }, el('h2', { text: ps.length ? `Revisión del modelo · ${nErr} ${nErr === 1 ? 'error' : 'errores'}, ${ps.length - nErr} ${ps.length - nErr === 1 ? 'aviso' : 'avisos'}` : 'Revisión del modelo: sin problemas' }));
    if (faltan) {
      const b = el('button', { type: 'button', class: 'btn', text: `Dibujar ${faltan} ${faltan === 1 ? 'flecha faltante' : 'flechas faltantes'}` });
      b.addEventListener('click', () => { pushHist(); Modelo.agregarFlechasFaltantes(S.M); cambio({ estructura: true }); });
      head.append(b);
    }
    box.append(head);
    if (!ps.length) { box.append(el('p', { class: 'nota', text: 'Cada ecuación usa variables existentes y cada causa tiene su flecha.' })); return; }
    const lista = el('div', { class: 'prob-lista' });
    const orden = ps.slice().sort((a, b) => (a.nivel === b.nivel ? 0 : a.nivel === 'error' ? -1 : 1));
    for (const p of orden.slice(0, 40)) {
      const b = el('button', { type: 'button', class: 'btn mini', text: 'Ver' });
      b.addEventListener('click', () => {
        if (p.flecha) { const vi = S.M.vistas.findIndex((v) => v.nombre === p.vista); if (vi >= 0) { if (vi !== S.vista) { S.vista = vi; pintarVistas(); } ir(null, p.flecha); } }
        else ir(p.key);
      });
      lista.append(el('div', { class: 'prob' }, el('span', { class: 'nivel ' + p.nivel, text: p.nivel }), el('span', { class: 'texto', text: p.texto }), b));
    }
    if (orden.length > 40) lista.append(el('p', { class: 'nota', text: `y ${orden.length - 40} más.` }));
    box.append(lista);
  }

  // ------------------------------------------------------------ teclado
  document.addEventListener('keydown', (e) => {
    const t = e.target;
    const enCampo = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); guardar(); return; }
    if (!$('#modal').hidden) { if (e.key === 'Escape') cerrarModal(); return; }
    if (enCampo) { if (e.key === 'Escape') t.blur(); return; }
    if (S.pestana !== 'lienzo') return;
    if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) rehacer(); else deshacer(); return; }
    if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); rehacer(); return; }
    if (mod && e.key.toLowerCase() === 'a') { e.preventDefault(); S.sel = itemsVista().map((x) => x.id); pintarLienzo(); pintarInspector(); pintarHerramientas(); return; }
    if (e.key === ' ') { S.espacio = true; return; }
    if (e.key === 'Escape') { S.herr = 'sel'; S.sel = []; cancelarArrastre(); pintarHerramientas(); pintarLienzo(); pintarInspector(); return; }
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); borrarSel(); return; }
    const mapa = { v: 'sel', s: 'nivel', f: 'flujo', a: 'var', c: 'flecha', t: 'nota' };
    if (!mod && mapa[e.key.toLowerCase()]) { usarHerr(mapa[e.key.toLowerCase()]); return; }
    const flechas = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (flechas[e.key] && S.sel.length) {
      e.preventDefault();
      pushHist();
      const d = e.shiftKey ? 20 : 5;
      for (const id of S.sel) { const x = item(id); if (x && x.t !== 'flecha') { x.x += flechas[e.key][0] * d; x.y += flechas[e.key][1] * d; } }
      cambio({});
    }
  });
  document.addEventListener('keyup', (e) => { if (e.key === ' ') S.espacio = false; });

  // ============================================================ GUARDAR
  function pintarGuardado() {
    const chip = $('#estado-guardado');
    const sucio = S.M && estadoGuardable() !== S.guardado;
    S.sucio = sucio;
    chip.className = 'chip' + (S.guardando ? '' : sucio ? ' sucio' : ' ok');
    chip.textContent = S.guardando ? 'Guardando…' : sucio ? (S.soloLectura ? 'Cambios solo en este navegador' : 'Cambios sin guardar') : 'Guardado';
    const b = $('#btn-guardar');
    b.disabled = !sucio || S.guardando || S.soloLectura || !S.artifact;
    b.title = !S.artifact ? 'Guardar en el artifact solo funciona dentro de Claude; copia el .mdl para conservar los cambios' : S.soloLectura ? 'Solo lectura: no puedes guardar este artifact' : 'Guardar el modelo en el artifact (Ctrl+S)';
    $('#btn-descargar').hidden = !S.downloads;
  }
  function guardarBorrador() {
    if (!S.M) return;
    if (estadoGuardable() === S.guardado) almacen.borrar(CLAVE_BORRADOR());
    else almacen.escribir(CLAVE_BORRADOR(), { texto: textoMdl(), cfg: S.cfg, ts: Date.now() });
  }
  async function guardar() {
    if (!S.artifact || S.soloLectura || S.guardando) return;
    const texto = textoMdl();
    const estado = estadoGuardable();
    if (estado === S.guardado) return;
    guardarBorrador();
    S.guardando = true; pintarGuardado();
    try {
      await S.artifact.publish({
        'modelo.mdl': { content: texto, contentType: 'text/plain' },
        'tablero_config.json': { content: JSON.stringify(S.cfg, null, 2), contentType: 'application/json' },
      });
      S.guardado = estado;
      almacen.borrar(CLAVE_BORRADOR());
      aviso(null);
    } catch (e) {
      const c = e && e.code;
      if (c === 'conflict') aviso('Alguien guardó otra versión mientras editabas; la página se recarga con esa versión. Tus cambios quedaron como borrador en este navegador.');
      else if (['not_writer', 'not_granted', 'capability_disabled', 'not_declared', 'consent_required', 'capability_removed'].includes(c)) {
        S.soloLectura = true;
        aviso('Esta vista es de solo lectura: tus cambios quedan en este navegador. Usa «Copiar .mdl» para llevártelos.');
      } else if (c === 'rate_limited') aviso('Guardaste muchas veces seguidas; espera un momento y vuelve a guardar.');
      else if (c === 'too_large') aviso('El modelo es demasiado grande para guardarlo en el artifact. Usa «Copiar .mdl».');
      else aviso('No se pudo guardar (' + (e && e.message || 'error desconocido') + '). Tus cambios siguen como borrador en este navegador.');
    } finally {
      S.guardando = false; pintarGuardado();
    }
  }
  function aviso(texto, acciones = []) {
    const b = $('#aviso');
    b.replaceChildren();
    if (!texto) { b.hidden = true; return; }
    b.append(el('span', { text: texto }));
    for (const [t, fn] of acciones) { const x = el('button', { type: 'button', class: 'btn mini', text: t }); x.addEventListener('click', fn); b.append(x); }
    b.hidden = false;
  }
  $('#btn-guardar').addEventListener('click', guardar);
  $('#btn-copiar').addEventListener('click', async () => {
    const t = textoMdl();
    try { await navigator.clipboard.writeText(t); toast('Copiado: pégalo en un archivo .mdl para abrirlo en Vensim.'); }
    catch (e) { mostrarTexto('Copiar el modelo (.mdl)', t); }
  });
  $('#btn-descargar').addEventListener('click', async () => {
    if (!S.downloads) return;
    const base = (S.cfg.titulo || 'modelo').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    try { await S.downloads.save({ filename: `${base}.mdl.txt`, data: textoMdl() }); toast('Descargado como .txt: quítale la extensión .txt para abrirlo en Vensim.'); }
    catch (e) { if (e && e.code !== 'declined') toast('No se pudo descargar aquí. Usa «Copiar .mdl».'); }
  });
  $('#btn-importar').addEventListener('click', importar);
  $('#btn-nuevo').addEventListener('click', () => confirmar('Empezar un modelo nuevo', 'El lienzo queda vacío. Puedes deshacerlo con Ctrl+Z mientras no recargues la página.', 'Empezar en blanco', () => {
    pushHist(); S.M = Modelo.vacio(); S.vista = 0; S.sel = []; cambio({ estructura: true }); ajustar();
  }));

  function toast(t) { aviso(t); clearTimeout(toast.t); toast.t = setTimeout(() => aviso(null), 4000); }

  // --------------------------------------------------------------- modal
  function abrirModal(titulo, cuerpo, acciones) {
    const caja = $('#modal-caja'); caja.replaceChildren();
    caja.append(el('h2', { id: 'modal-titulo', text: titulo }), ...[].concat(cuerpo));
    const pie = el('div', { class: 'modal-acciones' });
    const cerrar = el('button', { type: 'button', class: 'btn', text: 'Cancelar' }); cerrar.addEventListener('click', cerrarModal);
    pie.append(cerrar);
    for (const [t, fn, cls] of acciones) { const b = el('button', { type: 'button', class: 'btn ' + (cls || 'primario'), text: t }); b.addEventListener('click', fn); pie.append(b); }
    caja.append(pie);
    $('#modal').hidden = false;
    const f = caja.querySelector('textarea, input, .primario'); if (f) f.focus();
  }
  function cerrarModal() { $('#modal').hidden = true; }
  $('#modal').addEventListener('pointerdown', (e) => { if (e.target.id === 'modal') cerrarModal(); });
  function confirmar(titulo, texto, accion, fn) { abrirModal(titulo, [el('p', { text: texto })], [[accion, () => { cerrarModal(); fn(); }, 'primario']]); }
  function mostrarTexto(titulo, texto) {
    const t = el('textarea', { readonly: true, 'aria-label': 'Texto del modelo' }); t.value = texto;
    abrirModal(titulo, [el('p', { class: 'nota', text: 'Selecciona todo y cópialo (Ctrl+C). Guárdalo como archivo .mdl para abrirlo en Vensim.' }), t], []);
    t.select();
  }
  function importar() {
    const t = el('textarea', { placeholder: 'Pega aquí el contenido de un archivo .mdl de Vensim…', 'aria-label': 'Texto .mdl' });
    const f = el('input', { type: 'file', accept: '.mdl,.txt,text/plain', 'aria-label': 'Archivo .mdl' });
    const err = el('p', { class: 'modal-error' });
    f.addEventListener('change', () => { const file = f.files[0]; if (!file) return; const r = new FileReader(); r.onload = () => { t.value = r.result; }; r.readAsText(file); });
    abrirModal('Importar un modelo .mdl', [
      el('p', { class: 'nota', text: 'Abre un modelo de Vensim sin subíndices, macros ni datos externos. Reemplaza el modelo actual (Ctrl+Z para volver).' }), f, t, err,
    ], [['Abrir modelo', () => {
      try {
        const M = Modelo.desdeMdl(t.value);
        Motor.leer(Modelo.aMdl(Modelo.clon(M)));
        pushHist(); S.M = M; S.vista = 0; S.sel = []; cerrarModal(); cambio({ estructura: true }); ajustar();
      } catch (e) { err.textContent = e.message; }
    }]]);
  }

  // ============================================================ TABLERO
  const T = { cambios: {}, final: null, hover: null, metrica: 0, base: null, esc: null, aportes: null, graficos: [], controles: new Map(), bucles: new Map() };
  const CLAVE_T = () => 'simulador:' + (S.cfg.titulo || '');
  function montarTablero() {
    if (!S.comp) { $('#kpis').replaceChildren(el('p', { class: 'error', text: 'Corrige los errores del lienzo para ver el tablero.' })); return; }
    S.tableroSucio = false;
    const cfg = S.cfg;
    const modelo = S.comp;
    const CONSTS = modelo.constantes();
    const existe = (n) => { try { return !!modelo.variable(n); } catch (e) { return false; } };
    const porNombre = new Map(CONSTS.map((c) => [N(c.nombre), c]));
    for (const k of Object.keys(T.cambios)) if (!porNombre.has(k)) delete T.cambios[k];
    const horizontes = cfg.horizontes && cfg.horizontes.length ? cfg.horizontes : [S.M.control.final];
    if (T.final === null || !horizontes.includes(T.final)) T.final = horizontes.includes(S.M.control.final) ? S.M.control.final : horizontes[0];
    const valorActual = (c) => (N(c.nombre) in T.cambios ? T.cambios[N(c.nombre)] : c.valor);
    const normBucles = Object.fromEntries(Object.entries(cfg.bucles || {}).map(([k, v]) => [N(k), v]));
    const esBucle = (c) => N(c.nombre) in normBucles;

    // controles
    T.controles = new Map();
    const control = (c) => {
      const k = N(c.nombre);
      const r = c.rango || { min: 0, max: c.valor * 2 || 1, paso: null };
      const min = r.min ?? 0, max = r.max ?? Math.max(c.valor * 2, 1);
      const paso = r.paso || (max - min) / 100;
      const id = 'c-' + k.replace(/[^a-z0-9]+/g, '-');
      const out = el('output', { for: id });
      const input = el('input', { type: 'range', id, min, max, step: paso });
      input.value = valorActual(c);
      const reset = el('button', { class: 'reset-one', type: 'button', 'aria-label': 'Volver al valor del modelo', title: 'Volver al valor del modelo', text: '↺' });
      const help = tildes(c.comentario.replace(/^(SUPUESTO \/ PALANCA|SUPUESTO)[.:]?\s*/i, ''));
      const box = el('div', { class: 'ctl' }, el('div', { class: 'ctl-top' }, el('label', { for: id, text: etiqueta(c.nombre) }), out),
        el('div', { class: 'ctl-row' }, input, reset), help ? el('p', { class: 'ctl-help', text: help }) : null);
      const pintar = () => { out.textContent = fmtValor(c, valorActual(c)); box.classList.toggle('cambiado', k in T.cambios); };
      input.addEventListener('input', () => { const v = parseFloat(input.value); if (Math.abs(v - c.valor) < 1e-12) delete T.cambios[k]; else T.cambios[k] = v; pintar(); programarT(); });
      reset.addEventListener('click', () => { delete T.cambios[k]; input.value = c.valor; pintar(); programarT(); });
      T.controles.set(k, { input, pintar, c });
      pintar();
      return box;
    };
    const palancas = CONSTS.filter((c) => /PALANCA/.test(c.comentario) && !esBucle(c));
    $('#palancas').replaceChildren(...palancas.map(control));
    if (!palancas.length) $('#palancas').append(el('p', { class: 'ctl-help', text: 'Marca constantes como palancas escribiendo PALANCA en su comentario.' }));
    const grupos = new Map();
    for (const c of CONSTS) {
      if (esBucle(c) || palancas.includes(c)) continue;
      if (!grupos.has(c.grupo)) grupos.set(c.grupo, []);
      grupos.get(c.grupo).push(c);
    }
    const sup = $('#supuestos'); sup.replaceChildren();
    for (const [g, lista] of grupos) {
      const det = el('details', { class: 'grupo' }, el('summary', { text: `${(cfg.grupos || {})[g] || etiqueta(g || 'otros')} (${lista.length})` }));
      det.append(el('div', { class: 'cuerpo' }, ...lista.map(control)));
      sup.append(det);
    }
    // bucles
    T.bucles = new Map();
    const bx = $('#bucles'); bx.replaceChildren();
    for (const c of CONSTS.filter(esBucle)) {
      const k = N(c.nombre), meta = normBucles[k];
      const id = 'b-' + meta.codigo;
      const sw = el('input', { type: 'checkbox', class: 'switch', id, role: 'switch' });
      const fila = el('div', { class: 'bucle' }, el('span', { class: 'codigo', text: meta.codigo }), el('label', { class: 'bucle-nombre', for: id, text: meta.nombre }), sw, el('span', { class: 'bucle-desc', text: meta.descripcion }));
      const pintar = () => {
        const on = valorActual(c) !== 0;
        sw.checked = on; fila.classList.toggle('off', !on);
        document.querySelectorAll('#mapa [data-loop]').forEach((n) => { if (N(n.getAttribute('data-loop')) === k) n.classList.toggle('apagado', !on); });
      };
      sw.addEventListener('change', () => { if (sw.checked === (c.valor !== 0)) delete T.cambios[k]; else T.cambios[k] = sw.checked ? 1 : 0; pintar(); programarT(); });
      T.bucles.set(k, { pintar, c, meta });
      bx.append(fila);
      pintar();
    }
    $('#sec-bucles').hidden = !T.bucles.size;
    $('#sec-aporte').hidden = !T.bucles.size;
    $('#sec-mapa').hidden = !$('#mapa').querySelector('svg');

    // horizonte
    const hz = $('#horizonte'); hz.replaceChildren();
    for (const h of horizontes) {
      const b = el('button', { type: 'button', 'aria-pressed': String(h === T.final), text: h % 12 === 0 && /month/i.test(S.M.control.unidad) ? `${h / 12} años` : `${h}` });
      b.addEventListener('click', () => { T.final = h; hz.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); T.base = modelo.simular({ final: T.final }); programarT(); });
      hz.append(b);
    }

    // gráficos
    const charts = $('#charts'); charts.replaceChildren();
    T.graficos = (cfg.graficos || []).filter((g) => existe(g.variable)).map((g) => {
      const read = el('span', { class: 'chart-read' });
      const svg = sv('svg', { viewBox: '0 0 320 150', role: 'img', 'aria-label': g.titulo });
      const quitar = el('button', { type: 'button', class: 'quitar', title: 'Quitar gráfico', 'aria-label': `Quitar gráfico ${g.titulo}`, text: '×' });
      const fig = el('figure', { class: 'chart', tabindex: '0' }, el('figcaption', {}, el('span', { class: 'chart-title', text: g.titulo }), read), svg, quitar);
      quitar.addEventListener('click', () => { cfg.graficos = cfg.graficos.filter((x) => x !== g); montarTablero(); pintarGuardado(); guardarBorrador(); });
      charts.append(fig);
      const G = { g, svg, read, fig };
      const mover = (ev) => {
        const r = svg.getBoundingClientRect();
        const x = ((ev.clientX - r.left) / r.width) * 320;
        const n = T.esc.tiempo.length;
        T.hover = Math.max(0, Math.min(n - 1, Math.round(((x - G.x0) / (G.x1 - G.x0)) * (n - 1))));
        pintarHoverT();
      };
      svg.addEventListener('pointermove', mover); svg.addEventListener('pointerdown', mover);
      svg.addEventListener('pointerleave', () => { T.hover = null; pintarHoverT(); });
      fig.addEventListener('keydown', (ev) => {
        if (ev.key !== 'ArrowLeft' && ev.key !== 'ArrowRight') return;
        ev.preventDefault();
        const n = T.esc.tiempo.length, i = T.hover === null ? n - 1 : T.hover;
        T.hover = Math.max(0, Math.min(n - 1, i + (ev.key === 'ArrowRight' ? 1 : -1))); pintarHoverT();
      });
      fig.addEventListener('blur', () => { T.hover = null; pintarHoverT(); });
      return G;
    });
    const ag = $('#agregar-grafico'); ag.replaceChildren(el('option', { value: '', text: 'Elige una variable…' }));
    for (const k of S.M.orden) {
      const v = S.M.vars[k];
      if (v.tipo === 'tabla' || esConstante(v)) continue;
      if ((cfg.graficos || []).some((g) => N(g.variable) === k)) continue;
      ag.append(el('option', { value: v.nombre, text: etiqueta(v.nombre) }));
    }
    ag.onchange = () => {
      if (!ag.value) return;
      const v = S.M.vars[N(ag.value)];
      cfg.graficos = (cfg.graficos || []).concat([{ variable: v.nombre, titulo: etiqueta(v.nombre), unidad: fmtUnidad(v.unidades) }]);
      montarTablero(); pintarGuardado(); guardarBorrador();
    };

    // métricas de aporte
    const met = $('#metrica'); met.replaceChildren();
    T.metricas = (cfg.metricas_aporte || []).filter((m) => existe(m.variable));
    T.metricas.forEach((m, i) => met.append(el('option', { value: String(i), text: m.etiqueta })));
    if (T.metrica >= T.metricas.length) T.metrica = 0;
    met.value = String(T.metrica);
    met.onchange = () => { T.metrica = +met.value; pintarAportes(); };

    T.modelo = modelo; T.existe = existe; T.valorActual = valorActual;
    T.base = modelo.simular({ final: T.final });
    correrT();
  }

  const limpio = (max) => {
    if (max <= 0) return 1;
    const p = Math.pow(10, Math.floor(Math.log10(max)));
    for (const m of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * p >= max) return m * p;
    return 10 * p;
  };
  function dibujarT(G) {
    const { svg, g } = G;
    const t = T.esc.tiempo, a = T.esc.serie(g.variable), b = T.base.serie(g.variable);
    const L = 52, R = 312, Tp = 8, B = 128;
    G.x0 = L; G.x1 = R;
    const lo = Math.min(0, ...a, ...b);
    const ymax = limpio(Math.max(...a, ...b) * 1.04);
    const X = (i) => L + ((R - L) * i) / (t.length - 1);
    const Y = (v) => B - ((B - Tp) * (v - lo)) / (ymax - lo || 1);
    svg.replaceChildren();
    for (let k = 0; k <= 4; k++) {
      const v = lo + ((ymax - lo) * k) / 4, y = Y(v);
      svg.append(sv('line', { x1: L, x2: R, y1: y, y2: y, class: k === 0 ? 'basel' : 'gridl' }));
      if (k % 2 === 0) svg.append(sv('text', { x: L - 6, y: y + 3, 'text-anchor': 'end', class: 'ax' }, document.createTextNode(fmt(v))));
    }
    const span = t[t.length - 1] - t[0];
    const paso = span > 72 ? 24 : span > 24 ? 12 : span > 8 ? 2 : 1;
    t.forEach((tt, i) => { if (Math.abs(tt / paso - Math.round(tt / paso)) < 1e-9) svg.append(sv('text', { x: X(i), y: B + 14, 'text-anchor': 'middle', class: 'ax' }, document.createTextNode(String(tt)))); });
    const path = (s) => s.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join('');
    svg.append(sv('path', { d: path(b), class: 'l-base' }), sv('path', { d: path(a), class: 'l-esc' }));
    svg.append(sv('circle', { cx: X(t.length - 1), cy: Y(a[a.length - 1]), r: 4, class: 'dot' }));
    G.cross = sv('line', { y1: Tp, y2: B, class: 'cross', visibility: 'hidden' });
    G.hdot = sv('circle', { r: 4, class: 'dot', visibility: 'hidden' });
    svg.append(G.cross, G.hdot);
    G.X = X; G.Y = Y; G.a = a; G.b = b;
  }
  function pintarHoverT() {
    if (!T.esc) return;
    const n = T.esc.tiempo.length, i = T.hover === null ? n - 1 : T.hover;
    for (const G of T.graficos) {
      if (!G.cross) continue;
      const vis = T.hover === null ? 'hidden' : 'visible';
      G.cross.setAttribute('visibility', vis); G.hdot.setAttribute('visibility', vis);
      G.cross.setAttribute('x1', G.X(i)); G.cross.setAttribute('x2', G.X(i));
      G.hdot.setAttribute('cx', G.X(i)); G.hdot.setAttribute('cy', G.Y(G.a[i]));
      G.read.replaceChildren(`${fmtUnidad(S.M.control.unidad) === 'meses' ? 'mes' : 't ='} ${nf(2).format(T.esc.tiempo[i])} · `, el('b', { text: fmt(G.a[i]) }), ` · base ${fmt(G.b[i])} · ${G.g.unidad || ''}`);
    }
  }
  function pintarKpis() {
    const cont = $('#kpis'); cont.replaceChildren();
    for (const k of (S.cfg.kpis || []).filter((x) => T.existe(x.variable))) {
      const a = T.esc.serie(k.variable), b = T.base.serie(k.variable);
      const v = a[a.length - 1], vb = b[b.length - 1];
      const d = vb ? (v - vb) / Math.abs(vb) : 0;
      const delta = el('span', { class: 'kpi-delta' + (Math.abs(d) < 0.0005 ? '' : d > 0 ? ' up' : ' down') });
      delta.textContent = Math.abs(d) < 0.0005 ? 'igual que la base' : `${d > 0 ? '+' : '−'}${nf(1).format(Math.abs(d) * 100)} % vs base (${fmt(vb)})`;
      cont.append(el('div', { class: 'kpi' }, el('span', { class: 'kpi-label', text: `${k.etiqueta}, t = ${T.esc.tiempo[T.esc.tiempo.length - 1]}` }), el('span', { class: 'kpi-value', text: fmt(v) }), delta));
    }
    const R = S.cfg.restriccion;
    const box = $('#restriccion'); box.replaceChildren();
    if (R && T.existe(R.real) && T.existe(R.deseado)) {
      const real = T.esc.serie(R.real), des = T.esc.serie(R.deseado);
      const meses = real.filter((v, i) => v < des[i] * (1 - 1e-6)).length;
      const warn = meses > 0;
      const ic = sv('svg', { width: 16, height: 16, viewBox: '0 0 16 16', 'aria-hidden': 'true' });
      ic.append(sv('path', warn ? { d: 'M8 1.5 15 14H1z', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.6', 'stroke-linejoin': 'round' } : { d: 'M3 8.5l3 3 7-7', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8', 'stroke-linecap': 'round' }));
      if (warn) ic.append(sv('line', { x1: 8, y1: 6, x2: 8, y2: 9.5, stroke: 'currentColor', 'stroke-width': '1.6' }), sv('circle', { cx: 8, cy: 11.8, r: 0.9, fill: 'currentColor' }));
      box.append(el('span', { class: 'estado ' + (warn ? 'warn' : 'ok') }, ic, document.createTextNode(warn ? `${R.texto} en ${meses} de ${real.length - 1} periodos` : `${R.texto.replace('limita', 'no limita')} en ningún periodo`)));
    }
  }
  function pintarTabla() {
    const t = T.esc.tiempo, filas = (S.cfg.tabla || (S.cfg.graficos || []).map((g) => g.variable)).filter(T.existe);
    let idx = t.map((tt, i) => (Math.abs(tt % 12) < 1e-9 ? i : -1)).filter((i) => i >= 0);
    if (idx.length < 2) idx = [0, Math.floor((t.length - 1) / 2), t.length - 1];
    const tab = $('#tabla'); tab.replaceChildren();
    const hr = el('tr', {}, el('th', { text: 'Variable' }));
    idx.forEach((i) => hr.append(el('th', { text: t[i] === 0 ? 'inicio' : (/month/i.test(S.M.control.unidad) && t[i] % 12 === 0 ? `año ${t[i] / 12}` : `t = ${t[i]}`) })));
    hr.append(el('th', { text: 'vs base' }));
    tab.append(el('thead', {}, hr));
    const tb = el('tbody');
    for (const v of filas) {
      const a = T.esc.serie(v), b = T.base.serie(v);
      const tr = el('tr', {}, el('td', { text: etiqueta(T.modelo.variable(v).nombre) }));
      idx.forEach((i) => tr.append(el('td', { text: fmt(a[i]) })));
      const d = b[b.length - 1] ? (a[a.length - 1] - b[b.length - 1]) / Math.abs(b[b.length - 1]) : 0;
      tr.append(el('td', { text: Math.abs(d) < 0.0005 ? '=' : `${d > 0 ? '+' : '−'}${nf(1).format(Math.abs(d) * 100)} %` }));
      tb.append(tr);
    }
    tab.append(tb);
  }
  function calcularAportes() {
    T.aportes = [];
    for (const [k, b] of T.bucles) {
      if (T.valorActual(b.c) === 0) { T.aportes.push({ meta: b.meta, off: true }); continue; }
      T.aportes.push({ meta: b.meta, r: T.modelo.simular({ cambios: { ...T.cambios, [k]: 0 }, final: T.final }) });
    }
    pintarAportes();
  }
  function pintarAportes() {
    if (!T.aportes || !T.metricas || !T.metricas.length) return;
    const m = T.metricas[T.metrica];
    const s = T.esc.serie(m.variable), v = s[s.length - 1];
    const filas = T.aportes.map((a) => (a.off ? { ...a, p: null } : { ...a, p: v ? (v - a.r.serie(m.variable).at(-1)) / v : 0 })).sort((x, y) => (y.p ?? -1) - (x.p ?? -1));
    const cont = $('#barras'); cont.replaceChildren();
    for (const f of filas) {
      const w = f.p === null ? 0 : Math.max(0, Math.min(1, f.p)) * 100;
      cont.append(el('div', { class: 'barra' + (f.p === null ? ' off' : '') },
        el('span', { class: 'barra-label' }, el('span', { class: 'codigo', text: f.meta.codigo }), el('span', { text: f.meta.nombre })),
        el('div', { class: 'track' }, el('div', { class: 'fill', style: `width:${w}%` })),
        el('span', { class: 'barra-val', text: f.p === null ? 'apagado' : `${nf(0).format(f.p * 100)} %` })));
    }
    $('#nota-aporte').textContent = `Qué parte de las ${m.etiqueta} al final del horizonte se pierde si se apaga cada bucle, con todo lo demás como está. Los bucles se potencian entre sí, por eso los aportes pueden sumar más de 100 %.`;
  }
  let pendT = null, pendAporte = null;
  function correrT() {
    T.esc = T.modelo.simular({ cambios: T.cambios, final: T.final });
    T.graficos.forEach(dibujarT); pintarHoverT(); pintarKpis(); pintarTabla(); pintarAportes();
    almacen.escribir(CLAVE_T(), { cambios: T.cambios, final: T.final });
    clearTimeout(pendAporte); pendAporte = setTimeout(calcularAportes, 140);
  }
  function programarT() { if (pendT) return; pendT = requestAnimationFrame(() => { pendT = null; correrT(); }); }
  $('#restablecer').addEventListener('click', () => {
    T.cambios = {};
    for (const { input, pintar, c } of T.controles.values()) { input.value = c.valor; pintar(); }
    for (const b of T.bucles.values()) b.pintar();
    programarT();
  });
  $('#fijar').addEventListener('click', () => {
    const ks = Object.keys(T.cambios);
    if (!ks.length) { toast('No hay cambios en los sliders para fijar.'); return; }
    pushHist();
    for (const k of ks) if (S.M.vars[k]) S.M.vars[k].ecuacion = String(T.cambios[k]);
    T.cambios = {};
    cambio({ inspector: true });
    toast(`${ks.length} ${ks.length === 1 ? 'valor fijado' : 'valores fijados'} en el modelo. Guarda para conservarlos.`);
  });

  // ------------------------------------------------------------ pestañas
  function pestana(p) {
    S.pestana = p;
    $('#tab-lienzo').setAttribute('aria-selected', String(p === 'lienzo'));
    $('#tab-tablero').setAttribute('aria-selected', String(p === 'tablero'));
    $('#vista-lienzo').hidden = p !== 'lienzo';
    $('#vista-tablero').hidden = p !== 'tablero';
    if (p === 'tablero' && (S.tableroSucio || !T.esc)) montarTablero();
    if (p === 'lienzo') { pintarLienzo(); }
    almacen.escribir('pestana:' + (S.cfg.titulo || ''), p);
  }
  $('#tab-lienzo').addEventListener('click', () => pestana('lienzo'));
  $('#tab-tablero').addEventListener('click', () => pestana('tablero'));

  // ------------------------------------------------------------- inicio
  async function leerArchivo(nombre) {
    if (location.protocol === 'file:') return null;
    try {
      const r = await Promise.race([fetch(nombre, { cache: 'no-store' }), new Promise((res) => setTimeout(() => res(null), 2500))]);
      return r && r.ok ? await r.text() : null;
    } catch (e) { return null; }
  }
  function cargarTexto(texto) { S.M = Modelo.desdeMdl(texto); }
  async function iniciar() {
    let texto = $('#modelo-mdl').textContent;
    let cfg = CFG_EMB;
    const [t, c] = await Promise.all([leerArchivo('modelo.mdl'), leerArchivo('tablero_config.json')]);
    if (t && /INTEG|=/.test(t)) texto = t;
    if (c) { try { cfg = JSON.parse(c); } catch (e) { /* se usa la configuración incrustada */ } }
    S.cfg = cfg;
    $('#titulo').textContent = cfg.titulo || 'Simulador';
    $('#antetitulo').textContent = cfg.antetitulo || '';
    $('#bajada').textContent = cfg.bajada || '';
    $('#pie').textContent = cfg.pie || '';
    try { cargarTexto(texto); } catch (e) { S.M = Modelo.vacio(); aviso('No se pudo abrir el modelo guardado: ' + e.message); }
    S.guardado = estadoGuardable();
    const g = almacen.leer(CLAVE_T());
    if (g) { T.cambios = g.cambios || {}; T.final = g.final ?? null; }
    const b = almacen.leer(CLAVE_BORRADOR());
    if (b && b.texto && (b.texto + '\n' + JSON.stringify(b.cfg || S.cfg)) !== S.guardado) {
      const fecha = new Date(b.ts).toLocaleString('es');
      aviso(`Tienes cambios sin guardar de una sesión anterior (${fecha}).`, [
        ['Recuperarlos', () => { try { pushHist(); cargarTexto(b.texto); if (b.cfg) S.cfg = b.cfg; S.vista = 0; S.sel = []; cambio({ estructura: true }); ajustar(); aviso(null); } catch (e) { aviso('No se pudo recuperar el borrador: ' + e.message); } }],
        ['Descartarlos', () => { almacen.borrar(CLAVE_BORRADOR()); aviso(null); }],
      ]);
    }
    pintarHerramientas(); pintarVistas(); pintarInspector();
    requestAnimationFrame(() => { ajustar(); pintarLienzo(); });
    simular();
    pintarGuardado();
    const p = almacen.leer('pestana:' + (cfg.titulo || ''));
    if (p === 'tablero') pestana('tablero');
    new ResizeObserver(() => { if (!S.ajustado) { ajustar(); pintarLienzo(); } }).observe(SVG);
    if (window.claude && typeof window.claude.use === 'function') {
      window.claude.use('artifact').then((a) => { S.artifact = a; pintarGuardado(); }).catch(() => {});
      window.claude.use('downloads').then((d) => { S.downloads = d; pintarGuardado(); }).catch(() => {});
    }
  }
  iniciar();
})();
