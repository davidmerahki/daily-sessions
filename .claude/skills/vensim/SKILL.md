---
name: vensim
description: Experto en Vensim (Ventana Systems, vensim.com) y dinámica de sistemas. Úsalo siempre que el usuario mencione Vensim, archivos .mdl/.vpmx/.vdfx/.voc/.vpd/.vsc/.cin, ecuaciones INTEG/SMOOTH/DELAY/lookups, diagramas de stocks y flujos o causales, PySD o SDEverywhere, o pida construir, depurar, calibrar, explicar o traducir un modelo de dinámica de sistemas — también si pregunta en español ("niveles y flujos", "bucles de realimentación", "modelo de simulación dinámica").
---

# Vensim — skill experto

Base de conocimiento para responder como experto en **Vensim** (software de modelado y simulación de dinámica de sistemas de Ventana Systems) y en la metodología de **dinámica de sistemas** que lo sustenta. Todo el material está en `references/` (español; términos del software en inglés) y hay modelos `.mdl` listos para abrir en `examples/`.

## Cómo usar este skill

1. Identifica el tipo de pregunta y abre **solo** el/los archivo(s) relevante(s) de la tabla de abajo (son largos; no los cargues todos).
2. Responde con la terminología exacta de Vensim (nombres de funciones, menús y herramientas en inglés) y explica en el idioma del usuario.
3. Cuando escribas ecuaciones, usa sintaxis Vensim real (`nombre = expresión ~ unidades ~ comentario |`) y **siempre incluye unidades**.
4. Si generas un modelo `.mdl`, parte de un ejemplo de `examples/` (ya tienen sección de sketch válida) o genéralo con `scripts/mdlgen.py` (stocks, flujos, conectores con polaridad y marcadores de bucle; ejemplo de uso en su docstring) y, si hay Python disponible, valídalo con PySD (ver abajo).
5. Lo marcado "(verificar)" en las referencias no se pudo confirmar contra la documentación oficial: dilo si es relevante para la respuesta y remite a https://vensim.com/documentation/.

## Mapa de referencias

| Pregunta sobre… | Archivo |
|---|---|
| Ediciones (PLE, PLE Plus, Pro, DSS, Model Reader), precios, licencias, versiones y novedades | `references/01-productos-licencias-versiones.md` |
| Teoría: stocks/flujos, bucles, retrasos, arquetipos, proceso de modelado, formulaciones canónicas | `references/02-fundamentos-dinamica-de-sistemas.md` |
| Interfaz: menús, herramientas de dibujo y análisis, atajos, Control Panel, SyntheSim desde la UI | `references/03-interfaz-sketch-y-herramientas.md` |
| Sintaxis de ecuaciones, tipos de variable, operadores y precedencia, macros, orden de evaluación | `references/04-lenguaje-de-ecuaciones.md` |
| Qué hace una función concreta, firma exacta, unidades, trampas | `references/05-referencia-de-funciones.md` |
| Subíndices, rangos, mapeos, `:EXCEPT:`, funciones vectoriales | `references/06-subindices-y-arrays.md` |
| Lookups, variables de datos, GET XLS/GET DIRECT, datasets, importar/exportar | `references/07-datos-lookups-import-export.md` |
| TIME STEP, métodos de integración, ciclo de simulación, escenarios `.cin`, SyntheSim, Gaming | `references/08-simulacion-e-integracion.md` |
| Unidades, Units Check, Reality Check | `references/09-unidades-y-reality-check.md` |
| Sensibilidad/Monte Carlo (`.vsc`), optimización y calibración (`.voc`, `.vpd`), MCMC, Kalman, análisis de bucles | `references/10-analisis-avanzado-sensibilidad-optimizacion.md` |
| Command scripts, DLL de Vensim, Python (PySD / DLL), Venapps, Model Reader, funciones externas | `references/11-automatizacion-scripts-dll-python.md` |
| Formato interno del `.mdl` (ecuaciones + sketch + settings) y demás extensiones de archivo | `references/12-formatos-de-archivo.md` |
| Convenciones, catálogo de errores/mensajes y depuración, checklist de calidad | `references/13-buenas-practicas-errores-y-depuracion.md` |
| Modelos completos comentados (población, SIR, Bass, inventario/fuerza laboral, límites, cadena con subíndices, retrabajo) | `references/14-ejemplos-de-modelos.md` + `examples/*.mdl` |
| PySD, SDEverywhere, Simlin, XMILE/Stella, Ventity, comunidad y bibliografía | `references/15-ecosistema-y-herramientas-relacionadas.md` |
| Traducción de términos EN ↔ ES | `references/16-glosario.md` |

## Chuleta esencial (lo que hay que saber sin abrir nada)

### Forma de una ecuación en el `.mdl`
```vensim
Inventario = INTEG(Produccion - Envios, Inventario inicial)
	~	Widget
	~	Stock de producto terminado.
	|
```
- `~` separa expresión / unidades / comentario; `|` termina la entrada. Rango opcional para sliders al final de las unidades: `~ Week [1,20,1]` (`?` = sin límite). **Nunca** `~` ni `|` dentro del comentario.
- Nombres insensibles a mayúsculas; espacios y `_` son equivalentes; nombres con caracteres especiales van entre comillas `"..."`. Funciones con espacios: `IF THEN ELSE(…)`; `IF a THEN b ELSE c` crea una *variable* con ese nombre.
- `=` normal, `:=` ecuación de datos, `==` constante inmutable, `nombre( [(x0,y0)-(x1,y1)], (x,y), ... )` lookup (sin `=`), `Rango: a, b, c` subíndices, `DimB <-> DimA` alias; `:SUPPLEMENTARY` va como cuarto campo opcional (`… ~ unidades ~ comentario ~ :SUPPLEMENTARY |`).
- Variable con subíndices definida por partes: todas las ecuaciones menos la última terminan en `~~|`.
- Variables de control obligatorias: `INITIAL TIME`, `FINAL TIME`, `TIME STEP`, `SAVEPER` (grupo `.Control`); la unidad de tiempo del modelo es la de `INITIAL TIME`.
- Lógica: `:AND:`, `:OR:`, `:NOT:`; comparaciones `= <> < > <= >=`. Precedencia: `^` antes que el signo (`-2^2 = -4`, salida real de Vensim); usa paréntesis al mezclar `:AND:`/`:OR:`.
- `:NA:` = dato ausente: número finito muy negativo (≈ −1.298e33), **no** NaN; se prueba con `x = :NA:`.

### Funciones que más se usan (firmas verificadas en `05`)
| Función | Uso |
|---|---|
| `INTEG(rate, init)` | Stock (nivel); debe ser toda la ecuación. |
| `SMOOTH(input, tiempo)`, `SMOOTHI(input, tiempo, init)`, `SMOOTH3`/`SMOOTH3I`, `SMOOTH N(input, tiempo, init, orden)` | Retraso de información (percepción, pronóstico adaptativo). |
| `DELAY1/DELAY3(input, tiempo)`, `DELAY1I/DELAY3I(…, init)`, `DELAY N(input, tiempo, init, orden)` | Retraso material exponencial (conserva lo que entra). |
| `DELAY FIXED(input, tiempo, init)` | Tubería pura; `tiempo` se lee solo al inicio (variable → `DELAY MATERIAL`/`DELAY INFORMATION`). |
| `STEP(altura, t)`, `RAMP(pendiente, t0, t1)`, `PULSE(t0, duración)`, `PULSE TRAIN(t0, duración, intervalo, fin)` | Entradas de prueba (comparan con `Time + TIME STEP/2`). `PULSE` vale 1, no una cantidad. |
| `IF THEN ELSE(cond, a, b)` | Condicional; **no protege**: las funciones con estado de la rama no elegida siguen evolucionando y no evita divisiones por cero → usa `XIDZ`/`ZIDZ`. |
| `MIN(a,b)`, `MAX(a,b)` (solo 2 args), `XIDZ(a,b,x)`, `ZIDZ(a,b)`, `INTEGER`, `MODULO`, `LOG(x, base)` | Límites, divisiones seguras (umbral \|b\| < 1e‑6), truncado hacia 0. No hay `ROUND` (`INTEGER(x + 0.5)`) ni, al parecer, `PI` (verificar). |
| `tabla(x)`, `WITH LOOKUP(x, ([…],(x1,y1),…))`, `LOOKUP EXTRAPOLATE(tabla, x)` | No linealidades. **Los lookups no extrapolan**: fuera de rango devuelven el valor extremo. |
| `INITIAL(x)`, `ACTIVE INITIAL(activa, inicial)`, `SAMPLE IF TRUE(cond, input, init)` | Valor fijado en t0 / romper ciclos de inicialización / muestrear y retener. |
| `TREND(input, tiempo, tendencia inicial)` → 1/Time; `FORECAST(input, tiempo, horizonte)` → unidades de input | Tendencia fraccional y extrapolación. |
| `SUM(x[r!])`, `PROD`, `VMIN`, `VMAX`, `ELMCOUNT(r)`, `VECTOR …`, `ALLOCATE …` | Arrays (requieren subíndices → Pro/DSS). |
| `RANDOM NORMAL(min,max,media,sd,semilla)`, `RANDOM UNIFORM(min,max,semilla)` | Ruido truncado; un valor nuevo por `TIME STEP`. En `.vsc` se escriben sin semilla. |
| `GET XLS DATA('archivo','hoja','fila/col tiempo','celda')`, `GET DIRECT DATA/CONSTANTS/LOOKUPS/SUBSCRIPT` | Datos externos (XLS: Windows + Excel; DIRECT: lee `.xlsx`/`.csv` directamente; en CSV la "hoja" es el delimitador `','`). |

### Formulaciones canónicas
```vensim
Ajuste = (Objetivo - Stock) / Tiempo de ajuste                      ~ Unidad/Month
Efecto de X en Y = Tabla efecto X( X / X normal )                   ~ Dmnl
Salida = MIN(Salida deseada, Stock / Tiempo minimo de salida)        ~ Unidad/Month   (stock no negativo)
Percepcion = SMOOTH(Senal, Tiempo de percepcion)                     ~ unidades de Senal
Inyeccion = Cantidad / TIME STEP * PULSE(t inyeccion, TIME STEP)     ~ Unidad/Month   (impulso de cantidad fija)
```

### Ediciones (canónico: `01`; marcas "(v)" allí = verificar)
| Necesidad | Edición mínima |
|---|---|
| Sketch, simulación, SyntheSim, Units Check, Reality Check, lookups | **PLE** (gratis para educación) |
| Datos externos/variables Data, varias vistas, sensibilidad Monte Carlo, Gaming, sliders/gráficos en el sketch | **PLE Plus** |
| **Subíndices**, optimización/calibración, MCMC, Kalman, macros (v), editor de texto, publicar `.vpm` (v) | **Professional** |
| DLL, command scripts `.cmd`, Venapps, funciones externas, simulación compilada, multi-core, ODBC, servidor MCP "Agentic Vensim" (10.5, jun 2026) | **DSS** |
| Ejecutar un modelo publicado (`.vpm/.vpmx`, `.vpa`) sin licencia | **Model Reader** (gratis) |

Última versión documentada: **10.5** (junio 2026); 10.3 = feb 2025 (editor de ecuaciones nuevo), 10.4 = 2025.

### Archivos clave
`.mdl` modelo en texto (ecuaciones + sketch + settings) · `.vmf` binario · `.vpm/.vpmx` publicado · `.vdf/.vdfx` dataset (`.vdfx` en 64 bits, verificar) · `.cin` cambios de constantes/lookups · `.lst` savelist · `.vsc` control de sensibilidad · `.voc` control de optimización · `.vpd` payoff · `.out` parámetros óptimos (reutilizable como `.cin`) · `.vgd` custom graphs · `.cmd` script · `.vcd` Venapp. En la sección de settings del `.mdl` (tras `:L<%^E!@`): `15:` 4.º valor = método de integración (0 = Euler), `22:` equivalencias de unidades, `30:` alias de archivos `?nombre`.

### Reglas de oro
- **Unidades en todas las variables**; ejecutar *Units Check* (`Model > Units Check`, Ctrl+U) hasta "Units are A.O.K.". El flujo de un `INTEG` va en unidades del stock **por unidad de tiempo** del modelo. Entradas de lookup adimensionales.
- **TIME STEP** ≤ 1/4 (idealmente 1/10) de la constante de tiempo más pequeña (en `DELAY3`/`SMOOTH3` cuenta T/3; en `DELAY N`, T/N), potencia de 2 (1, 0.5, 0.25, 0.125, 0.0625…). Comprobar reduciendo a la mitad: el resultado no debe cambiar. `SAVEPER` múltiplo de `TIME STEP`.
- **Euler** (por defecto) si hay funciones discretas (`PULSE`, `STEP`, `DELAY FIXED`, `SAMPLE IF TRUE`, `IF THEN ELSE` que conmuta, aleatorios); RK4 solo para sistemas continuos y suaves (osciladores). Una oscilación de periodo 2·dt es casi siempre un dt demasiado grande.
- Nunca forzar un stock no negativo con `MAX` sobre el stock: limita el **flujo de salida** (`MIN(deseado, Stock/tiempo minimo)`, con tiempo mínimo ≥ TIME STEP).
- Sin números mágicos: toda constante con nombre, unidad, comentario y rango. Lookups normalizados que pasen por (1,1) y cubran todo el rango visitado.
- "Simultaneous equations" = ciclo de auxiliares sin stock → introducir un stock/`SMOOTH`; si el ciclo solo existe en la inicialización ("Simultaneous initial value equations"), `ACTIVE INITIAL`.
- No compares `Time` con `=` (frágil con dt no binario); usa `>=`, `STEP` o `PULSE`.
- Comentarios en línea `{…}` dentro de ecuaciones son Vensim válido pero rompen PySD: deja los comentarios en el campo de comentario.
- Antes de proponer subíndices, macros, optimización o scripts, comprueba la edición del usuario (tabla de arriba).

## Validar modelos con PySD (si hay Python)
```bash
pip install pysd
python -c "import pysd; m = pysd.read_vensim('modelo.mdl'); print(m.run().tail())"
python -c "import pysd; m = pysd.read_vensim('modelo.mdl'); print(m.run(time_step=0.0625, saveper=1).tail())"  # prueba dt/2
```
- Atajo: `python scripts/validar_modelo.py modelo.mdl [--time-step 0.0625]` traduce, simula y resume los stocks (NaN/inf, mín/máx).
- `read_vensim` escribe un `.py` junto al `.mdl` (copia el modelo a una carpeta de trabajo). Si regeneras y retraduces un `.mdl` con el mismo nombre y tamaño en el mismo segundo, puede reutilizar bytecode viejo.
- Para cambiar el paso usa **`run(time_step=..., saveper=...)`**, no `params={"TIME STEP": ...}` (en PySD 3.14.3 da resultados inconsistentes). `run(params={...})` cambia constantes; los `params` persisten entre `run()` (usa `reload()`).
- PySD integra solo con Euler, traduce `:NA:` a NaN, trata `GAME(x)` como `x`, ignora Reality Check y no comprueba unidades (Simlin sí). No soporta, entre otras, `LOOKUP EXTRAPOLATE`, `LOOKUP FORWARD`, `DELAY CONVEYOR`, `RANDOM POISSON`, `SHIFT IF TRUE`, `TIME SHIFT`, colas, comentarios `{…}`, variables de datos sin palabra clave ni llamadas a macro con salidas `:`. Un fallo en PySD no implica que el modelo sea inválido en Vensim — ver `references/15-ecosistema-y-herramientas-relacionadas.md` y `references/11-automatizacion-scripts-dll-python.md`.

## Fuente oficial
Documentación oficial: https://vensim.com/documentation/ (índice de funciones: https://vensim.com/documentation/ref_functions.html). Foro de soporte: https://www.ventanasystems.co.uk/forum/.
