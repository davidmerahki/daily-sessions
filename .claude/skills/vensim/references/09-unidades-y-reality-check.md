# 09 · Unidades de medida y Reality Check en Vensim

Referencia experta sobre (A) unidades de medida y su comprobación (*Units Check*) y (B) *Reality Check*: restricciones (*Constraints*) y entradas de prueba (*Test Inputs*) para verificar automáticamente que el modelo se comporta de forma razonable.

> Convenciones: menús, funciones y palabras clave en inglés como en Vensim. Ejemplos en sintaxis `.mdl` (`ecuación ~ unidades ~ comentario |`). Lo marcado **(verificar)** no pudo confirmarse en la documentación oficial durante la redacción. Los textos entre llaves `{…}` son anotaciones: Vensim admite comentarios entre llaves dentro del texto de una ecuación (p.ej. `b = 3 {transportation sector}`), pero colocados tras `|` son sólo explicativos; elimínelos al copiar un ejemplo (PySD no acepta llaves fuera de una ecuación).

## Tabla de contenidos

**Parte A — Unidades**
1. [Dónde y cómo se escriben las unidades](#1-dónde-y-cómo-se-escriben-las-unidades)
2. [Unidades adimensionales y sinónimos](#2-unidades-adimensionales-y-sinónimos)
3. [Equivalencias de unidades (Units Equiv)](#3-equivalencias-de-unidades-units-equiv)
4. [Rangos en el campo de unidades `[min,max,incr]`](#4-rangos-en-el-campo-de-unidades-minmaxincr)
5. [Comprobación de unidades (Units Check)](#5-comprobación-de-unidades-units-check)
6. [Reglas de propagación y unidades por función](#6-reglas-de-propagación-y-unidades-por-función)
7. [Unidades de tiempo, INTEG y TIME STEP](#7-unidades-de-tiempo-integ-y-time-step)
8. [Errores frecuentes y cómo corregirlos](#8-errores-frecuentes-y-cómo-corregirlos)
9. [Buenas prácticas de unidades](#9-buenas-prácticas-de-unidades)

**Parte B — Reality Check**
10. [Concepto](#10-concepto)
11. [Sintaxis: Constraints y Test Inputs](#11-sintaxis-constraints-y-test-inputs)
12. [Funciones RC y `RC START TIME`](#12-funciones-rc-y-rc-start-time)
13. [Introducir ecuaciones de Reality Check](#13-introducir-ecuaciones-de-reality-check)
14. [Ejecutar Reality Check](#14-ejecutar-reality-check)
15. [Interpretar los resultados](#15-interpretar-los-resultados)
16. [Ejemplos completos](#16-ejemplos-completos)
17. [Disponibilidad y compatibilidad](#17-disponibilidad-y-compatibilidad)
18. [Fuentes](#18-fuentes)

---

# Parte A — Unidades

## 1. Dónde y cómo se escriben las unidades

Cada variable tiene un campo *Units* (en el Equation Editor) que en el `.mdl` es el texto entre el primer y el segundo `~`:

```vensim
Hiring = Labor Gap / Time to Hire
	~	Person/Month
	~	Contrataciones mensuales.
	|
```

Sintaxis de las expresiones de unidades:
- Nombres de unidades (pueden contener espacios: `Veg equiv kg`), combinados **sólo con `*`, `/` y paréntesis** (documentación: "Units of measure are restricted to using only * / and ( ) operators").
- Ejemplos reales: `Widget/Month`, `1/Year`, `$/(Person*Year)`, `watt/(meter*meter)`, `Rs/(Day*Person)`, `fraction/(Year*Person)`, `Units*Units` (varianza).
- No se usa `^` en el campo de unidades: un área es `meter*meter`, no `meter^2`.
- `$` es una unidad válida (moneda).
- Unidades inversas con `1/…`: `1/Month` para tasas fraccionales.

## 2. Unidades adimensionales y sinónimos

- **`Dmnl`** (*dimensionless*) es la unidad adimensional habitual. Vensim trata como sinónimos, aunque la lista de equivalencias esté vacía: **`Dimensionless`, `Dmnl`, `Fraction`, `Nil` y `1`**.
- Dmnl "no cambia las unidades al multiplicar", y **los números escritos en una ecuación se tratan como adimensionales salvo que el contexto indique otra cosa** (p.ej. en `x + 3` se asume que el `3` tiene las unidades de `x`).
- `fraction` puede usarse con significado (`fraction/Year`), pero recuerde que equivale a Dmnl.
- Un porcentaje (`%`) es una unidad distinta de Dmnl salvo que se declare equivalencia (y en la ecuación debe dividirse entre 100).

## 3. Equivalencias de unidades (Units Equiv)

Vensim compara las unidades **literalmente**: `Person`, `Persons` y `People` son distintas, igual que `Mile` y `Miles`. Para declararlas sinónimas:

- `Model > Settings… > pestaña Units Equiv`: la lista muestra los grupos de sinónimos; se pueden añadir, modificar (*Modify Selected*) o borrar (*Delete Selected*).
- Al instalar Vensim, los modelos nuevos incluyen una lista breve. En los `.mdl` guardados por Vensim aparece, en la sección de *settings* tras el *sketch*, como líneas `22:`:

```text
22:$,Dollar,Dollars,$s
22:Day,Days
22:Hour,Hours
22:Month,Months
22:Person,People,Persons
22:Unit,Units
22:Week,Weeks
22:Year,Years
```

(Lista por defecto observada en cientos de modelos guardados por Vensim en los repositorios de prueba.) Para añadir propias: `22:hectare,hectares`, `22:s,Second`.

- Las equivalencias son de **nombre**, no de conversión: `Year` y `Month` nunca son equivalentes (requieren un factor `Months per Year` con unidades `Month/Year`).
- Si `Year`/`Years` no fueran sinónimos, una constante en `Years` usada con `TIME STEP` en `Year` daría error de unidades.

## 4. Rangos en el campo de unidades `[min,max,incr]`

El campo de unidades puede terminar con un rango entre corchetes:

```vensim
Time to Hire = 3        ~ Month [1,12,0.5] ~ |
Padding = 0.1           ~ Dmnl [0,0.2] ~ |
TIME STEP = 0.25        ~ Month [0,?] ~ |
Effect strength = 0     ~ watt/(meter*meter) [-1,1,0.01] ~ |
```

- Formato: `unidades [mínimo, máximo]` o `unidades [mínimo, máximo, incremento]`.
- `?` indica "sin límite" en ese extremo (`[0,?]`).
- Para constantes, el rango define los **sliders de SyntheSim** (el incremento sólo se usa para el slider). También se usa en sensibilidad/optimización como referencia de límites **(verificar)**.
- Puede editarse en los campos *Min*, *Max*, *Incr* del Equation Editor.
- El rango no recorta valores durante la simulación (no es una restricción del modelo) **(verificar si Vensim advierte al salirse del rango)**.

## 5. Comprobación de unidades (Units Check)

**Cómo ejecutarla**
- `Model > Units Check` (en algunas páginas, `Model > Check Units`), atajo **Ctrl+U**: analiza todo el modelo.
- Al comprobar una ecuación en el Equation Editor, Vensim también comprueba la consistencia de sus unidades ("The units of measure will be checked … when you check the equation").
- `Model > Check Model` (Ctrl+T) comprueba sintaxis y estructura; es distinto del Units Check.

**Salida** (ventana de texto con desplazamiento):
- **Errores**: inconsistencia dimensional.
- **Advertencias (warnings)**: variables **sin unidades definidas** y uso de variables **con dimensiones como entrada de un lookup**.
- Los errores de unidades **no impiden simular**, pero corregirlos suele revelar errores de formulación.

**Opción "Use strictest testing"**
- Si se activa, Vensim **deja de suponer** que las constantes embebidas en ecuaciones (p.ej. el `0.035` de `x * 0.035`) tienen las unidades que harían cuadrar la ecuación y las evalúa como **adimensionales**. Sirve para descubrir parámetros "escondidos" en ecuaciones. (Ubicación: diálogo *Model Settings*, junto a Units Equiv — **verificar pestaña exacta**.)

**Cómo trabaja**
- La comprobación va "de dentro hacia fuera": primero variables, luego subexpresiones; si una subexpresión falla, el resto sólo se comprueba parcialmente (corrija el primer error primero).
- Fuentes de error más comunes (documentación *Source of Units Check Errors*):
  1. El lado izquierdo y el derecho de la ecuación no tienen las mismas unidades.
  2. Sumas, restas y **comparaciones** entre expresiones con unidades distintas.
  3. Funciones llamadas con argumentos de unidades incompatibles con lo que la función requiere.

## 6. Reglas de propagación y unidades por función

Reglas generales:
- `*` multiplica unidades; `/` las divide.
- `+`, `-`, `<`, `>`, `=`, `MIN`, `MAX` requieren operandos con las mismas unidades; el resultado conserva esas unidades.
- Constantes numéricas embebidas: se asumen compatibles (salvo *strictest testing*).
- Potencia `base^x` (o `POWER`): el exponente debe ser adimensional; si el exponente es 0.5, 1, 2, 3 o 4, las unidades de la base se elevan a esa potencia cuando es posible.

Tabla de referencia por función (las marcadas **(verificar)** se deducen de la definición de la función, no de una tabla oficial):

| Función | Requisitos de unidades | Unidades del resultado |
|---|---|---|
| `INTEG(rate, init)` | `rate` = unidades del nivel / unidad de tiempo; `init` = unidades del nivel | Unidades del nivel |
| `SMOOTH`, `SMOOTH3`, `SMOOTHI`, `SMOOTH N` | `delay time` en unidades de tiempo; valor inicial = unidades de la entrada; orden Dmnl | Las de la entrada |
| `DELAY1`, `DELAY3`, `DELAY FIXED`, `DELAY N` | Igual que SMOOTH | Las de la entrada |
| `TREND(input, avg time, init)` | `avg time` en tiempo | `1/tiempo` (tasa fraccional) **(verificar)** |
| `FORECAST(input, avg time, horizon)` | Tiempos en unidades de tiempo | Las de la entrada **(verificar)** |
| `STEP(height, time)` | `time` en unidades de tiempo | Las de `height` |
| `RAMP(slope, start, end)` | `start`, `end` en tiempo | Unidades de `slope` × tiempo |
| `PULSE(start, width)` | Tiempos | Dmnl |
| `IF THEN ELSE(c, a, b)` | `a` y `b` con las mismas unidades | Las de `a` |
| `XIDZ(a, b, x)` / `ZIDZ(a, b)` | `x` con unidades de `a/b` | Unidades de `a/b` |
| `EXP`, `LN`, `LOG`, `SIN`, `COS`, `TAN`… | Argumento adimensional | Dmnl |
| `SQRT(x)` | — | Raíz de las unidades de `x` si es posible **(verificar)** |
| `ABS`, `INTEGER`, `MODULO`, `QUANTUM` | — | Las del argumento |
| `SUM`, `VMIN`, `VMAX` | — | Las del argumento |
| `PROD` | — | Producto de unidades **(verificar)** |
| `ELMCOUNT` | — | Dmnl |
| `INITIAL`, `SAMPLE IF TRUE` | Valor inicial con las mismas unidades | Las del argumento |
| Lookup `tbl(x)` | Se recomienda `x` adimensional (si no, *warning*) | Las declaradas para el lookup |
| `WITH LOOKUP(x, …)` | Igual que lookup | Las de la variable |
| `RANDOM UNIFORM(min, max, seed)` | `min`, `max` con las mismas unidades | Las de `min`/`max` **(verificar)** |
| `Time`, `TIME STEP`, `INITIAL TIME`, `FINAL TIME`, `SAVEPER` | — | Unidad de tiempo del modelo |
| `GET … DATA/CONSTANTS/LOOKUPS` | — | Las declaradas en la variable |

**Lookups y unidades**: usar una entrada con unidades es peligroso porque cambiar la unidad (p.ej. de $ a k$) invalidaría la relación. Formulación normalizada recomendada:

```vensim
demand = normal demand * demand f(price / reference price)
	~	Widget/Month ~ |
demand f( [(0,0)-(3,2)], (0,2), (1,1), (2,0.5), (3,0.3) )
	~	Dmnl
	~	Entrada y salida adimensionales; pasa por (1,1).
	|
```

## 7. Unidades de tiempo, INTEG y TIME STEP

- La unidad de tiempo del modelo se fija en `Model > Settings… > Time Bounds` (campo *Units for Time*: Year, Month, Week, Day, Hour…). Las unidades de `INITIAL TIME`, `FINAL TIME`, `TIME STEP` y `SAVEPER` deben coincidir con ella (`TIME STEP = 0.25 ~ Month [0,?]`).
- `INTEG` integra respecto del tiempo: **la unidad del flujo multiplicada por la unidad de tiempo debe ser la del nivel**. Por eso las tasas fraccionales llevan `1/Month` y los tiempos de ajuste `Month`.
- `TIME STEP` no aparece en las ecuaciones de flujos; si aparece (p.ej. para vaciar un nivel en un paso: `Stock / TIME STEP`) las unidades siguen cuadrando porque `TIME STEP` tiene unidades de tiempo.
- Cambiar de unidad de tiempo (años → meses) exige revisar todas las constantes con tiempo en sus unidades y los datos externos (columna de tiempo).
- Use sinónimos (`Year,Years`) para no tener errores por plurales.

## 8. Errores frecuentes y cómo corregirlos

| Mensaje / síntoma | Causa típica | Corrección |
|---|---|---|
| Unidades del nivel ≠ unidades del flujo × tiempo | Flujo declarado como `Widget` en vez de `Widget/Month` | Declarar el flujo por unidad de tiempo |
| Suma de unidades distintas | `Inventory + Backlog` con `Widget` vs `Order` | Unificar unidades, añadir equivalencia o factor de conversión |
| `Person` vs `People` | Unidades literalmente distintas | Añadir sinónimo en Units Equiv |
| Tasa fraccional sin `1/tiempo` | `fraction` en lugar de `fraction/Year` | Corregir a `1/Year` o `fraction/Year` |
| Warning: variable sin unidades | Campo Units vacío | Completar (usar `Dmnl` si es adimensional) |
| Warning: entrada de lookup con unidades | `tbl(price)` | Normalizar: `tbl(price / reference price)` |
| `EXP`/`LN` con argumento dimensional | `EXP(growth rate * Time)` sin cuadrar | El producto debe ser Dmnl (`1/Year × Year`) |
| `IF THEN ELSE` con ramas de unidades distintas | `IF THEN ELSE(c, Inventory, 0.5)` con constante dimensional explícita | Hacer que ambas ramas tengan las mismas unidades |
| Error sólo con *strictest testing* | Constantes embebidas con unidades implícitas | Sacarlas como constantes con nombre y unidades |
| Comparación con unidades distintas | `Stock > 10` con `10` interpretado según contexto; `Stock > Capacity` con unidades distintas | Comparar magnitudes homogéneas |
| `%` frente a `Dmnl` | Porcentajes mezclados con fracciones | Usar fracciones (Dmnl) o convertir `/100` con constante de unidades `%` |

## 9. Buenas prácticas de unidades

1. Defina unidades **para todas las variables** desde el principio; ejecute Ctrl+U con frecuencia.
2. Prefiera nombres en singular y declare sinónimos para plurales.
3. Saque las constantes "mágicas" de las ecuaciones como parámetros con nombre y unidades; active de vez en cuando *strictest testing*.
4. Normalice las entradas y salidas de los lookups (Dmnl) y multiplíquelas por valores de referencia.
5. Use factores de conversión explícitos (`Months per Year = 12 ~ Month/Year`).
6. Ponga rangos `[min,max,incr]` realistas en constantes que se explorarán con SyntheSim.
7. Un modelo sin errores de unidades no está validado: complemente con Reality Check (Parte B).

---

# Parte B — Reality Check

## 10. Concepto

*Reality Check* es una extensión del lenguaje de Vensim para **automatizar experimentos de control de calidad**: se escriben afirmaciones del tipo "si ocurre X, debe ocurrir Y" ("si no hay trabajadores, no se produce nada"; "si la producción es constante, las ventas no pueden crecer indefinidamente") y Vensim las prueba contra el comportamiento simulado, señalando las violaciones.

Dos tipos de ecuaciones:
- **Constraints** (restricciones): enuncian las consecuencias que deben seguirse de unas condiciones. Una violación indica un problema en el modelo (o en la restricción).
- **Test Inputs** (entradas de prueba): especifican las condiciones/circunstancias bajo las que una restricción debe cumplirse (fuerzan valores o trayectorias de variables).

Al probar una restricción, Vensim **fuerza la condición** (activando las Test Inputs necesarias) y comprueba si la consecuencia es verdadera; si la condición se cumple y la consecuencia no, informa un fallo de Reality Check.

## 11. Sintaxis: Constraints y Test Inputs

### 11.1 Constraint

```
nombre :THE CONDITION: condición :IMPLIES: consecuencia
```

```vensim
cold is dormant :THE CONDITION: temperature < 50 :IMPLIES: divisions = 0
	~
	~	Con frío, las células no se dividen.
	|
```

La **condición** está restringida a:
- comparaciones de variables con otras variables o con números (`temperature < 50`, `workers[a] = 0`);
- `variable = expresión` (una entrada de prueba escrita directamente; puede usar funciones RC y `TIME TRANSITION` y debe seguir las reglas de las Test Inputs);
- nombres de Test Inputs definidas aparte (se tratan como lógicas: verdaderas si están activas);
- combinaciones con `:AND:`, `:OR:` (y `:NOT:` **(verificar en condiciones)**). Ejemplo de la documentación: `Water = RC STEP(Water, 0) :AND: temperature > 65`.

La **consecuencia** es una expresión lógica sobre variables del modelo; suele compararse una variable con una función `RC … CHECK` (sección 12). Palabras clave adicionales en la consecuencia:
- `:CROSSING:` — las líneas deben cruzarse. `Inventory > :CROSSING: RC STEP CHECK(0, Inventory, 1)` exige que, a partir de `RC START TIME`, Inventory sea primero mayor que su valor de referencia y luego pase a ser menor y lo siga siendo. Dos `:CROSSING:` seguidos exigen mayor → menor → mayor (y quedarse mayor).
- `:AT LEAST ONCE:` — la relación debe cumplirse al menos una vez (en lugar de en todo momento).

### 11.2 Test Input

```
nombre :TEST INPUT: variable = expresión
```

```vensim
TI Production to zero :TEST INPUT: production = RC RAMP(production, 0, 2, 10)
	~	Widget/Month
	~	La producción baja en rampa desde su valor en t = 10 hasta 0 en t = 12.
	|
```

- Lo que va a la derecha de `:TEST INPUT:` tiene el mismo formato que una ecuación de auxiliar y sólo puede usar variables del modelo.
- Mientras la entrada de prueba está **activa**, la ecuación indicada sustituye a la ecuación normal de la variable.
- Las Test Inputs sólo pueden usarse en la parte condicional de una Constraint.
- Lista de Test Inputs que Vensim considera: las definidas explícitamente **más** todas las comparaciones que aparecen en las condiciones de las Constraints.

### 11.3 Con subíndices

Constraints y Test Inputs admiten subíndices (modelo guardado con Vensim DSS 9.3.1):

```vensim
productivity to zero[sectors] :TEST INPUT: productivity[sectors] = RC STEP(productivity[sectors], 0)
	~ ~ |
no productivity no output[sectors] :THE CONDITION:
	productivity to zero[sectors] :IMPLIES: output[sectors] <= RC STEP CHECK(0.5, output[sectors], 0.0001)
	~ ~ |
no workers no output :THE CONDITION: workers[a] = 0 :IMPLIES: output[a] = 0
	~ ~ |
```

En el `.mdl` las palabras clave pueden aparecer pegadas al nombre (`no_workers_no_output:THE CONDITION:`), tal como las guarda Vensim.

## 12. Funciones RC y `RC START TIME`

Cada función mantiene la variable en su valor generado normalmente por el modelo **hasta un instante** y desde ahí define una nueva trayectoria. Las funciones `RC …` se usan en **Test Inputs** (condición) y las `RC … CHECK` en la **consecuencia** (`:IMPLIES:`); lo normal es emparejar `RC STEP` con `RC STEP CHECK`, `RC RAMP` con `RC RAMP CHECK`, etc.

| Función (condición) | Función (consecuencia) | Trayectoria |
|---|---|---|
| `RC STEP(basis, mult[, start[, duration]])` | `RC STEP CHECK(grace, basis, mult[, start[, duration]])` | Salto a `basis·mult` en el instante de inicio y luego constante |
| `RC RAMP(basis, mult, ramptime[, start[, duration]])` | `RC RAMP CHECK(grace, basis, mult, ramptime[, start[, duration]])` | Rampa lineal hasta `basis·mult` en `ramptime` |
| `RC DECAY(basis, decaytime[, start[, duration]])` | `RC DECAY CHECK(grace, basis, decaytime[, start[, duration]])` | Decaimiento exponencial a 0 con constante `decaytime` |
| `RC GROW(basis, growrate[, start[, duration]])` | `RC GROW CHECK(grace, basis, growrate[, start[, duration]])` | Crecimiento exponencial a `growrate` |
| `RC COMPARE('runname', var, mult[, start[, duration]])` | `RC COMPARE CHECK('runname', var, grace, mult[, start[, duration]])` | Compara con la misma variable en otra corrida (normalmente el caso base) |

Argumentos:
- **`basis`**: valor de referencia; se usa **su valor en el instante de inicio** (queda "congelado"), multiplicado por `mult` cuando empieza el cambio.
- **`mult`**: multiplicador; a diferencia de `basis`, se usa su valor **actual** en cada instante (permite perfiles arbitrarios).
- **`grace`** (sólo CHECK): tiempo que puede pasar antes de que se empiece a verificar el cumplimiento.
- **`start`**: instante de inicio; si se omite se usa la variable del modelo **`RC START TIME`**.
- **`duration`**: duración del cambio **(verificar comportamiento al terminar)**.
- `RC RAMP` tras el inicio vale `basis·(mult·(Time−RC START TIME)/ramptime + (1 − (Time−RC START TIME)/ramptime))` hasta `RC START TIME + ramptime`, y luego `basis·mult`.

Uso idiomático: `var = RC STEP(var, .5)` → la variable salta al 50 % de su valor en el instante de inicio y se mantiene constante.

**`RC START TIME`**: variable que el modelador define (normalmente una constante algo posterior al inicio de la simulación) y que fija cuándo actúan las funciones RC sin `start` explícito. Como `basis` se congela en ese instante, `RC STEP CHECK(5, inventory, .3, 5)` y `RC STEP CHECK(0, inventory, .3, 10)` significan cosas bastante distintas.

```vensim
RC START TIME = 10
	~	Month
	~	Instante en que se aplican las entradas de prueba de Reality Check.
	|
```

Otras construcciones: `TIME TRANSITION` puede usarse en expresiones incluidas directamente en condiciones **(verificar firma)**.

## 13. Introducir ecuaciones de Reality Check

- Se escriben como cualquier ecuación: en el **Equation Editor**, eligiendo el tipo **Reality Check** y el subtipo **Constraint** o **Test Input**; para Constraints la condición y la consecuencia se editan en dos cuadros separados.
- También pueden escribirse directamente en el **Text Editor** o en el `.mdl`.
- En el **sketch**, se pueden dibujar como variables, mostrando como causas los elementos que verifican (útil para documentar), o en una vista dedicada a Reality Check.
- Use prefijos/convención de nombres (`TI …` para Test Inputs, `RC …` para restricciones) y documente la hipótesis en el comentario.

## 14. Ejecutar Reality Check

Se inicia desde la **barra de herramientas** (botón Reality Check) o desde el diálogo **Simulation Control** (también accesible desde el menú `Model` según la versión — **verificar**). Aparece el diálogo **Reality Check Control** con la lista de Constraints del modelo:

| Control | Función |
|---|---|
| *Test type* | Limita la prueba a un tipo de Reality Check; vacío = todos |
| *Priority >=* | Sólo restricciones con prioridad ≥ al valor indicado **(verificar cómo se asigna la prioridad)** |
| *Sim/Fail* | Muestra gráficos cuando falla una prueba y también al hacer una simulación única con *Sim Active* o *Highlighted* |
| *On Fail* | Muestra gráficos sólo si hay un fallo |
| **Sim Active** | Simula con las Test Inputs activas de la lista; el resto de restricciones se prueba **pasivamente** |
| **Highlighted** | Simula/prueba las restricciones seleccionadas (resaltadas) en la lista **(verificar detalle)** |
| **Test All** | Prueba todas las restricciones una a una, formando el conjunto de Test Inputs necesario para activar cada una (puede requerir varias simulaciones por restricción; puede tardar). **No guarda resultados de simulación**, sólo informa |

**Comprobación pasiva**: Vensim evalúa ambas partes de cada restricción como expresiones lógicas en la simulación tal cual; si la condición es verdadera y la consecuencia falsa en algún momento, informa un error. La restricción sólo se prueba si la condición ocurre de forma natural. Esta comprobación pasiva se hace al ejecutar Reality Check, **no durante una simulación normal**.

## 15. Interpretar los resultados

- Los resultados aparecen en una **ventana de texto** (una nueva cada vez que se pulsa *Sim Active*, *Highlighted* o *Test All*) que indica qué restricciones se probaron y cuáles se violaron.
- Métricas:
  - **Recuento** de éxitos y fallos.
  - **Reality Check Index**: según la documentación, número de éxitos dividido por el producto del número de variables dinámicas por el número total de variables; debería acercarse a 1 en un modelo con un conjunto completo de Reality Checks **(verificar la fórmula exacta)**.
  - **Closeness score**: cercanía media de los Reality Checks (1 si pasa).
- Pueden aparecer **gráficos** que muestran la parte de implicación de la restricción (la variable frente a la trayectoria `RC … CHECK`).
- Ante un fallo: (1) revisar si la restricción expresa bien el conocimiento del sistema; (2) seguir con *Causes Tree*/*Causes Strip* la variable de la consecuencia durante la prueba; (3) buscar formulaciones que permitan valores imposibles (stocks negativos, flujos sin límite físico, efectos de lookup que no llegan a 0).

## 16. Ejemplos completos

### 16.1 "Sin fuerza laboral no hay producción"

```vensim
Production = Workforce * Productivity
	~	Widget/Month
	~	|
Productivity = 10
	~	Widget/(Person*Month)
	~	|
Workforce = INTEG(Hiring - Quits, 100)
	~	Person
	~	|
RC START TIME = 6
	~	Month
	~	|
```

Forma 1 — condición directa (prueba activa: Vensim fuerza `Workforce = 0`):

```vensim
no workforce no production :THE CONDITION: Workforce = 0 :IMPLIES: Production = 0
	~
	~	Sin trabajadores no puede haber producción.
	|
```

Forma 2 — Test Input con trayectoria RC y comprobación con tolerancia:

```vensim
TI no workforce :TEST INPUT: Workforce = RC STEP(Workforce, 0)
	~	Person
	~	La fuerza laboral cae a 0 en RC START TIME.
	|
RC production stops :THE CONDITION: TI no workforce :IMPLIES: Production <= RC STEP CHECK(0.5, Production, 0.0001)
	~
	~	Medio mes después, la producción debe ser prácticamente 0.
	|
```

Nota: que una Test Input pueda sustituir la ecuación de un **nivel** (como `Workforce`) **(verificar)**; si su versión no lo permite, aplique la prueba al flujo o a una auxiliar (`Effective Workforce`).

### 16.2 "Sin producción, el inventario no puede crecer"

```vensim
Inventory = INTEG(Production - Shipments, 1000) ~ Widget ~ |

TI Production to zero :TEST INPUT: Production = RC RAMP(Production, 0, 2)
	~	Widget/Month
	~	Producción en rampa hasta 0 en 2 meses desde RC START TIME.
	|
no production no inventory growth :THE CONDITION: TI Production to zero
	:IMPLIES: Inventory <= RC STEP CHECK(2, Inventory, 1)
	~
	~	Tras 2 meses de gracia, el inventario no supera su valor en RC START TIME.
	|
```

### 16.3 Sobreoscilación (uso de `:CROSSING:`)

```vensim
TI demand step up :TEST INPUT: Demand = RC STEP(Demand, 1.5)
	~	Widget/Month
	~	La demanda sube un 50 % en RC START TIME.
	|
inventory overshoots :THE CONDITION: TI demand step up
	:IMPLIES: Inventory > :CROSSING: RC STEP CHECK(0, Inventory, 1)
	~
	~	Tras un aumento de demanda, el inventario primero queda por encima de su
		referencia y luego cruza por debajo (verificar semántica en su caso).
	|
```

### 16.4 Combinación de condiciones

```vensim
cold and no water :THE CONDITION: Water = RC STEP(Water, 0) :AND: temperature > 65
	:IMPLIES: divisions = 0
	~ ~ |
```

---

## 17. Disponibilidad y compatibilidad

- **Units Check y Units Equiv**: todas las ediciones (PLE incluida).
- **Reality Check**: la tabla comparativa oficial lo lista en PLE, PLE Plus, Professional y DSS; en versiones antiguas era característica de las ediciones superiores **(verificar en su versión)**.
- **Traductores**: PySD analiza las ecuaciones `:THE CONDITION:`/`:TEST INPUT:` pero **las ignora** al simular (el modelo `test-models/reality_checks` corre en PySD 3.14.3 sin evaluarlas); tampoco comprueba unidades. simlin reconoce las palabras clave en su lexer. Para validar Reality Checks hace falta Vensim.

---

## 18. Fuentes

**Unidades**
- Vensim Documentation – *Units Checking*: https://www.vensim.com/documentation/ref_units_check.html
- Vensim Documentation – *Units Equiv Tab*: https://www.vensim.com/documentation/ref_units_equiv.html
- Vensim Documentation – *Units Check Output*: https://vensim.com/documentation/22270.html
- Vensim Documentation – *Source of Units Check Errors*: https://www.vensim.com/documentation/22275.html
- Vensim Documentation – *Units and Lookup Functions*: https://www.vensim.com/documentation/22280.html ; *Normalized Lookups*: https://www.vensim.com/documentation/20545.html
- Vensim Documentation – *Equation Format and Conventions*: https://www.vensim.com/documentation/22030.html ; *Writing Equations*: http://vensim.com/documentation/20400.html
- Vensim Documentation – *POWER* (unidades con exponentes 0.5–4): https://www.vensim.com/documentation/fn_power.html ; *STEP*: https://www.vensim.com/documentation/fn_step.html
- Vensim Documentation – *Simulation Control Parameters*: https://www.vensim.com/documentation/ref_sim_control_params.html
- Vensim Documentation – *Setting Slider Bounds* / *Input Output Controls with SyntheSim*: https://www.vensim.com/documentation/ref11_setting_slider_bounds.html, https://www.vensim.com/documentation/ref11_input_output_controls_with_synthesim.html
- Vensim Documentation – *Model Settings, Errors and Units Checking*: https://www.vensim.com/documentation/ref_settings_error_units.html ; *Glossary*: https://www.vensim.com/documentation/glossary.html

**Reality Check**
- Vensim Documentation – *Defining Reality Check Equations*: https://www.vensim.com/documentation/20960.html
- Vensim Documentation – *Test Inputs*: https://www.vensim.com/documentation/20965.html ; *Constraints*: https://www.vensim.com/documentation/20970.html
- Vensim Documentation – *Simulation and Reality Check*: https://www.vensim.com/documentation/20975.html ; *Passive Constraint Checking*: https://www.vensim.com/documentation/20985.html
- Vensim Documentation – *Entering Reality Check Equations*: https://www.vensim.com/documentation/20995.html ; *Running Reality Check*: https://www.vensim.com/documentation/21005.html ; *Reality Check Results*: https://www.vensim.com/documentation/21015.html
- Vensim Documentation – *Test Input and Constraint Equations*: https://www.vensim.com/documentation/21030.html ; *An Initial Model*: https://www.vensim.com/documentation/21035.html
- Vensim Documentation – *Reality Check Functions*: http://vensim.com/documentation/fn_rc.html ; *Special Variables*: http://vensim.com/documentation/specialvariables.html ; *Keywords*: https://www.vensim.com/documentation/keywords.html
- Vensim – *Comparison Chart for Vensim Configurations*: https://vensim.com/comparison-chart-for-vensim-configurations/

**Repositorios locales**
- `SDXorg/test-models/tests/reality_checks/test_reality_checks.mdl` (Vensim DSS 9.3.1): sintaxis real de Constraints/Test Inputs con subíndices y `RC STEP`/`RC STEP CHECK`.
- Sección de *settings* (`22:`) de los `.mdl` en `test-models`, `SDEverywhere/models` y `simlin/test`: lista por defecto de equivalencias de unidades; `simlin/src/simlin-engine/src/mdl/settings.rs` (formato de la línea `22:`).
- `simlin/src/simlin-engine/src/mdl/lexer.rs`: palabras clave `:TEST INPUT:`, `:THE CONDITION:`, `:IMPLIES:`, `:AND:`, `:OR:`, `:NOT:`.
- Comprobación sintáctica propia de los ejemplos de esta guía (Constraints, Test Inputs, rangos de unidades) con PySD: `scratchpad/work-subs/rc2.mdl`.
- Modelo `SDEverywhere/models/comments` (comentarios `{…}` dentro de ecuaciones, ejecutado en Vensim).
- PySD 3.14.3: `translators/vensim/parsing_grammars/element_object.peg` (definiciones `:THE CONDITION:`/`:TEST INPUT:`), `vensim_element.py` (separación de unidades y rangos `[min,max,?]`).
