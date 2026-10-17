# Simulador propio ("nuestro Vensim")

Herramientas para construir, simular y explorar modelos de dinámica de sistemas sin licencia de Vensim, guardándolos en el formato `.mdl` de Vensim para que sigan siendo portables.

| Pieza | Qué hace |
|---|---|
| `motor.js` | Intérprete de `.mdl` en JavaScript, para navegador y Node. Lee las ecuaciones y simula con Euler, como Vensim por defecto |
| `plantilla_tablero.html` | Tablero genérico: KPIs, gráficos escenario vs. base, palancas, interruptores de bucles, aporte de cada bucle, mapa y tabla |
| `construir_tablero.py` | Incrusta el motor, el `.mdl`, la configuración y el diagrama en un solo `tablero.html` |
| `pruebas/verificar_contra_pysd.py` | Compara el motor con PySD variable por variable, en la base y con cada bucle apagado |
| `../.claude/skills/vensim/scripts/mdlgen.py` | Genera `.mdl` con diagrama (varias vistas, sombras, polaridades) desde Python |

## Flujo de trabajo

1. **Modelar.** Escribir el generador del modelo (ver `modelos/ecosistema_credenciales/generar_modelo.py`). Cada constante lleva rango `[min,max,paso]` en sus unidades, y ese rango define el slider.
2. **Verificar.** Correr `python pruebas/verificar_contra_pysd.py modelo.mdl`, que pide `pip install pysd` y `node`.
3. **Explorar.** Escribir `tablero_config.json` en la carpeta del modelo y ejecutar `python construir_tablero.py <carpeta>`.

En el tablero:
- las constantes cuyo comentario dice `PALANCA` aparecen como **palancas**; el resto queda en **Supuestos**, agrupado por la sección (`.grupo`) del `.mdl`;
- las constantes listadas en `bucles` de la configuración se muestran como **interruptores**, y el tablero mide cuánto cae cada métrica al apagarlas.

## Qué soporta el motor

Constantes, auxiliares, `INTEG`, lookups (`tabla(x)` y `WITH LOOKUP`), operadores `+ - * / ^`, comparaciones, `:AND:`, `:OR:` y `:NOT:`. Funciones: `ABS EXP LN LOG SQRT SIN COS TAN MIN MAX INTEGER MODULO QUANTUM XIDZ ZIDZ IF THEN ELSE STEP RAMP PULSE PULSE TRAIN INITIAL ACTIVE INITIAL SMOOTH SMOOTHI SMOOTH3 SMOOTH3I DELAY1 DELAY1I DELAY3 DELAY3I`.

**No soporta** subíndices, macros, datos externos (`GET XLS`, variables `:=`), `DELAY FIXED`, `DELAY N`, `SMOOTH N`, funciones aleatorias ni otros métodos de integración. Si un modelo los usa, `Motor.leer()` lanza un error que dice qué falta. Para esos modelos se usa PySD, o se amplía el motor.

**Verificación:** coincide con PySD (diferencia relativa ≤ 1e-15) en el modelo del ecosistema, en 8 escenarios, y en 6 modelos de ejemplo del skill de Vensim (`SMOOTH`, `SMOOTH3`, `DELAY3`, `STEP`, lookups, `XIDZ`, `ZIDZ`, `LN`).

```js
const Motor = require('./motor.js');               // o <script src="motor.js"> → window.Motor
const modelo = Motor.leer(textoDelMdl);
modelo.constantes();                               // [{nombre, valor, unidades, comentario, rango, grupo}]
const r = modelo.simular({ cambios: { 'fraccion de prospeccion': 0.006 }, final: 84 });
r.tiempo;                                          // instantes guardados (SAVEPER)
r.serie('Instituciones cliente');                  // valores
```
