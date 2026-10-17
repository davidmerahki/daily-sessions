// Lee cada .mdl con modelo.js, lo vuelve a escribir y compara:
// simulación (motor.js) idéntica y diagrama con los mismos elementos.
// Uso: node ida_y_vuelta.js modelo.mdl [...] [--salida carpeta]
const fs = require('fs');
const path = require('path');
const Motor = require(path.join(__dirname, '..', 'motor.js'));
const Modelo = require(path.join(__dirname, '..', 'modelo.js'));
const args = process.argv.slice(2);
const iSal = args.indexOf('--salida');
const salida = iSal >= 0 ? args.splice(iSal, 2)[1] : null;
let fallos = 0;
for (const ruta of args) {
  const texto = fs.readFileSync(ruta, 'utf8');
  let M;
  try { M = Modelo.desdeMdl(texto); } catch (e) { console.log(`${path.basename(ruta)}: no se puede abrir en el lienzo -> ${e.message}`); continue; }
  const texto2 = Modelo.aMdl(Modelo.clon(M));
  if (salida) fs.writeFileSync(path.join(salida, path.basename(ruta)), texto2);
  const M2 = Modelo.desdeMdl(texto2);
  const r1 = Motor.leer(texto).simular(), r2 = Motor.leer(texto2).simular();
  let peor = 0;
  for (const n of r1.nombres) {
    const a = r1.serie(n), b = r2.serie(n);
    for (let i = 0; i < a.length; i++) peor = Math.max(peor, Math.abs(a[i] - b[i]) / (Math.abs(a[i]) + 1e-9));
  }
  const cuenta = (MM) => MM.vistas.map((v) => ['nivel', 'var', 'sombra', 'valvula', 'nube', 'flecha', 'nota'].map((t) => v.items.filter((x) => x.t === t).length).join('/')).join(' | ');
  const curvas = (MM) => MM.vistas.map((v) => v.items.filter((x) => x.t === 'flecha').map((x) => `${x.cx},${x.cy},${x.pol}`).join(';')).join('|');
  const c1 = cuenta(M), c2 = cuenta(M2);
  const probs = Modelo.problemas(M);
  const err = probs.filter((p) => p.nivel === 'error').length, av = probs.filter((p) => p.nivel === 'aviso').length;
  const curvasIguales = curvas(M) === curvas(M2);
  const nCurvas = M.vistas.reduce((n, v) => n + v.items.filter((x) => x.t === 'flecha' && x.cx !== null).length, 0);
  const ok = peor < 1e-12 && c1 === c2 && curvasIguales;
  if (!ok) fallos++;
  console.log(`${ok ? 'OK ' : 'MAL'} ${path.basename(ruta)}: ${M.orden.length} variables, ${M.vistas.length} vistas; dif. simulación ${peor.toExponential(1)}; diagrama ${c1 === c2 ? 'igual' : 'DISTINTO'} (${c1}); curvas y polaridades ${curvasIguales ? 'iguales' : 'DISTINTAS'} (${nCurvas} curvas); problemas: ${err} errores, ${av} avisos`);
  if (c1 !== c2) console.log('   antes  ', c1, '\n   despues', c2);
}
process.exit(fallos ? 1 : 0);
