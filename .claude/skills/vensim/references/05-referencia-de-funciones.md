# 05 — Referencia de funciones y palabras clave de Vensim

Referencia exhaustiva de las funciones integradas de Vensim (Ventana Systems): firma exacta, semántica (incluido el comportamiento en la inicialización y en el tiempo), unidades, trampas y ejemplos. Para la sintaxis general del lenguaje ver `04-lenguaje-de-ecuaciones.md`; para subíndices `06-subindices-y-arrays.md`; para datos externos en detalle `07-datos-lookups-import-export.md`; para el ciclo de simulación `08-simulacion-e-integracion.md`.

> **Fiabilidad.** vensim.com no fue accesible directamente al redactar esto. Las firmas se contrastaron con extractos de la documentación oficial, con implementaciones que reproducen a Vensim (PySD, SDEverywhere, xmutil de Bob Eberlein, Simlin) y con salidas reales de Vensim incluidas en esos repositorios (`.dat`/`.tab`). Lo que no pudo confirmarse lleva **(verificar)**: dilo al usuario y remite a https://www.vensim.com/documentation/22300.html (Summary List of Functions) o a la página `fn_<nombre>.html` de la función.

## Tabla de contenidos

1. [Convenciones](#1-convenciones)
2. [Índice alfabético](#2-índice-alfabético)
3. [Operadores y palabras clave](#3-operadores-y-palabras-clave)
4. [Funciones matemáticas simples](#4-funciones-matemáticas-simples)
5. [Funciones de prueba (test inputs)](#5-funciones-de-prueba-test-inputs)
6. [Tiempo, control de la simulación y funciones especiales](#6-tiempo-control-de-la-simulación-y-funciones-especiales)
7. [Niveles, inicialización y muestreo](#7-niveles-inicialización-y-muestreo)
8. [Retrasos y suavizados (DELAY / SMOOTH)](#8-retrasos-y-suavizados-delay--smooth)
9. [Tendencia, pronóstico, finanzas y depreciación](#9-tendencia-pronóstico-finanzas-y-depreciación)
10. [Lookups (funciones de tabla)](#10-lookups-funciones-de-tabla)
11. [Funciones de datos y de lectura externa](#11-funciones-de-datos-y-de-lectura-externa)
12. [Funciones aleatorias](#12-funciones-aleatorias)
13. [Arrays y vectores](#13-arrays-y-vectores)
14. [Asignación y mercados (ALLOCATE…)](#14-asignación-y-mercados-allocate)
15. [Colas (QUEUE…)](#15-colas-queue)
16. [Reality Check (RC…)](#16-reality-check-rc)
17. [Lo que NO existe en Vensim y cómo sustituirlo](#17-lo-que-no-existe-en-vensim-y-cómo-sustituirlo)
18. [Disponibilidad por edición y novedades por versión](#18-disponibilidad-por-edición-y-novedades-por-versión)
19. [Equivalencias y confusiones frecuentes](#19-equivalencias-y-confusiones-frecuentes)
20. [Compatibilidad con PySD y SDEverywhere](#20-compatibilidad-con-pysd-y-sdeverywhere)
21. [Fuentes](#21-fuentes)

---

## 1. Convenciones

- **Nombres.** Vensim no distingue mayúsculas/minúsculas y trata el espacio y el guion bajo como equivalentes, también en los nombres de función (`DELAY FIXED` = `delay_fixed`; en modelos reales aparecen `RC_STEP_CHECK`, `FINAL_TIME`). Esta referencia escribe las funciones en MAYÚSCULAS con espacios, como la documentación.
- **Firma.** Se usan los nombres de argumento de la documentación cuando se conocen (`input`, `delay time`, `initial value`…). Todos los argumentos son obligatorios salvo que se indique lo contrario: Vensim **no** tiene argumentos opcionales en la mayoría de funciones (p. ej. `RAMP` exige los 3, `LOG` exige 2).
- **Unidades.** Notación de la doc: `FUNCIÓN(unidad, Time) → unidad`, donde `Time` = unidad de tiempo del modelo y `Dmnl` = adimensional. Units Check (ver `09-unidades-y-reality-check.md`) usa estas reglas.
- **"Debe ir justo tras el `=`".** Algunas funciones definen la variable entera (crean estado o tienen semántica especial) y no pueden combinarse con otros términos ni anidarse: hay que escribir `x = FUNCIÓN(...)` y operar en otra variable. Se indica en cada ficha.
- **"Se evalúa solo en la inicialización".** Argumentos que Vensim calcula una vez, en `INITIAL TIME`, y no vuelve a leer (valores iniciales, `delay time` de `DELAY FIXED`, orden de `DELAY N`…). Cambiarlos durante la simulación no tiene efecto.
- **Tiempo discreto.** Vensim calcula en cada `TIME STEP` (dt). Las funciones de prueba comparan con *time plus* = `Time + TIME STEP/2` para evitar errores de redondeo.
- **Funciones-macro.** `DELAY1`, `DELAY1I`, `DELAY3`, `DELAY3I`, `DELAYP`, `FORECAST`, `NPV`, `NPVE`, `SMOOTH`, `SMOOTH3`, `SMOOTH3I` y `TREND` están "definidas como macros" en Vensim (página *Macros* de la doc): crean niveles ocultos. Por eso tienen **estado** aunque se escriban dentro de una expresión.

---

## 2. Índice alfabético

Leyenda de categorías: **Mat** matemáticas · **Test** entradas de prueba · **Tiempo** tiempo/simulación · **Nivel** niveles e inicialización · **Retraso** delays/smooth · **Fin** pronóstico/finanzas · **Lookup** tablas · **Datos** datos/lectura externa · **Aleat** aleatorias · **Array** vectores/arrays · **Asig** asignación/mercados · **Cola** colas · **RC** Reality Check · **Clave** palabra clave. Orden alfabético, con las variantes de una misma familia agrupadas en una fila.

| Función / palabra clave | Cat. | Qué hace | § |
|---|---|---|---|
| `A FUNCTION OF(x, …)` | Clave | Marcador de ecuación incompleta; impide simular | 6 |
| `ABS(x)` | Mat | Valor absoluto | 4 |
| `ACTIVE INITIAL(active, initial)` | Nivel | Usa `initial` en la inicialización y `active` durante la simulación | 7 |
| `ALLOCATE AVAILABLE(request, pp, avail)` | Asig | Reparte un recurso según perfiles de prioridad | 14 |
| `ALLOCATE BY PRIORITY(request, priority, size, width, supply)` | Asig | Reparte por prioridad con solapamiento `width` | 14 |
| `ARCCOS(x)`, `ARCSIN(x)`, `ARCTAN(x)` | Mat | Trigonométricas inversas (radianes) | 4 |
| `COS(x)`, `SIN(x)`, `TAN(x)` | Mat | Trigonométricas (radianes) | 4 |
| `COSH(x)`, `SINH(x)`, `TANH(x)` | Mat | Hiperbólicas | 4 |
| `DELAY BATCH(input, bsize, btime, inibatch, initime, inibacklog)` | Retraso | Acumula en lotes de tamaño `bsize` y los entrega tras `btime` | 8 |
| `DELAY CONVEYOR(input, ctime, leak, initprofile, inittot, initctime)` | Retraso | Cinta transportadora con fuga | 8 |
| `DELAY FIXED(input, delay time, initial value)` | Retraso | Retraso puro (tubería) de tiempo fijo | 8 |
| `DELAY INFORMATION(input, delay time, initial value)` | Retraso | Como DELAY FIXED con tiempo variable; descarta/retiene valores | 8 |
| `DELAY MATERIAL(input, delay time, initial value, missval)` | Retraso | Como DELAY FIXED con tiempo variable; conserva material | 8 |
| `DELAY N(input, delay time, initial value, order)` | Retraso | Retraso material exponencial de orden N | 8 |
| `DELAY PROFILE(profile, input, delay time, initial value, growth)` | Retraso | Retraso con distribución arbitraria (lookup) | 8 |
| `DELAY1(input, delay time)` / `DELAY1I(…, initial value)` | Retraso | Retraso material de 1.er orden | 8 |
| `DELAY3(input, delay time)` / `DELAY3I(…, initial value)` | Retraso | Retraso material de 3.er orden | 8 |
| `DELAYP(input, delay time : pipeline)` | Retraso | DELAY3 que además devuelve el contenido en tránsito | 8 |
| `DEMAND AT PRICE(demand quantities, demand profiles, price)` | Asig | Cantidad demandada a un precio | 14 |
| `DEPRECIATE BY SCHEDULE(…)` | Fin | Depreciación según calendario (verificar firma) | 9 |
| `DEPRECIATE STRAIGHTLINE(stream, dtime, fisc, init)` | Fin | Depreciación lineal | 9 |
| `ELMCOUNT(range)` | Array | Nº de elementos de un rango de subíndices | 13 |
| `EXP(x)` | Mat | e^x | 4 |
| `FIND MARKET PRICE(dq, dp, sq, sp)` | Asig | Precio que iguala oferta y demanda | 14 |
| `FINAL TIME`, `INITIAL TIME`, `TIME STEP`, `SAVEPER`, `Time` | Tiempo | Variables de control | 6 |
| `FORECAST(input, average time, horizon)` | Fin | Extrapolación de tendencia | 9 |
| `GAME(x)` | Tiempo | Variable modificable por el usuario en modo Gaming | 6 |
| `GAMMA LN(x)` | Mat | ln Γ(x) | 4 |
| `GET 123 CONSTANTS/DATA/LOOKUPS(…)` | Datos | Lectura de hojas Lotus 1‑2‑3 (heredado) (verificar) | 11 |
| `GET DATA AT TIME(data, time)` | Datos | Valor de una variable de datos en un instante | 11 |
| `GET DATA BETWEEN TIMES(data, time, mode)` | Datos | Valor de datos en un instante con modo −1/0/1 | 11 |
| `GET DATA FIRST TIME(data)` / `GET DATA LAST TIME(data)` | Datos | Primer/último instante con dato (FIRST: verificar) | 11 |
| `GET DATA MAX/MIN/MEAN(data, start, end)` | Datos | Estadístico de los datos entre dos tiempos (MAX/MIN: verificar) | 11 |
| `GET DATA TOTAL POINTS(data)` | Datos | Nº de puntos de datos (verificar) | 11 |
| `GET DIRECT CONSTANTS/DATA/LOOKUPS/SUBSCRIPT(…)` | Datos | Lectura directa de .xlsx/.csv sin Excel | 11 |
| `GET TIME VALUE(relativeto, offset, measure)` | Tiempo | Fecha/hora o tiempo de simulación desplazado | 6 |
| `GET VDF CONSTANTS/DATA/LOOKUPS(…)` | Datos | Lectura desde un .vdf (verificar) | 11 |
| `GET XLS CONSTANTS/DATA/LOOKUPS/SUBSCRIPT(…)` | Datos | Lectura desde Excel | 11 |
| `IF THEN ELSE(cond, x, y)` | Mat | Condicional | 4 |
| `INITIAL(x)` | Nivel | Congela el valor de `x` en la inicialización | 7 |
| `INTEG(rate, initial value)` | Nivel | Integral (nivel/stock) | 7 |
| `INTEGER(x)` | Mat | Parte entera (trunca hacia 0) | 4 |
| `INTERNAL RATE OF RETURN(…)` | Fin | TIR (figura en el índice oficial; verificar firma) | 9 |
| `INVERT MATRIX(matrix, size)` | Array | Inversa de una matriz cuadrada | 13 |
| `LN(x)` | Mat | Logaritmo natural | 4 |
| `LOG(x, base)` | Mat | Logaritmo en base `base` | 4 |
| `LOOKUP AREA(lookup, x1, x2)` | Lookup | Área bajo la tabla entre x1 y x2 | 10 |
| `LOOKUP BACKWARD(lookup, x)` | Lookup | Valor escalonado hacia atrás | 10 |
| `LOOKUP EXTRAPOLATE(lookup, x)` | Lookup | Como lookup normal pero extrapola linealmente | 10 |
| `LOOKUP FORWARD(lookup, x)` | Lookup | Valor escalonado hacia delante | 10 |
| `LOOKUP INVERT(lookup, y)` | Lookup | x tal que lookup(x) = y | 10 |
| `LOOKUP SLOPE(lookup, x)` | Lookup | Pendiente de la tabla en x (verificar) | 10 |
| `MAX(a, b)`, `MIN(a, b)` | Mat | Máximo/mínimo de **dos** valores | 4 |
| `MODULO(a, b)` | Mat | Resto (signo del dividendo) | 4 |
| `NPV(stream, discount rate, init val, factor)` | Fin | Valor actual neto acumulado | 9 |
| `NPVE(…)` | Fin | Variante de NPV (macro; verificar) | 9 |
| `POWER(x, y)` | Mat | x^y | 4 |
| `PROD(x[r!])` | Array | Producto sobre un rango | 13 |
| `PULSE(start, width)` | Test | 1 durante `width` desde `start` | 5 |
| `PULSE TRAIN(start, width, tbetween, end)` | Test | Pulsos repetidos | 5 |
| `QUANTUM(a, q)` | Mat | Múltiplo entero de `q` (trunca hacia 0) | 4 |
| `QUEUE FIFO(…)`, `QUEUE AGE AVERAGE(…)`, `QUEUE ATTRIB…` | Cola | Colas discretas (verificar firmas) | 15 |
| `RAMP(slope, start time, end time)` | Test | Rampa que se mantiene tras `end time` | 5 |
| `RANDOM 0 1()` | Aleat | Uniforme [0,1] | 12 |
| `RANDOM BETA(…)` | Aleat | Beta truncada (verificar) | 12 |
| `RANDOM BINOMIAL(min, max, p, n, shift, stretch, seed)` | Aleat | Binomial truncada | 12 |
| `RANDOM EXPONENTIAL(min, max, shift, stretch, seed)` | Aleat | Exponencial truncada | 12 |
| `RANDOM GAMMA(…)` | Aleat | Gamma truncada (verificar) | 12 |
| `RANDOM LOOKUP(…)` | Aleat | Distribución definida por un lookup (verificar) | 12 |
| `RANDOM NEGATIVE BINOMIAL(…)` | Aleat | Binomial negativa (verificar) | 12 |
| `RANDOM NORMAL(min, max, mean, stdev, seed)` | Aleat | Normal truncada | 12 |
| `RANDOM PINK NOISE(mean, stdev, correlation time, seed)` | Aleat | Ruido rosa (autocorrelado) (orden: verificar) | 12 |
| `RANDOM POISSON(min, max, mean, shift, stretch, seed)` | Aleat | Poisson truncada | 12 |
| `RANDOM TRIANGULAR(…)` | Aleat | Triangular (verificar) | 12 |
| `RANDOM UNIFORM(min, max, seed)` | Aleat | Uniforme | 12 |
| `RANDOM WEIBULL(…)` | Aleat | Weibull (verificar) | 12 |
| `RC COMPARE/DECAY/GROW/RAMP/STEP` (+ variantes `CHECK`) | RC | Funciones de Reality Check | 16 |
| `REINITIAL(x)` | Nivel | Variante de INITIAL (verificar semántica) | 7 |
| `SAMPLE IF TRUE(condition, input, initial value)` | Nivel | Muestrea y retiene | 7 |
| `SHIFT IF TRUE(…)` | Nivel | Desplaza el contenido de un array cuando se cumple una condición (verificar firma) | 7 |
| `SMOOTH(input, delay time)` / `SMOOTHI(…, initial value)` | Retraso | Suavizado exponencial de 1.er orden | 8 |
| `SMOOTH3(input, delay time)` / `SMOOTH3I(…, initial value)` | Retraso | Suavizado de 3.er orden | 8 |
| `SMOOTH N(input, delay time, initial value, order)` | Retraso | Suavizado de orden N | 8 |
| `SQRT(x)` | Mat | Raíz cuadrada | 4 |
| `STEP(height, step time)` | Test | Escalón | 5 |
| `SUM(x[r!])` | Array | Suma sobre un rango | 13 |
| `SUPPLY AT PRICE(supply quantities, supply profiles, price)` | Asig | Cantidad ofertada a un precio | 14 |
| `TABBED ARRAY(…)` | Clave | Constantes de array pegadas con tabuladores | 13 |
| `TIME BASE(t, dt)` | Tiempo | Devuelve `t + dt*Time` | 6 |
| `TIME SHIFT(…)` | Datos | Desplaza en el tiempo una variable de datos (verificar firma) | 11 |
| `TREND(input, average time, initial trend)` | Fin | Tendencia fraccional (1/tiempo) | 9 |
| `VECTOR ELM MAP(vector[elm], offset)` | Array | Elemento a una distancia `offset` | 13 |
| `VECTOR LOOKUP(vector[elm], x, xmin, xmax, mode)` | Array | Usa un vector como tabla equiespaciada (verificar semántica de `mode`) | 13 |
| `VECTOR RANK(vector, direction)` | Array | Rango (1 = primero) | 13 |
| `VECTOR REORDER(vector, sort order)` | Array | Reordena según un orden | 13 |
| `VECTOR SELECT(sel[r!], expr[r!], missing, numerical action, error action)` | Array | Agregación condicionada | 13 |
| `VECTOR SORT ORDER(vector, direction)` | Array | Índices de ordenación (base 0) | 13 |
| `VMAX(x[r!])`, `VMIN(x[r!])` | Array | Máximo/mínimo sobre un rango | 13 |
| `WITH LOOKUP(x, ([…], (x1,y1), …))` | Lookup | Tabla en línea | 10 |
| `XIDZ(a, b, x)` | Mat | a/b, o `x` si b = 0 | 4 |
| `ZIDZ(a, b)` | Mat | a/b, o 0 si b = 0 | 4 |
| `:NA:` | Clave | Valor "no disponible" | 6 |
| `:EXCEPT:`, `:INTERPOLATE:`, `:RAW:`, `:HOLD BACKWARD:`, `:LOOK FORWARD:`, `:TEST INPUT:`, `:THE CONDITION:`, `:IMPLIES:`, `:MACRO:`, `:END OF MACRO:`, `:SUPPLEMENTARY` | Clave | Palabras clave del lenguaje | 3 |

---

## 3. Operadores y palabras clave

Resumen (detalle en `04-lenguaje-de-ecuaciones.md`):

| Elemento | Sintaxis | Notas |
|---|---|---|
| Aritméticos | `+ - * / ^` | `^` = potencia (equivale a `POWER`). |
| Comparación | `= <> < > <= >=` | Devuelven 1 (verdadero) o 0 (falso). `=` es comparación dentro de una expresión. |
| Lógicos | `:AND:`, `:OR:`, `:NOT:` | Con dos puntos. Tienen menor precedencia que las comparaciones: `:NOT: 1 > 2` vale 1 en Vensim (`:NOT:` se aplica a `1 > 2`). `:AND:` liga más que `:OR:` (documentación "Operators"; ver `04-lenguaje-de-ecuaciones.md` §7.4). Ante la duda, paréntesis. |
| Precedencia (de mayor a menor) | `()` y llamadas · `^` · `-`/`+` unarios · `* /` · `+ -` · comparaciones · `:NOT:` · `:AND:` · `:OR:` | `^` va **antes** que el signo unario: `-2^2 = -4` en la salida real de Vensim DSS 6.3 (`test-models/tests/exponentiation`). Tabla completa y casos dudosos (asociatividad de `^`) en `04-lenguaje-de-ecuaciones.md` §7.4. |
| `:NA:` | `IF THEN ELSE(x = :NA:, 0, x)` | Valor especial "no disponible" (ver §6). |
| `:EXCEPT:` | `x[r] :EXCEPT: [r1] = …` | Excepciones en ecuaciones con subíndices (ver 06). |
| Palabras clave de datos | `x[r] :INTERPOLATE: := GET XLS DATA(…)` | `:INTERPOLATE:`, `:RAW:`, `:HOLD BACKWARD:`, `:LOOK FORWARD:` controlan cómo se rellenan los huecos entre datos (ver §11). |
| Reality Check | `nombre :THE CONDITION: cond :IMPLIES: consecuencia`; `prueba :TEST INPUT: x = RC STEP(x, 0)` | Ver §16 y `09-unidades-y-reality-check.md`. |
| Macros | `:MACRO: NOMBRE(args) … :END OF MACRO:` | Ver 04. |
| `:SUPPLEMENTARY` | `x = … ~ unidades ~ comentario ~ :SUPPLEMENTARY` | Marca variable suplementaria (no se avisa si no se usa). |
| `TABBED ARRAY`, `WITH LOOKUP`, `A FUNCTION OF` | ver §13, §10, §6 | Se escriben como funciones pero son construcciones especiales. |
| Operadores de asignación | `=` normal, `==` constante inmutable, `:=` datos, `nombre( … )` lookup, `nombre: a, b` rango de subíndices | Ver 04. |

---

## 4. Funciones matemáticas simples

Funciones sin estado: el resultado depende solo de los argumentos en el mismo instante. Pueden anidarse libremente y usarse con subíndices (se aplican elemento a elemento).

| Función | Firma | Resultado | Unidades | Notas / trampas |
|---|---|---|---|---|
| ABS | `ABS(x)` | \|x\| | `ABS(u) → u` | |
| EXP | `EXP(x)` | e^x | `EXP(Dmnl) → Dmnl` | Desborda para x > ~709 (doble precisión). |
| LN | `LN(x)` | ln x | `LN(Dmnl) → Dmnl` | x ≤ 0 → error de coma flotante. |
| LOG | `LOG(x, base)` | ln x / ln base | `LOG(Dmnl, Dmnl) → Dmnl` | **Dos argumentos obligatorios**: para log10 escribe `LOG(x, 10)`. |
| SQRT | `SQRT(x)` | √x | (verificar reglas de unidades) | x < 0 → error. |
| POWER | `POWER(x, y)` | x^y | (normalmente `Dmnl`) | Igual que `x ^ y`. |
| SIN, COS, TAN | `SIN(x)`… | trigonométricas | `Dmnl → Dmnl` | **Radianes**. No hay `PI` integrado: define `pi = 3.14159265`. |
| ARCSIN, ARCCOS, ARCTAN | `ARCSIN(x)`… | inversas | `Dmnl → Dmnl` | Resultado en radianes. `ARCTAN` es de un argumento (no hay `ATAN2`). |
| SINH, COSH, TANH | `SINH(x)`… | hiperbólicas | `Dmnl → Dmnl` | `COSH` figura en el índice oficial; PySD traduce las tres. |
| GAMMA LN | `GAMMA LN(x)` | ln Γ(x) | `Dmnl → Dmnl` | Útil para factoriales: `EXP(GAMMA LN(n+1)) = n!`. |
| INTEGER | `INTEGER(x)` | parte entera **truncando hacia 0** | `INTEGER(u) → u` | `INTEGER(-9.9) = -9` (no es `floor`). |
| QUANTUM | `QUANTUM(a, q)` | `q * INTEGER(a/q)` | `QUANTUM(u, u) → u` ("both arguments have the same units") | "If B is less than or equal to zero, then A is returned". `QUANTUM(-1.9, 1) = -1`; `QUANTUM(423, 63) = 378`. |
| MODULO | `MODULO(a, b)` | `a - QUANTUM(a, b)` | `MODULO(u, u) → u` | Sigue la norma C: el resultado tiene **el signo del dividendo**: `MODULO(-9.9, 3) = -0.9` (no 2.1). |
| MIN, MAX | `MIN(a, b)`, `MAX(a, b)` | mínimo/máximo de **dos** valores | `MIN(u, u) → u` | Para el mínimo/máximo de un array usa `VMIN`/`VMAX` (§13). Para 3 valores: `MAX(a, MAX(b, c))`. |
| XIDZ | `XIDZ(a, b, x)` | `a/b`, o `x` si b es (casi) cero | `XIDZ(u1, u2, u1/u2) → u1/u2` | "X If Divided by Zero". Umbral de "cero": PySD y SDEverywhere usan \|b\| < 1e‑6 (verificar umbral exacto en la doc). |
| ZIDZ | `ZIDZ(a, b)` | `a/b`, o 0 si b es (casi) cero | `ZIDZ(u1, u2) → u1/u2` | "Zero If Divided by Zero" = `XIDZ(a, b, 0)`. |
| IF THEN ELSE | `IF THEN ELSE(cond, x, y)` | `x` si `cond` ≠ 0, si no `y` | `IF THEN ELSE(Dmnl, u, u) → u` | Ambas ramas deben tener las mismas unidades. Ver trampas abajo. |

### Fichas breves

**IF THEN ELSE(cond, true value, false value)**
- `cond` es numérica: 0 = falso, cualquier otro valor = verdadero. Se construye con comparaciones y `:AND:`/`:OR:`/`:NOT:`.
- **No es perezoso en sentido práctico**: no lo uses para "proteger" cálculos. Las funciones con estado (SMOOTH, DELAY…, que son macros con niveles ocultos) escritas dentro de una rama **siguen integrándose aunque la rama no se seleccione**. Para divisiones usa `XIDZ`/`ZIDZ` en lugar de `IF THEN ELSE(b = 0, 0, a/b)`.
- Comparar reales con `=` es frágil: `IF THEN ELSE(Time = 10, …)` solo acierta si 10 es múltiplo exacto de `TIME STEP`. Mejor `PULSE`/`STEP` o comparar con tolerancia (`ABS(Time - 10) < TIME STEP/2`).
- Para eventos discretos en flujos se suele combinar con `TIME STEP`: `IF THEN ELSE(cond, Stock / TIME STEP, 0)` vacía el stock en un paso.

```vensim
Ventas = IF THEN ELSE(Inventario > 0, Demanda, 0)
	~	Widget/Month
	~	Solo se vende si hay inventario (mejor: MIN(Demanda, Inventario/Tiempo minimo de envio)).
	|
Productividad relativa = XIDZ(Produccion, Trabajadores, Productividad normal)
	~	Widget/(Person*Month)
	~	Si no hay trabajadores devuelve la productividad normal en vez de dividir por cero.
	|
Ronda = INTEGER(x + 0.5)
	~	Dmnl
	~	Redondeo para x >= 0 (Vensim no tiene ROUND).
	|
```

**Trampas comunes del bloque**
- `MIN`/`MAX` con un solo argumento no existen en Vensim (sí en XMILE). `MIN(x[r!])` no es válido: usa `VMIN(x[r!])`.
- `INTEGER`, `QUANTUM` y `MODULO` truncan hacia cero; si necesitas el suelo matemático para negativos: `INTEGER(x) - IF THEN ELSE(x < INTEGER(x), 1, 0)`.
- `LOG(x)` con un argumento es un error de sintaxis en Vensim.

---

## 5. Funciones de prueba (test inputs)

Generan señales de entrada típicas para probar la respuesta del modelo. Todas dependen de `Time`; usan la convención *time plus* (`Time + TIME STEP/2`) para que los instantes coincidan con la rejilla de cálculo aunque haya error de redondeo.

| Función | Firma | Valor | Unidades |
|---|---|---|---|
| STEP | `STEP(height, step time)` | 0 antes de `step time`; `height` a partir de él | `STEP(u, Time) → u` |
| RAMP | `RAMP(slope, start time, end time)` | 0 hasta `start time`; `slope*(Time − start time)` hasta `end time`; después se mantiene en `slope*(end time − start time)` | `RAMP(u/Time, Time, Time) → u` |
| PULSE | `PULSE(start, width)` | 1 mientras `start < time plus < start + width`; si no, 0 | `PULSE(Time, Time) → Dmnl` |
| PULSE TRAIN | `PULSE TRAIN(start, width, tbetween, end)` | 1 durante `width` empezando en `start` y repitiendo cada `tbetween` hasta `end` | `PULSE TRAIN(Time, Time, Time, Time) → Dmnl` |

**Detalles verificados con salidas de Vensim**
- `STEP(h, t0)` vale `h` en el primer paso en que `Time + TIME STEP/2 > t0`. Con `TIME STEP = 1`, `STEP(1, 2.6)` cambia en `Time = 3`.
- `PULSE(3, 2)` con `TIME STEP = 0.0625` vale 1 para `3 ≤ Time < 5` (tests de PySD/test-models). Según la doc, la definición es `IF THEN ELSE(time plus > start :AND: time plus < start + width, 1, 0)` y **si `width` es 0 se trata como `TIME STEP`**; un `width` menor que medio paso puede no disparar nunca.
- `PULSE TRAIN(7, 1, 2, 12)` vale 1 en [7,8), [9,10), [11,12). Doc: "If the value of tbetween is smaller than width then 1 will be returned between start and end. If width is less than or equal to TIME STEP the pulses will only last one TIME STEP". El final es **inclusivo**: `PULSE TRAIN(10, 1, 5, 30)` con dt = 0.25 está activo en [10,11), [15,16), [20,21), [25,26) y solo en el instante `Time = 30`.
- `RAMP(1, 14, 17)` vale 0 en t = 14, sube con pendiente 1 y se queda en 3 desde t = 17. `end time` es obligatorio; se admite `start time > end time` (la rampa no termina).

**Patrón: introducir una cantidad Q de golpe en un stock**
```vensim
Inyeccion = Cantidad inyectada / TIME STEP * PULSE(Tiempo inyeccion, TIME STEP)
	~	Widget/Month
	~	Mete exactamente Cantidad inyectada (Widget) en un solo paso, sea cual sea TIME STEP.
	|
```
(El mismo patrón aparece en el modelo de prueba de `NPV` de SDEverywhere: `-investment / TIME STEP * PULSE(start time, TIME STEP)`.)

**Trampas**
- `PULSE` devuelve 1, no "una unidad de material": multiplicado por una tasa da `tasa × width` de material; para un impulso de cantidad Q usa el patrón anterior.
- El orden de argumentos difiere de XMILE/Stella (`PULSE(magnitude, start, interval)` en XMILE).
- Las funciones de prueba son discontinuas: simula con **Euler** o reduce `TIME STEP`; con RK4 los instantes intermedios pueden dar resultados raros.

---

## 6. Tiempo, control de la simulación y funciones especiales

### Variables de control (reservadas)

| Nombre | Significado | Notas |
|---|---|---|
| `Time` | Tiempo actual de simulación | Variable integrada; sus unidades son las de tiempo del modelo. |
| `INITIAL TIME` | Instante inicial | Se evalúa en la inicialización. |
| `FINAL TIME` | Instante final | Puede ser una expresión dinámica: `FINAL TIME = IF THEN ELSE(condicion, Time, 100)` detiene la simulación cuando se cumple la condición (caso de prueba `dynamic_final_time`, Vensim DSS 7.3.4). |
| `TIME STEP` | Paso de integración dt | Se puede usar en ecuaciones (p. ej. `x / TIME STEP`). Potencias de 2 recomendadas. |
| `SAVEPER` | Periodo de guardado de resultados | Debe ser múltiplo de `TIME STEP`; típico `SAVEPER = TIME STEP`. |

### `:NA:`
- Constante especial "no disponible": un número finito muy negativo, no un NaN (≈ −1.298×10³³ = −2¹¹⁰ en la DLL y en los `.vdf`; Simlin modela el literal como −2¹⁰⁹: verificar valor exacto; ver `04-lenguaje-de-ecuaciones.md` §5.10). Se usa para marcar datos ausentes y se compara con `=`: `IF THEN ELSE(x = :NA:, valor por defecto, x)`.
- Las funciones de datos devuelven `:NA:` cuando no hay dato; `VECTOR SELECT` puede usarlo como `missing value`.

### `A FUNCTION OF(x, y, …)`
- Lo inserta Vensim cuando dibujas flechas hacia una variable sin escribir su ecuación. Doc: "is not intended for use in writing equations, and precludes simulation". Su presencia impide simular: completa la ecuación.

### `TIME BASE(t, dt)`
- Devuelve `t + dt * Time` (doc: "equivalent to (START + Time*SLOPE)"). Útil para pasar de tiempo de simulación a otra escala (p. ej. años de calendario) como entrada a lookups o datos.

### `GET TIME VALUE(relativeto, offset, measure)`
- `relativeto`: 0 = tiempo actual de simulación, 1 = tiempo inicial, 2 = reloj del ordenador.
- `offset`: desplazamiento en unidades de tiempo del modelo antes de calcular (ignorado con `relativeto = 2`).
- `measure`: 0 unidades de Time del modelo (solo con relativeto 0/1) · 1 año (desde 1 a.C.) · 2 trimestre (1‑4) · 3 mes (1‑12) · 4 día del mes · 5 día de la semana (0 = domingo) · 6 días desde el 1‑ene del año 1 a.C. · 7 hora (0‑23) · 8 minuto · 9 segundo (no entero) · 10 segundos transcurridos módulo 500 000.
- Para que los `measure` de calendario tengan sentido con `relativeto` 0/1 el modelo debe tener un eje de tiempo con fechas (unidades de tiempo de calendario) (verificar). Lista de códigos tomada de la docstring de PySD, que reproduce la doc de Vensim.

### `GAME(x)`
- Fuera del modo Gaming devuelve `x`. En una simulación de juego (*Gaming*), el usuario puede cambiar el valor en cada intervalo de juego (*GAME INTERVAL*); el valor introducido se mantiene hasta que se vuelve a cambiar. Debe envolver toda la ecuación, justo tras el `=` (el caso `game` de test-models indica que Vensim no admite `GAME(A + B) * C`; verificar). Ver `08-simulacion-e-integracion.md`.

```vensim
Pedido decidido = GAME(Pedido recomendado)
	~	Widget/Month
	~	En modo juego el jugador sustituye la regla de pedidos.
	|
```

---

## 7. Niveles, inicialización y muestreo

### INTEG — nivel (stock)

**Firma:** `INTEG(rate, initial value)`
**Unidades:** `INTEG(u/Time, u) → u`.

- Define un **nivel**: `Stock(t + dt) = Stock(t) + dt · rate(t)` con Euler (con RK2/RK4 se combina la tasa en varios puntos del intervalo).
- `initial value` se evalúa **una sola vez**, en la inicialización. Puede ser una expresión que dependa de otras variables (Vensim ordena los cálculos iniciales), pero no puede depender circularmente del propio nivel ("simultaneous initial value" → usar `ACTIVE INITIAL` o reformular).
- Debe ir **justo tras el `=`** y constituir toda la ecuación: `Stock = INTEG(entradas - salidas, inicial)`. Para usar el valor escalado, crea otra variable.
- Vensim no impone no‑negatividad (no hay "non‑negative stocks" como en Stella): limita los **flujos de salida** (`MIN(salida deseada, Stock / tiempo minimo)`).

```vensim
Inventario = INTEG(Produccion - Envios, Inventario inicial)
	~	Widget
	~	Stock de producto terminado.
	|
```

### INITIAL — congelar el valor inicial

**Firma:** `INITIAL(value)` · **Unidades:** `INITIAL(u) → u`.
- Calcula `value` en la inicialización y lo mantiene constante toda la simulación. Útil para guardar condiciones de partida (`Poblacion inicial = INITIAL(Poblacion)`) o normalizar (`x / INITIAL(x)`).
- Debe ir justo tras el `=` (SDEverywhere lo exige; verificar redacción de la doc).

### ACTIVE INITIAL — romper ciclos de inicialización

**Firma:** `ACTIVE INITIAL(active value, initial value)` · **Unidades:** `ACTIVE INITIAL(u, u) → u`.
- Durante la inicialización la variable vale `initial value`; durante la simulación, `active value`.
- Uso típico: un bucle que solo es simultáneo en el instante inicial (p. ej. la capacidad depende de la producción y la producción inicial depende de la capacidad).
- Doc: debe "appear first on the right of the = sign and not be followed by anything else".

```vensim
Produccion = ACTIVE INITIAL(Capacidad * Utilizacion, Demanda inicial)
	~	Widget/Month
	~	En t0 se toma la demanda para evitar el ciclo de inicialización.
	|
```

### REINITIAL (verificar)

`REINITIAL(x)` existe como función reconocida (xmutil la traduce igual que `INITIAL`). Se describe como un INITIAL que se recalcula al reinicializar el modelo; no se pudo confirmar su semántica exacta en la doc.

### SAMPLE IF TRUE — muestrear y retener

**Firma:** `SAMPLE IF TRUE(condition, input, initial value)` · **Unidades:** `SAMPLE IF TRUE(Dmnl, u, u) → u`.
- Si `condition` ≠ 0 devuelve `input` (en el mismo paso); si no, el último valor muestreado. Antes de que la condición se cumpla por primera vez devuelve `initial value` (evaluado en la inicialización).
- Es un elemento con memoria (actúa como nivel discreto); escríbelo como ecuación completa (SDEverywhere exige que vaya justo tras el `=`; verificar en la doc).
- Salida real de Vensim: `a = SAMPLE IF TRUE(MODULO(Time, 5) = 0, Time, 0)` → 0,0,0,0,0,5,5,5,5,5,10…

```vensim
Precio de referencia = SAMPLE IF TRUE(MODULO(Time, 12) = 0, Precio, Precio)
	~	$/Widget
	~	Se actualiza cada 12 meses (si 12 es múltiplo de TIME STEP).
	|
```

### SHIFT IF TRUE (verificar firma)

Existe (`fn_shift_if_true.html`, citado por PySD, que **no** la implementa). Desplaza los valores de un array a lo largo de su subíndice cuando se cumple una condición, típicamente para cadenas de envejecimiento discretas (cohortes que avanzan un año). Firma no confirmada; PySD documenta una alternativa con `IF THEN ELSE` en flujos (issue #265).

---

## 8. Retrasos y suavizados (DELAY / SMOOTH)

### 8.1 Mapa conceptual

| Familia | Qué conserva | Estado interno | Uso típico |
|---|---|---|---|
| `SMOOTH`, `SMOOTHI`, `SMOOTH3`, `SMOOTH3I`, `SMOOTH N` | Nada (retraso de **información**): el estado es la propia salida | Nivel(es) = salida | Percepción, expectativas, promedios móviles exponenciales |
| `DELAY1`, `DELAY1I`, `DELAY3`, `DELAY3I`, `DELAY N`, `DELAYP` | **Material**: lo que entra acaba saliendo | Nivel(es) = material en tránsito; salida = nivel/tiempo | Envíos, construcción, maduración |
| `DELAY FIXED`, `DELAY MATERIAL`, `DELAY INFORMATION` | Tubería exacta (retraso puro) | Cola de valores por paso | Plazos fijos (transporte, contratos) |
| `DELAY CONVEYOR`, `DELAY BATCH`, `DELAY PROFILE` | Material con cinta/lotes/perfil | Estructura discreta | Procesos con fugas, lotes, distribuciones arbitrarias |

Con `delay time` **constante**, `SMOOTH` y `DELAY1` dan **la misma curva** (y `SMOOTH3` ≈ `DELAY3`). Difieren cuando `delay time` cambia o cuando importa la conservación del material (§19).

Todas las de esta sección: `FUNC(u, Time, …) → u` (entrada, valor inicial y salida con las mismas unidades; `delay time` en unidades de tiempo).

### 8.2 SMOOTH, SMOOTHI

**Firmas:** `SMOOTH(input, delay time)` · `SMOOTHI(input, delay time, initial value)`.

Equivalencia (suavizado exponencial de primer orden):
```vensim
SMOOTH = INTEG((input - SMOOTH) / delay time, input)
SMOOTHI = INTEG((input - SMOOTHI) / delay time, initial value)
```
- `SMOOTH` arranca en equilibrio con el valor inicial de `input`; `SMOOTHI` arranca en `initial value` (evaluado en la inicialización).
- La salida es continua aunque `delay time` cambie bruscamente.
- Estabilidad con Euler: con `delay time` < `TIME STEP` la salida oscila (amortiguada si `delay time` > `TIME STEP`/2, explosiva si es menor; ver `08-simulacion-e-integracion.md` §2.5); para precisión, `TIME STEP` ≤ `delay time`/4.

```vensim
Demanda percibida = SMOOTH(Demanda, Tiempo de percepcion)
	~	Widget/Month
	~	Promedio exponencial de la demanda.
	|
```

### 8.3 SMOOTH3, SMOOTH3I

**Firmas:** `SMOOTH3(input, delay time)` · `SMOOTH3I(input, delay time, initial value)`.
- Tres SMOOTH en cascada, cada uno con `delay time/3`; respuesta en "S" (menos reactiva al principio). `SMOOTH3I` inicializa las tres etapas en `initial value`.
```vensim
LV1 = INTEG((input - LV1) / (delay time/3), input)
LV2 = INTEG((LV1 - LV2) / (delay time/3), input)
SMOOTH3 = INTEG((LV2 - SMOOTH3) / (delay time/3), input)
```

### 8.4 SMOOTH N

**Firma:** `SMOOTH N(input, delay time, initial value, order)`.
- Suavizado de orden `order` (cascada de `order` etapas, cada una `delay time/order`). Con `order` = 1 ≈ `SMOOTHI`, con 3 ≈ `SMOOTH3I`. `order` se fija en la inicialización (verificar si debe ser entero; PySD lo trunca).
- Ojo al orden de argumentos al traducir a XMILE: Vensim `(input, delay time, initial value, order)` ↔ XMILE `SMTHN(input, averaging time, n, initial)`.

### 8.5 DELAY1, DELAY1I

**Firmas:** `DELAY1(input, delay time)` · `DELAY1I(input, delay time, initial value)`.
```vensim
DELAY1 = LV / delay time
LV = INTEG(input - DELAY1, input * delay time)
```
- `DELAY1I`: el nivel arranca en `initial value * delay time`. **`initial value` es el valor inicial de la salida (un flujo), no el contenido del retraso.**
- Si `delay time` cambia, la salida salta (`LV/delay time` con el mismo LV): el material se conserva, la salida no es continua.

### 8.6 DELAY3, DELAY3I

**Firmas:** `DELAY3(input, delay time)` · `DELAY3I(input, delay time, initial value)`.
```vensim
DL = delay time / 3
LV1 = INTEG(input - RT1, input * DL)       RT1 = LV1 / DL
LV2 = INTEG(RT1 - RT2, input * DL)         RT2 = LV2 / DL
LV3 = INTEG(RT2 - DELAY3, input * DL)      DELAY3 = LV3 / DL
```
- Tres retrasos de primer orden en cascada; la salida ante un escalón tiene forma de S (distribución Erlang‑3). `DELAY3I` inicializa con `initial value * DL` en cada etapa.
- Material en tránsito = LV1 + LV2 + LV3 (no accesible directamente: usa `DELAYP` o un `INTEG` paralelo).

### 8.7 DELAY N

**Firma:** `DELAY N(input, delay time, initial value, order)`.
- Retraso material exponencial de orden N. Doc: con order 1 es "almost the same as DELAY1I" y con 3 "almost the same as DELAY3I".
- **`order` se evalúa solo en la inicialización** (en el caso de prueba `delays`, cambiar `order` de 2 a 3 a mitad de simulación no altera la salida de Vensim; PySD, que fija el orden al inicio, coincide con Vensim a 5e‑6).
- Requiere `delay time > order · TIME STEP`; si no, Vensim avisa y **reduce automáticamente el orden**, comportándose casi como `DELAY MATERIAL`.
- Se trata como retraso discreto: salida constante dentro de cada `TIME STEP`.
- Conserva material: con entrada 0 la salida total es `initial value × delay time`.
- Con `delay time` variable **no** coincide con `DELAY3I`: los tiempos de retraso "viajan" con el material por las etapas (comparativa numérica en §19).
- Con N muy grande se aproxima a un retraso puro (`DELAY FIXED`).
- Orden de argumentos en XMILE: `DELAYN(input, delay time, n, initial)`.

### 8.8 DELAYP — DELAY3 con pipeline

**Firma:** `DELAYP(input, delay time : pipeline)` (¡dos puntos!).
- Igual que `DELAY3` pero además asigna a la variable `pipeline` (nombrada tras `:`) el material en tránsito (`LV1 + LV2 + LV3`), conservando el material aunque cambie `delay time`.
- La doc la mantiene por compatibilidad y recomienda en su lugar `DELAY3` + un `INTEG` explícito para el trabajo en curso.
```vensim
Terminaciones = DELAYP(Inicios, Tiempo de produccion : Trabajo en curso)
	~	Widget/Month
	~	Trabajo en curso queda definido como variable de salida.
	|
```

### 8.9 DELAY FIXED — retraso puro

**Firma:** `DELAY FIXED(input, delay time, initial value)` · **Unidades:** `(u, Time, u) → u`.
- "Returns the value of the input delayed by the delay time": la salida en t es la entrada en t − `delay time`. Hasta que transcurre `delay time` devuelve `initial value`.
- `delay time` e `initial value` se evalúan **solo en la inicialización**; si necesitas un tiempo variable usa `DELAY INFORMATION` o `DELAY MATERIAL`.
- El retraso se cuantiza a un número entero de `TIME STEP` (redondeo; PySD redondea, SDEverywhere usa techo: con tiempos que no son múltiplo de dt puede haber diferencias de un paso — verificar). El retraso efectivo mínimo es **un `TIME STEP`**: en Vensim `DELAY FIXED(x, 0, 0)` da lo mismo que `DELAY FIXED(x, 1, 0)` con dt = 1 (salida real en el modelo `delayfixed` de SDEverywhere).
- Es un nivel discreto: debe ir justo tras el `=` (como DELAY MATERIAL/INFORMATION; verificar redacción). No guarda el material en tránsito; si lo necesitas, añade `En transito = INTEG(entrada - salida, entrada * delay time)`.
- Discontinuo: simula con Euler.

```vensim
Recepciones = DELAY FIXED(Envios, Tiempo de transporte, Envios)
	~	Widget/Month
	~	Lo enviado llega exactamente Tiempo de transporte después.
	|
En transito = INTEG(Envios - Recepciones, Envios * Tiempo de transporte)
	~	Widget
	~	Material en tránsito (DELAY FIXED no lo guarda).
	|
```
Comprobado con Vensim: con `Envios = STEP(1,10) - STEP(1,20)` y tiempo 20, `Recepciones` vale 1 de t = 30 a t = 39.

### 8.10 DELAY INFORMATION

**Firma:** `DELAY INFORMATION(input, delay time, initial value)` · **Unidades:** `(u, Time, u) → u`.
- "The same as DELAY FIXED except that delay time can be a variable. If delay time is decreasing some values of the input will be discarded and replaced by more recent inputs. If delay time is increasing existing values will be held."
- Debe ir justo tras el `=`. Ejemplo de la doc: `SS1 = DELAY INFORMATION(R, 15 + STEP(15, 40), 0)`.

### 8.11 DELAY MATERIAL

**Firma:** `DELAY MATERIAL(input, delay time, initial value, missval)` · **Unidades:** entrada, valor inicial, `missval` y salida iguales; `delay time` en unidades de `TIME STEP`.
- Igual que `DELAY FIXED` pero con `delay time` variable y **conservando** el material: si el tiempo disminuye, valores de entrada se **suman** a otros más recientes en la salida; si aumenta, cuando no hay salida disponible devuelve `missval`.
- Debe ir justo tras el `=`. Ejemplo de la doc: `test completions = DELAY MATERIAL(test starts, test time, test starts, 0.0)`.

### 8.12 DELAY CONVEYOR

**Firma:** `DELAY CONVEYOR(input, ctime, leak, initprofile, inittot, initctime)`.
- `input`: lo que entra a la cinta · `ctime`: tiempo de transporte · `leak`: fuga fraccional por unidad de tiempo mientras el material está en la cinta · `initprofile`: lookup que distribuye el material inicial según un perfil temporal · `inittot`: material inicial total en la cinta · `initctime`: determina el valor inicial devuelto (`inittot/initctime`), normalmente igual a `ctime`.
- Con `leak` = 0 se conserva el material y se puede acelerar/frenar la cinta cambiando `ctime`.

### 8.13 DELAY BATCH

**Firma:** `DELAY BATCH(input, bsize, btime, inibatch, initime, inibacklog)`.
- Acumula la entrada hasta reunir un lote de tamaño `bsize` y lo entrega tras procesarlo durante `btime`; devuelve 0 cuando no se completa ningún lote (salida en pulsos, conserva el total). `inibatch` es el lote inicial en proceso, que sale en `initime`; `inibacklog` lo ya acumulado para el siguiente lote. `bsize` y `btime` pueden variar; el instante de salida lo fija `btime` al empezar el lote.

### 8.14 DELAY PROFILE

**Firma:** `DELAY PROFILE(profile, input, delay time, initial value, growth rate)` (doc: `DELAY PROFILE(P, X, T, I, G)`).
- Retraso con forma arbitraria: `profile` es un lookup no negativo (al menos un valor positivo) que Vensim normaliza como distribución de probabilidad, de modo que se conserva el material. `delay time` es el retraso **medio**. `growth rate` permite inicializar como si la entrada creciera a esa tasa (p. ej. 0.05); en ese caso ajusta a la baja `initial value`.
- Ejemplo de la doc: `boxxy((0,0),(2,0),(3,1),(6,1),(7,0))`, `delayed input = DELAY PROFILE(boxxy, input, delay time, input, 0)`.

### 8.15 Comparación numérica (PySD, contrastado con Vensim)

Entrada `inp2 = 1 + STEP(1, 5)`, `delay time = 4 + STEP(2, 15)`, dt = 1:

| Time | SMOOTH | DELAY1 | Comentario |
|---|---|---|---|
| 5 | 1.000 | 1.000 | El escalón aún no ha afectado |
| 6 | 1.250 | 1.250 | Idénticos con tiempo constante |
| 14 | 1.925 | 1.925 | |
| 15 | 1.944 | **1.296** | El tiempo pasa de 4 a 6: DELAY1 = LV/6 cae de golpe; SMOOTH sigue continuo |
| 20 | 1.977 | 1.717 | |

Y con entrada constante 4 e inicial 4: `DELAY3I` cae a 2.667 en t = 15 (LV/(6/3)), mientras que `DELAY N(…, 3)` se mantiene en 4 un paso más, baja y luego se recupera (2.667, 1.667, 2.167, 2.667…): **DELAY N ≠ DELAY3I con tiempo variable**.

---

## 9. Tendencia, pronóstico, finanzas y depreciación

### TREND

**Firma:** `TREND(input, average time, initial trend)` · **Unidades:** `TREND(u, Time, 1/Time) → 1/Time`.
- Tendencia **fraccional** (crecimiento relativo por unidad de tiempo), no absoluta. Equivalencia documentada (la reproduce el modelo de prueba `trend` de SDEverywhere):
```vensim
TREND = ZIDZ(input - AV, average time * ABS(AV))
AV = INTEG((input - AV) / average time, input / (1 + initial trend * average time))
```
- `initial trend` hace que la tendencia arranque en ese valor (AV inicial por debajo de la entrada).

### FORECAST

**Firma:** `FORECAST(input, average time, horizon)` · **Unidades:** `FORECAST(u, Time, Time) → u`.
- Extrapolación lineal de la tendencia a `horizon` unidades de tiempo: ≈ `input * (1 + TREND(input, average time, 0) * horizon)`. Implementación de PySD (coincide con la salida de Vensim del caso `forecast` a 5e‑5): `input * (1 + ZIDZ(input - AV, average time * AV) * horizon)`, `AV = INTEG((input - AV)/average time, input)`.
- Comentario del propio modelo de ejemplo: extrapolador muy simple, "performs very badly at turnarounds" y amplifica ruido.

### NPV — valor actual neto

**Firma:** `NPV(stream, discount rate, init val, factor)`.
- Acumula el valor descontado de `stream` desde `INITIAL TIME` hasta el instante actual (incluido el paso actual). Expansión usada por SDEverywhere (validada contra Vensim):
```vensim
df = INTEG(-df * discount rate / (1 + discount rate * TIME STEP), 1)
ncum = INTEG(stream * df, init val)
NPV = (ncum + stream * TIME STEP * df) * factor
```
- `discount rate` es por unidad de tiempo (fracción/Time; descuento compuesto por paso). `init val` es el valor inicial acumulado; `factor` multiplica el resultado (normalmente 1). Unidades esperables: `NPV(u/Time, 1/Time, u, Dmnl) → u` (verificar).
- Ejemplo (modelo `npv` de SDEverywhere): `discount rate = interest rate / 12 / 100` con tiempo en meses.

### NPVE, INTERNAL RATE OF RETURN (verificar)

- `NPVE` figura entre las funciones definidas como macros (variante de NPV; firma no confirmada).
- `INTERNAL RATE OF RETURN` figura en el índice de funciones; firma no confirmada.

### DEPRECIATE STRAIGHTLINE

**Firma:** `DEPRECIATE STRAIGHTLINE(stream, dtime, fisc, init)`.
- Distribuye cada entrada de `stream` uniformemente a lo largo de `dtime` y devuelve la depreciación del periodo. `dtime` (y `fisc`) se evalúan en la inicialización. `fisc` está relacionado con el periodo fiscal (semántica exacta: verificar; SDEverywhere no lo soporta). `init`: valor inicial.
- Salida real de Vensim (dt = 1 año, `dtime` = 20): una inversión de 1e9 en 2022 produce 5e7/año de 2022 a 2041 (empieza en el mismo periodo); otra de 2.5e9 en 2026 añade 1.25e8/año de 2026 a 2045.

### DEPRECIATE BY SCHEDULE (verificar firma)

Depreciación según un calendario (perfil) en lugar de lineal. Existe en el índice de funciones; no se pudo confirmar la firma.

---

## 10. Lookups (funciones de tabla)

### 10.1 Uso estándar

Definición (variable de tipo *Lookup*) y llamada:
```vensim
Efecto de la carga en la productividad tabla(
	[(0,0)-(2,1.5)],(0,1.2),(0.5,1.15),(1,1),(1.5,0.7),(2,0.4))
	~	Dmnl
	~	Rango opcional [(xmin,ymin)-(xmax,ymax)] y después los puntos (x,y).
	|
Efecto de la carga = Efecto de la carga en la productividad tabla(Carga / Carga normal)
	~	Dmnl
	~	Se llama como una función de un argumento.
	|
```
- Interpolación **lineal** entre puntos; los x deben ser crecientes.
- **Fuera del rango de x no extrapola**: devuelve el primer y (por debajo) o el último y (por encima). Para extrapolar usa `LOOKUP EXTRAPOLATE`.
- La caja `[(xmin,ymin)-(xmax,ymax)]` solo afecta al editor gráfico; puede omitirse (Vensim acepta lookups sin rango).
- Unidades: el argumento debe tener las unidades del eje x (normalmente `Dmnl`, por eso se normaliza `x / x normal`); el resultado tiene las unidades declaradas del lookup.
- Usar `Time` como argumento convierte la tabla en una serie temporal exógena (`Precio historico(Time)`).
- Los lookups pueden tener subíndices (`tabla[r]( … )`) y pueden leerse de Excel con `GET XLS LOOKUPS` / `GET DIRECT LOOKUPS` (§11).

### 10.2 WITH LOOKUP — tabla en línea

**Firma:** `WITH LOOKUP(input, ([(xmin,ymin)-(xmax,ymax)], (x1,y1), (x2,y2), …))`
```vensim
Efecto = WITH LOOKUP(Ratio, ([(0,0)-(2,2)],(0,0),(1,1),(2,1.5)))
	~	Dmnl
	~	Equivale a definir una tabla aparte y llamarla con Ratio.
	|
```
- Mismo comportamiento que un lookup normal. Debe ir justo tras el `=` (verificar; SDEverywhere lo exige). Inconveniente: la tabla no es reutilizable ni se puede cambiar como parámetro en SyntheSim/sensibilidad tan cómodamente como una tabla con nombre.

### 10.3 Funciones sobre lookups

El primer argumento es el **nombre** de un lookup (no una expresión).

| Función | Firma | Qué devuelve | Ejemplo doc `LOOK((0,1),(1,1),(2,2))` en x = −1 / 1.5 / 2.5 |
|---|---|---|---|
| (llamada normal) | `LOOK(x)` | Interpolación, extremos mantenidos | 1 / 1.5 / 2 |
| LOOKUP EXTRAPOLATE | `LOOKUP EXTRAPOLATE(lookup, x)` | Interpolación; fuera de rango extrapola linealmente con los dos últimos (o primeros) puntos | 1 / 1.5 / 2.5 |
| LOOKUP FORWARD | `LOOKUP FORWARD(lookup, x)` | Sin interpolar: y del siguiente punto con xi ≥ x | 1 / 2 / 2 |
| LOOKUP BACKWARD | `LOOKUP BACKWARD(lookup, x)` | Sin interpolar: y del punto anterior (escalón que se mantiene) | 1 / 1 / 2 |
| LOOKUP INVERT | `LOOKUP INVERT(lookup, y)` | x tal que lookup(x) = y (interpolando); la tabla debe ser monótona para que tenga sentido (verificar comportamiento si no lo es) | — |
| LOOKUP AREA | `LOOKUP AREA(lookup, x1, x2)` | Área bajo la curva entre x1 y x2 (integral de la poligonal) (verificar tratamiento fuera de rango) | — |
| LOOKUP SLOPE | `LOOKUP SLOPE(lookup, x)` | Pendiente del tramo en x (verificar firma) | — |

```vensim
Precio objetivo = LOOKUP INVERT(Demanda segun precio tabla, Capacidad)
	~	$/Widget
	~	Precio al que la demanda iguala la capacidad.
	|
Tarifa vigente = LOOKUP BACKWARD(Calendario tarifas, Time)
	~	$/kWh
	~	Escalones: la tarifa se mantiene hasta el siguiente punto.
	|
```

`RANDOM LOOKUP` (§12) usa un lookup como función de densidad; `DELAY PROFILE` y `DELAY CONVEYOR` usan lookups como perfiles; `VECTOR LOOKUP` (§13) trata un vector como tabla.

---

## 11. Funciones de datos y de lectura externa

Resumen; el detalle de ficheros, rangos y celdas está en `07-datos-lookups-import-export.md`.

### 11.1 Variables de datos y palabras clave de interpolación

Una variable de datos se define con `:=` (o vacía, con los datos en un `.vdf` cargado):
```vensim
Poblacion historica :INTERPOLATE: := GET XLS DATA('datos.xlsx', 'Hoja1', 'A', 'B2')
	~	Person
	~	Serie histórica leída de Excel; tiempos en la columna A, valores desde B2.
	|
```
| Palabra clave (antes de `:=`) | Entre puntos de datos |
|---|---|
| `:INTERPOLATE:` | Interpolación lineal (modo por defecto también en Vensim: una variable de datos sin palabra clave se interpola, como muestra la salida real de Vensim en `SDEverywhere/models/extdata` (`Simple Totals` interpolado linealmente entre t = 2 y t = 9); ver `07-datos-lookups-import-export.md` §3.2) |
| `:HOLD BACKWARD:` | Mantiene el último valor conocido |
| `:LOOK FORWARD:` | Toma el siguiente valor conocido |
| `:RAW:` | Solo valores en los instantes con dato; `:NA:` en el resto |

### 11.2 GET DATA … (funciones sobre variables de datos)

| Función | Firma | Qué devuelve | Estado |
|---|---|---|---|
| GET DATA AT TIME | `GET DATA AT TIME(data, time)` | Valor de la variable de datos en `time` | Firma confirmada (2 args, xmutil) |
| GET DATA BETWEEN TIMES | `GET DATA BETWEEN TIMES(data, time, mode)` | Valor en `time` con `mode`: −1 = mantener hacia atrás, 0 = interpolar, 1 = mirar hacia delante | Confirmada (PySD/SDE/Simlin) |
| GET DATA LAST TIME | `GET DATA LAST TIME(data)` | Último instante con dato | Confirmada (1 arg) |
| GET DATA FIRST TIME | `GET DATA FIRST TIME(data)` | Primer instante con dato | (verificar) |
| GET DATA MEAN | `GET DATA MEAN(data, start time, end time)` | Media de los datos entre dos tiempos | 3 args confirmados; nombres (verificar) |
| GET DATA MAX / GET DATA MIN | `GET DATA MAX(data, start time, end time)` | Máximo/mínimo entre dos tiempos | (verificar) |
| GET DATA TOTAL POINTS | `GET DATA TOTAL POINTS(data)` | Número de puntos de datos | (verificar) |
| TIME SHIFT | `TIME SHIFT(data, shift)`? | Desplaza en el tiempo una variable de datos | Existe (citada por PySD); firma (verificar) |

Particularidades observadas por SDEverywhere al reproducir `GET DATA BETWEEN TIMES`: con `mode` ±1 Vensim parece redondear hacia abajo el tiempo a un entero, y con `mode` 0 y tiempos no enteros da resultados "inesperados". Úsala con tiempos que coincidan con los datos.

```vensim
Valor hace un anio = GET DATA BETWEEN TIMES(Ventas historicas, MAX(INITIAL TIME, Time - 1), 0)
	~	Widget/Year
	~	Patrón del modelo de prueba getdata de SDEverywhere.
	|
```

### 11.3 Lectura de hojas de cálculo y ficheros

| Función | Firma | Tipo de variable |
|---|---|---|
| GET XLS DATA / GET DIRECT DATA | `('file', 'tab', 'time row or col', 'first cell')` | Datos (`:=`) |
| GET XLS CONSTANTS / GET DIRECT CONSTANTS | `('file', 'tab', 'first cell')` | Constante (`=`), escalar o array |
| GET XLS LOOKUPS / GET DIRECT LOOKUPS | `('file', 'tab', 'x row or col', 'first cell')` | Lookup: `tabla( GET XLS LOOKUPS(…) )` |
| GET XLS SUBSCRIPT / GET DIRECT SUBSCRIPT | `('file', 'tab', 'first cell', 'last cell', 'prefix')` | Definición de rango: `Region: GET DIRECT SUBSCRIPT(…)` |
| GET 123 … | análogas, para Lotus 1‑2‑3 (heredadas) | (verificar) |
| GET VDF CONSTANTS / DATA / LOOKUPS | lectura desde un `.vdf` de Vensim | (verificar firmas) |

- Todos los argumentos son **cadenas entre comillas simples**. `'time row or col'` es la fila (número) o columna (letra) donde están los tiempos o las x.
- `GET XLS …` usa Excel (Windows); `GET DIRECT …` lee directamente `.xlsx`/`.csv` (y otros formatos de texto) sin Excel y funciona en más plataformas (verificar alcance exacto por versión/edición).
- Los datos se leen al cargar/simular el modelo; si el fichero cambia hay que volver a simular.

---

## 12. Funciones aleatorias

### 12.1 Reglas comunes

- Se genera **un nuevo valor en cada `TIME STEP`** (no en cada `SAVEPER`). Por tanto la "fuerza" del ruido depende de dt: si cambias `TIME STEP` cambia el comportamiento. Para ruido con autocorrelación independiente de dt usa `RANDOM PINK NOISE` o suaviza un ruido blanco con `SMOOTH`.
- **Truncamiento por re‑muestreo**: `min` y `max` truncan la distribución (los valores fuera se descartan, no se acumulan en los límites). Comprobado con 500 000 muestras de Vensim PLE 10.1.4: `RANDOM NORMAL(0, 1000, 0, 1, 0)` tiene media 0.797 (semi‑normal) sin acumulación de valores en 0; `RANDOM EXPONENTIAL(2, 100, 0, 1, 0)` tiene media 3.0.
- **`shift` y `stretch`**: la variable base se transforma como `shift + stretch · x` (desplazar y escalar), y después se trunca a [`min`, `max`].
- **`seed`** (semilla): misma semilla → misma secuencia en cada simulación. En las pruebas, `RANDOM 0 1()` y `RANDOM UNIFORM(0, 1, 0)` produjeron exactamente la misma secuencia. Usa semillas distintas para flujos aleatorios independientes. En análisis de sensibilidad la semilla de ruido global (*Noise Seed*) se cambia en la configuración de la simulación de sensibilidad (verificar detalles; ver `10-analisis-avanzado-sensibilidad-optimizacion.md`).
- Unidades: `min`, `max`, `mean`, `shift`, `stretch` y resultado con las unidades de la variable; `seed` adimensional.
- Funciones discontinuas → simular con Euler.

### 12.2 Tabla de funciones

| Función | Firma | Distribución | Estado |
|---|---|---|---|
| RANDOM 0 1 | `RANDOM 0 1()` | Uniforme en [0, 1] | Confirmada |
| RANDOM UNIFORM | `RANDOM UNIFORM(min, max, seed)` | Uniforme en [min, max] | Confirmada |
| RANDOM NORMAL | `RANDOM NORMAL(min, max, mean, stdev, seed)` | Normal(mean, stdev) truncada a [min, max] | Confirmada |
| RANDOM EXPONENTIAL | `RANDOM EXPONENTIAL(min, max, shift, stretch, seed)` | Exponencial de media `stretch` desplazada `shift`, truncada | Confirmada (estadísticos de Vensim) |
| RANDOM POISSON | `RANDOM POISSON(min, max, mean, shift, stretch, seed)` | Poisson de media `mean`, `shift + stretch·x`, truncada | 6 args y posiciones confirmados (xmutil) |
| RANDOM BINOMIAL | `RANDOM BINOMIAL(min, max, prob, n, shift, stretch, seed)` | Binomial(n, prob), `shift + stretch·x`, truncada | 7 args y posiciones confirmados (xmutil) |
| RANDOM PINK NOISE | `RANDOM PINK NOISE(mean, stdev, correlation time, seed)` | Ruido normal autocorrelado (rosa) | 4 args confirmados; orden (verificar) |
| RANDOM BETA | `RANDOM BETA(min, max, alpha, beta, shift, stretch, seed)` | Beta | (verificar) |
| RANDOM GAMMA | `RANDOM GAMMA(min, max, order, shift, stretch, seed)` | Gamma (Erlang si `order` entero) | (verificar) |
| RANDOM NEGATIVE BINOMIAL | `RANDOM NEGATIVE BINOMIAL(min, max, prob, n, shift, stretch, seed)` | Binomial negativa | (verificar) |
| RANDOM TRIANGULAR | `RANDOM TRIANGULAR(min, max, start, peak, end, seed)` | Triangular | (verificar) |
| RANDOM WEIBULL | `RANDOM WEIBULL(min, max, shape, shift, stretch, seed)` | Weibull | (verificar) |
| RANDOM LOOKUP | `RANDOM LOOKUP(lookup, min, max, seed)` | Distribución empírica dada por un lookup | (verificar) |

No se ha encontrado `RANDOM LOGNORMAL` ni `RANDOM PARETO` en Vensim (verificar si se necesitan; se pueden construir: `EXP(RANDOM NORMAL(...))`).

```vensim
Demanda con ruido = Demanda media * (1 + RANDOM NORMAL(-0.5, 0.5, 0, Desviacion relativa, 17))
	~	Widget/Month
	~	Ruido blanco multiplicativo truncado a +-50 %; semilla 17.
	|
Ruido correlacionado = RANDOM PINK NOISE(0, Desviacion relativa, Tiempo de correlacion, 5)
	~	Dmnl
	~	Orden de argumentos a verificar en la doc (fn_random_pink_noise).
	|
```

---

## 13. Arrays y vectores

Requieren subíndices (ver `06-subindices-y-arrays.md` y §18 sobre ediciones). El signo `!` marca la dimensión sobre la que se agrega.

### 13.1 Agregación: SUM, PROD, VMIN, VMAX

| Función | Firma | Resultado |
|---|---|---|
| SUM | `SUM(expr[r!])` | Suma sobre `r` |
| PROD | `PROD(expr[r!])` | Producto sobre `r` |
| VMIN / VMAX | `VMIN(expr[r!])`, `VMAX(expr[r!])` | Mínimo / máximo sobre `r` |

- El argumento puede ser una expresión: `SUM(Precio[p!] * Cantidad[p!])`. Las dimensiones sin `!` se conservan: `Total por region[region] = SUM(Ventas[region, producto!])`.
- Funcionan con subrangos: `VMAX(x[SubX!])` (salida real de Vensim).
- Varias `!` agregan sobre varias dimensiones: `SUM(x[a!, b!])`.
- Unidades: las del argumento.
- **Multiplicación de matrices** (no hay función específica): `C[i, j] = SUM(A[i, k!] * B[k!, j])`.

### 13.2 ELMCOUNT y subíndices como números

- `ELMCOUNT(range)` → número de elementos del rango (Dmnl). Ej.: `ELMCOUNT(Region)`.
- Un rango usado como variable en una ecuación devuelve la posición del elemento (1, 2, 3…): `Indice[Region] = Region`.

### 13.3 Funciones VECTOR

Todas operan sobre la **última dimensión** del array; PySD reproduce exactamente la salida de Vensim en los 419 resultados del caso de prueba `vector_order`.

| Función | Firma | Qué hace |
|---|---|---|
| VECTOR SORT ORDER | `VECTOR SORT ORDER(vector[r], direction)` | Índices (**base 0**) de los elementos en orden: `direction` > 0 ascendente, ≤ 0 descendente. Ej. Vensim: `h = 2100, 2010, 2020` → ascendente `1, 2, 0`; con `direction = 0` → `0, 2, 1`. |
| VECTOR RANK | `VECTOR RANK(vector[r], direction)` | Rango (**base 1**) de cada elemento: con `direction` = 1 el menor recibe 1. Ej.: `3, 2, 4` → `2, 1, 3`. |
| VECTOR REORDER | `VECTOR REORDER(vector[r], sort order[r])` | Reordena `vector` según un vector de orden (el que devuelve VECTOR SORT ORDER). |
| VECTOR ELM MAP | `VECTOR ELM MAP(vector[first elm], offset)` | Elemento situado `offset` posiciones después del elemento dado (en orden de almacenamiento; base 0). Ej. Vensim: `x = 1,2,3,4,5`, `VECTOR ELM MAP(x[three], DimA - 1)` → `3, 4, 5`. **El primer argumento debe ser una variable**, no una expresión (error de Vensim: "Argument 1 to function VECTOR ELM MAP must be a normal variable"). Fuera de rango → `:NA:` (verificar). |
| VECTOR SELECT | `VECTOR SELECT(selection[r!], expression[r!], missing value, numerical action, error action)` | Agregación condicionada (ver abajo). |
| VECTOR LOOKUP | `VECTOR LOOKUP(vector[first elm], x, xmin, xmax, mode)` | Usa el vector como tabla con x equiespaciados entre `xmin` y `xmax`; `mode` elige el tipo de consulta (lista de códigos 0–9 tomada de un modelo de T. Fiddaman en `06-subindices-y-arrays.md` §9; verificar valores). Firma de 5 args confirmada por xmutil y modelos reales. |

**VECTOR SELECT — códigos** (docstring de PySD, contrastado con Vensim DSS 9.2.4):
- `numerical action`: 0 suma ponderada Σ sel·expr · 1 producto de sel·expr · 2 mínimo de sel·expr · 3 máximo de sel·expr · 4 media de sel·expr · 5 producto de expr^sel (la ayuda dice sel^expr pero Vensim calcula expr^sel) · 6 suma de expr (donde sel ≠ 0) · 7 producto de expr · 8 mínimo de expr · 9 máximo de expr · 10 media de expr. Solo cuentan los elementos con `selection` ≠ 0. Puede ser una expresión dinámica.
- `error action`: 0 ninguno · 1 error si todos los `selection` son 0 · 2 error si hay más de un no‑cero · 3 ambos.
- `missing value`: lo que se devuelve si todos los `selection` son 0 (p. ej. `:NA:` o 0).

```vensim
Ventas regiones activas = VECTOR SELECT(Region activa[Region!], Ventas[Region!], 0, 0, 0)
	~	Widget/Month
	~	Suma de ventas de las regiones con Region activa = 1.
	|
Orden por coste[Planta] = VECTOR SORT ORDER(Coste[Planta], 1)
	~	Dmnl
	~	Índices base 0 de las plantas de menor a mayor coste.
	|
```

### 13.4 INVERT MATRIX

**Firma:** `INVERT MATRIX(matrix[i, j], size)`, con `size` = número de filas (p. ej. `ELMCOUNT(i)`). Devuelve la inversa de la matriz cuadrada definida por las dos últimas dimensiones. Si es singular el resultado no es válido (SDEverywhere devuelve `:NA:`).
```vensim
Inversa[fila, col] = INVERT MATRIX(Matriz A[fila, col], ELMCOUNT(fila))
	~	Dmnl
	~	|
```

### 13.5 TABBED ARRAY

Permite pegar una tabla copiada de una hoja de cálculo (valores separados por tabuladores; filas = primera dimensión, columnas = segunda):
```vensim
Coste[pais, tipo] = TABBED ARRAY(
	11	12	13	14
	15	16	17	18
	19	20	21	22)
	~	$/Widget
	~	|
```
También admite `==` (constante inmutable). Alternativa equivalente: lista con comas y `;` entre filas (`1,2,3,4; 5,6,7,8; …`).

---

## 14. Asignación y mercados (ALLOCATE…)

Funciones para repartir un recurso escaso entre varios solicitantes (y para equilibrar oferta y demanda). La dimensión de reparto es la **última** del array. Los resultados son flujos con las unidades de la solicitud. Ver la página *Allocation overview* (`allocation_overview.html`) de la doc.

### ALLOCATE BY PRIORITY

**Firma:** `ALLOCATE BY PRIORITY(request, priority, size, width, supply)`
- `request[r]`: cantidad solicitada por cada elemento (≥ 0) · `priority[r]`: prioridad (**mayor valor = se atiende antes**) · `size`: número de elementos de `r` (usa `ELMCOUNT(r)`) · `width`: cuánta diferencia de prioridad hace falta para que la asignación vaya primero al de mayor prioridad y al de menor solo le lleguen sobras; si dos prioridades distan más de `width` y el de mayor prioridad no recibe todo, el de menor no recibe nada (`width` > 0) · `supply`: total disponible (≥ 0).
- Si la oferta supera la suma de solicitudes, todos reciben lo pedido y nadie más: el sobrante **no** se conserva automáticamente (calcúlalo aparte si hay que guardarlo).
- Debe ir justo tras el `=` (verificar; SDEverywhere lo exige).

```vensim
Envios[Region] = ALLOCATE BY PRIORITY(Demanda[Region], Prioridad[Region], ELMCOUNT(Region), Ancho prioridad, Oferta total)
	~	Widget/Month
	~	Demanda = 3,2,4; Prioridad = 1,2,3; Oferta = 6 -> Envios = 0, 2, 4 (PySD).
	|
```

### ALLOCATE AVAILABLE

**Firma:** `ALLOCATE AVAILABLE(request, pp, avail)`
- `request[r]`: solicitudes (≥ 0) · `pp[r, pprofile]`: perfil de prioridad de cada solicitante; la última dimensión tiene 4 elementos en este orden: `ptype`, `ppriority`, `pwidth`, `pextra` · `avail`: cantidad disponible.
- `ptype`: 0 cantidad fija (verificar) · 1 rectangular · 2 triangular · 3 normal (`pwidth` = desviación típica) · 4 exponencial (`pwidth` = escala) · 5 elasticidad constante (`pextra` = elasticidad). **Sumar 10** a `ptype` fuerza asignaciones enteras (comentario del modelo de prueba de SDEverywhere derivado del ejemplo de Vensim).
- `ppriority` es el punto medio de la curva de prioridad; `pwidth` su anchura/dispersión. Internamente Vensim busca el nivel de prioridad que reparte exactamente `avail` (las implementaciones de terceros usan optimización y pueden diferir ligeramente cerca de los límites).
```vensim
XPriority: ptype, ppriority, pwidth, pextra ~~|
Perfil prioridad[Region, XPriority] = 1, 5, 2, 0; 1, 7, 2, 0; 1, 6, 2, 0 ~ Dmnl ~|
Envios[Region] = ALLOCATE AVAILABLE(Demanda[Region], Perfil prioridad[Region, XPriority], Oferta total)
	~	Widget/Month
	~	|
```

### DEMAND AT PRICE, SUPPLY AT PRICE, FIND MARKET PRICE

| Función | Firma | Qué devuelve |
|---|---|---|
| DEMAND AT PRICE | `DEMAND AT PRICE(demand quantities, demand profiles, price)` | Cantidad demandada por cada demandante al precio dado, según sus perfiles |
| SUPPLY AT PRICE | `SUPPLY AT PRICE(supply quantities, supply profiles, price)` | Cantidad ofertada por cada oferente al precio dado |
| FIND MARKET PRICE | `FIND MARKET PRICE(demand quantities, demand profiles, supply quantities, supply profiles)` | Precio que iguala oferta y demanda totales |

Los perfiles usan la misma estructura `ptype, ppriority, pwidth, pextra`. Número de argumentos confirmado por SDEverywhere (3, 3 y 4); semántica fina en la doc (verificar).

---

## 15. Colas (QUEUE…)

El índice oficial incluye funciones de colas discretas: `QUEUE FIFO`, `QUEUE AGE AVERAGE` y una familia `QUEUE ATTRIB …` (colas con atributos). No se pudieron confirmar sus firmas ni su disponibilidad por edición **(verificar)** en `https://www.vensim.com/documentation/22300.html`. Ni PySD ni SDEverywhere las implementan. Para colas sencillas suele bastar un `INTEG` con flujo de salida limitado (`MIN(capacidad, Cola / TIME STEP)`) o `DELAY FIXED`/`DELAY MATERIAL`; para entidades individuales con atributos, considera Ventity u otra herramienta de eventos discretos.

---

## 16. Reality Check (RC…)

Funciones usadas en ecuaciones de Reality Check (ver `09-unidades-y-reality-check.md`):
- Entradas de prueba (en definiciones `:TEST INPUT:`): `RC STEP`, `RC RAMP`, `RC GROW`, `RC DECAY` (forzar un cambio en una variable).
- Comparaciones/consecuencias (en `:IMPLIES:`): `RC COMPARE` y las variantes `… CHECK` (p. ej. `RC STEP CHECK`).

```vensim
productividad a cero[sector] :TEST INPUT: productividad[sector] = RC STEP(productividad[sector], 0)
	~	|
sin productividad no hay produccion[sector] :THE CONDITION: productividad a cero[sector]
	:IMPLIES: produccion[sector] <= RC STEP CHECK(0.5, produccion[sector], 0.0001)
	~	|
```
(Ejemplo adaptado del caso `reality_checks` de test-models; el significado exacto de cada argumento de las funciones RC: verificar.) Las Reality Checks no afectan a la simulación normal; se ejecutan con la herramienta Reality Check.

---

## 17. Lo que NO existe en Vensim y cómo sustituirlo

| Lo que el usuario busca | En Vensim |
|---|---|
| `ROUND(x)` | `INTEGER(x + 0.5)` (x ≥ 0) o `QUANTUM(x + 0.5, 1)`; para negativos ajusta el signo. |
| `INT`/`FLOOR` (suelo), `CEILING` | `INTEGER` trunca hacia 0; suelo: `INTEGER(x) - IF THEN ELSE(x < INTEGER(x), 1, 0)`. |
| `MOD` (módulo con signo del divisor, XMILE) | `MODULO` (signo del dividendo); para negativos: `MODULO(MODULO(a, b) + b, b)`. |
| `PI` | Constante propia `pi = 3.14159265358979` (Vensim no tiene `PI` integrado según Simlin/PySD; verificar). |
| `PREVIOUS(x, init)` | `DELAY FIXED(x, TIME STEP, init)` (valor del paso anterior) o `SAMPLE IF TRUE`. |
| `MEAN(x[r])` | `SUM(x[r!]) / ELMCOUNT(r)`. |
| `MIN(x[r])`/`MAX(x[r])` de un argumento | `VMIN(x[r!])` / `VMAX(x[r!])`. |
| `MAX(a, b, c)` | `MAX(a, MAX(b, c))`. |
| `SAFEDIV(a, b, x)` (XMILE) | `XIDZ(a, b, x)` / `ZIDZ(a, b)`. |
| `DELAY(input, t, init)` (XMILE/Stella) | `DELAY FIXED(input, t, init)`. |
| `SMTH1`, `SMTH3`, `SMTHN`, `DELAYN`, `FORCST` (XMILE) | `SMOOTH`/`SMOOTHI`, `SMOOTH3`/`SMOOTH3I`, `SMOOTH N`, `DELAY N`, `FORECAST` (¡orden de argumentos distinto en las de orden N!). |
| Stocks no negativos (opción de Stella) | Limitar el flujo de salida: `MIN(Salida deseada, Stock / Tiempo minimo)`. |
| `IF … THEN … ELSE …` como sentencia | `IF THEN ELSE(cond, a, b)` (función). |
| `ATAN2(y, x)` | `ARCTAN(y/x)` + corrección de cuadrante con `IF THEN ELSE`. |
| `SSHAPE`, `RAMP FROM TO`, `SAMPLE UNTIL` | No son funciones integradas: aparecen como **macros** (`:MACRO: SSHAPE(input)`, `:MACRO: RAMP FROM TO(xfrom, xto, tstart, tend, islinear)`) en modelos como C‑ROADS/En‑ROADS; hay que copiar la macro. |
| Lognormal, Pareto | Construir: `EXP(RANDOM NORMAL(…))`; Pareto por transformada inversa de `RANDOM 0 1()`. |

---

## 18. Disponibilidad por edición y novedades por versión

**Ediciones** (ver `01-productos-licencias-versiones.md`). La documentación advierte que "not all functions are available in all configurations". Reglas prácticas **(verificar en la página de cada función)**:
- Matemáticas, entradas de prueba, `INTEG`, `SMOOTH*`, `DELAY1/3`, `DELAY FIXED`, lookups y aleatorias básicas están en todas las ediciones (los datos de prueba de `RANDOM UNIFORM/NORMAL/EXPONENTIAL` se generaron con **Vensim PLE 10.1.4**).
- Todo lo que necesita **subíndices** (SUM, VMAX, VECTOR…, ALLOCATE…, INVERT MATRIX, TABBED ARRAY) requiere una edición con arrays (Pro/DSS).
- Según la tabla de `01-productos-licencias-versiones.md`: conectividad con datos (variables Data, Excel; previsiblemente `GET XLS`/`GET DIRECT`, verificar) y `GAME`/Gaming desde **PLE Plus**; macros en Pro/DSS (verificar para Pro); funciones externas (DLL de usuario) solo en **DSS**. Asignación/mercado y colas usan subíndices, así que exigen al menos Pro (verificar si alguna es solo DSS).
- Vensim Model Reader ejecuta modelos con cualquier función pero no permite editarlos.

**Versiones.** No se pudo acceder a la página *Function and Language Changes* (`function_changes.html`), que lista las funciones nuevas por versión, por lo que **no se confirma qué funciones se añadieron en Vensim 9 o 10**. Indicios de disponibilidad por versión en los casos de prueba usados: `GET TIME VALUE`, `VECTOR SORT ORDER/RANK/REORDER`, `FORECAST`, `DELAY N` → Vensim DSS 7.3.4; `VECTOR SELECT` → Vensim DSS 9.2.4; `RANDOM …` → PLE 10.1.4; `DELAY FIXED`, `DELAY1/3`, `SMOOTH*` → presentes desde las primeras versiones. `SIMULTANEOUS` aparece en la documentación ("Iterative Solutions to Active Simultaneous Equations", ver `13-buenas-practicas-errores-y-depuracion.md` §3.2), pero su firma y edición no están confirmadas (verificar). Funciones como `FIND ZERO`, `MATRIX MULTIPLY`, `TRANSPOSE` o funciones de texto/cadenas **no se han podido confirmar** como funciones de Vensim: no las propongas sin comprobarlas.

---

## 19. Equivalencias y confusiones frecuentes

1. **SMOOTH vs DELAY1.** Mismas ecuaciones de primer orden; con `delay time` constante dan curvas idénticas. Diferencias: SMOOTH es retraso de **información** (el estado es la salida; continua si cambia el tiempo); DELAY1 es retraso de **material** (el estado es lo que está en tránsito; la salida `LV/delay time` salta si cambia el tiempo, pero el material se conserva). Usa SMOOTH para percepciones/expectativas y DELAY1 para flujos físicos.
2. **DELAY1I vs SMOOTHI: el valor inicial.** En ambos `initial value` es el valor inicial de la **salida** (un flujo en DELAY1I). El contenido inicial del retraso de DELAY1I es `initial value × delay time`.
3. **DELAY3 vs DELAY FIXED vs DELAY N.** DELAY3 reparte la salida en el tiempo (forma de S, media = `delay time`); DELAY FIXED la reproduce exactamente desplazada (tubería; sin dispersión); DELAY N interpola entre ambos según el orden (N grande → DELAY FIXED). DELAY FIXED no admite tiempo variable (se lee al inicio) → `DELAY MATERIAL` (conserva) o `DELAY INFORMATION` (descarta/retiene).
4. **DELAY3I vs DELAY N(…, 3).** Iguales con tiempo constante; distintos si el tiempo cambia (§8.15). El orden de DELAY N se fija al inicio y se reduce si `order·TIME STEP > delay time`.
5. **STEP vs PULSE vs RAMP.** STEP es permanente (altura `height`); PULSE vale 1 durante `width` (no "inyecta" una cantidad: para eso `Q/TIME STEP * PULSE(t, TIME STEP)`); RAMP crece con `slope` y **se mantiene** (no vuelve a 0) tras `end time`.
6. **XIDZ vs ZIDZ.** `ZIDZ(a, b) = XIDZ(a, b, 0)`. Elige el valor por defecto con sentido físico (p. ej. productividad normal, no 0). Ambos consideran "cero" un denominador muy pequeño (≈1e‑6; verificar).
7. **IF THEN ELSE no protege.** No uses `IF THEN ELSE(b = 0, 0, a/b)` para evitar divisiones por cero (usa XIDZ/ZIDZ); y las funciones con estado dentro de una rama no seleccionada siguen evolucionando.
8. **MIN/MAX vs VMIN/VMAX.** `MIN(a, b)` compara dos valores (elemento a elemento si son arrays); `VMIN(x[r!])` reduce un array. `MIN(x[r!])` no es válido.
9. **SUM con y sin `!`.** `SUM(x[r!])` agrega; sin `!` Vensim no sabe sobre qué dimensión sumar (error).
10. **INITIAL vs ACTIVE INITIAL vs SMOOTHI/DELAY…I.** INITIAL congela un valor; ACTIVE INITIAL da un valor distinto solo durante la inicialización (para romper ciclos); las variantes `…I` fijan el estado inicial de un retraso.
11. **INTEGER/QUANTUM/MODULO truncan hacia cero.** `INTEGER(-9.9) = -9`, `MODULO(-9.9, 3) = -0.9`. No hay ROUND.
12. **LOG necesita la base.** `LOG(x, 10)`; `LN(x)` para logaritmo natural.
13. **Lookups no extrapolan.** Fuera del rango devuelven el valor extremo; `LOOKUP EXTRAPOLATE` extrapola. Normaliza la entrada (`x / x normal`) y haz que la tabla pase por (1, 1).
14. **TREND devuelve una tasa fraccional (1/Time)**, no un incremento absoluto; FORECAST devuelve un nivel (unidades de la entrada).
15. **Aleatorias y TIME STEP.** Un valor nuevo por paso: cambiar dt cambia el ruido efectivo. Para Monte Carlo de parámetros usa la herramienta de sensibilidad (distribuciones en el `.vsc`), no `RANDOM …` en una constante; si usas `RANDOM` para un parámetro fijo por simulación, envuélvelo en `INITIAL(RANDOM UNIFORM(…))`.
16. **Argumentos que solo se leen al inicio.** `initial value` de INTEG/SMOOTHI/DELAY…I, `delay time` e `initial value` de DELAY FIXED, `order` de DELAY N/SMOOTH N, `dtime` de DEPRECIATE STRAIGHTLINE, el valor de INITIAL y el segundo argumento de ACTIVE INITIAL. Cambiarlos en SyntheSim/escenarios sí tiene efecto (se reinicializa), pero no durante la simulación.
17. **Comparar `Time` con `=`.** Solo funciona si el instante está en la rejilla de `TIME STEP`; las funciones de prueba usan *time plus* para evitarlo.
18. **PULSE TRAIN y XMILE.** Vensim: `PULSE TRAIN(start, width, tbetween, end)` (devuelve 1); XMILE: `PULSE(magnitude, first, interval)` (devuelve magnitud/dt).
19. **SMOOTH N / DELAY N vs XMILE.** Vensim pone `initial value` antes de `order`; XMILE (`SMTHN`, `DELAYN`) pone `n` antes de `initial`.
20. **Funciones que deben ir solas tras el `=`.** Confirmadas en la doc: ACTIVE INITIAL, DELAY MATERIAL, DELAY INFORMATION. Práctica estándar (y exigido por SDEverywhere, que imita a Vensim): INTEG, DELAY FIXED, INITIAL, SAMPLE IF TRUE, GAME, WITH LOOKUP, ALLOCATE…, GET…, DEPRECIATE STRAIGHTLINE (verificar redacción para cada una). Si necesitas operar con el resultado, usa una variable intermedia.
21. **`:NA:` se propaga.** Operar con `:NA:` da resultados sin sentido; compruébalo con `= :NA:` antes de usar datos incompletos.

---

## 20. Compatibilidad con PySD y SDEverywhere

| Función | PySD 3.14 | SDEverywhere (C) | Observaciones |
|---|---|---|---|
| Matemáticas (ABS…TANH, INTEGER, MODULO, QUANTUM, XIDZ, ZIDZ, IF THEN ELSE, LOG, POWER) | Sí | Sí (no SINH/COSH/TANH listadas) | `GAMMA LN`: solo SDE. |
| STEP, RAMP, PULSE, PULSE TRAIN | Sí | Sí | PySD: `PULSE(start, 0)` no dispara (Vensim lo trata como width = TIME STEP). |
| INTEG, INITIAL, ACTIVE INITIAL, SAMPLE IF TRUE | Sí | Sí | |
| SMOOTH/SMOOTHI/SMOOTH3/SMOOTH3I | Sí | Sí | SMOOTH N: solo PySD. |
| DELAY1/1I/3/3I, DELAY FIXED | Sí | Sí | DELAY N: solo PySD. DELAY MATERIAL/INFORMATION/CONVEYOR/BATCH/PROFILE/DELAYP: ninguno. |
| TREND, FORECAST, NPV | TREND, FORECAST | TREND, NPV | |
| DEPRECIATE STRAIGHTLINE | No | Parcial (sin `fisc`) | |
| Lookups, WITH LOOKUP | Sí | Sí (+ LOOKUP FORWARD/BACKWARD/INVERT, GET DATA BETWEEN TIMES) | |
| GET XLS/DIRECT DATA/CONSTANTS/LOOKUPS/SUBSCRIPT | Sí | Sí (SUBSCRIPT solo CSV) | |
| RANDOM 0 1, UNIFORM, NORMAL, EXPONENTIAL | Sí | No | Resto de RANDOM: no. |
| SUM, PROD, VMIN, VMAX, ELMCOUNT, VECTOR SELECT, SORT ORDER, RANK, REORDER, INVERT MATRIX | Sí | SUM, VMIN, VMAX, ELMCOUNT, VECTOR SELECT (acciones 0 y 3), SORT ORDER, ELM MAP, INVERT MATRIX | |
| ALLOCATE AVAILABLE, ALLOCATE BY PRIORITY | Sí (perfiles parciales) | Sí; + DEMAND/SUPPLY AT PRICE, FIND MARKET PRICE | |
| GAME, GET TIME VALUE | Sí (GAME = valor sin juego; GET TIME VALUE parcial) | GAME | |
| SHIFT IF TRUE, QUEUE…, RC… | No | No | |

Un fallo de traducción en PySD/SDEverywhere no implica que el modelo sea inválido en Vensim.

---

## 21. Fuentes

**Documentación oficial de Vensim** (consultada mediante extractos de búsqueda y citas literales recogidas en el código de Simlin/PySD/SDEverywhere; vensim.com no era accesible directamente):
- Summary List of Functions: https://www.vensim.com/documentation/22300.html
- Páginas de función `https://www.vensim.com/documentation/fn_<nombre>.html`, en particular: `fn_delay_fixed`, `fn_delay_information`, `fn_delay_material`, `fn_delay_n`, `fn_delay_conveyor`, `fn_delay_batch`, `fn_delay_profile`, `fn_delayp`, `fn_delay1`, `fn_delay3`, `fn_smooth`, `fn_smoothi`, `fn_smooth3`, `fn_smooth_n`, `fn_pulse`, `fn_pulse_train`, `fn_quantum`, `fn_modulo`, `fn_integer`, `fn_active_initial`, `fn_a_function_of`, `fn_time_base`, `fn_lookup_extrapolate`, `fn_lookup_forward`, `fn_lookup_backward`, `fn_vector_select`, `fn_vector_sort_order`, `fn_vector_rank`, `fn_vector_reorder`, `fn_vector_elm_map`, `fn_get_time_value`, `fn_allocate_available`, `fn_allocate_by_priority`, `fn_shift_if_true`, `fn_random`, `fn_log`.
- Macros: https://www.vensim.com/documentation/macros.html · Allocation overview: https://www.vensim.com/documentation/allocation_overview.html · Function and Language Changes: https://www.vensim.com/documentation/function_changes.html (no consultada).

**Implementaciones y pruebas que reproducen Vensim** (repositorios clonados localmente):
- PySD 3.14.3 (SDXorg/pysd): `docs/tables/*.tab`, `pysd/py_backend/functions.py`, `statefuls.py`, `allocation.py`, `data.py`, `builders/python/python_functions.py`, `docs/structure/vensim_translation.rst`.
- SDEverywhere (climateinteractive/SDEverywhere): `packages/cli/src/c/vensim.h`, `vensim.c`, `packages/compile/src/model/read-equations.js`, `read-equation-fn-*.js`; modelos con salida real de Vensim en `models/` (`delayfixed`, `depreciate`, `npv`, `quantum`, `sample`, `vector`, `getdata`, `pulsetrain`, `allocate`, `trend`); wiki *Supported Vensim Functions*.
- SDXorg/test-models: `tests/` (salidas de Vensim DSS 6.4–9.2 para `delays`, `forecast`, `input_functions`, `rounding`, `vector_order`, `vector_select`, `get_time_value`, `dynamic_final_time`, `reality_checks`, `tabbed_arrays`…) y `random/` (500 000 muestras de Vensim PLE 10.1.4).
- xmutil (bobeberlein/xmutil): `src/Function/Function.h`, `Function.cpp` (nombres y número de argumentos de funciones Vensim, traducción de RANDOM BINOMIAL/POISSON/NORMAL, LOG, TIME BASE).
- Simlin (bpowers/simlin): `src/simlin-engine/src/mdl/builtins.rs`, `xmile_compat.rs`, `writer.rs`, `docs/design/mdl-parser.md`, `vensim-probes/README.md` (citas literales de la doc de Vensim y pruebas con Vensim DSS).
- Comprobaciones numéricas propias con PySD 3.14.3 (comparación SMOOTH/DELAY1/DELAY3I/DELAY N con tiempo variable; validación de los ejemplos de este documento).
