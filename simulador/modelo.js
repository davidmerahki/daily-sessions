/*
 * modelo.js — modelo editable (variables + diagrama) para el lienzo.
 *
 * Convierte un .mdl de Vensim (ecuaciones y vistas del sketch) en un objeto
 * JSON que el lienzo puede editar, y vuelve a escribirlo como .mdl que abren
 * Vensim, PySD y Simlin. No toca el DOM: se prueba en Node.
 *
 *   const M = Modelo.desdeMdl(texto);      // { control, vars, orden, vistas, ajustes }
 *   Modelo.renombrar(M, 'vieja', 'nueva'); // actualiza ecuaciones y diagrama
 *   const texto2 = Modelo.aMdl(M);         // .mdl completo
 *   Modelo.problemas(M)                    // errores y avisos por variable
 *
 * Estructura:
 *   vars[key] = { nombre, tipo: 'nivel'|'flujo'|'aux'|'tabla', ecuacion, inicial,
 *                 tasaManual, unidades, comentario, rango: {min,max,paso}|null, grupo }
 *     (nivel: ecuacion = tasa neta; flujo: los niveles que conecta salen del diagrama)
 *   vistas[i] = { nombre, items: [...] } con items:
 *     {id,t:'nivel',key,x,y,w,h}   {id,t:'var',key,x,y,w,h}   {id,t:'sombra',key,x,y,w,h}
 *     {id,t:'valvula',key,x,y,lx,ly,desde,hacia}  (desde/hacia: id de un nivel o una nube)
 *     {id,t:'nube',x,y}   {id,t:'flecha',de,a,pol,cx,cy,inicial}   {id,t:'nota',texto,x,y,bucle,horario}
 */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else raiz.Modelo = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const norm = (s) => String(s).replace(/["]/g, '').replace(/[\s_]+/g, ' ').trim().toLowerCase();
  const CONTROL = ['initial time', 'final time', 'time step', 'saveper'];
  const FUNCIONES = ['abs', 'exp', 'ln', 'log', 'sqrt', 'sin', 'cos', 'tan', 'min', 'max', 'integer', 'modulo',
    'quantum', 'xidz', 'zidz', 'if then else', 'step', 'ramp', 'pulse', 'pulse train', 'initial', 'active initial',
    'smooth', 'smoothi', 'smooth3', 'smooth3i', 'delay1', 'delay1i', 'delay3', 'delay3i', 'with lookup'];
  const clon = (o) => JSON.parse(JSON.stringify(o));

  // ------------------------------------------------------------ léxico
  // Recorre una expresión y devuelve los identificadores con su posición,
  // con las mismas reglas que motor.js (un nombre puede tener espacios).
  function identificadores(expr) {
    const res = [];
    let i = 0;
    const s = expr || '';
    while (i < s.length) {
      const c = s[i];
      if (c === '{') { const f = s.indexOf('}', i); i = f < 0 ? s.length : f + 1; continue; }
      if (c === ':') { const m = s.slice(i).match(/^:[A-Z ]+:/i); i += m ? m[0].length : 1; continue; }
      if (c === '"') {
        const f = s.indexOf('"', i + 1);
        const fin = f < 0 ? s.length : f + 1;
        res.push({ ini: i, fin, texto: s.slice(i + 1, fin - 1), llamada: /^\s*\(/.test(s.slice(fin)) });
        i = fin; continue;
      }
      const num = s.slice(i).match(/^(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?/);
      if (num) { i += num[0].length; continue; }
      const m = s.slice(i).match(/^[A-Za-z_$À-ɏ][\w $'À-ɏ.&%]*/);
      if (m) {
        const crudo = m[0];
        const t = crudo.replace(/\s+$/, '');
        res.push({ ini: i, fin: i + t.length, texto: t, llamada: /^\s*\(/.test(s.slice(i + crudo.length)) });
        i += crudo.length; continue;
      }
      i++;
    }
    return res;
  }

  /** Claves de las variables que usa una expresión (en orden, sin repetir). */
  function usa(M, expr) {
    const out = [];
    for (const t of identificadores(expr)) {
      const k = norm(t.texto);
      if (M.vars[k] && !out.includes(k)) out.push(k);
    }
    return out;
  }

  function reemplazarNombre(expr, viejaKey, nuevoNombre) {
    const ids = identificadores(expr).filter((t) => norm(t.texto) === viejaKey);
    let s = expr;
    for (let j = ids.length - 1; j >= 0; j--) s = s.slice(0, ids[j].ini) + escribirNombre(nuevoNombre) + s.slice(ids[j].fin);
    return s;
  }

  const nombreSimple = (n) => /^[A-Za-z_À-ɏ][A-Za-z0-9_ À-ɏ$']*$/.test(n);
  const escribirNombre = (n) => (nombreSimple(n) ? n : '"' + n.replace(/"/g, '\\"') + '"');

  /** Valida un nombre nuevo; devuelve un mensaje de error o null. */
  function errorNombre(M, nombre, propioKey) {
    const n = String(nombre).replace(/\s+/g, ' ').trim();
    if (!n) return 'El nombre no puede quedar vacío.';
    if (/[~|"=\[\]:!]/.test(n)) return 'El nombre no puede llevar ~ | " = [ ] : !';
    if (/^\d/.test(n)) return 'El nombre no puede empezar con un número.';
    const k = norm(n);
    if (CONTROL.includes(k) || k === 'time') return 'Ese nombre está reservado para el control de la simulación.';
    if (FUNCIONES.includes(k)) return 'Ese nombre es una función de Vensim.';
    if (M.vars[k] && k !== propioKey) return 'Ya existe una variable con ese nombre.';
    return null;
  }

  // ------------------------------------------------------- lectura .mdl
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

  function separarCampos(linea) {
    const out = []; let cur = '', q = false;
    for (let i = 0; i < linea.length; i++) {
      const c = linea[i];
      if (c === '"' && linea[i - 1] !== '\\') { q = !q; cur += c; continue; }
      if (c === ',' && !q) { out.push(cur); cur = ''; continue; }
      cur += c;
    }
    out.push(cur);
    return out;
  }

  function leerEcuaciones(texto) {
    const fin = texto.indexOf('\\\\\\---///');
    let eqs = (fin >= 0 ? texto.slice(0, fin) : texto).replace(/^﻿?\{UTF-8\}/, '');
    eqs = eqs.replace(/\\\r?\n/g, ' ');
    const vars = {}, orden = [], control = { unidad: 'Month' };
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
        const r = mr[2].split(',').map((x) => (x.trim() === '?' || x.trim() === '' ? null : parseFloat(x)));
        rango = { min: r[0] ?? null, max: r[1] ?? null, paso: r.length > 2 ? r[2] : null };
      }
      if (/:=|\bGET\s|:INTERPOLATE:|:RAW:|:HOLD BACKWARD:|:LOOK FORWARD:/i.test(def)) {
        throw new Error('El lienzo todavía no admite variables de datos: ' + def.slice(0, 60));
      }
      if (/^\s*:MACRO:/i.test(def)) throw new Error('El lienzo todavía no admite macros.');
      const eqi = def.search(/==|=/);
      if (eqi < 0) {
        const pi = def.indexOf('(');
        if (pi < 0 || /:/.test(def.slice(0, pi))) throw new Error('El lienzo todavía no admite subíndices: ' + def.slice(0, 60));
        const nombre = def.slice(0, pi).trim().replace(/^"|"$/g, '');
        const k = norm(nombre);
        vars[k] = { nombre, tipo: 'tabla', ecuacion: def.slice(pi + 1, def.lastIndexOf(')')).trim(), inicial: '', tasaManual: false, unidades, comentario, rango, grupo };
        orden.push(k);
        continue;
      }
      const lhs = def.slice(0, eqi).trim();
      const rhs = def.slice(def[eqi + 1] === '=' ? eqi + 2 : eqi + 1).trim();
      if (/[\[:]/.test(lhs)) throw new Error('El lienzo todavía no admite subíndices: ' + lhs);
      const nombre = lhs.replace(/^"|"$/g, '');
      const k = norm(nombre);
      if (CONTROL.includes(k)) {
        const v = parseFloat(rhs);
        if (k === 'initial time') { control.inicial = v; if (unidades) control.unidad = unidades; }
        if (k === 'final time') control.final = v;
        if (k === 'time step') control.paso = v;
        if (k === 'saveper') control.guardar = norm(rhs) === 'time step' ? null : v;
        continue;
      }
      const integ = rhs.match(/^INTEG\s*\(([\s\S]*)\)\s*$/i);
      if (integ) {
        const [tasa, ini] = separarArgs(integ[1]);
        vars[k] = { nombre, tipo: 'nivel', ecuacion: tasa.replace(/\s+/g, ' '), inicial: ini.replace(/\s+/g, ' '), tasaManual: true, unidades, comentario, rango, grupo };
      } else {
        vars[k] = { nombre, tipo: 'aux', ecuacion: rhs.replace(/\s+/g, ' ').trim(), inicial: '', tasaManual: false, unidades, comentario, rango, grupo };
      }
      orden.push(k);
    }
    for (const [c, d] of [['inicial', 0], ['final', 100], ['paso', 1]]) if (control[c] === undefined || isNaN(control[c])) control[c] = d;
    if (control.guardar === undefined) control.guardar = null;
    return { vars, orden, control };
  }

  function leerVistas(texto, vars) {
    const ini = texto.indexOf('\\\\\\---///');
    if (ini < 0) return [];
    const finIdx = texto.indexOf('///---\\\\\\', ini);
    const lineas = texto.slice(ini, finIdx < 0 ? texto.length : finIdx).split(/\r?\n/);
    const vistas = [];
    let v = null;
    for (let i = 0; i < lineas.length; i++) {
      const l = lineas[i];
      if (l.startsWith('*')) { v = { nombre: l.slice(1).trim() || `Vista ${vistas.length + 1}`, rec: [] }; vistas.push(v); continue; }
      if (!v || !/^\d+,/.test(l)) continue;
      const f = separarCampos(l);
      const r = { tipo: +f[0], id: +f[1], f, linea: l };
      if (r.tipo === 12 && f[2] !== '48') {
        const sig = lineas[i + 1];
        if (sig !== undefined && !/^\d+,/.test(sig) && !sig.startsWith('*') && !sig.startsWith('$') && !sig.startsWith('\\\\\\') && !sig.startsWith('///')) {
          r.texto = sig; i++;
        }
      }
      v.rec.push(r);
    }
    return vistas.map((vv) => convertirVista(vv, vars));
  }

  function convertirVista(vv, vars) {
    const items = [];
    const porId = new Map();     // id del .mdl -> item
    const etiquetaDeValvula = new Map(); // id de la etiqueta del flujo -> item válvula
    let ultimaValvula = null;
    const nom = (s) => s.replace(/^"|"$/g, '').replace(/\\"/g, '"');
    for (const r of vv.rec) {
      const f = r.f;
      if (r.tipo === 10) {
        const nombre = nom(f[2]), k = norm(nombre);
        const x = +f[3], y = +f[4], w = +f[5] || 30, h = +f[6] || 10, forma = +f[7], bits = +f[8];
        if (!vars[k] && k !== 'time' && !CONTROL.includes(k)) { ultimaValvula = null; continue; }
        if ((forma & 32) && ultimaValvula) {
          ultimaValvula.key = k; ultimaValvula.lx = x - ultimaValvula.x; ultimaValvula.ly = y - ultimaValvula.y;
          if (vars[k]) vars[k].tipo = 'flujo';
          etiquetaDeValvula.set(r.id, ultimaValvula);
          ultimaValvula = null;
          continue;
        }
        ultimaValvula = null;
        if (k === 'time' || CONTROL.includes(k)) continue;
        const sombra = !(bits & 1);
        const t = sombra ? 'sombra' : (forma & 3) === 3 && vars[k].tipo === 'nivel' ? 'nivel' : 'var';
        const it = { id: 'e' + r.id, t, key: k, x, y, w, h };
        items.push(it); porId.set(r.id, it);
      } else if (r.tipo === 11) {
        const it = { id: 'e' + r.id, t: 'valvula', key: null, x: +f[3], y: +f[4], lx: 0, ly: 18, desde: null, hacia: null };
        items.push(it); porId.set(r.id, it); ultimaValvula = it;
      } else if (r.tipo === 12) {
        ultimaValvula = null;
        if (f[2] === '48') {
          const it = { id: 'e' + r.id, t: 'nube', x: +f[3], y: +f[4] };
          items.push(it); porId.set(r.id, it);
        } else if (r.texto !== undefined) {
          const forma = +f[7];
          const bucle = (forma === 4 || forma === 5) && /^[RBrb]\d*$/.test(r.texto.trim()) ? r.texto.trim().toUpperCase() : null;
          items.push({ id: 'e' + r.id, t: 'nota', texto: r.texto, x: +f[3], y: +f[4], bucle, horario: forma === 4 });
        }
      } else {
        ultimaValvula = null;
      }
    }
    for (const r of vv.rec) {
      if (r.tipo !== 1) continue;
      const f = r.f;
      const de = +f[2], a = +f[3];
      // los puntos van al final como n|(x,y)|...; se leen de la línea cruda porque llevan comas
      const puntos = (r.linea.slice(r.linea.lastIndexOf(',,') + 2).match(/\((-?\d+),(-?\d+)\)/g)) || [];
      const pts = puntos.map((p) => p.slice(1, -1).split(',').map(Number));
      if (f[7] === '22') {
        const valv = porId.get(de) || etiquetaDeValvula.get(de);
        const fin = porId.get(a);
        if (!valv || valv.t !== 'valvula' || !fin) continue;
        if (+f[4] === 100) valv.desde = fin.id; else valv.hacia = fin.id;
        continue;
      }
      const ia = porId.get(de) || etiquetaDeValvula.get(de);
      const ib = porId.get(a) || etiquetaDeValvula.get(a);
      if (!ia || !ib || ia.t === 'nube' || ib.t === 'nube') continue;
      const pol = f[6] === '43' ? '+' : f[6] === '45' ? '-' : f[6] === '83' ? '+' : f[6] === '79' ? '-' : '';
      const p = pts[pts.length - 1];
      const curva = f[4] === '1' && p;
      items.push({ id: 'e' + r.id, t: 'flecha', de: ia.id, a: ib.id, pol, cx: curva ? p[0] : null, cy: curva ? p[1] : null, inicial: f[10] === '1' });
    }
    const out = items.filter((it) => it.t !== 'valvula' || it.key);
    return { nombre: vv.nombre, items: out };
  }

  function leerAjustes(texto) {
    const i = texto.indexOf('///---\\\\\\');
    if (i < 0) return [];
    return texto.slice(i + 9).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  }

  function desdeMdl(texto) {
    const { vars, orden, control } = leerEcuaciones(texto);
    const vistas = leerVistas(texto, vars);
    const M = { control, vars, orden, vistas: vistas.length ? vistas : [{ nombre: 'Vista 1', items: [] }], ajustes: leerAjustes(texto) };
    for (const k of orden) {
      const v = vars[k];
      if (v.tipo === 'nivel') v.tasaManual = !tasaCoincide(M, k);
    }
    asegurarIds(M);
    return M;
  }

  function asegurarIds(M) {
    M.sig = M.sig || 1;
    for (const v of M.vistas) for (const it of v.items) {
      const n = parseInt(String(it.id).replace(/\D/g, ''), 10);
      if (n >= M.sig) M.sig = n + 1;
    }
  }
  const nuevoId = (M) => 'e' + (M.sig++);

  // --------------------------------------------- estructura de flujos
  /** {entradas:[keys], salidas:[keys]} de un nivel, según las válvulas del diagrama. */
  function flujosDe(M, stockKey) {
    const entradas = [], salidas = [];
    for (const v of M.vistas) {
      const porId = new Map(v.items.map((it) => [it.id, it]));
      for (const it of v.items) {
        if (it.t !== 'valvula' || !it.key) continue;
        const d = porId.get(it.desde), h = porId.get(it.hacia);
        if (h && h.t === 'nivel' && h.key === stockKey && !entradas.includes(it.key)) entradas.push(it.key);
        if (d && d.t === 'nivel' && d.key === stockKey && !salidas.includes(it.key)) salidas.push(it.key);
      }
    }
    return { entradas, salidas };
  }

  function tasaAuto(M, stockKey) {
    const { entradas, salidas } = flujosDe(M, stockKey);
    const nom = (k) => escribirNombre(M.vars[k].nombre);
    let s = entradas.map(nom).join('+');
    for (const k of salidas) s += '-' + nom(k);
    return s || '0';
  }

  function terminos(M, expr) {
    const s = (expr || '').replace(/\s+/g, ' ').trim();
    if (s === '0' || s === '') return new Map();
    const out = new Map();
    const ids = identificadores(s);
    let pos = 0;
    for (const t of ids) {
      const entre = s.slice(pos, t.ini).trim();
      if (!(entre === '' || entre === '+' || entre === '-') || (pos > 0 && entre === '')) return null;
      out.set(norm(t.texto), entre === '-' ? -1 : 1);
      pos = t.fin;
    }
    if (s.slice(pos).trim() !== '') return null;
    return out;
  }

  function tasaCoincide(M, stockKey) {
    const a = terminos(M, M.vars[stockKey].ecuacion);
    const b = terminos(M, tasaAuto(M, stockKey));
    if (!a || !b || a.size !== b.size) return false;
    for (const [k, s] of a) if (b.get(k) !== s) return false;
    return true;
  }

  /** Recalcula la tasa de los niveles que no tienen tasa manual. */
  function actualizarTasas(M) {
    for (const k of M.orden) {
      const v = M.vars[k];
      if (v.tipo === 'nivel' && !v.tasaManual) v.ecuacion = tasaAuto(M, k);
    }
  }

  // ------------------------------------------------------- escritura .mdl
  const limpiarComentario = (s) => String(s || '').replace(/[~|]/g, '-').replace(/\s+/g, ' ').trim();
  const fmtNum = (x) => (x === null || x === undefined || isNaN(x) ? '?' : String(+x));

  function bloqueVariable(v) {
    let u = v.unidades || '';
    if (v.rango && (v.rango.min !== null || v.rango.max !== null)) {
      u += (u ? ' ' : '') + `[${fmtNum(v.rango.min)},${fmtNum(v.rango.max)}${v.rango.paso ? ',' + fmtNum(v.rango.paso) : ''}]`;
    }
    const com = limpiarComentario(v.comentario);
    const nom = escribirNombre(v.nombre);
    if (v.tipo === 'nivel') {
      return `${nom}= INTEG (\n\t${v.ecuacion || '0'},\n\t\t${v.inicial || '0'})\n\t~\t${u}\n\t~\t${com}\n\t|\n`;
    }
    if (v.tipo === 'tabla') {
      return `${nom}(\n\t${v.ecuacion})\n\t~\t${u}\n\t~\t${com}\n\t|\n`;
    }
    return `${nom}=\n\t${v.ecuacion}\n\t~\t${u}\n\t~\t${com}\n\t|\n`;
  }

  function cabeceraGrupo(nombre) {
    return `********************************************************\n\t.${nombre}\n********************************************************~\n\t\t\n\t|\n`;
  }

  function ecuacionesMdl(M) {
    const grupos = [];
    const porGrupo = new Map();
    for (const k of M.orden) {
      const g = M.vars[k].grupo || '';
      if (!porGrupo.has(g)) { porGrupo.set(g, []); grupos.push(g); }
      porGrupo.get(g).push(k);
    }
    let s = '{UTF-8}\n';
    for (const g of grupos) {
      if (g) s += cabeceraGrupo(g) + '\n';
      for (const k of porGrupo.get(g)) s += bloqueVariable(M.vars[k]) + '\n';
    }
    const c = M.control, u = c.unidad || 'Month';
    s += '********************************************************\n\t.Control\n********************************************************~\n\t\tSimulation Control Parameters\n\t|\n\n';
    s += `FINAL TIME  = ${c.final}\n\t~\t${u}\n\t~\tThe final time for the simulation.\n\t|\n\n`;
    s += `INITIAL TIME  = ${c.inicial}\n\t~\t${u}\n\t~\tThe initial time for the simulation.\n\t|\n\n`;
    s += `SAVEPER  = ${c.guardar === null ? '\n        TIME STEP' : c.guardar}\n\t~\t${u} [0,?]\n\t~\tThe frequency with which output is stored.\n\t|\n\n`;
    s += `TIME STEP  = ${c.paso}\n\t~\t${u} [0,?]\n\t~\tThe time step for the simulation.\n\t|\n\n`;
    return s;
  }

  const medioAncho = (nombre) => Math.max(16, Math.ceil(2.9 * Math.min(18, nombre.length)));
  const sketchNombre = (n) => (/[,"]/.test(n) ? '"' + n.replace(/"/g, '\\"') + '"' : n);

  function vistaMdl(M, vista) {
    const L = [`\\\\\\---/// Sketch information - do not modify anything except names`,
      'V300  Do not put anything below this section - it will be ignored',
      `*${vista.nombre}`,
      '$192-192-192,0,Times New Roman|12||0-0-0|0-0-0|0-0-255|-1--1--1|-1--1--1|96,96,100,0'];
    const num = new Map();
    let n = 0;
    for (const it of vista.items) if (it.t !== 'flecha') num.set(it.id, ++n);
    const etiq = new Map();
    for (const it of vista.items) if (it.t === 'valvula') etiq.set(it.id, ++n);
    const porId = new Map(vista.items.map((it) => [it.id, it]));
    const R = (x) => Math.round(x);
    for (const it of vista.items) {
      const id = num.get(it.id);
      const v = it.key ? M.vars[it.key] : null;
      if (it.t === 'nivel') L.push(`10,${id},${sketchNombre(v.nombre)},${R(it.x)},${R(it.y)},${R(it.w || 40)},${R(it.h || 20)},3,3,0,0,0,0,0,0`);
      else if (it.t === 'var') L.push(`10,${id},${sketchNombre(v.nombre)},${R(it.x)},${R(it.y)},${R(it.w || medioAncho(v.nombre))},${R(it.h || 8)},8,3,0,0,0,0,0,0`);
      else if (it.t === 'sombra') L.push(`10,${id},${sketchNombre(v.nombre)},${R(it.x)},${R(it.y)},${R(it.w || medioAncho(v.nombre))},${R(it.h || 8)},8,2,0,3,-1,0,0,0,128-128-128,0-0-0,|12||128-128-128`);
      else if (it.t === 'nube') L.push(`12,${id},48,${R(it.x)},${R(it.y)},10,8,0,3,0,0,-1,0,0,0`);
      else if (it.t === 'nota') {
        if (it.bucle) L.push(`12,${id},0,${R(it.x)},${R(it.y)},15,15,${it.horario ? 4 : 5},4,0,0,-1,0,0,0`, it.bucle);
        else L.push(`12,${id},0,${R(it.x)},${R(it.y)},${R(Math.max(20, 2.6 * Math.min(40, it.texto.length)))},10,8,4,0,8,-1,0,0,0,0-0-0,0-0-0,|10||0-0-0`, it.texto.replace(/\r?\n/g, ' '));
      } else if (it.t === 'valvula') {
        const d = porId.get(it.desde), h = porId.get(it.hacia);
        const vertical = d && h ? Math.abs(h.y - d.y) > Math.abs(h.x - d.x) : false;
        L.push(vertical ? `11,${id},48,${R(it.x)},${R(it.y)},8,6,33,3,0,0,4,0,0,0` : `11,${id},48,${R(it.x)},${R(it.y)},6,8,34,3,0,0,1,0,0,0`);
        L.push(`10,${etiq.get(it.id)},${sketchNombre(v.nombre)},${R(it.x + it.lx)},${R(it.y + it.ly)},${medioAncho(v.nombre)},8,40,3,0,0,-1,0,0,0`);
        for (const [fin, dir] of [[h, 4], [d, 100]]) {
          if (!fin) continue;
          const p = ancla(fin, it);
          L.push(`1,${++n},${id},${num.get(fin.id)},${dir},0,0,22,0,0,0,-1--1--1,,1|(${R(p[0])},${R(p[1])})|`);
        }
      }
    }
    for (const it of vista.items) {
      if (it.t !== 'flecha') continue;
      const a = porId.get(it.de), b = porId.get(it.a);
      if (!a || !b) continue;
      const pol = it.pol === '+' ? 43 : it.pol === '-' ? 45 : 0;
      const curva = it.cx !== null && it.cx !== undefined;
      const px = curva ? it.cx : (a.x + b.x) / 2, py = curva ? it.cy : (a.y + b.y) / 2;
      L.push(`1,${++n},${num.get(a.id)},${num.get(b.id)},${curva ? 1 : 0},0,${pol},0,0,64,${it.inicial ? 1 : 0},-1--1--1,,1|(${R(px)},${R(py)})|`);
    }
    return L.join('\n');
  }

  /** Punto donde una tubería toca un nivel o una nube, mirando hacia la válvula. */
  function ancla(fin, valv) {
    if (fin.t === 'nube') return [fin.x, fin.y];
    const w = fin.w || 40, h = fin.h || 20;
    const dx = valv.x - fin.x, dy = valv.y - fin.y;
    if (Math.abs(dx) * h >= Math.abs(dy) * w) return [fin.x + Math.sign(dx || 1) * w, fin.y + (dx ? (dy * w) / Math.abs(dx) : 0)];
    return [fin.x + (dy ? (dx * h) / Math.abs(dy) : 0), fin.y + Math.sign(dy || 1) * h];
  }

  const AJUSTES_BASE = [':L<%^E!@', '1:Current.vdf', '9:Current', '22:$,Dollar,Dollars,$s', '22:Hour,Hours', '22:Month,Months',
    '22:Person,People,Persons', '22:Unit,Units', '22:Week,Weeks', '22:Year,Years', '22:Day,Days', '15:0,0,0,0,0,0', '19:100,0',
    '27:2,', '34:0,', '4:Time', '35:Date', '36:YYYY-MM-DD', '37:2000', '38:1', '39:1', '40:2', '41:0', '42:1', '24:0'];

  function aMdl(M) {
    actualizarTasas(M);
    const vistas = M.vistas.map((v) => vistaMdl(M, v)).join('\n');
    let ajustes = M.ajustes && M.ajustes.length ? M.ajustes.slice() : AJUSTES_BASE.slice();
    ajustes = ajustes.filter((l) => !/^(25|26):/.test(l));
    ajustes.push(`25:${M.control.final}`, `26:${M.control.final}`);
    return ecuacionesMdl(M) + vistas + '\n///---\\\\\\\n' + ajustes.join('\n') + '\n';
  }

  // ------------------------------------------------------------ edición
  function nuevoNombre(M, base) {
    let i = 1, n = base;
    while (M.vars[norm(n)]) n = `${base} ${++i}`;
    return n;
  }

  function agregarVariable(M, tipo, nombre, grupo) {
    const k = norm(nombre);
    M.vars[k] = { nombre, tipo, ecuacion: tipo === 'nivel' ? '0' : '', inicial: tipo === 'nivel' ? '0' : '', tasaManual: false, unidades: '', comentario: '', rango: null, grupo: grupo || '' };
    M.orden.push(k);
    return k;
  }

  function renombrar(M, viejaKey, nuevo) {
    const nombre = String(nuevo).replace(/\s+/g, ' ').trim();
    const err = errorNombre(M, nombre, viejaKey);
    if (err) throw new Error(err);
    const k = norm(nombre);
    const v = M.vars[viejaKey];
    for (const kk of M.orden) {
      const w = M.vars[kk];
      w.ecuacion = reemplazarNombre(w.ecuacion, viejaKey, nombre);
      w.inicial = reemplazarNombre(w.inicial, viejaKey, nombre);
    }
    v.nombre = nombre;
    if (k !== viejaKey) {
      delete M.vars[viejaKey];
      M.vars[k] = v;
      M.orden = M.orden.map((x) => (x === viejaKey ? k : x));
      for (const vista of M.vistas) for (const it of vista.items) if (it.key === viejaKey) it.key = k;
    }
    return k;
  }

  /** Borra un item. Si es la definición (no una sombra) borra la variable de todo el modelo. */
  function borrarItem(M, vista, itemId) {
    const it = vista.items.find((x) => x.id === itemId);
    if (!it) return;
    if (it.t === 'flecha' || it.t === 'nota' || it.t === 'sombra' || it.t === 'nube') {
      quitarItems(M, vista, new Set([it.id]));
      return;
    }
    if (it.key) borrarVariable(M, it.key);
  }

  function borrarVariable(M, key) {
    for (const vista of M.vistas) {
      const ids = new Set(vista.items.filter((x) => x.key === key).map((x) => x.id));
      // los flujos conectados a un nivel borrado pasan a terminar en una nube
      for (const it of vista.items) {
        if (it.t !== 'valvula' || ids.has(it.id)) continue;
        for (const lado of ['desde', 'hacia']) {
          if (ids.has(it[lado])) {
            const st = vista.items.find((x) => x.id === it[lado]);
            const nube = { id: nuevoId(M), t: 'nube', x: st.x, y: st.y };
            vista.items.push(nube);
            it[lado] = nube.id;
          }
        }
      }
      quitarItems(M, vista, ids);
    }
    delete M.vars[key];
    M.orden = M.orden.filter((x) => x !== key);
  }

  function quitarItems(M, vista, ids) {
    // al quitar una válvula se quitan sus nubes si nadie más las usa
    for (const it of vista.items) {
      if (it.t === 'valvula' && ids.has(it.id)) {
        for (const lado of ['desde', 'hacia']) {
          const n = vista.items.find((x) => x.id === it[lado]);
          if (n && n.t === 'nube') ids.add(n.id);
        }
      }
    }
    let cambio = true;
    while (cambio) {
      cambio = false;
      for (const it of vista.items) {
        if (it.t === 'flecha' && !ids.has(it.id) && (ids.has(it.de) || ids.has(it.a))) { ids.add(it.id); cambio = true; }
      }
    }
    vista.items = vista.items.filter((x) => !ids.has(x.id));
  }

  /** Dónde está definida (no sombra) cada variable: key -> {vista, item}. */
  function definiciones(M) {
    const d = new Map();
    M.vistas.forEach((vista, vi) => {
      for (const it of vista.items) {
        if ((it.t === 'nivel' || it.t === 'var' || it.t === 'valvula') && it.key && !d.has(it.key)) d.set(it.key, { vista: vi, item: it });
      }
    });
    return d;
  }

  /** Flechas que la ecuación necesita y no están dibujadas: [{de, a}] por clave. */
  function flechasFaltantes(M) {
    const falt = [];
    const defs = definiciones(M);
    for (const k of M.orden) {
      const v = M.vars[k];
      const d = defs.get(k);
      if (!d) continue;
      const vista = M.vistas[d.vista];
      const porId = new Map(vista.items.map((it) => [it.id, it]));
      const entrantes = new Set(vista.items.filter((it) => it.t === 'flecha' && it.a === d.item.id)
        .map((it) => porId.get(it.de)).filter(Boolean).map((it) => it.key));
      const deps = v.tipo === 'nivel' ? usa(M, v.inicial) : usa(M, v.ecuacion);
      const flujos = v.tipo === 'nivel' ? new Set([...flujosDe(M, k).entradas, ...flujosDe(M, k).salidas]) : new Set();
      for (const dep of deps) {
        if (dep === k || flujos.has(dep) || entrantes.has(dep)) continue;
        falt.push({ de: dep, a: k });
      }
    }
    return falt;
  }

  /** Dibuja las flechas faltantes; crea sombras cuando la causa está en otra vista. */
  function agregarFlechasFaltantes(M) {
    const defs = definiciones(M);
    let n = 0;
    for (const { de, a } of flechasFaltantes(M)) {
      const d = defs.get(a);
      const vista = M.vistas[d.vista];
      let fuente = vista.items.find((it) => it.key === de && (it.t !== 'valvula' || true) && it.t !== 'flecha');
      if (!fuente) {
        const otras = vista.items.filter((it) => it.t === 'sombra' && Math.abs(it.x - (d.item.x - 130)) < 60);
        fuente = { id: nuevoId(M), t: 'sombra', key: de, x: d.item.x - 130, y: d.item.y - 60 - 22 * otras.length, w: medioAncho(M.vars[de].nombre), h: 8 };
        vista.items.push(fuente);
      }
      vista.items.push({ id: nuevoId(M), t: 'flecha', de: fuente.id, a: d.item.id, pol: '', cx: null, cy: null, inicial: M.vars[a].tipo === 'nivel' });
      n++;
    }
    return n;
  }

  /** Errores y avisos: [{nivel:'error'|'aviso', key, texto}] */
  function problemas(M) {
    const out = [];
    const defs = definiciones(M);
    for (const k of M.orden) {
      const v = M.vars[k];
      const campos = v.tipo === 'nivel' ? [['tasa', v.ecuacion], ['valor inicial', v.inicial]] : [['ecuación', v.ecuacion]];
      for (const [qué, expr] of campos) {
        if (!String(expr || '').trim()) { out.push({ nivel: 'error', key: k, texto: `${v.nombre}: falta la ${qué}` }); continue; }
        if (v.tipo === 'tabla') continue;
        for (const t of identificadores(expr)) {
          const tk = norm(t.texto);
          if (M.vars[tk] || tk === 'time' || CONTROL.includes(tk)) continue;
          if (t.llamada && FUNCIONES.includes(tk)) continue;
          out.push({ nivel: 'error', key: k, texto: t.llamada ? `${v.nombre}: función desconocida «${t.texto}»` : `${v.nombre}: «${t.texto}» no existe` });
        }
      }
      if (!defs.has(k)) out.push({ nivel: 'aviso', key: k, texto: `${v.nombre} no está en ninguna vista` });
      if (v.tipo === 'nivel' && v.tasaManual && !tasaCoincide(M, k)) out.push({ nivel: 'aviso', key: k, texto: `${v.nombre}: la tasa escrita no coincide con los flujos dibujados` });
    }
    for (const f of flechasFaltantes(M)) {
      out.push({ nivel: 'aviso', key: f.a, texto: `Falta la flecha ${M.vars[f.de].nombre} → ${M.vars[f.a].nombre}`, falta: true });
    }
    for (const vista of M.vistas) {
      const porId = new Map(vista.items.map((it) => [it.id, it]));
      for (const it of vista.items) {
        if (it.t !== 'flecha') continue;
        const a = porId.get(it.de), b = porId.get(it.a);
        if (!a || !b || !a.key || !b.key) continue;
        const vb = M.vars[b.key];
        if (!vb) continue;
        const usados = vb.tipo === 'nivel' ? usa(M, vb.inicial) : usa(M, vb.ecuacion);
        if (!usados.includes(a.key)) out.push({ nivel: 'aviso', key: b.key, texto: `La flecha ${M.vars[a.key].nombre} → ${vb.nombre} no se usa en la ecuación`, flecha: it.id, vista: vista.nombre });
      }
    }
    return out;
  }

  function vacio() {
    return { control: { inicial: 0, final: 60, paso: 0.25, guardar: 1, unidad: 'Month' }, vars: {}, orden: [], vistas: [{ nombre: 'Vista 1', items: [] }], ajustes: [], sig: 1 };
  }

  return {
    norm, desdeMdl, aMdl, ecuacionesMdl, identificadores, usa, renombrar, errorNombre, nuevoNombre, agregarVariable,
    borrarItem, borrarVariable, quitarItems, flujosDe, tasaAuto, tasaCoincide, actualizarTasas, definiciones,
    flechasFaltantes, agregarFlechasFaltantes, problemas, vacio, nuevoId, ancla, clon, medioAncho, FUNCIONES, CONTROL,
  };
});
