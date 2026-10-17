// Recalcula las tablas de «Resultados» del README con el motor del simulador.
// Uso: node modelos/ecosistema_credenciales/resultados.js [mes]   (mes 60 por defecto)
const fs = require('fs');
const path = require('path');
const Motor = require(path.join(__dirname, '..', '..', 'simulador', 'motor.js'));

const MES = Number(process.argv[2] || 60);
const modelo = Motor.leer(fs.readFileSync(path.join(__dirname, 'ecosistema_credenciales.mdl'), 'utf8'));
const KPI = ['Instituciones cliente', 'Unidades activas', 'Credenciales emitidas', 'Empresas usuarias'];

const correr = (cambios = {}) => {
  const r = modelo.simular({ cambios });
  const i = r.tiempo.indexOf(MES);
  return (n) => r.serie(n)[i];
};
const base = correr();
const valor = (n) => modelo.simular().serie(n)[0];
const pct = (v, b) => `${v >= b ? '+' : '−'}${Math.round(Math.abs(v / b - 1) * 100)} %`;
const fmt = (v) => v >= 1e6 ? `${(v / 1e6).toFixed(2).replace('.', ',')} M`
  : Math.round(v).toLocaleString('es-CO');

console.log(`Base (mes ${MES}):`);
for (const n of [...KPI, 'Instituciones perdidas', 'Instituciones en piloto', 'Titulares activos',
  'penetracion interna', 'Valor percibido de la credencial']) {
  console.log(`  ${n}: ${n === 'penetracion interna' || n.startsWith('Valor') ? base(n).toFixed(2) : fmt(base(n))}`);
}
const lim = modelo.simular();
const limitada = lim.tiempo.filter((t, k) => t > 0 && t <= MES
  && lim.serie('emision de credenciales')[k] < lim.serie('demanda de credenciales')[k] - 1e-6).length;
console.log(`  la capacidad docente limita la emisión en ${limitada} de ${MES} meses\n`);

console.log('| Bucle | Instituciones | Unidades | Credenciales | Empresas |\n|---|---|---|---|---|');
const BUCLES = {
  'R1 Boca a boca institucional': 'activar boca a boca institucional',
  'R2 Land & expand': 'activar expansion interna',
  'R3 Hábito del estudiante': 'activar habito estudiantil',
  'R4 Compromiso docente': 'activar compromiso docente',
  'R5 Talento verificable': 'activar flywheel empresas',
  'R6 Credencial como moneda': 'activar flywheel del ecosistema',
  'R7 Boca a boca empresarial': 'activar boca a boca empresarial',
};
for (const [nombre, sw] of Object.entries(BUCLES)) {
  const r = correr({ [sw]: 0 });
  console.log(`| ${nombre} | ${KPI.map((k) => `${Math.round((1 - r(k) / base(k)) * 100)} %`).join(' | ')} |`);
}

const p = (n) => valor(n);
const PALANCAS = [
  ['Duplicar la prospección de instituciones', { 'fraccion de prospeccion': 2 * p('fraccion de prospeccion') }],
  ['Conversión de pilotos +20 puntos', { 'fraccion de conversion de pilotos': p('fraccion de conversion de pilotos') + 0.2 }],
  ['Pilotos que se deciden en la mitad del tiempo', { 'duracion del piloto': p('duracion del piloto') / 2 }],
  ['Duplicar la expansión institucional', { 'fraccion de expansion institucional': 2 * p('fraccion de expansion institucional') }],
  ['Duplicar las evidencias por docente', { 'evidencias por docente': 2 * p('evidencias por docente') }],
  ['Triplicar la prospección de empresas', { 'fraccion de prospeccion de empresas': 3 * p('fraccion de prospeccion de empresas') }],
];
console.log('\n| Palanca | Instituciones | Unidades | Credenciales | Empresas |\n|---|---|---|---|---|');
for (const [nombre, cambios] of PALANCAS) {
  const r = correr(cambios);
  const detalle = Object.entries(cambios).map(([k, v]) => `${k} ${+p(k).toFixed(4)} → ${+v.toFixed(4)}`).join(', ');
  console.log(`| ${nombre} (${detalle}) | ${KPI.map((k) => pct(r(k), base(k))).join(' | ')} |`);
}

// Táctica T1 (paid media caballo de Troya): está apagada en la base; aquí se enciende
const t1 = (cambios = {}) => modelo.simular({ cambios: { 'activar paid media': 1, ...cambios } });
const en = (r, mes, n) => r.serie(n)[r.tiempo.indexOf(mes)];
const r0 = modelo.simular();
const usd = (v) => `USD ${Math.round(v).toLocaleString('es-CO')}`;
const ESCENARIOS_T1 = [
  ['Supuestos de la táctica', {}],
  ['4 cupos de virtualización por mes', { 'cupos de virtualizacion gratis por mes': 4 }],
  ['Pauta de USD 3.000 al mes', { 'presupuesto base de paid media': 3000 }],
  ['Sin virtualización gratis (solo leads)', { 'cupos de virtualizacion gratis por mes': 0 }],
  ['Compra el 25 % al terminar la virtualización', { 'fraccion que compra al terminar la virtualizacion': 0.25 }],
  ['Curso corto: virtualizar cuesta USD 500', { 'costo de una virtualizacion gratis': 500 }],
  ['Curso corto + primera compra de USD 3.000', { 'costo de una virtualizacion gratis': 500, 'ingreso anual por cliente nuevo': 3000 }],
  ['Reinvertir 50 % del ingreso en pauta (R8)', { 'fraccion de ingresos reinvertida': 0.5 }],
];
const c12 = en(r0, 12, 'Instituciones cliente'), c36 = en(r0, 36, 'Instituciones cliente');
console.log(`\n| Escenario con T1 encendida | Clientes mes 12 (base ${Math.round(c12)}) | Clientes mes 36 (base ${Math.round(c36)}) `
  + '| Clientes ganados por T1 (mes 36) | Gasto acumulado (mes 36) | Costo por cliente (mes 36) | Ingreso del 1.er año por dólar (mes 36) |'
  + '\n|---|---|---|---|---|---|---|');
for (const [nombre, cambios] of ESCENARIOS_T1) {
  const r = t1(cambios);
  const a = en(r, 12, 'Instituciones cliente'), b = en(r, 36, 'Instituciones cliente');
  console.log(`| ${nombre} | ${Math.round(a)} (${pct(a, c12)}) | ${Math.round(b)} (${pct(b, c36)}) | ${Math.round(en(r, 36, 'Clientes ganados con paid media'))} `
    + `| ${usd(en(r, 36, 'Gasto acumulado de la tactica'))} | ${usd(en(r, 36, 'costo por cliente de paid media'))} `
    + `| ${en(r, 36, 'retorno anual por dolar invertido').toFixed(2).replace('.', ',')} |`);
}
const rt = t1();
console.log(`\nPúblico de T1 (instituciones con emisor competidor): ${Math.round(en(rt, 0, 'instituciones con emisor competidor'))} al inicio, `
  + `${Math.round(en(rt, 12, 'instituciones con emisor competidor'))} al mes 12 y ${Math.round(en(rt, 36, 'instituciones con emisor competidor'))} al mes 36.`);
const pauta = en(rt, 36, 'presupuesto de paid media') * 36;
console.log(`Parte del gasto de T1 que es virtualizar (mes 36): ${Math.round((1 - pauta / en(rt, 36, 'Gasto acumulado de la tactica')) * 100)} %.`);
