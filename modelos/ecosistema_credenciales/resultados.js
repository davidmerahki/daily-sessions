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
