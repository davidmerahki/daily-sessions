// Uso: node correr_motor.js modelo.mdl '{"constante": valor}' > salida.json
const fs = require('fs');
const path = require('path');
const Motor = require(path.join(__dirname, '..', 'motor.js'));
const [, , ruta, cambiosJson] = process.argv;
try {
  const modelo = Motor.leer(fs.readFileSync(ruta, 'utf8'));
  const r = modelo.simular({ cambios: JSON.parse(cambiosJson || '{}') });
  const out = { tiempo: r.tiempo, series: {} };
  for (const n of r.nombres) out.series[n] = r.serie(n);
  process.stdout.write(JSON.stringify(out));
} catch (e) {
  process.stdout.write(JSON.stringify({ error: e.message }));
}
