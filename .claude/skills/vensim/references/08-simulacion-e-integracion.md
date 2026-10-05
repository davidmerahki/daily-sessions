# 08 — Simulación e integración numérica en Vensim

Cómo Vensim avanza un modelo en el tiempo: variables de control, elección del `TIME STEP`, métodos de integración, ciclo de cálculo (inicialización → auxiliares/flujos → integración → guardado), configuración y comparación de corridas, SyntheSim, Gaming y depuración numérica. Los menús, palabras clave y funciones se dan en inglés, tal como aparecen en Vensim.

> Convención: lo marcado **(verificar)** no se pudo confirmar contra la documentación oficial (vensim.com/documentation) y procede de conocimiento general, de parsers de terceros o de inferencia. Los ejemplos numéricos se reprodujeron con PySD 3.14 (que integra solo con Euler, igual que el Euler de Vensim) y con NumPy.

## Tabla de contenidos

1. [Variables de control del tiempo](#1-variables-de-control-del-tiempo)
2. [Cómo elegir el TIME STEP](#2-cómo-elegir-el-time-step)
3. [Métodos de integración](#3-métodos-de-integración)
4. [El ciclo de simulación](#4-el-ciclo-de-simulación)
5. [Stocks no negativos: la forma correcta](#5-stocks-no-negativos-la-forma-correcta)
6. [Configurar una corrida](#6-configurar-una-corrida)
7. [Comparar corridas y corridas múltiples](#7-comparar-corridas-y-corridas-múltiples)
8. [SyntheSim](#8-synthesim)
9. [Gaming (función GAME)](#9-gaming-función-game)
10. [Precisión numérica y depuración](#10-precisión-numérica-y-depuración)
11. [Checklist rápido](#11-checklist-rápido)
12. [Fuentes](#fuentes)

---

## 1. Variables de control del tiempo

Todo modelo de Vensim tiene cuatro variables de control, normalmente en el grupo `.Control` del `.mdl`:

| Variable | Significado | Valor típico | Notas |
|---|---|---|---|
| `INITIAL TIME` | Instante inicial de la simulación | 0, 2000… | Referenciable en ecuaciones (p.ej. `Time - INITIAL TIME`). |
| `FINAL TIME` | Instante final | 100, 2050… | Puede ser una expresión (ver 1.3). |
| `TIME STEP` | Paso de integración (dt) | 1, 0.5, 0.25, 0.125, 0.0625… | Debe ser > 0. Elegir potencia de 2 (sección 2). |
| `SAVEPER` | Cada cuánto se **guardan** resultados en el dataset | `TIME STEP` o 1 | Múltiplo entero de `TIME STEP`. No afecta al cálculo, solo a lo que se guarda. |

Forma estándar en el `.mdl` (la generan los modelos nuevos de Vensim):

```vensim
********************************************************
	.Control
********************************************************~
		Simulation Control Parameters
	|

FINAL TIME  = 100
	~	Month
	~	The final time for the simulation.
	|

INITIAL TIME  = 0
	~	Month
	~	The initial time for the simulation.
	|

SAVEPER  =
        TIME STEP
	~	Month [0,?]
	~	The frequency with which output is stored.
	|

TIME STEP  = 0.125
	~	Month [0,?]
	~	The time step for the simulation.
	|
```

- `[0,?]` tras la unidad es una **especificación de rango** (mínimo 0, sin máximo). Los rangos `[min,max,incremento]` también fijan los límites de los deslizadores de SyntheSim (sección 8).
- La unidad de `INITIAL TIME`, `FINAL TIME`, `TIME STEP` y `SAVEPER` es la **unidad de tiempo del modelo** (Month, Year, Day, Week, Hour…). Esa misma unidad es la que se usa implícitamente al integrar: en `Stock = INTEG(flujo, inicial)` el flujo debe tener unidades `unidad_del_stock/unidad_de_tiempo` (ver `09-unidades-y-reality-check.md`).
- La variable `Time` (tiempo actual) existe siempre y no se define.

### 1.1 Dónde se configuran

**Model > Settings… > pestaña Time Bounds**. Campos: `INITIAL TIME`, `FINAL TIME`, `TIME STEP`, `SAVEPER` (*Save results every*), **Units for Time** e **Integration Type**. Editar estos campos reescribe las ecuaciones del grupo `.Control`; también se pueden editar directamente como cualquier ecuación (son constantes normales del modelo).

### 1.2 Unidad de tiempo y fechas

- Cambiar *Units for Time* no reescala ningún valor: si pasas de `Month` a `Year`, tienes que reescribir tiempos de ajuste, retrasos y tasas.
- El bloque de *settings* al final del `.mdl` guarda, además, ajustes de presentación de fechas (líneas `35:Date`, `36:YYYY-MM-DD`, `37:`–`40:` origen y tipo de calendario, según los comentarios del escritor de `.mdl` de Simlin) para mostrar el eje de tiempo como calendario (verificar desde qué versión y dónde se configura en la interfaz).

### 1.3 Variables de control dinámicas

- `FINAL TIME` puede ser una expresión que cambie durante la corrida: Vensim detiene la simulación cuando `Time` alcanza el valor actual de `FINAL TIME`. El caso de prueba `dynamic_final_time` de *SDXorg/test-models* (generado con Vensim DSS 7.3.4) usa:

  ```vensim
  FINAL TIME = IF THEN ELSE(my control var > 50, Time, max time)
  	~	Month
  	~	Detiene la simulación cuando se cumple la condición.
  	|
  ```
  y la salida termina en t = 28 en vez de 100. Útil para "simular hasta que ocurra X".
- `TIME STEP` y `INITIAL TIME` deben tratarse como constantes (no los hagas depender de variables dinámicas).
- `SAVEPER = TIME STEP` es el valor por defecto de los modelos nuevos; en modelos grandes o con dt muy pequeño conviene `SAVEPER` mayor (p.ej. 1) para reducir el tamaño del dataset.

---

## 2. Cómo elegir el TIME STEP

### 2.1 Regla práctica

> `TIME STEP` ≤ entre **1/4 y 1/10 de la constante de tiempo más pequeña** del modelo, y **potencia de 2**.

Constantes de tiempo a revisar:

| Estructura | Constante de tiempo efectiva |
|---|---|
| `Flujo = Stock / tiempo` (decaimiento, ajuste) | `tiempo` |
| `SMOOTH(x, T)`, `DELAY1(x, T)` | `T` |
| `SMOOTH3(x, T)`, `DELAY3(x, T)` | **`T/3`** (cada una de las 3 etapas internas) |
| `DELAY N(x, T, init, N)`, `SMOOTH N` | **`T/N`** |
| Salidas limitadas `MIN(deseado, Stock/tiempo mínimo)` | `tiempo mínimo` |
| Oscilaciones | Periodo / (2π) aproximadamente; usar ≥ 20–30 pasos por periodo con Euler |

Ejemplo: `DELAY3(pedidos, 3)` en un modelo mensual tiene etapas de 1 mes → `TIME STEP` ≤ 0.25 (mejor 0.125).

### 2.2 Por qué potencias de 2 (0.5, 0.25, 0.125, 0.0625, 0.03125…)

Los números en coma flotante son binarios: 0.125 = 2⁻³ se representa **exactamente**, 0.1 no. Al acumular `Time` paso a paso con un dt no binario aparecen errores de redondeo que pueden desplazar un paso entero los eventos definidos con comparaciones sobre `Time` (`Time >= x`, `Time = x` dentro de `IF THEN ELSE`). `STEP`, `PULSE` y `PULSE TRAIN` comparan con *time plus* = `Time + TIME STEP/2` precisamente para evitarlo (ver `05-referencia-de-funciones.md` §5; así lo implementan también PySD y SDEverywhere). Demostración en Python (doble precisión):

```text
0.1 sumado 10 veces   = 0.9999999999999999   ==1.0? False
0.125 sumado 8 veces  = 1.0                  ==1.0? True
0.1 sumado 1000 veces = 99.9999999999986
0.0625 sumado 1000 v. = 62.5
Time >= 1 con Time acumulado y dt=0.1: se cumple en el paso 11 (Time=1.0999…), no en el 10
```

Con precisión simple (algunas compilaciones antiguas de Vensim eran *single precision*; *test-models* documenta salidas de "Vensim DSS 7.3.4 single precision" y "double precision") el problema es mucho mayor. Además, con un dt binario `SAVEPER` = 1 es múltiplo exacto de `TIME STEP`. El cuadro de *Time Bounds* ofrece precisamente valores de dt en potencias de 2 (verificar la lista exacta del desplegable).

### 2.3 SAVEPER múltiplo de TIME STEP

Vensim solo calcula en los instantes `INITIAL TIME + k·TIME STEP`. Si `SAVEPER` no es múltiplo entero de `TIME STEP`, los instantes de guardado no coinciden con instantes calculados (Vensim avisa o ajusta; verificar el comportamiento exacto). Regla: `SAVEPER = n · TIME STEP` con n entero. El caso `euler_step_vs_saveper` de *test-models* (dt = 0.03125, SAVEPER = 1) comprueba que el cálculo usa `TIME STEP` y no `SAVEPER`.

### 2.4 Test de sensibilidad al paso: "reducir a la mitad"

Procedimiento estándar de verificación:
1. Simula con el `TIME STEP` actual (run `base`).
2. Simula con `TIME STEP` a la mitad (run `dt_mitad`) sin cambiar nada más.
3. Compara las variables clave (graph con ambas corridas, o `Table`). Si la diferencia es apreciable para el propósito del modelo, el dt era demasiado grande: repite reduciendo.
4. Opcional: compara Euler vs RK4 con el mismo dt (sección 3). Si difieren mucho, o el dt es grande o hay discontinuidades.

Resultado reproducible con PySD sobre el modelo SIR de *test-models* (`Duration` = 5 días es la constante de tiempo menor), Euler, `SAVEPER = 1`:

| TIME STEP | Pico de `Infectious` | Diferencia máx. con dt/2 |
|---|---|---|
| 2 | 72.008 (t=42) | — |
| 1 | 69.993 (t=41) | 1.88 personas (2.7 % del pico) |
| 0.5 | 68.969 (t=40) | — |
| 0.25 | 68.506 | 0.45 (0.66 %) vs 0.125 |
| 0.0625 | 68.143 | 0.11 (0.16 %) vs 0.03125 |
| 0.03125 | 68.081 | — |

El error de Euler es de **primer orden**: al dividir dt por 2, el error se divide aproximadamente por 2. Con dt = 1 (= Duration/5) el error ya es pequeño para un análisis de políticas; con dt = 2 (Duration/2.5) el pico se adelanta y crece.

### 2.5 Estabilidad de Euler

Para un decaimiento `dS/dt = -S/τ`, Euler multiplica el stock por `(1 - dt/τ)` en cada paso:

| dt/τ | Comportamiento numérico |
|---|---|
| < 1 | Decae monótonamente (con error) |
| = 1 | El stock se vacía en **un** paso |
| 1 – 2 | Oscila con signo alterno, amortiguado (artefacto) |
| > 2 | Oscilación **explosiva** (inestable) |

Con τ = 1, S0 = 100: dt = 2 → S(6) = −100 (oscila ±100); dt = 2.5 → S(5) = 225. Una oscilación de periodo 2·dt que aparece "de la nada" es casi siempre un dt demasiado grande.

---

## 3. Métodos de integración

Se elige en **Model > Settings > Time Bounds > Integration Type**. Métodos disponibles en Vensim (la disponibilidad por edición puede variar; ver `01-productos-licencias-versiones.md`):

| Método | Qué hace | Evaluaciones por paso | Cuándo usarlo |
|---|---|---|---|
| **Euler** (por defecto) | `Level(t+dt) = Level(t) + dt · flujo_neto(t)` | 1 | Opción por defecto y la recomendada para la mayoría de modelos de DS, sobre todo si hay elementos discretos o aleatorios. Resultados idénticos a PySD/SDEverywhere/Stella-Euler. |
| **RK4** (Fixed) | Runge-Kutta clásico de 4º orden con paso fijo = `TIME STEP` | 4 | Sistemas continuos suaves, oscilatorios (física, ecología predador-presa, osciladores), cuando se necesita precisión con dt moderado. |
| **RK2** (Fixed) | Runge-Kutta de 2º orden, paso fijo | 2 | Compromiso precisión/coste (verificar la variante: punto medio o Heun). |
| **RK4 Auto** | RK4 con **control automático del paso** (adaptativo) para mantener el error de los Levels dentro de una tolerancia | variable | Sistemas continuos rígidos o con escalas de tiempo muy distintas. Sin discontinuidades. |
| **RK2 Auto** | RK2 con paso adaptativo | variable | Igual que RK4 Auto con menor orden (verificar disponibilidad). |
| **Difference** | Pensado para modelos en **ecuaciones en diferencias** (tiempo discreto: contabilidad mensual, cohortes anuales) | 1 | Modelos intrínsecamente discretos con `TIME STEP` = periodo contable. Numéricamente de la familia Euler (verificar diferencias exactas con Euler en la ayuda de *Integration Type*). |

Notas:
- Con los métodos *Auto*, el `TIME STEP` sigue definiendo la rejilla de guardado y el paso máximo/inicial; el integrador subdivide internamente cuando el error estimado supera la tolerancia (verificar el algoritmo concreto y dónde se fija la tolerancia; la documentación de opciones de optimización menciona `ABSOLUTE_TOLERANCE` como "error aceptable en todos los Levels para confirmar la convergencia de la integración Runge-Kutta de paso variable").
- RK no "arregla" un modelo mal especificado: si el resultado depende del método, revisa la estructura (discontinuidades, constantes de tiempo minúsculas).

### 3.1 Comparación numérica

Decaimiento `dS/dt = -S/τ`, τ = 1, S0 = 100, valor en t = 5 (exacto 0.67379):

| dt | Euler (error) | RK2 Heun (error) | RK4 (error) |
|---|---|---|---|
| 1 | 0.00000 (−100 %) | 3.12500 (+364 %) | 0.74158 (+10 %) |
| 0.5 | 0.09766 (−86 %) | 0.90949 (+35 %) | 0.67647 (+0.40 %) |
| 0.25 | 0.31712 (−53 %) | 0.71746 (+6.5 %) | 0.67393 (+0.02 %) |
| 0.125 | 0.47899 (−29 %) | 0.68350 (+1.4 %) | 0.67380 (+0.001 %) |
| 0.0625 | 0.57240 (−15 %) | 0.67610 (+0.34 %) | 0.67380 (+0.0001 %) |

(El error relativo es grande porque a t = 5τ queda menos del 1 % del stock; lo importante es la tendencia: Euler converge con orden 1, RK2 con orden 2, RK4 con orden 4.)

Oscilador sin amortiguar `x'' = -x` (periodo 2π), amplitud tras t = 50 (exacta = 1):

| dt | Euler | RK4 |
|---|---|---|
| 0.25 | 429.4 | 0.99966 |
| 0.125 | 22.2 | 0.99999 |
| 0.0625 | 4.76 | 1.00000 |

Euler **añade energía** a los osciladores: un ciclo límite o una oscilación creciente en un modelo de inventario/fuerza laboral puede ser artefacto numérico. Para esos modelos, compara con RK4 o reduce mucho el dt.

### 3.2 Funciones discretas y por qué Euler es preferible con ellas

RK evalúa los flujos en instantes intermedios (`t`, `t+dt/2`, `t+dt` en RK4) y combina las pendientes suponiendo que la función es **suave dentro del paso**. Las funciones discretas rompen esa hipótesis:

| Función / elemento | Problema con RK |
|---|---|
| `PULSE`, `PULSE TRAIN`, `STEP`, `RAMP` (en sus quiebres) | La discontinuidad cae dentro de un paso: el efecto se "reparte" o se adelanta. |
| `IF THEN ELSE` que conmuta, `MIN`/`MAX` que cambian de rama | Pendientes de las etapas inconsistentes; los *Auto* reducen mucho el paso cerca del quiebre. |
| `DELAY FIXED`, `SAMPLE IF TRUE`, colas/`QUEUE`… | Tienen memoria discreta que se actualiza una vez por `TIME STEP` (son "pseudo-Levels"), no por etapa de RK (verificar el detalle interno). `DELAY FIXED` además redondea el retraso a un número entero de pasos (PySD lo replica con `N = round(delay/TIME STEP)`). |
| `RANDOM ...` (ruido) | Cada evaluación puede dar otro valor: las 4 etapas no ven la misma "derivada". El ruido blanco además depende del dt (ver `05-referencia-de-funciones.md`). |
| `GAME`, datos con saltos (`:=` con interpolación escalonada) | Mismo problema de discontinuidad. |

Demostración: impulso `PULSE(1, TIME STEP) / TIME STEP` (añade exactamente 1 unidad) hacia un stock:

```text
dt=0.25 Euler: stock  t=0.75→0   t=1.0→0      t=1.25→1.0
dt=0.25 RK4:   stock  t=0.75→0   t=1.0→0.1667 t=1.25→1.0
```

Con RK4 el paso de 0.75→1.0 ya "ve" el pulso en su última etapa (`k4` en t = 1) y adelanta 1/6 del impulso; el total se conserva pero el **momento** es incorrecto. Con Euler el pulso entra exactamente en el paso previsto. Conclusión, coherente con la práctica recomendada por Ventana: **usa Euler (o Difference) si el modelo contiene funciones discretas, estocásticas o de decisión por umbrales; RK4 solo para modelos continuos y suaves**, y en ese caso comprueba que el resultado no cambia con dt/2.

### 3.3 Dónde queda guardado el método en el `.mdl`

Tras el sketch, el bloque de *settings* (marcador `:L<%^E!@`, a veces con un byte `\x7F` tras `:L`) contiene líneas `código:valores`. El método de integración es el **4º valor de la línea `15:`**:

```text
///---\\\
:L<%^E!@
1:Current.vdf
9:Current
15:0,0,0,0,0,0     ← 4º valor = 0 → Euler
19:100,0
...
```

Según los parsers de `.mdl` de terceros (xmutil, escrito por Bob Eberlein, y Simlin): **0 → Euler; 1 y 5 → familia RK4; 3 y 4 → familia RK2; 2 → tratado como Euler** (presumiblemente *Difference*). Qué código corresponde a *Auto* y cuál a *Fixed* no está documentado públicamente (verificar). Simlin escribe `15:0,0,0,1,0,0` para RK4. Cambia el método desde *Time Bounds*, no editando el bloque a mano.

> **Inferencia probable.** El botón de integración del modo *Simulation setup* recorre los métodos en este orden (ver `03-interfaz-sketch-y-herramientas.md`): Euler → RK4 → Difference → RK2F → RK2 → RK4F. Ese orden encaja exactamente con los códigos anteriores, por lo que lo más probable es: **0 = Euler, 1 = RK4 Auto, 2 = Difference, 3 = RK2 Fixed, 4 = RK2 Auto, 5 = RK4 Fixed** (la "F" es *Fixed*; sin sufijo, *Auto*). Sigue siendo una deducción (verificar).

Otras líneas útiles del mismo bloque (vistas en modelos reales): `30:?alias=archivo.xlsx` (alias de archivos de datos), `11:` archivo `.voc`, `12:` archivo `.vpd`, `18:` archivo `.vsc`, `20:` *savelist* `.lst`, `1:` datasets cargados, `9:` nombre del run (ver `12-formatos-de-archivo.md`).

---

## 4. El ciclo de simulación

### 4.1 Orden de cálculo (no depende del orden del texto)

Vensim ordena las ecuaciones por dependencias causales; el orden en el `.mdl` es irrelevante. Clasifica cada variable como Constant, Level (`INTEG` y funciones con memoria como `SMOOTH`, `DELAY…`), Auxiliary/Rate, Data, Lookup, Initial.

**Inicialización (en `INITIAL TIME`)**
1. Se asignan las constantes (y los cambios del run: `.cin`, Simulation Setup, SyntheSim).
2. Se calculan, en orden de dependencias, los valores iniciales de todos los Levels y de todo lo que haga falta para obtenerlos. La expresión inicial de un Level puede depender de auxiliares, que a su vez dependen de otros Levels **iniciales**; Vensim resuelve la cadena siempre que no haya un ciclo.
3. Las variables `INITIAL(x)` se calculan una vez aquí y quedan fijas.
4. `ACTIVE INITIAL(activa, inicial)`: durante la inicialización usa la expresión `inicial`; durante la simulación usa `activa`. Sirve para romper un **ciclo que solo existe en la inicialización** (p.ej. inventario inicial = envíos × cobertura, envíos dependen del inventario).

```vensim
Envios = ACTIVE INITIAL(MIN(Envios deseados, Inventario / Tiempo minimo de envio), Envios deseados)
	~	Widget/Month
	~	En t0 los envíos iniciales son los deseados; luego, limitados por el inventario.
	|
Inventario = INTEG(Produccion - Envios, Envios * Cobertura deseada)
	~	Widget
	~		|
```

> Detalle verificado con *test-models* (`active_initial`, Vensim DSS 6.3E): con `Value A = ACTIVE INITIAL(Time, 45)` y `Stock A = INTEG(1, Value A)`, el stock empieza en **45** (valor de inicialización), pero `Value A` **guardado** en t = 0 es **0** (= `Time`, la parte activa). Es decir, el valor que ves en t0 en tablas y gráficos es el de la expresión activa.

**Bucle de simulación (Euler)** — en cada `t = INITIAL TIME + k·TIME STEP`:
1. Con los Levels en `t`, calcular auxiliares y flujos en orden causal (incluye lookups, datos interpolados, funciones de tiempo).
2. Si `t` es un instante de guardado (múltiplo de `SAVEPER`), guardar **todas** las variables (o las de la *savelist*) en el dataset. Por eso los flujos guardados en `t` son los que se aplican de `t` a `t+dt`.
3. Integrar: `Level(t+dt) = Level(t) + TIME STEP · (entradas − salidas)`; actualizar funciones con memoria discreta (`DELAY FIXED`, `SAMPLE IF TRUE`…).
4. `t ← t + TIME STEP`; repetir hasta `FINAL TIME` (incluido: en `FINAL TIME` se calculan y guardan auxiliares y flujos).

Con RK, el paso 1 se repite en las etapas intermedias (2 o 4 veces por paso, o más en los *Auto*) y el paso 3 combina las pendientes.

### 4.2 Ecuaciones simultáneas

Un ciclo de dependencias **entre auxiliares** (sin un Level en medio) no tiene orden de cálculo: Vensim lo rechaza como *simultaneous equations* al comprobar/simular el modelo e indica las variables implicadas. Soluciones, por orden de preferencia:
1. **Hay un retraso real** que no se ha modelado (percepción, ajuste): introduce un Level o `SMOOTH`. Es lo correcto en DS: toda realimentación pasa por una acumulación.
2. El ciclo solo existe en la **inicialización** → `ACTIVE INITIAL` o `INITIAL` en el valor inicial del Level.
3. Si de verdad es un sistema algebraico (equilibrio de mercado instantáneo), reformula analíticamente (despeja) o usa un ajuste rápido (Level con tiempo de ajuste pequeño, con `TIME STEP` acorde).

### 4.3 Cosas que el ciclo implica en la práctica

- Las funciones de memoria (`SMOOTH`, `DELAY1/3/N`, `TREND`, `FORECAST`) son Levels internos: responden con la misma lógica de integración y su precisión depende del dt (y de su orden: `DELAY3` necesita dt ≤ T/12 para ir cómodo).
- Referenciar `TIME STEP` en una ecuación (p.ej. `Stock/TIME STEP`) hace que el resultado dependa explícitamente del paso: úsalo solo donde tenga sentido (vaciado en un paso, impulsos `PULSE(t, TIME STEP)/TIME STEP`).
- `SAVEPER` grande no "suaviza" nada: los valores no guardados se calculan igual, simplemente no se ven. Para depurar, pon `SAVEPER = TIME STEP`.

---

## 5. Stocks no negativos: la forma correcta

Vensim **no tiene** una opción "non-negative stock" como XMILE/Stella. Un stock físico (inventario, población, agua) que se vuelve negativo indica que algún flujo de salida no está limitado por la disponibilidad.

**Mal**: forzar el stock con `MAX`. En Vensim un Level es `INTEG(...)` (no se puede envolver en `MAX`) y crear un auxiliar `Stock visible = MAX(0, Stock)` oculta el error y **rompe la conservación** (sale material que no existía).

**Bien**: limitar el flujo de salida por lo que hay:

```vensim
Envios maximos = Inventario / Tiempo minimo de envio
	~	Widget/Month
	~	Lo máximo que se puede extraer por unidad de tiempo.
	|
Envios = MIN(Envios deseados, Envios maximos)
	~	Widget/Month
	~	Salida limitada por el stock disponible.
	|
Tiempo minimo de envio = 0.5
	~	Month
	~	Tiempo físico mínimo para vaciar el inventario. Debe ser >= TIME STEP.
	|
```

Variante "vaciado exacto en un paso": `Envios maximos = Inventario / TIME STEP`. Garantiza no negatividad con Euler, pero hace la estructura dependiente del dt. La versión con un *tiempo mínimo* con significado físico es preferible; también puedes suavizar la transición con un lookup de "fracción satisfecha" (`Envios = Envios deseados * Efecto disponibilidad(Envios maximos/Envios deseados)`, con `XIDZ` si el denominador puede ser 0).

Demostración (S0 = 10, salida deseada 3/mes, dt = 1):

```text
salida = deseada                        : 10, 7, 4, 1, -2, -5, -8      ← negativo
salida = MIN(deseada, S/TIME STEP)      : 10, 7, 4, 1,  0,  0,  0
salida = MIN(deseada, S/tiempo mín.=2)  : 10, 7, 4, 2,  1, 0.5, 0.25
```

Y la trampa (comprobado con PySD sobre el modelo anterior): con `Tiempo minimo de envio = 0.5` y `TIME STEP = 1` (dt > tiempo mínimo), el inventario **oscila y se vuelve negativo** (1, −1, 1, −1…), por la inestabilidad de Euler de la sección 2.5. Con `TIME STEP = 0.25` el inventario tiende suavemente a 0. Regla: **tiempo mínimo ≥ TIME STEP** (idealmente ≥ 2–4 dt).

Otros casos:
- Varias salidas compitiendo por el mismo stock: calcula la salida total limitada y repártela proporcionalmente (o con `ALLOCATE BY PRIORITY` / `ALLOCATE AVAILABLE`, ver `05-referencia-de-funciones.md`).
- Si un stock **puede** ser negativo por definición (caja/deuda neta, temperatura en °C), no lo limites.

---

## 6. Configurar una corrida

### 6.1 Nombre del run y dataset

- El **nombre de la corrida** se escribe en el cuadro de texto de la barra de herramientas (por defecto `Current`). Al simular se crea `nombre.vdf` (formato binario clásico) o `nombre.vdfx` (formato de las versiones de 64 bits según EMA Workbench, ver `11-automatizacion-scripts-dll-python.md` y `12-formatos-de-archivo.md`; versión de introducción: verificar) en la carpeta del modelo. Si ya existe, Vensim pregunta si sobrescribe (se puede desactivar).
- Usa nombres significativos (`base`, `politica_A`, `dt_mitad`): todas las comparaciones (gráficos, `Runs Compare`) trabajan con datasets cargados por nombre.

### 6.2 Modos de ejecución (barra de herramientas)

| Acción | Qué hace |
|---|---|
| **Simulate** (*Run a simulation*) | Corre con los valores del modelo + cambios pendientes del Setup/`.cin`. |
| **Simulation Setup** (*Set up a simulation*) | Prepara una corrida: las constantes aparecen resaltadas en el diagrama y se pueden editar haciendo clic; los lookups se pueden editar gráficamente. Los cambios se aplican solo a ese run (no modifican el modelo) y quedan registrados en el dataset. |
| **SyntheSim** | Simulación continua con deslizadores (sección 8). |
| **Game** | Simulación interactiva por intervalos (sección 9). |
| **Sensitivity / Optimize** | Monte Carlo y optimización/calibración (ver `10-analisis-avanzado-sensibilidad-optimizacion.md`). |

En versiones con el diálogo **Simulation Control** se reúnen: nombre del run, archivos de cambios, datos usados y botones para cada modo; una pestaña avanzada guarda *savelist*, archivos de payoff, sensibilidad y optimización (verificar nombres de pestañas en tu versión).

### 6.3 Archivos de cambios `.cin`

Un `.cin` (*changes input*) es texto plano con nuevas definiciones de **constantes** y **lookups**, una por línea, con la misma sintaxis que en el modelo pero sin unidades ni comentarios. Ejemplos reales (escenarios de World3-03, Ventana/Meadows et al.):

```text
initial nonrenewable resources = 2e12
persistent pollution technology change mult table (
 (-1,-.03),(0,0))
land yield technology change rate multiplier table (
  (0,0),(1,.02))
land life policy implementation time =1995
```

- Constantes: `nombre = valor` (se admiten subíndices, p.ej. `Precio[norte] = 3`).
- Lookups: `nombre ( (x1,y1),(x2,y2),... )`, opcionalmente con el rango `[(xmin,ymin)-(xmax,ymax)]` delante de los puntos.
- Se pueden **encadenar** varios `.cin` en un mismo run (en la interfaz se eligen varios; por comandos `SIMULATE>READCIN|a.cin` y luego `SIMULATE>ADDCIN|b.cin`). Útil para combinar "escenario base de datos" + "política".
- El archivo `.out` que produce una optimización tiene formato compatible y puede usarse como archivo de cambios para reproducir la corrida óptima (ver archivo 10).
- Para documentar escenarios, guarda un `.cin` por escenario con un comentario en el nombre (`SCEN03_tecnologia.cin`) y versiona los `.cin` junto al `.mdl`.

Equivalentes en *command scripts* / Venapps / DLL (confirmados en Venapps de Ventana y en `venpy`):

```text
SIMULATE>RUNNAME|SCEN03
SIMULATE>READCIN|W303S03.cin
SIMULATE>ADDCIN|extra.cin
SIMULATE>SETVAL|technology development delay=5
MENU>RUN|O
```

Otros comandos vistos en el Venapp de World3: `SIMULATE>READRUNCHG|<run>` (tomar como base los cambios de una corrida anterior), `SIMULATE>GETCNSTCHG` y `SIMULATE>GETTABCHG` (pedir al usuario cambios de constantes/tablas). Ver `11-automatizacion-scripts-dll-python.md`.

### 6.4 Datos usados en la corrida

Las variables de datos (`:=`, `GET XLS DATA`, `GET DIRECT DATA`…) toman valores de los archivos indicados en la ecuación o de los datasets (`.vdf`/`.vdfx`) seleccionados como **datos usados** en la configuración de la corrida (*Data used*). Para calibrar, los datos históricos suelen cargarse así. Los alias de archivo (`?data`) se guardan en el bloque de settings (`30:?alias=archivo`). Ver `07-datos-lookups-import-export.md`.

---

## 7. Comparar corridas y corridas múltiples

- **Datasets cargados**: *Control Panel > Datasets* permite cargar/descargar corridas y reordenarlas. Los gráficos de las herramientas de análisis muestran todas las corridas cargadas; la **primera** se toma como referencia en comparaciones.
- **Runs Compare** (herramienta de análisis): lista las constantes y lookups que difieren entre las dos primeras corridas cargadas. Es la forma rápida de saber "qué cambié en este run".
- **Gráficos y tablas**: `Graph`, `Causes Strip`, `Table`, `Table Time Down` con varias corridas superpuestas; los *custom graphs* permiten fijar escalas y comparar variables de distintas corridas.
- **Corridas múltiples**:
  - Escenarios discretos: un `.cin` por escenario + *command script* (`.cmd`) o Venapp que recorre los escenarios (World3 Explorer hace exactamente eso con `READCIN` + `RUNNAME` + `MENU>RUN`).
  - Barridos y Monte Carlo: **Sensitivity** (archivo 10), con `VECTOR` para barridos deterministas.
  - Escenarios "subscriptados": replica el modelo sobre un subíndice `Escenario: base, politica A, politica B` y diferencia los parámetros por elemento; una sola corrida produce todos los escenarios (cómodo para comparar en una tabla). Coste: modelo más grande y unidades/ecuaciones subscriptadas.
  - Externamente: Python con la DLL de Vensim (`venpy`, EMA Workbench) o PySD (ver archivo 11).

---

## 8. SyntheSim

SyntheSim convierte el diagrama en un tablero de simulación en vivo: cada cambio de un parámetro re-simula al instante y muestra el comportamiento sobre el propio diagrama.

**Funcionamiento**
- Se activa con el botón **SyntheSim** de la barra de herramientas. Las constantes muestran un **deslizador** debajo del nombre; Levels, flujos y auxiliares muestran mini-gráficos de su comportamiento en la corrida.
- Al mover un deslizador, Vensim simula el modelo completo y actualiza los mini-gráficos y las herramientas de análisis abiertas (*Causes Strip*, gráficos), comparando con las corridas cargadas.
- **Rangos de los deslizadores**: se toman de la especificación de rango de la ecuación, en el campo de unidades: `~ Month [1,24,1]` → mínimo 1, máximo 24, incremento 1. Sin rango, Vensim propone uno por defecto alrededor del valor actual (verificar regla). Conviene definir rangos plausibles en las constantes de política: ayuda a SyntheSim y documenta el modelo.
- **Lookups**: se pueden editar gráficamente durante SyntheSim (arrastrando puntos) y el efecto se ve al instante (override temporal del lookup).
- **Reset**: botón para devolver todas las constantes y lookups a los valores del modelo. Los cambios hechos en SyntheSim se aplican al run actual; al salir, Vensim permite descartarlos o **guardarlos en el modelo** (verificar los nombres exactos de los botones en tu versión).
- Los resultados se escriben en el dataset con el nombre del run actual (se sobrescribe en cada movimiento). Para fijar un escenario, cambia el nombre del run o sal de SyntheSim y simula normalmente.
- Las constantes `==` (*unchangeable*) no ofrecen deslizador.

**Limitaciones y buenas prácticas**
- Requiere que una corrida completa sea rápida: con modelos grandes, dt muy pequeño o muchos datos la interacción se vuelve lenta (reduce `FINAL TIME`, aumenta `SAVEPER`, o usa Simulate).
- No sustituye a un análisis de sensibilidad sistemático: es exploración (OAT, uno a uno). Para incertidumbre usa Sensitivity.
- Con métodos RK Auto o modelos estocásticos, pequeños movimientos pueden dar saltos por ruido o por cambios de rama: usa una semilla fija (`NOISE SEED` o la semilla de las funciones `RANDOM`).
- Buen flujo de trabajo: Simulate `base` → SyntheSim con `base` cargado como referencia → identificar palancas sensibles → formalizar con Sensitivity/Optimize.

---

## 9. Gaming (función GAME)

El modo juego permite que una persona tome decisiones durante la simulación (simuladores de gestión, *flight simulators*, talleres).

**Ecuaciones**

```vensim
Contrataciones decididas = GAME(Contratacion de reemplazo + Ajuste de plantilla)
	~	Person/Month
	~	En una simulación normal vale la expresión; en Gaming el jugador puede sustituirla.
	|
Precio fijado = GAME(12)
	~	$/Widget
	~		|
```

- `GAME(expresión)`: fuera del modo juego devuelve la expresión. En modo juego, el valor puede ser introducido por el usuario en cada intervalo; si no lo cambia, se mantiene el comportamiento del modelo (verificar si el valor introducido persiste en intervalos siguientes o vuelve a la expresión).
- `GAME` debe envolver la ecuación completa (Vensim no admite `GAME(A + B) * C`, según la nota del caso de prueba `game` de *test-models*). PySD y otros traductores la tratan como un simple paréntesis.

**Uso**
1. Botón **Game** (o el modo Gaming del menú) inicia la simulación en modo juego hasta el primer intervalo.
2. El **intervalo de juego** (*Game Interval*) fija cada cuánto tiempo de modelo se detiene la simulación para recibir decisiones (múltiplo de `TIME STEP`; verificar dónde se configura en tu versión).
3. Se editan las variables `GAME` (en el diagrama, en un panel o desde un Venapp) y se avanza al siguiente intervalo; existe la opción de retroceder un intervalo (verificar nombre: *Back up*) y de terminar.
4. El resultado queda en el dataset del run como una corrida normal (comparable con otras).

Comandos equivalentes (DLL / scripts, usados por `venpy`):

```text
SIMULATE>RUNNAME|partida1
MENU>GAME|O
GAME>GAMEINTERVAL|1
SIMULATE>SETVAL|Precio fijado=14
GAME>GAMEON          ← avanza un intervalo
GAME>ENDGAME
```

Este mecanismo es también la forma de **acoplar Vensim con código externo paso a paso** (Python decide cada intervalo vía la DLL). Para interfaces de juego más pulidas: Venapps (DSS) o Vensim Model Reader / publicación web (ver archivos 01 y 11).

---

## 10. Precisión numérica y depuración

### 10.1 Errores típicos

| Síntoma / mensaje | Causa habitual | Remedio |
|---|---|---|
| *Floating point error* / *floating point exception* al calcular una variable en un instante (verificar texto exacto) | División por cero, `LN`/`LOG` de ≤ 0, `SQRT` de negativo, `^` con base negativa y exponente no entero, overflow | Lee qué variable y en qué `Time` falla; usa `XIDZ(a, b, x)` / `ZIDZ(a, b)`, `MAX(ε, x)` en argumentos de `LN`, y revisa por qué el denominador llega a 0 (¿stock negativo?, sección 5). |
| Valores enormes (1e+30…) u overflow | Bucle reforzador sin límite, dt inestable (sección 2.5), unidades mal escaladas | Reduce dt a la mitad: si cambia mucho es numérico; si no, es estructural (falta un bucle balanceador). |
| Oscilación de periodo 2·dt | dt > constante de tiempo de algún flujo | Reducir dt o revisar el tiempo mínimo. |
| Resultados que cambian con el método (Euler vs RK4) | dt grande o discontinuidades | Sección 3.2. |
| *Simultaneous equations* | Ciclo de auxiliares sin Level | Sección 4.2. |
| Eventos desplazados un paso (`IF THEN ELSE` con `Time`, `PULSE` de ancho < dt) | dt no binario, comparaciones de igualdad con `Time` | dt potencia de 2; usar `>=` en vez de `=` con `Time`, o `STEP`/`PULSE` (usan *time plus*). |
| `:NA:` propagándose | Datos faltantes usados en aritmética | `:NA:` es un número muy negativo (−1.298074214633707e+33 = −2¹¹⁰ en la DLL y los `.vdf`; Simlin modela el literal como −2¹⁰⁹, verificar; ver `04-lenguaje-de-ecuaciones.md` §5.10), no un NaN: compruébalo explícitamente (`x = :NA:`) antes de operar. Al exportar a `.tab`, Vensim deja la celda vacía (caso `na` de *test-models*). |

Notas:
- Vensim detiene la simulación en el primer error de coma flotante e informa la variable y el instante; el dataset queda con los valores hasta ese momento (verificar si en tu versión continúa con aviso). Los avisos se pueden silenciar (en Venapps: `SETTING>SHOWWARNING|0`), pero no lo hagas mientras depuras.
- Precisión: las versiones actuales calculan en doble precisión; existieron compilaciones de precisión simple (máx. ≈ 3.4e38, ~7 dígitos), en las que la acumulación de `Time` y los stocks grandes con flujos pequeños pierden exactitud (verificar qué ediciones/versiones son de precisión simple). La DLL de Vensim se distribuía en dos variantes, `vendll32.dll` (simple) y `VdpDLL32.dll` (doble), según el conector de EMA Workbench.
- Vía DLL, `vensim_continue_simulation` devuelve −1 cuando se produce un error de coma flotante (útil para detectar corridas inválidas en lotes automáticos).

### 10.2 Procedimiento de depuración numérica

1. `SAVEPER = TIME STEP` y simula con un nombre de run nuevo.
2. Localiza el primer instante anómalo con `Table` (o `Table Time Down`) sobre la variable que falla y sus causas (`Causes Strip`, `Causes Tree`).
3. Comprueba unidades (*Units Check*) y que lookups no reciban entradas fuera de rango (Vensim mantiene constante el último valor fuera del rango, salvo funciones de extrapolación explícitas).
4. Prueba dt/2 y Euler vs RK4 para separar error numérico de error estructural.
5. Aplica pruebas de condiciones extremas (Reality Check, archivo 09): stocks a 0, parámetros a 0 o ∞.
6. Protege divisiones y logaritmos solo donde el cero sea legítimo; si el cero no debería ocurrir, arregla la causa en vez de ocultarla con `ZIDZ`.

---

## 11. Checklist rápido

- [ ] Unidad de tiempo coherente y declarada en *Time Bounds*.
- [ ] `TIME STEP` potencia de 2 y ≤ 1/4–1/10 de la menor constante de tiempo (recuerda `DELAY3` → T/3, `DELAY N` → T/N).
- [ ] `SAVEPER` múltiplo entero de `TIME STEP`.
- [ ] Test dt/2 superado (diferencias despreciables para el propósito).
- [ ] Euler si hay `PULSE`/`STEP`/`IF THEN ELSE` conmutando/`DELAY FIXED`/`SAMPLE IF TRUE`/ruido; RK4 solo si el modelo es continuo y suave (y verificado).
- [ ] Ningún stock físico negativo; salidas limitadas por el stock con tiempo mínimo ≥ dt.
- [ ] Sin ecuaciones simultáneas; `ACTIVE INITIAL` solo para ciclos de inicialización.
- [ ] Escenarios en `.cin` versionados; runs con nombres significativos; comparación con `Runs Compare`.

---

## Fuentes

- Vensim Documentation (índice): https://vensim.com/documentation/ — páginas consultadas vía extractos de búsqueda: *Optimization Options* (`ABSOLUTE_TOLERANCE` y RK de paso variable), https://vensim.com/documentation/optimizationoptions.html; *Sensitivity Simulations*, https://www.vensim.com/documentation/sensitivity.html.
- SDXorg/test-models (casos `active_initial`, `dynamic_final_time`, `euler_step_vs_saveper`, `game`, `delay_numeric_error`; salidas generadas con Vensim 6.3E–7.3.4): https://github.com/SDXorg/test-models
- Parser de `.mdl` de **xmutil** (Bob Eberlein), `src/Vensim/VensimParse.cpp` (código de integración en la línea `15:`): https://github.com/bobeberlein/xmutil
- **Simlin** (`src/simlin-engine/src/mdl/settings.rs` y `writer.rs`: códigos 15/22/30/35–40 del bloque de settings): https://github.com/bpowers/simlin
- World3-03 (Ventana Systems / Meadows, Randers, Meadows 2004): archivos `.cin` de escenarios y Venapp `WRLD3-03.VCD` con comandos `SIMULATE>READCIN`, `RUNNAME`, `READRUNCHG`, `GETCNSTCHG`, `GETTABCHG` (copia en el corpus de pruebas de Simlin).
- `venpy` (wrapper Python de la DLL de Vensim; comandos `MENU>GAME`, `GAME>GAMEINTERVAL`, `GAME>GAMEON`, `GAME>ENDGAME`, `SIMULATE>ADDCIN`): https://github.com/pbreach/venpy y fork de Vensim.
- EMA Workbench, conector Vensim (`vensimDLLwrapper.py`: DLL `vendll32.dll` / `VdpDLL32.dll`, `vensim_continue_simulation`): https://github.com/quaquel/EMAworkbench
- PySD 3.14 (documentación del *Julia builder*: Euler coincide con Vensim; `DELAY FIXED` con `N = round(delay/TIME STEP)`): https://pysd.readthedocs.io/
- Demostraciones numéricas propias (NumPy / PySD) hechas al construir esta base (scripts no incluidos).
- Sterman, J. D. (2000). *Business Dynamics*, Apéndice A (integración numérica y elección de dt). McGraw-Hill.
