# 10 — Análisis avanzado: sensibilidad, optimización, calibración, MCMC, Kalman y análisis estructural

Referencia práctica de las herramientas "avanzadas" de Vensim: simulaciones de sensibilidad / Monte Carlo (`.vsc`, `.lst`), optimización y calibración (`.voc`, `.vpd`, `.out`), calibración bayesiana con MCMC, filtrado de Kalman, análisis de estructura (bucles, árboles causales), diseño de escenarios y rendimiento. Palabras clave, opciones y menús en inglés, tal como los usa Vensim.

> Convención: **(verificar)** = no confirmado contra la documentación oficial (vensim.com/documentation, no accesible directamente al construir esta base; se usaron extractos de búsqueda, archivos reales de Vensim y conocimiento general). La disponibilidad por edición (PLE, PLE Plus, Pro, DSS) se resume en `01-productos-licencias-versiones.md`; según esa tabla, la sensibilidad Monte Carlo está desde **PLE Plus**; optimización/calibración, MCMC y Kalman desde **Professional**; multi-core, simulación compilada y Venapps solo en **DSS** (verificar matriz exacta en tu versión).

## Tabla de contenidos

1. [Mapa rápido de herramientas y archivos](#1-mapa-rápido-de-herramientas-y-archivos)
2. [Análisis de sensibilidad / Monte Carlo](#2-análisis-de-sensibilidad--monte-carlo)
3. [Optimización y calibración](#3-optimización-y-calibración)
4. [Payoff: archivo `.vpd`](#4-payoff-archivo-vpd)
5. [Control de optimización: archivo `.voc`](#5-control-de-optimización-archivo-voc)
6. [Intervalos de confianza y sensibilidad del payoff](#6-intervalos-de-confianza-y-sensibilidad-del-payoff)
7. [Archivos de salida de la optimización](#7-archivos-de-salida-de-la-optimización)
8. [Calibración bayesiana con MCMC](#8-calibración-bayesiana-con-mcmc)
9. [Filtrado de Kalman (Pro/DSS)](#9-filtrado-de-kalman-prodss)
10. [Flujo de calibración típico, paso a paso](#10-flujo-de-calibración-típico-paso-a-paso)
11. [Análisis de estructura y comportamiento](#11-análisis-de-estructura-y-comportamiento)
12. [Políticas, escenarios y diseño de experimentos](#12-políticas-escenarios-y-diseño-de-experimentos)
13. [Rendimiento: compilación, paralelismo, multicontexto](#13-rendimiento-compilación-paralelismo-multicontexto)
14. [Fuentes](#fuentes)

---

## 1. Mapa rápido de herramientas y archivos

| Tarea | Herramienta Vensim | Archivos de entrada | Salidas principales |
|---|---|---|---|
| Incertidumbre de parámetros, Monte Carlo, barridos | **Sensitivity** (*Sensitivity Simulation*) | `.vsc` (control), `.lst` (*savelist*) | Dataset del run con N simulaciones; gráficos de bandas de confianza |
| Ajuste a datos (calibración) | **Optimize** con payoff de calibración (`*C`) | `.vpd` (payoff), `.voc` (control) | `run.vdf(x)`, `run.out`, `run.log`, `run.rep` |
| Optimización de políticas | **Optimize** con payoff de política (`*P`) | `.vpd`, `.voc` | Igual |
| Intervalos de confianza de parámetros | `:SENSITIVITY=PAYOFF_VALUE` (o MCMC) | `.voc` | `run_sensitive.tab` (nombre según versión) |
| Posterior bayesiana | `:OPTIMIZER=MCMC` | `.voc`, `.vpd` (+ priors) | `run_MCMC_sample.tab`, `_points.tab`, `_clust.tab`, `.vsc` generado |
| Estimación de estado con ruido | Kalman filtering (Pro/DSS según `01`) | `.vpd` (varianzas de medida), `kalman.prm` | Run filtrado; `1step.err`/`2step.err` |
| Escenarios | Simulate + `.cin` | `.cin` | Un dataset por escenario |
| Estructura | Causes/Uses Tree, Loops, Causes Strip, Document | — | Ventanas de análisis |

El propio `.mdl` recuerda los últimos archivos usados en su bloque de *settings* (visto en un modelo real de Vensim): `11:` → `.voc`, `12:` → `.vpd`, `18:` → `.vsc`, `20:` → `.lst`.

```text
11:ccv11 fit mcmc.voc
12:cal us cases deaths 11.vpd
18:ccv12 uncert.vsc
20:ccv9 save.lst
```

---

## 2. Análisis de sensibilidad / Monte Carlo

### 2.1 Concepto

*Sensitivity Simulation* ejecuta el modelo muchas veces variando **constantes** del modelo según distribuciones de probabilidad (o barridos) y guarda las trayectorias de las variables de la *savelist*. Sirve para propagar incertidumbre de parámetros, probar robustez de políticas y hacer barridos deterministas. Solo se pueden variar **Constants** (no Levels, auxiliares ni datos); para variar un lookup, parametrízalo (p.ej. multiplica su salida o su entrada por una constante) — (verificar si tu versión permite variar lookups directamente).

### 2.2 Asistente (wizard)

1. Botón **Sensitivity** de la barra (o desde el control de simulación) → asistente de *Sensitivity Simulation Setup*.
2. Elegir/crear el archivo de control `.vsc`: número de simulaciones, tipo de muestreo, semilla, y para cada parámetro (*Currently Active Parameters*) la distribución y sus argumentos.
3. Elegir la *savelist* `.lst` (variables a guardar). Guardar solo lo necesario: con 1000 simulaciones el dataset crece rápido.
4. *Finish* → simula todas las corridas en el dataset con el nombre del run.

Por comandos (scripts/DLL, confirmado en `venpy`):

```text
SIMULATE>RUNNAME|incertidumbre
SIMULATE>SENSITIVITY|mi_modelo.vsc
SIMULATE>SENSSAVELIST|mi_modelo.lst
MENU>RUN_SENSITIVITY|o
```

### 2.3 Formato del archivo `.vsc`

Primera línea (documentada en *Control File Format – Sensitivity Simulations*):

```text
#simulaciones , método={U|M|L|G|F} , semilla , archivo , avisos={0|1}
```

| Campo | Valores | Significado |
|---|---|---|
| `#simulaciones` | entero | Número de simulaciones. |
| método | `U` | **Univariate**: varía un parámetro cada vez (los demás en su valor base). |
| | `M` | **Multivariate**: todos los parámetros se muestrean simultáneamente (Monte Carlo simple). |
| | `L` | **Latin Hypercube**: muestreo estratificado (mejor cobertura con menos simulaciones). |
| | `G` | **Latin Grid** (rejilla latina) (verificar semántica exacta). |
| | `F` | **File**: lee los valores de los parámetros de un archivo (p.ej. la muestra de un MCMC). |
| semilla | entero | Por defecto **1234**. Entre 1 y 2³¹ (≈2e9), o 1 y 2²³ en precisión simple. **Negativa** → usa el generador LCG antiguo (*legacy*). **0** → semilla aleatoria no reproducible (útil para repartir muestras distintas entre varios ordenadores sin editar el archivo). |
| archivo | nombre o vacío | Archivo de valores para el método `F`. |
| avisos | `0` / `1` | Mostrar o no avisos durante las corridas. |

Siguientes líneas: una por parámetro, `Constante=DISTRIBUCION(argumentos)`.

**Distribuciones**: las distribuciones de sensibilidad son idénticas a las funciones `RANDOM …` de Vensim **sin el último argumento de semilla**, y todas están **truncadas** por el mínimo y el máximo indicados. En el archivo se escriben con guion bajo (`RANDOM_UNIFORM`); como en todo Vensim, espacio y `_` son equivalentes.

| Distribución en `.vsc` | Argumentos | Notas |
|---|---|---|
| `RANDOM_UNIFORM(min,max)` | mínimo, máximo | La más usada para rangos plausibles sin más información. |
| `RANDOM_NORMAL(min,max,media,desv)` | truncada en [min,max] | Confirmado en `.vsc` real. |
| `RANDOM_TRIANGULAR(min,max,inicio,pico,fin)` | truncada en [min,max]; la forma va de `inicio` a `fin` con moda `pico` | Mezclando valores se obtienen formas de "tienda" asimétricas. |
| `VECTOR(...)` | recorre una serie de valores crecientes | Para análisis univariado o búsqueda exhaustiva en rejilla. Argumentos habituales: mínimo, máximo, incremento (verificar). |
| Otras (`RANDOM_EXPONENTIAL`, `RANDOM_LOGNORMAL`, `RANDOM_GAMMA`, `RANDOM_BETA`, `RANDOM_POISSON`, `RANDOM_WEIBULL`, `RANDOM_BINOMIAL`, `RANDOM_NEGATIVE_BINOMIAL`…) | los de la función `RANDOM` homónima sin semilla | Ver `05-referencia-de-funciones.md` (verificar lista exacta disponible en el asistente). |

### 2.4 Ejemplos de `.vsc`

**Ejemplo real** (generado por Vensim; modelo COVID de T. Fiddaman, repositorio oficial `venpy`): 100 simulaciones, multivariado, semilla 1234, sin archivo, avisos desactivados.

```text
100,M,1234,,0
Log10 Fatality Rate=RANDOM_NORMAL(-3,-1,-2.3,0.3)
R0=RANDOM_TRIANGULAR(2.2,5,2.5,3.5,4.5)
Seasonal Amplitude=RANDOM_TRIANGULAR(0,0.5,0,0.1,0.5)
Available Hospital Beds per 000 Capita=RANDOM_TRIANGULAR(1,3,1,2,3)
High Risk Share=RANDOM_TRIANGULAR(0.1,0.5,0.1,0.2,0.5)
Statistical Value of Life=RANDOM_TRIANGULAR(0,1.5e+07,1e+06,1e+07,1.5e+07)
```

Nótese el truco de muestrear `Log10 Fatality Rate` (y calcular la tasa como `10^Log10 Fatality Rate` en el modelo) para obtener una distribución log-normal en un parámetro que abarca órdenes de magnitud.

**Ejemplo de la documentación**: 250 simulaciones multivariadas, avisos desactivados.

```text
250,M,1234,,0
PRICE OF STEEL=RANDOM TRIANGULAR(.5,1.5,.5,1,1.5)
BUILDING TIME=RANDOM UNIFORM(11,15)
```

**Latin Hypercube para el modelo SIR** (escrito para esta base):

```text
200,L,1234,,0
Contact Infectivity=RANDOM_UNIFORM(0.2,0.4)
Duration=RANDOM_TRIANGULAR(3,8,3,5,8)
Total Population=RANDOM_NORMAL(800,1200,1000,100)
```

**Barrido univariado determinista** (sintaxis de `VECTOR` a verificar):

```text
11,U,1234,,0
Duration=VECTOR(3,8,0.5)
```

**Método File** (p.ej. con la muestra de un MCMC): la primera línea nombra el archivo tabulado con una columna por parámetro y una fila por simulación (verificar el formato exacto de cabeceras; el `.vsc` que genera el propio MCMC ya viene configurado):

```text
1000,F,1234,calib_MCMC_sample.tab,0
```

Subíndices: un parámetro subscriptado puede variarse por elemento (`Precio[norte]=RANDOM_UNIFORM(…)`) o para todo el rango (verificar si todos los elementos reciben la misma extracción o extracciones independientes). Parámetros **correlacionados**: Vensim muestrea cada línea de forma independiente; para correlación, muestrea un factor común y deriva los parámetros en el modelo, o usa el método `F` con una muestra preparada fuera (Python, MCMC).

### 2.5 *Savelist* `.lst`

Texto plano, un nombre de variable por línea (ejemplo real):

```text
Active Infectious
Cumulative Cost
Deaths
Total Deaths
Peak Prevalence
```

Incluye las variables de interés **y** las que quieras graficar; lo que no esté en la lista no se guarda en las corridas de sensibilidad.

### 2.6 Resultados: gráficos y exportación

- **Bandas de confianza** (*Sensitivity Graph*): para la variable de trabajo, Vensim dibuja la mediana y bandas de percentiles; por defecto **50 %, 75 %, 95 % y 100 %** (verificar colores y dónde se cambian los percentiles). Alternativamente se pueden mostrar las trayectorias individuales.
- Valores en un instante (distribución de resultados en t): vía DLL `vensim_get_sens_at_time(run, var, "Time", t, vals, maxn)` (usado por `venpy`), o exportando.
- **Exportación**: *Exporting Sensitivity Results* en la doc; comando `MENU>SENS2FILE|vdffile|outfile|…` (ver `11-automatizacion-scripts-dll-python.md` §2.4) para volcar las corridas de sensibilidad a archivo tabulado (verificar argumentos adicionales).
- **Vensim 10.3**: casilla en la configuración de sensibilidad para variar también la `NOISE SEED` en cada simulación, combinando incertidumbre de parámetros (p.ej. muestra MCMC) con incertidumbre aleatoria del ruido del modelo; nuevas variables especiales reservadas para que las salidas de MCMC se ignoren en sensibilidad.

### 2.7 Buenas prácticas

- Empieza con Latin Hypercube (`L`) y 200–1000 simulaciones; comprueba que los percentiles no cambian al duplicar N (o con otra semilla).
- Rangos con significado (literatura, datos, juicio experto documentado en el comentario de la constante).
- Univariado (`U`) para *screening* (qué parámetros importan); multivariado/LHS para la incertidumbre conjunta.
- Distingue **incertidumbre de parámetros** (sensibilidad) de **ruido estocástico** (funciones `RANDOM` en el modelo con `NOISE SEED`): para el segundo, varía la semilla.
- Con modelos estocásticos o discretos usa Euler (archivo 08).

---

## 3. Optimización y calibración

### 3.1 Concepto

Vensim **maximiza** un *payoff* variando los parámetros listados en el `.voc` dentro de sus rangos. El algoritmo por defecto es un **Powell modificado** (búsqueda por direcciones conjugadas sin derivadas, *hill climbing*): rápido y robusto, pero **local**; para problemas multimodales se usa el inicio múltiple (`:MULTIPLE_START`).

Dos usos:
- **Calibración** (payoff `*C`): el payoff es (menos) la discrepancia ponderada entre una variable del modelo y su serie de datos; maximizarlo es minimizar el error. Con ponderación correcta es una log-verosimilitud.
- **Optimización de políticas** (payoff `*P`): el payoff es un indicador de desempeño (beneficio acumulado, coste, bienestar) que se maximiza (o minimiza con peso negativo) variando parámetros de decisión.

### 3.2 Asistente de optimización

1. Botón **Optimize** (desde la barra o el control de simulación) → *Optimization wizard*.
2. **Payoff definition** (`.vpd`): elegir variables, tipo (calibración/política), variable de datos y peso. Se puede editar en el diálogo o en texto.
3. **Optimization control** (`.voc`): parámetros a buscar con mínimo/máximo (e inicial), y opciones (Optimizer, Sensitivity, Multiple Start, tolerancias…). Botón *Next* para opciones avanzadas.
4. **Payoff Report** (casilla): guarda las contribuciones de cada elemento del payoff en `run.rep` (y archivos de residuos, ver 7).
5. *Finish* → optimiza; el progreso (mejor payoff, número de simulaciones) aparece en una ventana de mensajes y en `run.log`.

Por comandos (verificar nombres): `SIMULATE>PAYOFF|archivo.vpd`, `SIMULATE>OPTPARM|archivo.voc`, `MENU>RUN_OPTIMIZE|o`.

---

## 4. Payoff: archivo `.vpd`

### 4.1 Formato básico

Texto plano con dos tipos de entrada: **especificaciones de tipo** (`*C`, `*P`, …) y **elementos** del payoff. Un tipo se aplica a todos los elementos siguientes hasta que aparece otro (se puede repetir antes de cada línea, pero no es necesario).

```text
*C
modelo|datos/peso
*P
variable/peso
```

- Calibración: `variable del modelo|variable de datos/peso` — ejemplo de la doc: `wolves|measured wolves/1`.
- Política: `variable/peso`.
- El **peso puede ser una variable** del modelo (no solo un número), y se admiten rangos de subíndices siempre que coincidan entre modelo y datos (`Casos[region]|Casos data[region]/Peso casos[region]`).
- La variable de datos debe existir en el modelo como variable de datos (`:=`, `GET XLS DATA`, o variable de datos alimentada por un dataset en *Data used*; ver archivo 07). El error solo se acumula en los instantes con dato disponible (verificar el tratamiento exacto de huecos y de instantes entre `SAVEPER`).

### 4.2 Interpretación del peso (calibración clásica `*C`)

| Caso | Interpretación del peso | Contribución al payoff |
|---|---|---|
| `*C` sin modificador (Normal, por defecto) | **peso = 1 / desviación típica** del error de medida (≥ 0) | `−((modelo − dato) · peso)²` sumado en el tiempo |
| Un solo elemento en el payoff | El valor del peso solo **escala** el payoff: no cambia el óptimo | — |
| Con **Kalman filtering** activo | El peso es la **varianza** del error de medida de esa serie (significado completamente distinto) | log-verosimilitud del filtro |

Regla práctica: pondera para que todos los elementos tengan el mismo orden de magnitud; lo ideal es `peso = 1/σ` con σ estimada (error de medida o desviación de los residuos de un primer ajuste). Con `peso = 1/σ`, `−payoff` es una suma de cuadrados ponderada que, salvo constante, vale `−2·ln(verosimilitud)` — base de los intervalos de la sección 6.

### 4.3 Tipos extendidos de elemento (Vensim 7+, ampliados en 10.x)

El `*C` admite un **modificador de transformación** (`L` o `X`) y un **modificador de distribución** (`G, K, O, R, Y, H, B, P` o `D`). Lo confirmado en la documentación:

| Código | Significado | Escala / peso |
|---|---|---|
| `*C` | Normal (por defecto): suma de cuadrados ponderada | peso = 1/σ |
| `*CG` | **Gaussian**: log-verosimilitud normal **completa** | el parámetro es la **σ** del error de medida (la forma más cómoda: σ es la medida más intuitiva de calidad del dato). Al incluir el término de normalización, σ puede **estimarse** como parámetro. |
| `*CK` | Gaussiano con interpretación del peso igual que en Kalman | peso = varianza |
| `*CR` | **Robust**: basado en el valor absoluto de las diferencias | escala = MAD/ln(2) > 0 |
| `*CP` | **Poisson** (conteos) | — |
| `*CB` | **Binomial** | — |
| `*CL` | Errores en **espacio logarítmico** (transforma modelo y dato con log) | — |
| `*CGL`, `*CRL` | Combinaciones: gaussiano o robusto sobre log-transformados | — |
| `X`, `O`, `Y`, `H`, `D` | Otros modificadores de transformación/distribución (verificar significado en *Payoff Element Types*) | — |
| `*P` | Política: contribución `peso · variable` acumulada a lo largo de la simulación (verificar si se multiplica por `TIME STEP`) | peso > 0 maximiza, < 0 minimiza |
| `*PF` | Política calculada **solo en `FINAL TIME`** | — |
| `*R` | **pRior** (10.3): mismo comportamiento que `*P`, pero se contabiliza aparte (prior bayesiano) | — |
| `*RI` | Prior calculado **solo en `INITIAL TIME`** | — |

Notas:
- Los elementos Poisson/Binomial o con transformación logarítmica añaden una **penalización grande si el modelo genera valores ≤ 0**.
- Con Kalman, una distribución no gaussiana se traduce automáticamente al formato Kalman; en Poisson (media = varianza) el filtro usa N(media, media).
- Para un prior sobre una constante usa `*RI` (una sola contribución); con `*R` a secas se sumaría en cada instante.

### 4.4 Ejemplos de `.vpd`

**Calibración simple** (SIR contra datos de infectados y recuperados; pesos = 1/σ):

```text
*C
Infectious|Infectious data/0.1
Recovered|Recovered data/0.02
```
Lectura: σ(Infectious) ≈ 10 personas, σ(Recovered) ≈ 50 personas.

**Calibración con verosimilitud gaussiana y σ estimable**:

```text
*CG
Infectious|Infectious data/Sigma infectious
```
con `Sigma infectious` como constante del modelo incluida en el `.voc` como parámetro a estimar.

**Conteos y datos en log**:

```text
*CP
Reported Cases|Reported Cases data/1
*CGL
Hospitalized|Hospitalized data/0.2
```
(Escalas ilustrativas; verificar el significado de la escala en `*CGL` y si `*CP` usa el peso.)

**Política con objetivo en el instante final y prior**:

```text
*PF
Cumulative Discounted Profit/1
*P
Backlog Cost/-1
*RI
Log Prior Duration/1
```
con, en el modelo, `Log Prior Duration = -0.5*((Duration - 5)/1.5)^2 ~ Dmnl` (log-densidad normal de un prior N(5, 1.5²), sin constante).

---

## 5. Control de optimización: archivo `.voc`

### 5.1 Estructura

1. Opciones `:CLAVE=valor` (deben ir **antes** de los parámetros).
2. Lista de parámetros de búsqueda, uno por línea:

```text
min <= Nombre de constante = valor inicial <= max
```

- `min`/`max` pueden ser números o **constantes del modelo**; el parámetro nunca sale de ese rango.
- El valor inicial es opcional (`4 <= WORK SPEED BASE <= 10` usa el valor del modelo).
- Subíndices: `-2.048<=x[i]=0<=2.048` (elemento o rango).
- Tolerancia por parámetro: la documentación describe además un tipo de tolerancia (`FRAC` o `ABS`) y un valor por parámetro que prevalece sobre el global (verificar sintaxis exacta en *Specifying Optimization Control*).
- Parámetros **discretos** (con `:STOCHASTIC`, ver 5.4): `0 <= x[i] <= 10|DIS=1` (verificar separador).
- **Priors en la lista de parámetros** (Vensim 10.3): se pueden declarar directamente en la línea del parámetro (verificar sintaxis).
- Líneas `:COM texto` como comentario (verificar).

### 5.2 Opciones (confirmadas en la documentación salvo indicación)

| Opción | Valores (defecto) | Significado |
|---|---|---|
| `:OPTIMIZER=` | `POWELL` (defecto), `OFF`, `MCMC` | Powell modificado; `OFF` = no optimiza (solo simula o ejecuta la sensibilidad / búsqueda en rejilla); `MCMC` = Markov chain Monte Carlo (sección 8). |
| `:SENSITIVITY=` | `OFF`, `PAYOFF_VALUE{=4.0}`, `PAYOFF_PERCENT{=10.0}`, `PARAMETER_PERCENT{=10.0}`, `ALL_CONSTANTS{=10.0}`, `PAYOFF MCMC` | Sensibilidad del payoff / intervalos de confianza (sección 6). |
| `:MULTIPLE_START=` | `OFF`, `RANDOM`, `RRANDOM`, `XPARALLEL`, `RPARALLEL`, `GRID`, `VECTOR`, `SVECTOR` | Reinicia la optimización desde varios puntos o, con `OPTIMIZER=OFF`, simula en distintos valores. `RANDOM`: puntos uniformes en el rango de cada parámetro (el primero es siempre el inicial). `GRID` + `OPTIMIZER=OFF`: búsqueda en rejilla de definición creciente. `VECTOR`/`SVECTOR`: búsqueda a lo largo de un vector. `RRANDOM`, `XPARALLEL`, `RPARALLEL`: variantes (aleatorio reiniciado / paralelo; verificar semántica). |
| `:VECTOR_POINTS=` | `25` | Puntos a lo largo del vector (solo con `VECTOR`/`SVECTOR`). |
| `:MAX_ITERATIONS=` | `1000` | Máximo de pasadas por la lista de parámetros (evita bucles infinitos). |
| `:PASS_LIMIT=` | `2` | Número de búsquedas Powell completas; al inicio de cada una se reinicializa el conjunto de direcciones (evita direcciones colapsadas). |
| `:FRACTIONAL_TOLERANCE=` | `0.0003` | Criterio de parada: cada parámetro se refina hasta `tolerancia × (max − min)`; sin rango, `tolerancia × max(1, |valor inicial|)`. |
| `:TOLERANCE_MULTIPLIER=` | `21` | Relaja la tolerancia en las búsquedas tempranas/gruesas (multi-inicio) para que terminen rápido y la búsqueda fina parta de un buen punto. |
| `:ABSOLUTE_TOLERANCE=` | — | Error aceptable en los Levels para la convergencia de la integración RK de paso variable; tolerancias por parámetro prevalecen sobre la global (la doc mezcla ambos usos; verificar). |
| `:STOCHASTIC` | (palabra clave) | Optimización estocástica (5.4). |
| `:MCLIMIT`, `:MCBURNIN`, `:MCSAMPLE`, `:MCDECIMATE`, `:MCRECORD`, `:MCINITMETHOD`, `:MCTEMP`, `:MCPROGRESS` | ver sección 8 | Opciones de MCMC. |

Opciones que aparecen en `.voc` generados por Vensim pero no confirmadas aquí (verificar antes de usar): `:RANDOM_NUMBER=`, `:OUTPUT_LEVEL=`, `:TRACE=`, `:RESTART_MAX=` (número de reinicios del multi-inicio), `:SCALE_ABSOLUTE=`, `:MCNCHAINS=`, `:MCDEBUG=`. No se encontró documentación de una opción llamada simplemente `SCALE`; la de puntos del vector se escribe `VECTOR_POINTS`.

### 5.3 Ejemplos de `.voc`

**Calibración local con intervalos de confianza** (SIR):

```text
:OPTIMIZER=Powell
:SENSITIVITY=PAYOFF_VALUE=4
:MULTIPLE_START=OFF
:MAX_ITERATIONS=1000
:PASS_LIMIT=2
:FRACTIONAL_TOLERANCE=0.0003
:TOLERANCE_MULTIPLIER=21
0.05<=Contact Infectivity=0.3<=1
1<=Duration=5<=15
100<=Total Population=1000<=5000
```

1. Powell desde los valores iniciales.
2. Al terminar, para cada parámetro busca cuánto hay que moverlo (por debajo y por encima) para que el payoff empeore 4 unidades → ≈ IC 95 % si `.vpd` usa `peso = 1/σ` (sección 6).
3. Rangos amplios pero físicamente plausibles: el optimizador nunca los rebasa y la tolerancia se calcula sobre ellos.

**Búsqueda global por multi-inicio**:

```text
:OPTIMIZER=Powell
:SENSITIVITY=OFF
:MULTIPLE_START=RANDOM
:PASS_LIMIT=2
:FRACTIONAL_TOLERANCE=0.0003
:TOLERANCE_MULTIPLIER=21
0.05<=Contact Infectivity=0.3<=1
1<=Duration=5<=15
```
(El número de reinicios se controla con una opción adicional — `RESTART_MAX` en `.voc` generados por Vensim, verificar.)

**Búsqueda en rejilla sin optimizar** (mapa del payoff):

```text
:OPTIMIZER=OFF
:MULTIPLE_START=GRID
0.05<=Contact Infectivity=0.3<=1
1<=Duration=5<=15
```

**Cribado de sensibilidad de todas las constantes** (sin optimizar; verificar que `OPTIMIZER=OFF` ejecuta la sensibilidad):

```text
:OPTIMIZER=OFF
:SENSITIVITY=ALL_CONSTANTS=10
```
Genera `sortsens.tab` con las constantes ordenadas por impacto en el payoff (una medida tipo elasticidad del payoff ante ±10 %).

**Política** (maximizar beneficio descontado variando dos palancas):

```text
:OPTIMIZER=Powell
:MULTIPLE_START=RANDOM
0<=Fraction of Revenue to Marketing=0.1<=0.5
1<=Capacity Acquisition Time=4<=24
```
con un `.vpd` `*PF Cumulative Discounted Profit/1`.

### 5.4 Optimización estocástica y parámetros discretos

Añadiendo la palabra clave `:STOCHASTIC` a un `.voc` existente, Vensim trata el payoff como ruidoso (modelos con funciones `RANDOM`), útil para buscar políticas robustas frente al ruido. Ejemplo de la doc (función de prueba): `-2.048<=x[i]=0<=2.048`. Con *Discrete Constraints* se restringen parámetros a valores discretos: `0 <= x[i] <= 10|DIS=1` (paso 1). Detalles del algoritmo y opciones asociadas: página *Stochastic Optimization* (verificar).

---

## 6. Intervalos de confianza y sensibilidad del payoff

`:SENSITIVITY=` tiene cuatro modos principales (+ MCMC):

| Modo | Qué hace | Cuándo |
|---|---|---|
| `PAYOFF_VALUE=v` (defecto 4) | Tras el óptimo, para cada parámetro busca los valores (inferior y superior) que **reducen el payoff en `v` unidades** | Payoff = log-verosimilitud verdadera o suma de cuadrados correctamente ponderada → intervalos de confianza |
| `PAYOFF_PERCENT=p` (defecto 10) | Ídem, reducción de un `p` % del payoff | Payoffs de política o sin interpretación estadística |
| `PARAMETER_PERCENT=p` (defecto 10) | Cambia cada parámetro de búsqueda ±`p` % e informa del cambio del payoff | Sensibilidad local |
| `ALL_CONSTANTS=p` (defecto 10) | Lo mismo para **todas** las constantes del modelo; crea además `sortsens.tab` ordenado por impacto | Cribado de parámetros |
| `PAYOFF MCMC` | Usa MCMC como método de sensibilidad del payoff con Powell (`:OPTIMIZER=Powell`, `:SENSITIVITY=PAYOFF MCMC=valor`, `:MCLIMIT=10000`) | Intervalos sin suponer cuadraticidad (verificar sintaxis exacta) |

`PAYOFF_VALUE` y `PAYOFF_PERCENT` **solo tienen sentido en un óptimo**.

**Elección del valor** (razón de verosimilitudes): `2·ln(L_max/L)` ~ χ² con 1 grado de libertad.
- Payoff = suma de cuadrados ponderada con `peso = 1/σ` (`*C` normal) → `−payoff = −2 ln L + cte` → usar **3.84 (≈ 4)** para un IC del 95 %.
- Payoff = log-verosimilitud real (Kalman, `*CG`, distribuciones extendidas) → usar **1.92 (≈ 2)** = 3.84/2.

Advertencias: los IC son marginales (un parámetro cada vez, los demás fijos en el óptimo); con parámetros correlacionados o residuos autocorrelacionados (lo normal en series temporales) **subestiman** la incertidumbre. Para incertidumbre conjunta, usa MCMC.

Salida: `runname_sensitive.tab` (versiones antiguas: `sensitiv.tab` / `sensitivity.tab`) y, con `ALL_CONSTANTS`, `sortsens.tab`.

---

## 7. Archivos de salida de la optimización

Tras cada optimización con nombre de run `runname`:

| Archivo | Contenido |
|---|---|
| `runname.vdf` / `.vdfx` | Simulación final con los parámetros óptimos. |
| `runname.out` | Mejor payoff, motivo de parada y **valores óptimos** de los parámetros, junto con las opciones y comentarios del `.voc` de entrada. |
| `runname.log` | Historial de mensajes de la optimización. |
| `runname.rep` | *Payoff Report* (si se activó): contribuciones absolutas y relativas de cada elemento al payoff (log-verosimilitud). Antes se llamaba `payoff.rep`. |
| `1step.err`, `2step.err` | Residuos modelo vs datos (cuando aplica, p.ej. con Kalman); se pueden cargar en Vensim con Dat2VDF. |
| `runname_sensitive.tab`, `sortsens.tab` | Resultados de `:SENSITIVITY` (sección 6). |
| `runname_<tipo>…` | Archivos de multi-inicio, vector o sensibilidad: se nombran con el run seguido de `_tipo de búsqueda`. |
| `runname_MCMC_*.tab`, `.vsc` | Salidas de MCMC (sección 8). |

**Reutilizar el óptimo**: el `.out` tiene líneas `min<=parámetro=valor<=max` compatibles con un archivo de cambios: cárgalo como *changes file* (igual que un `.cin`) para reproducir la corrida óptima o como punto de partida de otro escenario (práctica habitual; verificar en tu versión). Para incorporar los valores definitivamente al modelo, cópialos a las ecuaciones (documentando fuente y fecha en el comentario).

Herramienta **Stats** (doc: *Stats tool*): estadísticos de ajuste modelo-dato (verificar contenido; p.ej. R²). Estadísticos de Theil (descomposición del error en sesgo, varianza y covarianza) no forman parte del payoff: calcúlalos exportando las series.

---

## 8. Calibración bayesiana con MCMC

### 8.1 Concepto e historia

MCMC (*Markov chain Monte Carlo*) explora la calibración realizando un "paseo aleatorio" sobre la superficie de verosimilitud que define el payoff; la muestra de puntos aceptados aproxima la **distribución posterior** conjunta de los parámetros (con priors, ver 8.3). Disponible en Vensim desde la **6.0** (2012; ver historial en `01-productos-licencias-versiones.md`), con gran mejora de rendimiento en 6.3; edición: Professional/DSS según `01` (verificar). El algoritmo está adaptado de **DREAM** (Vrugt, ter Braak, Diks, Robinson, Hyman & Higdon, *Accelerating MCMC simulation by differential evolution with self-adaptive randomized subspace sampling*) y en **Vensim 10.3 (febrero 2025)** se actualizó a **DREAM-ZS** (Vrugt 2016) para mejor tasa de aceptación y convergencia más rápida. La misma maquinaria sirve para *simulated annealing* (con `MCTEMP`; página *Markov Chain Monte Carlo & Simulated Annealing*).

Requisito clave: el payoff debe ser una **log-verosimilitud** bien especificada (pesos = 1/σ correctos, `*CG` con σ, Poisson…), porque MCMC interpreta literalmente su escala; un payoff mal ponderado produce posteriores demasiado estrechas o anchas.

### 8.2 Opciones

| Opción | Significado (confirmado salvo indicación) |
|---|---|
| `:OPTIMIZER=MCMC` | Activa MCMC en lugar de Powell. |
| `:MCLIMIT=` | Iteraciones máximas. Si `<= 0` se calcula como `MCBURNIN + MCSAMPLE·MCDECIMATE` (recomendado: dejar 0). |
| `:MCBURNIN=` (defecto 0) | Iteraciones de calentamiento (*burn-in*) cuyos puntos aceptados no se registran (cadenas aún no estacionarias). |
| `:MCSAMPLE=` | Tamaño de muestra deseado a reportar. |
| `:MCDECIMATE=` | Aclarado (*thinning*): solo se reporta una de cada N iteraciones (p.ej. 5). |
| `:MCRECORD=` | Permite suprimir puntos repetidos (MCMC no acepta un punto nuevo en cada iteración; las repeticiones son estadísticamente necesarias, suprímelas solo en uso heurístico). |
| `:MCINITMETHOD=` | Método de inicialización de las cadenas; defecto 0 (3 en sensibilidad del payoff); existe un método *Hybrid* cuya inicialización es totalmente paralela desde 10.3 (verificar códigos). |
| `:MCTEMP=` | Temperatura (p.ej. 100) para *simulated annealing* (verificar valor neutro, presumiblemente 1). |
| `:MCPROGRESS=` | Frecuencia/forma de reporte de progreso (verificar). |

### 8.3 Priors

- Sin priors explícitos, los rangos `min<=p<=max` del `.voc` actúan como prior uniforme acotado.
- Elemento **`*R` / `*RI`** en el `.vpd` (10.3): escribe la log-densidad del prior como ecuación del modelo e inclúyela como elemento prior (sección 4.4).
- Desde 10.3 también se pueden especificar priors directamente en la lista de parámetros del `.voc` (verificar sintaxis).

### 8.4 Salidas

| Archivo | Contenido |
|---|---|
| `runname_MCMC_sample.tab` | Puntos **aceptados** y sus payoffs tras el *burn-in* (tabulado). Es la muestra posterior. |
| `runname_MCMC_points.tab` | Diagnóstico con más información, incluidos los puntos **rechazados**. |
| `runname_MCMC_clust.tab` | Agrupamiento **k-means** de la muestra: un subconjunto representativo para explorar la variación sin generar demasiadas corridas. |
| Archivo de estadísticas (*stats*) | Estadísticos de convergencia/resumen; ampliado en 10.3 (incluye distribuciones marginales). |
| `.vsc` generado | Control de sensibilidad listo para usar con método `F` que apunta a `runname_MCMC_sample.tab` (se puede cambiar a `_clust.tab`). |

### 8.5 Ejemplo de `.voc` MCMC

```text
:OPTIMIZER=MCMC
:SENSITIVITY=OFF
:MCLIMIT=0
:MCBURNIN=5000
:MCSAMPLE=10000
:MCDECIMATE=5
0.05<=Contact Infectivity=0.3<=1
1<=Duration=5<=15
1<=Sigma infectious=10<=100
```
Iteraciones totales = 5000 + 10000·5 = 55 000 simulaciones (más las de inicialización): con un modelo grande conviene compilar y paralelizar (sección 13).

### 8.6 De la posterior a bandas de predicción

1. Corre MCMC (`runname` = `calib`).
2. Abre el `.vsc` generado (método `F`, archivo `calib_MCMC_sample.tab` o `calib_MCMC_clust.tab`).
3. Define la *savelist* con las variables a proyectar y lanza **Sensitivity** con ese `.vsc` → bandas de confianza que reflejan la incertidumbre conjunta y correlaciones de los parámetros.
4. (10.3) Marca la variación de `NOISE SEED` si el modelo tiene ruido de proceso, para combinar incertidumbre de parámetros y aleatoria.
5. Comprueba convergencia: varias cadenas, trazas estables, resultados similares con más iteraciones o distinta semilla.

---

## 9. Filtrado de Kalman (Pro/DSS)

### 9.1 Concepto

El filtro de Kalman combina el modelo (con **ruido de conducción** en los Levels) y mediciones ruidosas para estimar el estado no observado en cada instante, corrigiendo la trayectoria del modelo hacia los datos según las varianzas relativas. En Vensim permite: (a) medir indirectamente variables no observadas; (b) combinado con optimización ("estadística de Schweppe"), estimar parámetros estructurales con conocimiento limitado de las características estocásticas, maximizando la verosimilitud de las **innovaciones** (errores de predicción a un paso) — más robusto que el ajuste por simulación pura cuando hay ruido de proceso.

### 9.2 Qué hace falta

1. **Payoff `.vpd`** con las mediciones: con Kalman activo, el **peso es la varianza del error de medida** de cada serie.
2. **Archivo de control del filtro**, que debe llamarse **`kalman.prm`**: covarianza del ruido de conducción y covarianza inicial del estado. La implementación supone que el ruido actúa directamente sobre los Levels. Formato por línea:

```text
Nivel/varianza del ruido de conducción/varianza inicial
```
Ejemplo de la doc: `Lev_1/.34/1000` (ruido sobre `Lev_1` con varianza 0.34; varianza inicial de `Lev_1` = 1000). La varianza puede ser el nombre de una constante del modelo, lo que permite **estimarla** optimizando:

```text
inventory/inventory drive variance/.1
workforce/workforce drive variance/.1
```
3. Activar el filtrado de Kalman en la configuración avanzada de la simulación/optimización (verificar ubicación exacta del control en tu versión).

### 9.3 Ejemplo de la documentación (fuerza laboral e inventario)

Ruido de conducción a través de `net hire noise` (4) y `productivity noise` (0.20); mediciones `meas workforce` y `meas inventory`, mediciones directas de los Levels con errores (`workforce meas noise` = 0.025, `inventory meas noise` = 0.1). La varianza de medida del inventario usada en el payoff es 55 ≈ 0.0833·(0.1·300)² (varianza de un ruido uniforme de amplitud 0.1·300). Si no se conocen las varianzas, se pueden incluir en la búsqueda junto con los tiempos de ajuste (*Optimizing Everything*).

### 9.4 Notas

- El payoff con Kalman es la log-verosimilitud real → `:SENSITIVITY=PAYOFF_VALUE=1.92` (≈ 2) para IC 95 %.
- Distribuciones no gaussianas del `.vpd` se traducen al formato Kalman automáticamente (Poisson → N(media, media)).
- Para modelos no lineales el filtro linealiza (filtro extendido) (verificar detalles de implementación).
- Los archivos `1step.err`/`2step.err` del *Payoff Report* contienen los residuos para diagnóstico (blancura, sesgo).

---

## 10. Flujo de calibración típico, paso a paso

1. **Modelo listo**: unidades consistentes (*Units Check*), *Reality Check* básico, dt verificado (archivo 08), Euler salvo razón para RK.
2. **Datos**: importa las series (Excel/CSV → `GET XLS DATA`/`GET DIRECT DATA` o dataset `.vdfx` cargado en *Data used*). Crea variables de datos con nombres claros (`Infectious data`). Comprueba unidades y fechas (archivo 07).
3. **Corrida base** con los valores a priori; grafica modelo vs datos en el mismo gráfico. Si la forma del comportamiento no se parece, revisa la **estructura** antes de calibrar.
4. **Elige parámetros a estimar**: pocos, inciertos y con influencia (usa `:SENSITIVITY=ALL_CONSTANTS=10` con `OPTIMIZER=OFF` o un univariado para cribar). Fija el resto con fuentes documentadas.
5. **Payoff** (`.vpd`): `*C modelo|datos/peso` con `peso = 1/σ`; si σ es desconocida, primer ajuste con pesos razonables, estima σ = √(SSE/N) de los residuos y vuelve a ajustar (o usa `*CG` con σ como parámetro).
6. **Control** (`.voc`): rangos plausibles; Powell; `:MULTIPLE_START=RANDOM` si sospechas óptimos locales; `:SENSITIVITY=PAYOFF_VALUE=4` (o 1.92 con verosimilitud real).
7. **Optimize** con un run nuevo (`calib1`). Revisa `calib1.out` (parámetros en el borde del rango = señal de mala especificación), `calib1.rep` (qué serie domina el error), y el gráfico final.
8. **Diagnóstico de residuos**: sesgo sistemático, autocorrelación, heterocedasticidad (exporta y analiza fuera si hace falta). Residuos estructurados ⇒ falta estructura, no más parámetros.
9. **Incertidumbre**: IC por `PAYOFF_VALUE` o, mejor, **MCMC** (sección 8) → `.vsc` generado → **Sensitivity** para bandas de proyección.
10. **Validación**: reserva parte de los datos (ajusta hasta t₁, compara después); prueba la plausibilidad de parámetros; repite *Reality Check*.
11. **Documenta y aplica**: usa el `.out` como archivo de cambios para los escenarios; copia valores al modelo con comentario (fuente, fecha, run de calibración); versiona `.vpd`, `.voc`, `.out`, `.vsc` junto al `.mdl`.

---

## 11. Análisis de estructura y comportamiento

### 11.1 Herramientas de análisis (sobre la *workbench variable*)

| Herramienta | Uso |
|---|---|
| **Causes Tree** / **Uses Tree** | Árbol de causas (qué determina la variable) y de usos (a qué afecta), con profundidad configurable. |
| **Loops** | Lista todos los bucles de realimentación que pasan por la variable de trabajo, con su longitud. Base para identificar y nombrar bucles R/B. |
| **Causes Strip** | Gráficos apilados de la variable y sus causas directas: permite "tirar del hilo" de un comportamiento hacia atrás. |
| **Document** | Ecuaciones, unidades y comentarios de la variable (o de todo el modelo). |
| **Graph**, **Table**, **Table Time Down** | Comportamiento numérico de las corridas cargadas. |
| **Runs Compare** | Diferencias de constantes y lookups entre corridas. |

**Causal Tracing** (término de Ventana): el método de recorrer el diagrama desde un síntoma hacia sus causas usando *Causes Strip*/*Causes Tree* con las corridas cargadas, combinando estructura y comportamiento. En SyntheSim, los mini-gráficos en el diagrama y la *Causes Strip* se actualizan al mover deslizadores, lo que acelera este rastreo (archivo 08).

### 11.2 Dominancia de bucles

- **Loops That Matter** (LTM; Schoenberg, Davidsen & Eberlein, 2020) está implementado en **Stella Architect** (*Loop Dominance Analysis*) y en **Simlin** (código abierto, importa `.mdl`). **No se ha podido confirmar** que Vensim (hasta 10.x) incluya un análisis automático de dominancia de bucles (verificar en las notas de versión).
- En Vensim, la dominancia se analiza con métodos "manuales":
  1. **Desactivación de bucles** (*loop knockout*): introduce una constante interruptor en un enlace del bucle (`Efecto = IF THEN ELSE(Switch bucle R1 = 1, efecto normal, valor neutro)`) y compara corridas.
  2. **Pruebas parciales**: fijar una variable (`INITIAL(x)`) para cortar un bucle y ver el comportamiento resultante.
  3. **SyntheSim + Causes Strip** para ver qué ganancias cambian cuando el comportamiento cambia de modo (crecimiento exponencial → saturación).
  4. Herramientas externas: Simlin/LTM, análisis de elasticidad de autovalores o *pathway participation* (p.ej. Digest), exportando el modelo (verificar compatibilidad).
- **Elasticidad**: Vensim no tiene una herramienta "Elasticity" dedicada (verificar). Aproximaciones: `:SENSITIVITY=PARAMETER_PERCENT=10` o `ALL_CONSTANTS=10` (cambio del payoff ante ±10 % de cada parámetro), o sensibilidad univariada sobre una variable de resultado.
- No existe (que se sepa) una herramienta llamada "Model Analyzer" en Vensim.

---

## 12. Políticas, escenarios y diseño de experimentos

- **Escenarios discretos**: un `.cin` por escenario (archivo 08), corridas con nombres explícitos y comparación con *Runs Compare* y gráficos. Combina `.cin` (base de datos + política) con `READCIN` + `ADDCIN`.
- **Diseño de experimentos**:
  - *One-factor-at-a-time*: Sensitivity univariada (`U`) o `VECTOR`.
  - *Factorial completo*: varios `VECTOR` en multivariado o `:MULTIPLE_START=GRID` con `:OPTIMIZER=OFF` (verificar combinación), o un script que recorra los `.cin`.
  - *Muestreo eficiente*: Latin Hypercube (`L`).
  - *Exploratory Modeling and Analysis*: EMA Workbench (Python) controla Vensim vía DLL (`SIMULATE>SETVAL`, `READCIN`, `RUNNAME`, `MENU>RUN`) o PySD, con muestreo, PRIM/escenario-discovery y robustez (archivo 11).
- **Optimización de políticas**: `.vpd` `*P`/`*PF` con el indicador de desempeño (preferible un Level acumulado — beneficio descontado, coste total — evaluado en `FINAL TIME`), `.voc` con las palancas y sus rangos factibles, `:MULTIPLE_START=RANDOM`. Valida la política optimizada con Sensitivity sobre los parámetros inciertos (robustez) o con `:STOCHASTIC` si hay ruido.
- **Escenarios subscriptados**: un subíndice `Escenario` replica el modelo; las palancas se definen por elemento y una sola corrida produce todos los escenarios:

```vensim
Escenario: base, precio alto, marketing alto
	~
	~	Escenarios evaluados en paralelo dentro de una corrida.
	|
Precio[Escenario] = 10, 14, 10
	~	$/Widget
	~		|
Gasto marketing[Escenario] = 100, 100, 250
	~	$/Month
	~		|
```
Ventajas: comparación directa en tablas y gráficos, compatible con optimización/sensibilidad. Inconvenientes: todas las ecuaciones afectadas deben subscriptarse.

---

## 13. Rendimiento: compilación, paralelismo, multicontexto

- **Simulación compilada (DSS)**: Vensim DSS puede traducir el modelo a C y compilarlo para simular mucho más rápido (útil en optimización, MCMC y sensibilidad con miles de corridas). Requiere un **compilador de C** instalado y configurado (en Windows, Microsoft Visual C++/Visual Studio) (verificar versiones soportadas, la opción exacta y la situación en macOS). Las funciones externas (*external functions*, DLL de usuario) también requieren DSS.
- **Paralelismo**: la documentación incluye una página *Parallel Simulation*; las opciones `:MULTIPLE_START=XPARALLEL`/`RPARALLEL` corresponden a búsquedas de inicio múltiple en paralelo, y en **10.3** la fase de inicialización de MCMC es totalmente paralela. La configuración de núcleos y qué tareas se paralelizan (sensibilidad, optimización) dependen de versión/edición (verificar).
- **Multicontexto**: la DLL de Vensim en su versión "servidor" admite varios contextos de modelo simultáneos (funciones tipo `vensim_contextadd` / `vensim_contextdrop`, según el conector de EMA Workbench; verificar nombres en la documentación de la DLL). Útil para ejecutar varios modelos o instancias desde una aplicación.
- **Reducir coste por corrida**: *savelist* mínima; `SAVEPER` mayor; `FINAL TIME` lo necesario; evitar RK Auto si no aporta; cachear datos externos (convertir Excel a `.vdfx`); reducir dimensiones de subíndices en experimentos.
- Alternativas fuera de Vensim para lotes masivos: PySD (Python) o SDEverywhere (C/WebAssembly, solo Euler), ver archivo 15.

---

## Fuentes

Documentación oficial de Vensim (consultada mediante extractos de búsqueda; el sitio no era accesible directamente):
- Specifying Optimization Control — https://www.vensim.com/documentation/optimizationcontrol.html
- Optimization Options — https://vensim.com/documentation/optimizationoptions.html
- Examples of Optimization Control Files — http://vensim.com/documentation/23595.html
- Multiple Start – Optimization — https://www.vensim.com/documentation/multiple_start.html
- Stochastic Optimization — https://www.vensim.com/documentation/stochastic_optimization.html ; Discrete Constraints — https://www.vensim.com/documentation/discrete_constraints.html
- Payoff Definitions (.vpd files) — https://www.vensim.com/documentation/ref_payoff.html ; File Format — https://www.vensim.com/documentation/23560.html ; Payoff Element Types — https://www.vensim.com/documentation/extended_payoffs.html ; Payoff Computation — https://www.vensim.com/documentation/payoffcomputation.html ; Payoff Report — https://www.vensim.com/documentation/extended_payoff_reporting.html
- Payoff Sensitivity — https://www.vensim.com/documentation/payoff_sensitivity.html ; Computing Confidence Bounds — https://www.vensim.com/documentation/21320.html
- Optimization Output — https://www.vensim.com/documentation/23600.html ; Starting the Optimization — https://www.vensim.com/documentation/23585.html
- MCMC Options — http://vensim.com/documentation/mcmc_options.html ; MCMC Output — https://www.vensim.com/documentation/mcmc_output.html ; Markov Chain Monte Carlo & Simulated Annealing — https://www.vensim.com/documentation/mcmc_sa.html
- Vensim 10.3 (February 2025) release notes — https://vensim.com/documentation/vensim-10_3.html
- Control File Format – Sensitivity Simulations — https://www.vensim.com/documentation/sensitivitycontrol.html ; Sensitivity Distributions — https://www.vensim.com/documentation/sensitivitydistributions.html ; Sensitivity Simulations — https://www.vensim.com/documentation/sensitivity.html ; SENS2FILE — https://www.vensim.com/documentation/sens2file.html ; Exporting Sensitivity Results — https://www.vensim.com/documentation/ref_data_export_sensi.html
- Kalman Filtering — https://www.vensim.com/documentation/ref_kalman.html ; Driving Noise and Initial State Covariance — https://www.vensim.com/documentation/23625.html ; Kalman Example — https://www.vensim.com/documentation/23630.html ; Combining Filtering and Optimization — https://www.vensim.com/documentation/23635.html ; Optimizing Everything — https://www.vensim.com/documentation/23640.html
- Parallel Simulation — https://vensim.com/documentation/parallel-simulation.html ; Stats tool — https://www.vensim.com/documentation/ref_stats.html
- T. Fiddaman, *Calibration with Vensim* (2022), partes 1 y 2 — https://vensim.com/wp-content/uploads/2022/07/CalibrationWithVensim2022-pt1.pdf

Archivos y código reales:
- Repositorio oficial `venpy` (Ventana): modelo `community virus simple arr v14.mdl` (bloque de settings con `.voc`/`.vpd`/`.vsc`/`.lst`), `ccv12 uncert.vsc`, `ccv9 save.lst`, `control.cin`, y comandos `SIMULATE>SENSITIVITY`, `SIMULATE>SENSSAVELIST`, `MENU>RUN_SENSITIVITY`, `vensim_get_sens_at_time` — https://github.com/pbreach/venpy (y fork de Vensim).
- EMA Workbench, conector Vensim (`vensimDLLwrapper.py`: DLL simple/doble, contextos) — https://github.com/quaquel/EMAworkbench
- Simlin (implementación de Loops That Matter) — https://github.com/bpowers/simlin
- Vrugt, J. A. (2016). Markov chain Monte Carlo simulation using the DREAM software package. *Environmental Modelling & Software* 75, 273–316.
- Vrugt, J. A., ter Braak, C. J. F., Diks, C. G. H., Robinson, B. A., Hyman, J. M., Higdon, D. (2009). Accelerating Markov chain Monte Carlo simulation by differential evolution with self-adaptive randomized subspace sampling. *Int. J. Nonlinear Sciences and Numerical Simulation* 10(3).
- Schoenberg, W., Davidsen, P., Eberlein, R. (2020). Understanding model behavior using the Loops that Matter method. *System Dynamics Review* 36(2).
- Schweppe, F. C. (1973). *Uncertain Dynamic Systems*. Prentice-Hall (base del enfoque filtrado + optimización).
