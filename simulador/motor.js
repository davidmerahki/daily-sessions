/*
 * motor.js — intérprete mínimo de modelos Vensim (.mdl) en JavaScript.
 *
 * Lee la sección de ecuaciones de un .mdl y simula con integración de Euler,
 * igual que Vensim con su método por defecto. Funciona en el navegador
 * (window.Motor) y en Node (require('./motor.js')).
 *
 *   const modelo = Motor.leer(textoMdl);
 *   const r = modelo.simular({ cambios: { 'fraccion de prospeccion': 0.006 } });
 *   r.tiempo            // [0, 1, 2, ...] según SAVEPER
 *   r.serie('Instituciones cliente')  // valores en cada instante guardado
 *
 * Subconjunto soportado: constantes, auxiliares, INTEG, lookups (tabla(x) y
 * WITH LOOKUP), operadores + - * / ^, comparaciones, :AND: :OR: :NOT:, y las
 * funciones ABS EXP LN LOG SQRT SIN COS TAN MIN MAX INTEGER MODULO QUANTUM
 * XIDZ ZIDZ IF THEN ELSE STEP RAMP PULSE PULSE TRAIN INITIAL ACTIVE INITIAL
 * SMOOTH SMOOTHI SMOOTH3 SMOOTH3I DELAY1 DELAY1I DELAY3 DELAY3I.
 * Sin subíndices, macros ni datos externos: si el modelo los usa, leer() lanza
 * un error que dice qué falta.
 */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else raiz.Motor = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const norm = (s) => s.replace(/["]/g, '').replace(/[\s_]+/g, ' ').trim().toLowerCase();

  // ------------------------------------------------------------------ léxico
  const KEYWORDS = { ':AND:': 'and', ':OR:': 'or', ':NOT:': 'not', ':NA:': 'na' };

  function tokenizar(src) {
    const t = [];
    let i = 0;
    while (i < src.length) {
      const c = src[i];
      if (/\s/.test(c)) { i++; continue; }
      if (c === '{') { i = src.indexOf('}', i) + 1 || src.length; continue; } // comentario en línea
      if (c === ':') {
        const m = src.slice(i).match(/^:[A-Z ]+:/i);
        if (!m) throw new Error(`símbolo ':' inesperado en «${src}»`);
        const k = KEYWORDS[m[0].toUpperCase()];
        if (!k) throw new Error(`palabra clave no soportada ${m[0]}`);
        t.push({ tipo: 'op', v: k }); i += m[0].length; continue;
      }
      const num = src.slice(i).match(/^(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?/);
      if (num) { t.push({ tipo: 'num', v: parseFloat(num[0]) }); i += num[0].length; continue; }
      const dos = src.slice(i, i + 2);
      if (dos === '<>' || dos === '<=' || dos === '>=') { t.push({ tipo: 'op', v: dos }); i += 2; continue; }
      if ('+-*/^(),=<>[]'.includes(c)) { t.push({ tipo: 'op', v: c }); i++; continue; }
      if (c === '"') {
        const fin = src.indexOf('"', i + 1);
        t.push({ tipo: 'id', v: norm(src.slice(i + 1, fin)) }); i = fin + 1; continue;
      }
      const m = src.slice(i).match(/^[A-Za-z_$À-ɏ][\w $'À-ɏ.&%]*/);
      if (m) { t.push({ tipo: 'id', v: norm(m[0]) }); i += m[0].length; continue; }
      throw new Error(`carácter inesperado «${c}» en «${src}»`);
    }
    return t;
  }

  // -------------------------------------------------------------- sintaxis
  // Precedencia (de menor a mayor): :OR:, :AND:, comparación, + -, * /, unario (- + :NOT:), ^
  function analizar(src, comoTabla = false) {
    const t = tokenizar(src);
    let p = 0;
    const ver = () => t[p];
    const es = (v) => t[p] && t[p].tipo === 'op' && t[p].v === v;
    const esperar = (v) => { if (!es(v)) throw new Error(`se esperaba «${v}» en «${src}»`); p++; };

    function o() { let a = y(); while (es('or')) { p++; a = { op: 'or', a, b: y() }; } return a; }
    function y() { let a = cmp(); while (es('and')) { p++; a = { op: 'and', a, b: cmp() }; } return a; }
    function cmp() {
      let a = suma();
      while (ver() && ver().tipo === 'op' && ['=', '<>', '<', '>', '<=', '>='].includes(ver().v)) {
        const op = t[p++].v; a = { op, a, b: suma() };
      }
      return a;
    }
    function suma() {
      let a = prod();
      while (es('+') || es('-')) { const op = t[p++].v; a = { op, a, b: prod() }; }
      return a;
    }
    function prod() {
      let a = unario();
      while (es('*') || es('/')) { const op = t[p++].v; a = { op, a, b: unario() }; }
      return a;
    }
    function unario() {
      if (es('-')) { p++; return { op: 'neg', a: unario() }; }
      if (es('+')) { p++; return unario(); }
      if (es('not')) { p++; return { op: 'not', a: unario() }; }
      return pot();
    }
    function pot() {
      const a = prim();
      if (es('^')) { p++; return { op: '^', a, b: unario() }; }
      return a;
    }
    function prim() {
      const k = ver();
      if (!k) throw new Error(`expresión incompleta: «${src}»`);
      if (k.tipo === 'num') { p++; return { num: k.v }; }
      if (es('na')) { p++; return { num: -1.298074214633707e33 }; }
      if (es('(')) { p++; const e = o(); esperar(')'); return e; }
      if (k.tipo === 'id') {
        p++;
        if (es('(')) {
          p++;
          const args = [];
          if (!es(')')) {
            args.push(argumento(k.v, 0));
            while (es(',')) { p++; args.push(argumento(k.v, args.length)); }
          }
          esperar(')');
          return { fn: k.v, args };
        }
        if (es('[')) throw new Error(`subíndices no soportados (${k.v})`);
        return { id: k.v };
      }
      throw new Error(`token inesperado «${k.v}» en «${src}»`);
    }
    function argumento(fn, i) {
      if (fn === 'with lookup' && i === 1) return { tabla: tablaArg() };
      return o();
    }
    function numero() {
      let s = 1;
      if (es('-')) { p++; s = -1; } else if (es('+')) p++;
      const k = ver();
      if (!k || k.tipo !== 'num') throw new Error(`se esperaba un número en la tabla de «${src}»`);
      p++; return s * k.v;
    }
    function par() { esperar('('); const x = numero(); esperar(','); const yv = numero(); esperar(')'); return [x, yv]; }
    function puntos() {
      const pts = [];
      if (es('[')) { p++; par(); esperar('-'); par(); esperar(']'); if (es(',')) p++; }
      while (es('(')) { pts.push(par()); if (es(',')) p++; }
      return pts;
    }
    function tablaArg() { esperar('('); const pts = puntos(); esperar(')'); return pts; }

    if (comoTabla) {
      const pts = tablaArg();
      if (p !== t.length) throw new Error(`sobra texto en la tabla «${src}»`);
      return pts;
    }
    const ast = o();
    if (p !== t.length) throw new Error(`sobra texto en «${src}»`);
    return ast;
  }

  // ------------------------------------------------------- lectura del .mdl
  function separarArgs(s) {
    const partes = []; let nivel = 0, actual = '';
    for (const c of s) {
      if (c === ',' && nivel === 0) { partes.push(actual); actual = ''; continue; }
      if (c === '(' || c === '[') nivel++;
      if (c === ')' || c === ']') nivel--;
      actual += c;
    }
    partes.push(actual);
    return partes.map((x) => x.trim());
  }

  function leer(texto) {
    const fin = texto.indexOf('\\\\\\---///');
    let eqs = (fin >= 0 ? texto.slice(0, fin) : texto).replace(/^﻿?\{UTF-8\}/, '');
    eqs = eqs.replace(/\\\r?\n/g, ' ');
    const vars = new Map();
    let grupo = '';
    for (const bruto of eqs.split('|')) {
      const bloque = bruto.trim();
      if (!bloque) continue;
      if (bloque.startsWith('*')) {
        const m = bloque.match(/\n\s*\.([^\n~]+)/);
        if (m) grupo = m[1].trim();
        continue;
      }
      const campos = bloque.split('~');
      const def = campos[0].trim();
      const unidadesTxt = (campos[1] || '').trim();
      const comentario = (campos[2] || '').replace(/\s+/g, ' ').trim();
      let rango = null, unidades = unidadesTxt;
      const mr = unidadesTxt.match(/^(.*?)\s*\[([^\]]*)\]\s*$/);
      if (mr) {
        unidades = mr[1].trim();
        const r = mr[2].split(',').map((x) => (x.trim() === '?' ? null : parseFloat(x)));
        rango = { min: r[0], max: r[1], paso: r.length > 2 ? r[2] : null };
      }
      const base = { unidades, comentario, rango, grupo };
      if (/:=|\bGET\s|:INTERPOLATE:|:RAW:|:HOLD BACKWARD:|:LOOK FORWARD:/i.test(def)) {
        throw new Error(`variables de datos no soportadas: ${def.slice(0, 60)}`);
      }
      if (/^\s*:MACRO:/i.test(def)) throw new Error('macros no soportados');
      const eqi = def.search(/==|=/);
      if (eqi < 0) {
        // lookup: nombre( [(x0,y0)-(x1,y1)], (x,y), ... )
        const pi = def.indexOf('(');
        if (pi < 0) {
          if (/:/.test(def)) throw new Error(`subíndices no soportados: ${def.slice(0, 60)}`);
          throw new Error(`ecuación no reconocida: ${def.slice(0, 60)}`);
        }
        const nombre = norm(def.slice(0, pi));
        const puntos = analizar(def.slice(pi), true);
        vars.set(nombre, { ...base, nombre: def.slice(0, pi).trim(), tipo: 'tabla', puntos });
        continue;
      }
      const lhs = def.slice(0, eqi).trim();
      const rhs = def.slice(def[eqi + 1] === '=' ? eqi + 2 : eqi + 1).trim();
      if (/[\[:]/.test(lhs)) throw new Error(`subíndices o :EXCEPT: no soportados: ${lhs}`);
      const nombre = norm(lhs);
      const integ = rhs.match(/^INTEG\s*\(([\s\S]*)\)\s*$/i);
      if (integ) {
        const [flujo, ini] = separarArgs(integ[1]);
        vars.set(nombre, { ...base, nombre: lhs, tipo: 'nivel', flujo: analizar(flujo), inicial: analizar(ini) });
      } else {
        const ast = analizar(rhs);
        const tipo = ast.num !== undefined || (ast.op === 'neg' && ast.a.num !== undefined) ? 'constante' : 'auxiliar';
        vars.set(nombre, { ...base, nombre: lhs, tipo, expr: ast });
      }
    }
    for (const c of ['initial time', 'final time', 'time step']) {
      if (!vars.has(c)) throw new Error(`falta la variable de control ${c.toUpperCase()}`);
    }
    return new Modelo(vars);
  }

  // ------------------------------------------------------------ simulación
  const tablaEval = (pts, x) => {
    if (x <= pts[0][0]) return pts[0][1];
    const n = pts.length - 1;
    if (x >= pts[n][0]) return pts[n][1];
    for (let i = 1; i <= n; i++) {
      if (x <= pts[i][0]) {
        const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
        return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
      }
    }
    return pts[n][1];
  };
  const ESTADO = new Set(['smooth', 'smoothi', 'smooth3', 'smooth3i', 'delay1', 'delay1i', 'delay3', 'delay3i',
    'initial', 'active initial']);

  class Modelo {
    constructor(vars) {
      this.vars = vars;
      // cada llamada a una función con estado recibe un índice fijo
      this.nEstados = 0;
      const marcar = (n) => {
        if (!n || typeof n !== 'object') return;
        if (n.fn && ESTADO.has(n.fn)) n.slot = this.nEstados++;
        for (const k of ['a', 'b']) marcar(n[k]);
        (n.args || []).forEach(marcar);
      };
      for (const v of vars.values()) { marcar(v.expr); marcar(v.flujo); marcar(v.inicial); }
      for (const v of vars.values()) this._verificar(v);
    }

    _verificar(v) {
      const rec = (n) => {
        if (!n || typeof n !== 'object') return;
        if (n.id !== undefined && n.id !== 'time' && !this.vars.has(n.id)) {
          throw new Error(`«${v.nombre}» usa «${n.id}», que no está definida`);
        }
        if (n.fn !== undefined && !FUNCIONES[n.fn] && !ESTADO.has(n.fn) && !(this.vars.get(n.fn) || {}).puntos) {
          throw new Error(`función no soportada: ${n.fn.toUpperCase()} (en «${v.nombre}»)`);
        }
        for (const k of ['a', 'b']) rec(n[k]);
        (n.args || []).forEach(rec);
      };
      rec(v.expr); rec(v.flujo); rec(v.inicial);
    }

    /** Constantes con su rango, unidades, comentario y grupo (para construir sliders). */
    constantes() {
      return [...this.vars.values()].filter((v) => v.tipo === 'constante' &&
        !['initial time', 'final time', 'time step', 'saveper'].includes(norm(v.nombre)))
        .map((v) => ({ nombre: v.nombre, valor: v.expr.op === 'neg' ? -v.expr.a.num : v.expr.num,
          unidades: v.unidades, comentario: v.comentario, rango: v.rango, grupo: v.grupo }));
    }

    niveles() { return [...this.vars.values()].filter((v) => v.tipo === 'nivel').map((v) => v.nombre); }

    variable(nombre) { return this.vars.get(norm(nombre)); }

    /**
     * Simula el modelo. opciones.cambios: { nombre: valor } para constantes.
     * opciones.final: tiempo final alternativo. Devuelve { tiempo, serie(nombre), valores }.
     */
    simular(opciones = {}) {
      const cambios = new Map(Object.entries(opciones.cambios || {}).map(([k, v]) => [norm(k), v]));
      for (const k of cambios.keys()) {
        if (!this.vars.has(k)) throw new Error(`no existe la variable «${k}»`);
      }
      const vars = this.vars;
      const constante = (k) => cambios.has(k) ? cambios.get(k) : null;
      let tiempo = 0;
      let memo = new Map();
      const enCurso = new Set();
      const niveles = new Map(); // nombre -> valor actual
      const estados = new Array(this.nEstados).fill(null); // arrays de estado por slot
      const derivadas = [];
      let inicializando = true;

      const valor = (k) => {
        if (k === 'time') return tiempo;
        const c = constante(k);
        if (c !== null) return c;
        if (memo.has(k)) return memo.get(k);
        const v = vars.get(k);
        if (v.tipo === 'nivel') {
          if (!niveles.has(k)) {
            if (enCurso.has(k)) throw new Error(`ecuaciones simultáneas al inicializar «${v.nombre}»`);
            enCurso.add(k); niveles.set(k, ev(v.inicial)); enCurso.delete(k);
          }
          return niveles.get(k);
        }
        if (v.tipo === 'tabla') throw new Error(`la tabla «${v.nombre}» se usa sin argumento`);
        if (enCurso.has(k)) throw new Error(`ecuaciones simultáneas: «${v.nombre}» depende de sí misma sin un nivel`);
        enCurso.add(k);
        const r = ev(v.expr);
        enCurso.delete(k);
        memo.set(k, r);
        return r;
      };

      const dt = () => valor('time step');
      const ev = (n) => {
        if (n.num !== undefined) return n.num;
        if (n.id !== undefined) return valor(n.id);
        if (n.fn !== undefined) return llamar(n);
        const a = ev(n.a);
        switch (n.op) {
          case 'neg': return -a;
          case 'not': return a ? 0 : 1;
        }
        const b = ev(n.b);
        switch (n.op) {
          case '+': return a + b;
          case '-': return a - b;
          case '*': return a * b;
          case '/': return a / b;
          case '^': return Math.pow(a, b);
          case '=': return a === b ? 1 : 0;
          case '<>': return a !== b ? 1 : 0;
          case '<': return a < b ? 1 : 0;
          case '>': return a > b ? 1 : 0;
          case '<=': return a <= b ? 1 : 0;
          case '>=': return a >= b ? 1 : 0;
          case 'and': return a && b ? 1 : 0;
          case 'or': return a || b ? 1 : 0;
        }
        throw new Error(`operador desconocido ${n.op}`);
      };

      const llamar = (n) => {
        const f = n.fn;
        const tabla = vars.get(f);
        if (tabla && tabla.tipo === 'tabla') return tablaEval(tabla.puntos, ev(n.args[0]));
        if (ESTADO.has(f)) return conEstado(n);
        if (f === 'if then else') {
          // Vensim evalúa ambas ramas: las funciones con estado de la rama no
          // elegida siguen evolucionando.
          const c = ev(n.args[0]), si = ev(n.args[1]), no = ev(n.args[2]);
          return c ? si : no;
        }
        if (f === 'with lookup') return tablaEval(n.args[1].tabla, ev(n.args[0]));
        return FUNCIONES[f](n.args.map(ev), { tiempo, dt: dt() });
      };

      // Funciones con estado: el estado se crea al primer uso (inicialización)
      // y su derivada se calcula en cada paso junto con las de los niveles.
      const conEstado = (n) => {
        const f = n.fn, s = n.slot, A = n.args;
        let st = estados[s];
        if (f === 'initial') {
          if (st === null) { st = estados[s] = [ev(A[0])]; }
          return st[0];
        }
        if (f === 'active initial') {
          return inicializando ? ev(A[1]) : ev(A[0]);
        }
        const orden = f.startsWith('smooth3') || f.startsWith('delay3') ? 3 : 1;
        const material = f.startsWith('delay');
        const entrada = ev(A[0]);
        const T = ev(A[1]);
        if (st === null) {
          const ini = f.endsWith('i') ? ev(A[2]) : entrada;
          st = estados[s] = new Array(orden).fill(material ? ini * T / orden : ini);
          derivadas.push({ slot: s, n });
        }
        n.ultimo = { entrada, T };
        return material ? st[orden - 1] / (T / orden) : st[orden - 1];
      };

      const derivadaEstado = (d) => {
        const n = d.n, st = estados[d.slot];
        const f = n.fn;
        const orden = st.length;
        const material = f.startsWith('delay');
        const { entrada, T } = n.ultimo;
        const tau = T / orden;
        const der = new Array(orden);
        if (material) {
          let flujo = entrada;
          for (let i = 0; i < orden; i++) { const sale = st[i] / tau; der[i] = flujo - sale; flujo = sale; }
        } else {
          let prev = entrada;
          for (let i = 0; i < orden; i++) { der[i] = (prev - st[i]) / tau; prev = st[i]; }
        }
        return der;
      };

      // control
      const t0 = valor('initial time');
      const tf = opciones.final !== undefined ? opciones.final : valor('final time');
      const paso = valor('time step');
      const saveper = vars.has('saveper') ? valor('saveper') : paso;
      const nPasos = Math.round((tf - t0) / paso);
      const cadaN = Math.max(1, Math.round(saveper / paso));
      tiempo = t0;
      memo = new Map();

      const nombres = [...vars.keys()].filter((k) => vars.get(k).tipo !== 'tabla');
      const serie = new Map(nombres.map((k) => [k, []]));
      const tiempos = [];
      const nivelesK = nombres.filter((k) => vars.get(k).tipo === 'nivel');

      for (let i = 0; i <= nPasos; i++) {
        tiempo = t0 + i * paso;
        memo = new Map();
        if (inicializando) {
          for (const k of nombres) valor(k); // fija niveles y estados iniciales
          inicializando = false;
          memo = new Map();
        }
        for (const k of nombres) valor(k);
        if (i % cadaN === 0 || i === nPasos) {
          tiempos.push(tiempo);
          for (const k of nombres) serie.get(k).push(valor(k));
        }
        if (i === nPasos) break;
        // Euler: calcular todas las derivadas con los valores de t, luego actualizar
        const dNiv = nivelesK.map((k) => ev(vars.get(k).flujo));
        const dEst = derivadas.map(derivadaEstado);
        nivelesK.forEach((k, j) => niveles.set(k, niveles.get(k) + paso * dNiv[j]));
        derivadas.forEach((d, j) => { const st = estados[d.slot]; for (let q = 0; q < st.length; q++) st[q] += paso * dEst[j][q]; });
      }
      return {
        tiempo: tiempos,
        serie: (nombre) => {
          const s = serie.get(norm(nombre));
          if (!s) throw new Error(`no existe la variable «${nombre}»`);
          return s;
        },
        nombres: nombres.map((k) => vars.get(k).nombre),
      };
    }
  }

  const tplus = (c) => c.tiempo + c.dt / 2;
  const FUNCIONES = {
    'abs': ([a]) => Math.abs(a),
    'exp': ([a]) => Math.exp(a),
    'ln': ([a]) => Math.log(a),
    'log': ([a, b]) => Math.log(a) / Math.log(b),
    'sqrt': ([a]) => Math.sqrt(a),
    'sin': ([a]) => Math.sin(a), 'cos': ([a]) => Math.cos(a), 'tan': ([a]) => Math.tan(a),
    'min': ([a, b]) => Math.min(a, b),
    'max': ([a, b]) => Math.max(a, b),
    'integer': ([a]) => Math.trunc(a),
    'modulo': ([a, b]) => a % b,
    'quantum': ([a, q]) => (q <= 0 ? a : q * Math.trunc(a / q)),
    'xidz': ([a, b, x]) => (Math.abs(b) < 1e-6 ? x : a / b),
    'zidz': ([a, b]) => (Math.abs(b) < 1e-6 ? 0 : a / b),
    'step': ([h, t], c) => (tplus(c) > t ? h : 0),
    'ramp': ([s, t1, t2], c) => (c.tiempo > t1 ? s * (Math.min(c.tiempo, t2) - t1) : 0),
    'pulse': ([t1, w], c) => { const tp = tplus(c); return tp > t1 && tp < t1 + Math.max(w, c.dt) ? 1 : 0; },
    'pulse train': ([t1, w, rep, t2], c) => {
      const tp = tplus(c);
      if (tp < t1 || tp > t2) return 0;
      return (tp - t1) % rep < Math.max(w, c.dt) ? 1 : 0;
    },
  };

  return { leer, analizar, version: '0.1.0' };
});
