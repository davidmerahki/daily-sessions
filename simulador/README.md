# Simulador propio ("nuestro Vensim")

Herramientas para construir, simular y explorar modelos de dinámica de sistemas sin licencia de Vensim. Los modelos se guardan en el formato `.mdl` de Vensim, así que siguen siendo portables: se abren en Vensim, PySD y Simlin.

| Pieza | Qué hace |
|---|---|
| `motor.js` | Intérprete de `.mdl` en JavaScript, para navegador y Node. Lee las ecuaciones y simula con Euler, como Vensim por defecto |
| `modelo.js` | Modelo editable: convierte un `.mdl` (ecuaciones + vistas del diagrama) en un objeto que el lienzo edita y lo vuelve a escribir como `.mdl`. También renombra, borra, detecta flechas faltantes y revisa el modelo |
| `app.js` | La interfaz: **lienzo** tipo Vensim y **tablero** de escenarios |
| `plantilla_tablero.html` | HTML y estilos de la página |
| `construir_tablero.py` | Incrusta motor, modelo, app, `.mdl`, configuración y diagrama en un solo `tablero.html` |
| `pruebas/verificar_contra_pysd.py` | Compara el motor con PySD variable por variable, en la base y con cada bucle apagado |
| `pruebas/ida_y_vuelta.js` | Lee cada `.mdl`, lo reescribe y verifica que la simulación, el diagrama, las curvas y las polaridades no cambien |
| `../.claude/skills/vensim/scripts/mdlgen.py` | Genera `.mdl` con diagrama desde Python (varias vistas, sombras, polaridades) |

## El lienzo

Funciona como el sketch y el editor de ecuaciones de Vensim.

| Herramienta | Tecla | Uso |
|---|---|---|
| Seleccionar | `V` | Clic para seleccionar, arrastrar para mover, `Shift`+clic para seleccionar varios. Arrastrar el fondo mueve el lienzo |
| Nivel (stock) | `S` | Clic en el lienzo para crear un nivel |
| Flujo | `F` | Arrastrar desde un nivel (o un espacio vacío, que crea una nube) hasta otro nivel (o un espacio vacío) |
| Variable | `A` | Clic para crear una variable auxiliar o una constante |
| Flecha | `C` | Arrastrar desde la causa hasta el efecto |
| Comentario | `T` | Texto libre o marcador de bucle (R/B) |

Atajos: `Supr` elimina, `Ctrl+Z` y `Ctrl+Shift+Z` deshacen y rehacen, `Ctrl+S` guarda, `Ctrl`+rueda acerca o aleja y doble clic abre la ecuación.

- **Inspector.** Al seleccionar un elemento se pueden editar nombre, ecuación, unidades, rango del slider y comentario. Al renombrar, el nombre se actualiza en todas las ecuaciones.
  - Las causas conectadas con flechas aparecen como botones para insertarlas en la ecuación, y hay un menú de funciones.
  - En los niveles, la tasa sale de los flujos dibujados (entradas − salidas) y se puede escribir a mano.
  - Cada variable muestra su gráfico de simulación.
- **Revisión del modelo.** Señala ecuaciones vacías, variables o funciones que no existen, flechas que faltan y flechas que sobran. El botón *Dibujar flechas faltantes* las agrega y crea sombras si la causa está en otra vista.
- **Simulación en vivo.** Cada cambio vuelve a simular; con *Mini gráficos* cada variable muestra su trayectoria, como el SyntheSim de Vensim.
- **Vistas.** Una pestaña por vista: doble clic para renombrar y `+` para agregar.
- **Guardar.** Dentro de Claude, *Guardar* publica `modelo.mdl` y `tablero_config.json` como nueva versión del artifact (capacidad `artifact`). Mientras tanto, los cambios quedan como borrador en el navegador. *Copiar .mdl* y *Descargar* (se guarda como `.mdl.txt`) llevan el modelo a Vensim. *Importar* abre un `.mdl` de Vensim.
- **Tablero.** Usa el modelo del lienzo: sliders para las constantes (las que dicen `PALANCA` en el comentario van arriba), interruptores de bucles, aporte de cada bucle, gráficos (se pueden agregar y quitar) y *Fijar en el modelo* para volver permanentes los valores de los sliders.

## Qué soporta el motor

Constantes, auxiliares, `INTEG`, lookups (`tabla(x)` y `WITH LOOKUP`), operadores `+ - * / ^`, comparaciones, `:AND:`, `:OR:` y `:NOT:`. Funciones: `ABS EXP LN LOG SQRT SIN COS TAN MIN MAX INTEGER MODULO QUANTUM XIDZ ZIDZ IF THEN ELSE STEP RAMP PULSE PULSE TRAIN INITIAL ACTIVE INITIAL SMOOTH SMOOTHI SMOOTH3 SMOOTH3I DELAY1 DELAY1I DELAY3 DELAY3I`.

**No soporta** subíndices, macros, datos externos (`GET XLS`, variables `:=`), `DELAY FIXED`, `DELAY N`, `SMOOTH N`, funciones aleatorias ni otros métodos de integración. Si un modelo los usa, `Motor.leer()` y `Modelo.desdeMdl()` lanzan un error que dice qué falta.

## Verificación

- El motor coincide con PySD (diferencia relativa ≤ 1e-15) en el modelo del ecosistema, en 8 escenarios, y en 6 modelos de ejemplo del skill.
- La ida y vuelta `.mdl` → lienzo → `.mdl` no cambia la simulación, los elementos del diagrama, las curvas ni las polaridades. Se probó con el modelo del ecosistema, los ejemplos del skill y dos modelos creados por Vensim (`teacup` y `SIR` de SDXorg/test-models). Simlin y PySD leen los archivos exportados.

```bash
node simulador/pruebas/ida_y_vuelta.js modelo.mdl
python simulador/pruebas/verificar_contra_pysd.py modelo.mdl     # requiere pip install pysd
python simulador/construir_tablero.py modelos/<carpeta>
```

## API

```js
const modelo = Motor.leer(textoDelMdl);            // simulación
modelo.constantes();                               // [{nombre, valor, unidades, comentario, rango, grupo}]
const r = modelo.simular({ cambios: { 'fraccion de prospeccion': 0.006 }, final: 84 });
r.tiempo; r.serie('Instituciones cliente');

const M = Modelo.desdeMdl(textoDelMdl);            // edición
Modelo.renombrar(M, 'tasa de natalidad', 'natalidad');
Modelo.problemas(M);                               // [{nivel: 'error'|'aviso', key, texto}]
const texto = Modelo.aMdl(M);                      // .mdl completo con diagrama
```
