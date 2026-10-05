# 04 · Lenguaje de ecuaciones de Vensim: referencia de sintaxis

Referencia práctica de **cómo se escriben las ecuaciones de Vensim**: lo que va en el editor de ecuaciones y lo que queda en el archivo `.mdl`. Otros archivos de la base de conocimiento tratan en profundidad el formato `.mdl` (sketch y settings), las funciones, los subíndices y Reality Check. Aquí solo se resumen.

**Leyenda**
- `[PySD ✓]`: fragmento validado con PySD 3.14.3 (se tradujo y se ejecutó). El registro completo está en la §17.
- `[PySD ✗]`: sintaxis válida en Vensim que PySD no soporta. Se indica la fuente que la confirma.
- **(verificar)**: dato plausible que no se ha podido confirmar con la documentación oficial ni con un modelo de referencia.

---

## Tabla de contenidos

1. [Modelo mental](#1-modelo-mental)
2. [Anatomía de una ecuación en el `.mdl`](#2-anatomía-de-una-ecuación-en-el-mdl)
3. [Nombres de variables](#3-nombres-de-variables)
4. [Operadores de definición (lado izquierdo)](#4-operadores-de-definición-lado-izquierdo)
5. [Tipos de variable y su sintaxis](#5-tipos-de-variable-y-su-sintaxis)
6. [Variables de control y el tiempo](#6-variables-de-control-y-el-tiempo)
7. [Operadores y expresiones](#7-operadores-y-expresiones)
8. [Unidades y rangos](#8-unidades-y-rangos)
9. [Grupos y el flag `:SUPPLEMENTARY`](#9-grupos-y-el-flag-supplementary)
10. [Macros (`:MACRO:` … `:END OF MACRO:`)](#10-macros-macro--end-of-macro)
11. [Funciones definidas por el usuario y externas](#11-funciones-definidas-por-el-usuario-y-externas)
12. [Subíndices: resumen de sintaxis](#12-subíndices-resumen-de-sintaxis)
13. [Orden de evaluación y semántica de simulación](#13-orden-de-evaluación-y-semántica-de-simulación)
14. [Editor de ecuaciones frente a edición del `.mdl` como texto; errores comunes](#14-editor-de-ecuaciones-frente-a-edición-del-mdl-como-texto-errores-comunes)
15. [Portabilidad: diferencias detectadas con PySD y SDEverywhere](#15-portabilidad-diferencias-detectadas-con-pysd-y-sdeverywhere)
16. [Chuleta (cheat sheet)](#16-chuleta-cheat-sheet)
17. [Registro de validación con PySD](#17-registro-de-validación-con-pysd)
18. [Fuentes](#18-fuentes)

---

## 1. Modelo mental

- Un modelo de Vensim es un **conjunto no ordenado de ecuaciones**, una por variable (o una por elemento o bloque de elementos si la variable tiene subíndices). El orden en que aparecen en el archivo **no** influye en el cálculo. Vensim deduce la secuencia de cómputo a partir de la estructura causal. La **única** regla de orden es que un macro debe definirse antes de usarse (§10).
- Cada variable lleva tres atributos de documentación: **ecuación**, **unidades** y **comentario**. Las unidades y el comentario pertenecen a la variable, no a cada ecuación.
- El **tipo** de la variable (Level, Auxiliary, Constant, Data, Lookup, Initial…) **no se declara**: Vensim lo deduce de la forma de la ecuación (§5.1).
- La forma "humana" de editar es el **Equation Editor**. El `.mdl` es texto plano y se puede editar a mano si se respetan los separadores `~` y `|` (§14).

---

## 2. Anatomía de una ecuación en el `.mdl`

### 2.1 Forma canónica

```vensim
nombre = expresión
	~	unidades [min,max,incremento]
	~	comentario
	|
```

Variante con el flag de variable suplementaria, que lleva un cuarto campo:

```vensim
nombre = expresión
	~	unidades
	~	comentario
	~	:SUPPLEMENTARY
	|
```

| Pieza | Obligatoria | Notas |
|---|---|---|
| LHS (`nombre`, `nombre[subíndices]`) | sí | Puede llevar `:EXCEPT:` y palabras clave de datos (§5.6) |
| Operador de definición | según el tipo | `=`, `==`, `:=`, `(` (lookup), `:` (rango de subíndices), `<->`, ninguno (dato) (§4) |
| Expresión (RHS) | según el tipo | Puede ocupar varias líneas |
| `~ unidades` | el separador sí, el texto no | Rango opcional `[min,max]` o `[min,max,inc]` al final (§8) |
| `~ comentario` | el separador sí, el texto no | Texto libre multilínea, **sin `~` ni `\|`** |
| `~ :SUPPLEMENTARY` | no | Cuarto campo opcional (§9) |
| `\|` | sí | Termina la entrada |

Forma mínima válida, sin unidades ni comentario: `x = 5 ~~|`.

Ejemplo real, tal como lo guarda Vensim `[PySD ✓ s01]`:

```vensim
Population= INTEG (
	births - deaths,
		initial population)
	~	Person [0,?]
	~	Stock de población. Comentario largo que continúa \
		en otra línea con barra invertida.
	|

birth rate=
	0.03
	~	1/Year [0,0.1,0.005]
	~	Fracción anual; rango para slider [min,max,incremento].
	|

net change check=
	births - deaths
	~	Person/Year
	~		~	:SUPPLEMENTARY
	|
```

### 2.2 Cabecera, fin de ecuaciones y secciones posteriores

- **Primera línea**: `{UTF-8}` indica la codificación. Los modelos antiguos (ANSI) no la llevan. PySD acepta cualquier `{...}` inicial.
- **Fin de las ecuaciones**: la línea `\\\---/// Sketch information - do not modify anything except names` marca el comienzo de la información del diagrama (`V300 …`, `*View 1`, registros de elementos). Esa sección termina en `///---\\\`. Después viene un bloque de configuración que empieza por `:L<%^E!@` y sigue con líneas numeradas como `1:Current.vdf`. **Todo esto lo cubre el archivo dedicado al formato `.mdl`.** Para el lenguaje de ecuaciones basta saber que nada de lo que hay tras `\\\---///` son ecuaciones.
- Entre la cabecera y el sketch: ecuaciones, definiciones de subíndices, macros y marcadores de grupo (§9), en cualquier orden.

### 2.3 Espacios, saltos de línea y continuación `\`

- Los espacios, tabuladores y saltos de línea **entre tokens** son libres. Vensim acepta `Upstream1 +⏎ Upstream2` sin ningún marcador (modelo `test-models/tests/line_breaks`, guardado por Vensim).
- **`\` al final de una línea** es la continuación que **Vensim inserta al guardar** cuando una línea supera unos 80 caracteres. Va seguida de un salto y dos tabuladores. Puede caer **en mitad de un nombre** o de un comentario, y al leer se une la línea siguiente. `[PySD ✓ s09]`:

```vensim
Very long variable name that Vensim wraps when saving the model because it exceeds the line\
		 width=
	3
	~	Dmnl
	~		|
```

- Fuera de los nombres no hace falta escribir `\` a mano. Basta con partir la expresión en varias líneas.

### 2.4 Varias ecuaciones para una misma variable (`~~|`)

Cuando una variable con subíndices necesita más de una ecuación (por elementos, por subrangos o con `:EXCEPT:`), en el editor de texto **todas menos una terminan en `~~|`** (o simplemente `|`). La última lleva las unidades y el comentario `[PySD ✓ s07]`:

```vensim
price[north]=
	1.2 ~~|
price[south]=
	2.3 ~~|
price[east]=
	3.4
	~	$/unit
	~	Definición elemento a elemento.
	|
```

### 2.5 Comentarios

- **Campo de comentario** (tras el segundo `~`): texto libre que puede ocupar varias líneas. **No puede contener `~` ni `|`**, porque los dos son delimitadores. Durante la validación, un `~~|` escrito dentro de un comentario cortó la entrada y descuadró todo el modelo. Las comillas desemparejadas dentro del comentario sí son admisibles (`test-models/tests/odd_number_quotes`).
- **Comentarios en línea `{ … }` dentro de la ecuación**: la documentación ("Equation Format and Conventions") dice que se pueden incluir comentarios en una ecuación encerrándolos entre llaves, y SDEverywhere los elimina al preprocesar (`models/comments`). Pueden anidarse y ocupar varias líneas `[PySD ✗]`:

```vensim
hours per year=
	8760 {se ignoran años bisiestos}
	~	hour/Year
	~		|
```

  PySD 3.14 falla con `IncompleteParseError`. Para que el modelo sea portable, deja los comentarios en el campo de comentario.
- **Notas del modelo**: hay texto de documentación a nivel de modelo en los ajustes del modelo y en grupos. No son ecuaciones.

### 2.6 Cómo reescribe Vensim el archivo al guardar

Al guardar, Vensim **normaliza** el texto. Conviene saberlo para no extrañarse con los diffs:
- `nombre=⏎\texpresión⏎\t~\tunidades⏎\t~\tcomentario⏎\t|`.
- Los Levels se escriben como `nombre= INTEG (⏎\tflujo,⏎\t\tinicial)`, y de forma parecida `ACTIVE INITIAL (` y `WITH LOOKUP (`.
- Los nombres de función pasan a **MAYÚSCULAS**. Vensim acepta `Max`, `MAX` o `max` porque no distingue mayúsculas (`test-models/tests/function_capitalization`).
- Las líneas largas se parten con `\` (§2.3).
- Las variables de control se escriben con sus comentarios estándar (§6).

---

## 3. Nombres de variables

### 3.1 Reglas (documentación "Rules for Variable Names")

| Regla | Detalle |
|---|---|
| Sin comillas | Deben **empezar por una letra** (vale un carácter internacional) y contener solo letras, caracteres internacionales, dígitos, **espacios**, **`_`**, **comilla simple `'`** y **`$`** |
| Con comillas dobles | Cualquier carácter: `"Costo $/unidad (2024)"`, `"M&Ms"`, `"100% true"`, `"1995€/$"` |
| Comilla doble dentro del nombre | Se escapa con barra invertida: `"The \"Final\" Frontier"` |
| Longitud | Límite de **255 caracteres** |
| Espacio y `_` | **Intercambiables**: `Unit_Sales` ≡ `unit sales`. Las secuencias de espacios o guiones bajos equivalen a uno solo (así lo implementa SDEverywhere citando esta página; validado en PySD con `time's   up`) |
| Mayúsculas | **No distingue mayúsculas, pero las conserva**: usa la capitalización con la que apareció el nombre por primera vez |
| Unicode | `this is a french variable with é à è` es válido sin comillas (`{UTF-8}`) |
| Salto de línea visual | Dentro de un nombre entre comillas, `\n` representa un salto de línea en el diagrama: `"Stock with \n Newline Character"` |

Ejemplo `[PySD ✓ s02]`:

```vensim
"Costo $/unidad (2024)"=
	12.5
	~	$/unit
	~	Nombre entre comillas: contiene / ( ) y espacios.
	|

"El \"Gran\" total"=
	"Costo $/unidad (2024)" * Unit_Sales
	~	$
	~	Comillas internas escapadas con barra invertida.
	|

unit sales=
	100
	~	unit
	~	Se referencia arriba como Unit_Sales.
	|

DOLLAR SIGN$=
	1
	~	Dmnl
	~	$ permitido sin comillas.
	|

time's up=
	2 * DOLLAR SIGN$
	~	Dmnl
	~	Comilla simple permitida sin comillas dobles.
	|
```

### 3.2 Reservados y trampas

- **`Time`, `INITIAL TIME`, `FINAL TIME`, `TIME STEP` y `SAVEPER`** son variables del sistema (§6). No los uses para otra cosa.
- **Nombres de funciones**: `IF THEN ELSE`, `MIN`, `SMOOTH`, `INTEG`, etc. son palabras clave. Siguen la misma equivalencia de espacio y `_`, así que `IF_THEN_ELSE` ≡ `IF THEN ELSE`. No pongas a una variable el nombre de una función (verificar el mensaje exacto que da Vensim).
- **Palabras clave con dos puntos**: `:AND:`, `:OR:`, `:NOT:`, `:NA:`, `:EXCEPT:`, `:MACRO:`, `:END OF MACRO:`, `:INTERPOLATE:`, `:RAW:`, `:HOLD BACKWARD:`, `:LOOK FORWARD:`, `:TEST INPUT:`, `:THE CONDITION:`, `:IMPLIES:`. Todas aparecen en el léxico de xmutil y Simlin.
- **La trampa de los nombres con espacios**: `d = IF a THEN b ELSE c` **no** es un condicional. Asigna a `d` una variable llamada "`IF a THEN b ELSE c`" (documentación de IF THEN ELSE). La forma correcta es `IF THEN ELSE(a, b, c)`.
- **Nombre + paréntesis = invocación de lookup**: `algo(x)`, cuando `algo` no es una función, se interpreta como llamar a un lookup llamado `algo` (§5.7). Una función mal escrita se convierte así en una "variable no definida" (verificar el mensaje exacto).
- **Dentro de un macro**, `nombre$` hace referencia a una variable del modelo, por ejemplo `TIME STEP$` (§10). Fuera de un macro, `$` es un carácter más del nombre (`DOLLAR SIGN$`).
- **Espacios al inicio o al final** dentro de comillas (`" quotes 2 "`): SDEverywhere los recorta. Evítalos (verificar en Vensim).

### 3.3 Buenas prácticas de nombrado

- Usa nombres descriptivos con espacios (`average lifetime`) y evita las comillas salvo que sean imprescindibles. Las comillas complican la portabilidad a PySD y SDEverywhere, que convierten los nombres en identificadores.
- Mantén una capitalización coherente, por ejemplo Levels en mayúscula inicial (`Population`) y el resto en minúscula. Es una convención extendida, no una regla.
- No incluyas unidades en el nombre si ya van en el campo de unidades.

---

## 4. Operadores de definición (lado izquierdo)

El símbolo que separa el LHS del RHS determina la clase de entrada. Así lo modelan las gramáticas de PySD (`element_object.peg`) y Simlin:

| Forma | Significado | Ejemplo |
|---|---|---|
| `x = expr` | Ecuación normal: Constant, Auxiliary, Level (si es `INTEG`) o Initial (si es `INITIAL`) | `x = 5` |
| `x == expr` | **Constante inmodificable** (Unchangeable) | `conversion factor == 12` |
| `x := expr` | **Ecuación de datos** | `y :RAW: := historical` |
| `x` (sin operador) | **Variable de datos** sin ecuación: los valores vienen de fuera | `historical sales ~ unit ~ \|` |
| `x :KEYWORD:` | Variable de datos con modo de interpolación | `sales held:HOLD BACKWARD:` |
| `x( puntos )` | **Lookup** (tabla) | `t( (0,0),(1,1) )` |
| `Dim: a, b, c` | Definición de **rango de subíndices** | `Region: north, south` |
| `DimA <-> DimB` | **Equivalencia** (alias) de rangos | `Origin<->Region` |
| `x[d] :EXCEPT: [e] = …` | Ecuación con excepciones | §12 |
| `n :TEST INPUT: …` / `n :THE CONDITION: …` | Reality Check | §5.13 |
| `x = A FUNCTION OF(a, b)` | Marcador de ecuación incompleta | §5.11 |

---

## 5. Tipos de variable y su sintaxis

### 5.1 Cómo decide Vensim el tipo

| Tipo | Se reconoce porque… | Se evalúa |
|---|---|---|
| **Level** (stock, acumulación, estado) | La ecuación es `INTEG(...)` | Por integración en cada TIME STEP |
| **Auxiliary** | Ecuación `=` con variables, que no es INTEG ni INITIAL. Incluye los **flujos (rates)** | En cada paso, en orden de dependencias |
| **Constant** | `=` con solo un número, o una expresión de solo números (`10/3`) | Una vez |
| **Initial** | `INITIAL(...)` o `REINITIAL(...)` | Una vez, en la inicialización |
| **Data** | Sin ecuación, `:=` o con palabra clave de datos | Valores por tiempo, interpolados |
| **Lookup** | Nombre seguido directamente de `(` con pares `(x,y)` | Al invocarse |
| **Unchangeable constant** | `==` | Una vez; no se puede cambiar en experimentos |
| **Subscript range** | `Nombre: elementos` | No es variable |

La documentación ("Variable Types") distingue aux, const, data, level y rate. Las auxiliares no tienen memoria. Los Levels dependen de sus valores previos.

### 5.2 Constant

```vensim
average lifetime=
	70
	~	Year [1,100]
	~		|
```

- Las Constants son las que aparecen como **sliders** en SyntheSim y se pueden cambiar entre simulaciones (Set up a Simulation) sin recompilar.
- Una expresión que solo contiene números (`My Variable = 10/3`) sigue siendo constante (`test-models/tests/constant_expressions`).

### 5.3 Auxiliary (y flujos)

```vensim
births=
	Population * birth rate
	~	Person/Year
	~		|
```

- Los **flujos** de un diagrama stock-flow (las válvulas) son auxiliares cuyo valor alimenta un `INTEG`. Vensim los trata como *rates*.
- Una auxiliar puede depender de Levels, Constants, Data, Lookups y otras auxiliares, pero **sin ciclos entre auxiliares** (§13.3).

### 5.4 Level: `INTEG(rate, initial)`

```vensim
Population= INTEG (
	births - deaths,
		initial population)
	~	Person [0,?]
	~		|
```

- `INTEG(flujo_neto, valor_inicial)`. El primer argumento suele ser `entradas - salidas`. El segundo se evalúa **una sola vez** al inicializar y puede ser una expresión con otras variables.
- `INTEG` debe ser la expresión **completa** del lado derecho. No escribas `2*INTEG(...)`, sino una auxiliar aparte (verificar el mensaje exacto).
- Para que un elemento de una variable subindicada sea Level "constante", usa `INTEG(0, valor)`. No se pueden mezclar Levels con ecuaciones INITIAL en la misma variable ("Problems with Variable Types").
- Inicializar en equilibrio es un patrón habitual: `Inventory = INTEG(production - shipments, desired inventory)` `[PySD ✓ s17]`.

### 5.5 Initial: `INITIAL(expr)` y `REINITIAL`

```vensim
stock at start=
	INITIAL(Stock)
	~	unit
	~	Se evalúa una sola vez, en la inicialización.
	|
```
`[PySD ✓ s06]`

- `INITIAL(x)` guarda el valor de `x` en el instante inicial y lo mantiene constante.
- También existe `REINITIAL(x)`: la documentación de tipos dice que las Initial tienen ecuaciones INITIAL o REINITIAL, y xmutil y Simlin la reconocen como builtin. Su semántica exacta, que se supone de reevaluación al reinicializar, está por verificar.
- `ACTIVE INITIAL(expr_activa, expr_inicial)` **no** es Initial sino Auxiliary con una ecuación especial para la inicialización. Sirve para romper ciclos de inicialización (§13.4).

### 5.6 Data: sin ecuación, `:=` y modos de interpolación

**a) Variable de datos sin ecuación.** Los valores se toman de un archivo de datos (`.vdf`, `.tab`, `.csv`, `.xls…`) cargado en la simulación:

```vensim
historical sales
	~	unit/Month
	~	Variable de datos sin ecuación: valores desde un .vdf/.tab externo.
	|
```
Es Vensim válido (SDEverywhere `models/extdata`; xmutil lo trata como dato exógeno) `[PySD ✗]`: PySD 3.14 exige una palabra clave (`Rule 'keyword' didn't match`).

**b) Con modo de interpolación** (palabra clave tras el nombre) `[PySD ✓ s05]`:

```vensim
sales held:HOLD BACKWARD:
	~	unit/Month
	~	Datos externos con modo de interpolación explícito.
	|
```

**c) Ecuación de datos `:=`** (palabra clave opcional entre el nombre y `:=`) `[PySD ✓ s05]`:

```vensim
sales raw :RAW: := historical sales
	~	unit/Month
	~		|

sales interp :INTERPOLATE: := historical sales * 2
	~	unit/Month
	~		|

sales ahead :LOOK FORWARD: := historical sales
	~	unit/Month
	~		|
```

- En el RHS de una ecuación `:=` **solo pueden aparecer otros datos y constantes** (documentación "Data Equations").
- Lo habitual es leer de Excel o CSV: `x :INTERPOLATE: := GET XLS DATA('file.xlsx', 'Sheet1', 'A', 'B2')` o `GET DIRECT DATA(...)`. Esas funciones se tratan en otro archivo. Se pueden subindicar por elemento: `revenue[company, A] :RAW: := GET DIRECT DATA(...) ~~|`.

| Palabra clave | Valor entre puntos de datos |
|---|---|
| `:INTERPOLATE:` | Interpolación lineal. **Modo por defecto** |
| `:HOLD BACKWARD:` | Mantiene el último valor conocido hasta el siguiente |
| `:LOOK FORWARD:` | Usa el siguiente valor conocido |
| `:RAW:` | Sin relleno: donde no hay dato vale `:NA:`. Sirve para elegir entre dato real y valor generado por el modelo |

Nota de semántica: PySD aproxima `:=`. En la prueba, `sales raw :RAW: := historical sales` devolvió valores interpolados, no `:NA:`, porque PySD ya interpola la fuente.

### 5.7 Lookup (tabla o función gráfica)

**Definición** `[PySD ✓ s04]`:

```vensim
effect of density table(
	[(0,0)-(2,1.5)],(0,1.2),(0.5,1.1),(1,1),(1.5,0.7),(2,0.4))
	~	Dmnl
	~	Lookup con rango [(xmin,ymin)-(xmax,ymax)].
	|

simple table(
	(0,0),(1,10),(2,15))
	~	Dmnl
	~	Lookup sin rango explícito.
	|
```

- La sintaxis es `nombre( [(xmin,ymin)-(xmax,ymax)], (x1,y1), (x2,y2), … )`. **No hay `=`**: el nombre va seguido directamente de `(`.
- El rango `[...]` es opcional y solo afecta a la escala del editor gráfico.
- **Puntos extra dentro de los corchetes**: `[(0,0)-(2,10),(0,10),(2,0)]` lo genera el editor gráfico y Vensim lo guarda así (`test-models/tests/lookups_with_expr`). Se interpreta como una línea de referencia que no altera los valores (verificar). PySD lo acepta.
- Los valores x deben ir en orden creciente (verificar el error que da si no).

**Invocación**: se llama como si fuera una función `[PySD ✓ s04]`:

```vensim
effect of density=
	effect of density table(density)
	~	Dmnl
	~		|
```

- Entre los puntos se interpola linealmente. **Fuera del rango x se mantiene el valor del extremo** y no extrapola. En la prueba, `simple table(3)` y `simple table(4)` dieron 15. Para extrapolar se usa `LOOKUP EXTRAPOLATE(tabla, x)`.
- Funciones relacionadas: `LOOKUP INVERT`, `LOOKUP AREA`, `LOOKUP FORWARD`, `LOOKUP BACKWARD`, `GET DATA AT TIME`… (se tratan en otro archivo).

**Lookup en línea con `WITH LOOKUP`**, cuando la tabla solo se usa en una variable `[PySD ✓ s04]`:

```vensim
inline effect=
	WITH LOOKUP(density, ([(0,0)-(2,2)],(0,0),(1,1),(2,1.5)))
	~	Dmnl
	~	Lookup en línea.
	|
```
Así lo guarda Vensim: `x= WITH LOOKUP (⏎\tinput,⏎\t\t([(…)-(…)],(…),…))`.

**Lookups con subíndices** (definición por elemento y llamada con subíndice) `[PySD ✓ s15]`:

```vensim
demand curve[A](
	[(0,0)-(10,10)],(0,10),(10,0)) ~~|
demand curve[B](
	[(0,0)-(10,10)],(0,5),(10,5))
	~	unit
	~	Lookup subindicado definido por elemento.
	|

demand[Product]=
	demand curve[Product](Time)
	~	unit
	~		|
```

**Desde Excel**: `tabla( GET XLS LOOKUPS('inputs.xlsx', 'Sheet1', 'A', 'B2') )` o `GET DIRECT LOOKUPS`. La gramática de PySD `lookups.peg` confirma la forma; el detalle está en otro archivo.

Si un elemento de una variable subindicada es Lookup, **todos** deben serlo ("Variable Types").

### 5.8 Constante inmodificable `==`

```vensim
conversion factor==
	12
	~	Month/Year
	~	Constante inmodificable (==).
	|
```
`[PySD ✓ s06]`

- Se fija en el modelo y no aparece como parámetro cambiable en SyntheSim ni en la configuración de simulación (verificar el alcance exacto). Es útil para constantes físicas o de conversión.
- Si un elemento de una variable subindicada es Unchangeable, todos deben serlo ("Variable Types").
- También funciona con `TABBED ARRAY`: `x[r,c] == TABBED ARRAY(...)`.

### 5.9 Listas de constantes y `TABBED ARRAY`

```vensim
population[Region]=
	100, 200, 300
	~	Person
	~	Lista de constantes (1 dimensión).
	|

distance[Origin, Region]=
	0, 5, 7;
	5, 0, 3;
	7, 3, 0;
	~	km
	~	Tabla 2D: filas = 1.ª dimensión, columnas = 2.ª.
	|
```
`[PySD ✓ s07]`

- Las comas separan columnas (última dimensión) y el `;` separa filas (primera dimensión). Para tres dimensiones o más, una ecuación por cada elemento de la dimensión extra: `x[A,B,c1] = …; ~~|`.
- `TABBED ARRAY(...)` acepta valores separados por tabuladores, pegados desde una hoja de cálculo `[PySD ✓ s09]`:

```vensim
tab array[r, c]=TABBED ARRAY(
	1	2	3
	4	5	6)
	~	Dmnl
	~	Constantes pegadas desde una hoja de cálculo (tabuladores).
	|
```

### 5.10 `:NA:` (valor ausente)

```vensim
missing until 2=
	IF THEN ELSE(Time < 2, :NA:, Time)
	~	Dmnl
	~	:NA: = valor especial de dato ausente.
	|
```
`[PySD ✓ s09]`

- En Vensim, `:NA:` es un **número centinela muy negativo**, alrededor de −1.298e33 según las notas sobre el formato `.vdf` en Simlin. Por eso `x = :NA:` es una comparación válida (la gramática de SDEverywhere la prueba explícitamente) y es la forma de comprobar si falta un dato `:RAW:`.
- PySD traduce `:NA:` a `NaN`, así que `x = :NA:` da siempre falso: en la prueba, `is missing` dio 0. Hay una diferencia semántica.
- `NA` sin dos puntos aparece en algunas listas de funciones; usa siempre `:NA:` (verificar).

### 5.11 `A FUNCTION OF`

```vensim
Capital  = A FUNCTION OF( Investment,-Discards)
	~	
	~		|
```

- Es un **marcador de ecuación incompleta**. Lo crea Vensim cuando se dibuja el diagrama sin escribir ecuaciones (el ejemplo es real, `FREE6/energy_pos_loop.mdl`) y cuando se decide **ignorar un error de sintaxis**: la ecuación se guarda literalmente y Vensim la marca internamente como A_FUNCTION_OF ("Legacy: Syntax Errors").
- Lista las entradas causales; `-x` indica un flujo de salida en el caso de los Levels. **"No está pensada para escribir ecuaciones e impide la simulación"** (fn_a_function_of, citado por Simlin).
- PySD la traduce a `NaN` y simula. Vensim no simula `[PySD ✓ s12]` (solo el parseo).

### 5.12 `GAME` (entradas de juego)

```vensim
price setting=
	GAME(base price * 1.1)
	~	$/unit
	~	Variable de juego.
	|
```
`[PySD ✓ s09]`

- Fuera del modo Gaming vale la expresión interna. En modo Gaming el usuario puede fijar el valor de forma interactiva en cada intervalo de juego. PySD trata `GAME(x)` como `x`.

### 5.13 Reality Check (resumen; hay archivo dedicado)

```vensim
no workers:TEST INPUT:
	workforce = 0
	~	
	~	Reality Check: entrada de prueba.
	|

no workers no output:THE CONDITION:
	no workers :IMPLIES: output = 0
	~	
	~	Reality Check: restricción.
	|
```
`[PySD ✓ s10]` (PySD parsea los bloques y los ignora en la simulación)

- `nombre :TEST INPUT: variable = valor` define una entrada de prueba.
- `nombre :THE CONDITION: condición :IMPLIES: consecuencia` define una restricción. Se usan funciones RC como `RC STEP`, `RC COMPARE`…, que se tratan en el archivo de Reality Check.
- xmutil y Simlin aceptan también `:TESTINPUT:` y `:THECONDITION:` sin espacio.
- **`:CROSSING:`** no aparece en los léxicos de xmutil, Simlin ni PySD ni en ningún `.mdl` de los repositorios consultados. Que exista como palabra clave está por verificar.
- Reality Check es una función de las ediciones avanzadas de Vensim, Pro y DSS (verificar disponibilidad por edición).

### 5.14 Mezcla de tipos en una variable subindicada

Cuando cada elemento tiene su propia ecuación, Vensim permite ciertas mezclas ("Problems with Variable Types" / "Mixed Variable Types"):

| Mezcla | Se trata como |
|---|---|
| Data + Constant | Data |
| Auxiliary + Data + Initial + Constant | Auxiliary |
| Level + Constant + Data | Level (verificar) |
| Level + Initial | **No permitida**: usa `INTEG(0, inicial)` |
| Lookup + otra cosa | **No permitida**: todas Lookup |
| Unchangeable + otra cosa | **No permitida**: todas `==` |

---

## 6. Variables de control y el tiempo

Todo modelo tiene cuatro variables de control. Vensim las crea en el grupo `.Control` con estos comentarios estándar `[PySD ✓ s14]`:

```vensim
********************************************************
	.Control
********************************************************~
		Simulation Control Parameters
	|

FINAL TIME  = 2030
	~	Year
	~	The final time for the simulation.
	|

INITIAL TIME  = 2020
	~	Year
	~	The initial time for the simulation.
	|

SAVEPER  = 1
	~	Year [0,?]
	~	The frequency with which output is stored.
	|

TIME STEP  = 0.25
	~	Year [0,?]
	~	The time step for the simulation.
	|
```

| Variable | Papel |
|---|---|
| `INITIAL TIME` | Instante inicial. Las unidades de esta variable fijan la **unidad de tiempo** del modelo (Model › Settings › Time Bounds, campo *Units for Time*) |
| `FINAL TIME` | Instante final, incluido |
| `TIME STEP` | Paso de integración (dt). Se recomienda una potencia de 2 (1, 0.5, 0.25, 0.125, 0.0625, 0.03125…) para evitar errores de redondeo binario (verificar la redacción oficial) |
| `SAVEPER` | Cada cuánto se guardan resultados. Suele ser `= TIME STEP` o un múltiplo suyo |
| `Time` | Variable del sistema con el tiempo actual. No tiene ecuación y se usa en cualquier expresión: `Time - INITIAL TIME`, `STEP(10, 5)` compara contra `Time` |

- Las cuatro se pueden usar en ecuaciones como cualquier variable, por ejemplo `elapsed = Time - INITIAL TIME`.
- Lo normal es que sean constantes. En el diagrama, `Time` y las variables de control se dibujan como variables sombra (shadow variables).
- El método de integración (Euler por defecto, Runge-Kutta 2/4 y otros) se elige en Model › Settings y queda en la sección de configuración del `.mdl`. No es parte del lenguaje de ecuaciones.

---

## 7. Operadores y expresiones

### 7.1 Aritméticos

| Operador | Uso | Notas |
|---|---|---|
| `+` `-` | suma, resta; también unarios (`-x`, `+.72`) | |
| `*` `/` | producto, división | `3/4 = 0.75`: no hay división entera (`test-models/tests/number_handling`). Dividir por 0 da un error de punto flotante en simulación; protégete con `XIDZ` o `ZIDZ` |
| `^` | potencia | `Time^2`, `x^-2` |

No hay operador módulo: se usan las funciones `MODULO(a,b)`, `INTEGER(x)` (trunca hacia 0) y `QUANTUM(a,b)`.

### 7.2 Relacionales

`=`, `<>`, `<`, `>`, `<=`, `>=`. Devuelven 1 (verdadero) o 0 (falso). Nota: `=` es a la vez el operador de definición y el de igualdad. Dentro de una expresión siempre significa comparación.

### 7.3 Lógicos

`:AND:`, `:OR:` (binarios) y `:NOT:` (unario). Se escriben **entre dos puntos** `[PySD ✓ s03, s16]`:

```vensim
logic and or=
	IF THEN ELSE( (Time > 1 :AND: Time < 3) :OR: Time = 0 , 1, 0)
	~	Dmnl
	~	Con paréntesis explícitos: resultado inequívoco.
	|

logic not=
	IF THEN ELSE( :NOT: (Time >= 2), 1, 0)
	~	Dmnl
	~		|
```

- La documentación ("Operators") dice que los operadores relacionales y lógicos están **pensados para usarse dentro de funciones como `IF THEN ELSE`, `SAMPLE IF TRUE` y `SHIFT IF TRUE`**. Es mejor no asignar comparaciones sueltas (`x = a > b`) y escribir `IF THEN ELSE(a > b, 1, 0)`. PySD acepta la comparación suelta y la convierte en booleano; está por verificar si Vensim la acepta.
- Cualquier valor distinto de 0 es verdadero en la condición de `IF THEN ELSE`.

### 7.4 Precedencia

De **mayor a menor**. Los paréntesis siempre mandan.

| Nivel | Operadores | Evidencia |
|---|---|---|
| 1 | `( )` | |
| 2 | `^` | `-2^2 = -4` en **Vensim DSS 6.3** (salida en `test-models/tests/exponentiation`); `^` se aplica antes que el signo unario |
| 3 | `-` y `+` unarios | `-x * y` = `(-x)*y` (tests de SDEverywhere) |
| 4 | `*` `/` | |
| 5 | `+` `-` binarios | |
| 6 | `<` `>` `<=` `>=` `=` `<>` | `(1 + 2) > 2`: la aritmética va antes que la comparación |
| 7 | `:NOT:` | `:NOT: 1 > 2` da **1** en Vensim: `:NOT:` niega la comparación entera (verificación contra Vensim registrada en Simlin GH #914) |
| 8 | `:AND:` | `(2 > 1) :AND: 0`: la comparación va antes que `:AND:` |
| 9 | `:OR:` | `:AND:` va antes que `:OR:` (documentación "Operators") |

La documentación agrupa los binarios en este orden: `^`; `* / + -`; `< > <= >= <> =`; `:AND:`; `:OR:`. Los unarios son `:NOT:`, `-` y `+`. Afirma que la precedencia es la convencional, como en C o BASIC.

**Casos dudosos. Usa paréntesis siempre en estos casos:**
- **Asociatividad de `^`**: `2^3^2` da 512 en PySD (asociativa por la derecha, como en XMILE), mientras que la gramática de SDEverywhere la documenta por la izquierda (64). Sin confirmar en Vensim (verificar). Escribe `(2^3)^2` o `2^(3^2)`.
- **`:AND:` y `:OR:` mezclados**: PySD 3.14 agrupa mal `Time > 1 :AND: Time < 3 :OR: Time = 0` (en `t=0` dio 0; con la precedencia de Vensim sale 1). Con paréntesis funciona en todos los motores.
- **Comparaciones encadenadas** (`a < b < c`): no las uses. PySD solo admite una comparación por nivel. Escribe `a < b :AND: b < c`.
- **`:NOT:` frente a `:AND:`**: `:NOT: a :AND: b` se lee como `(:NOT: a) :AND: b` en PySD (verificar en Vensim). Pon paréntesis.

Validación de precedencia `[PySD ✓ s03]`: `-2^2 → -4`, `1 + 2 * 3 - 8 / 4 → 5`, `IF THEN ELSE(Time + 1 > 2 * 1, 1, 0)` → 1 desde `t=2`.

### 7.5 Números

- Formatos: enteros, decimales con punto, decimales sin cero inicial (`.25`, `-.67`, `+.72`) y notación científica con `e` o `E` (`3e-05`, `1.5E+3`) `[PySD ✓ s03; test-models/zeroled_decimals]`.
- El separador decimal es siempre el punto. La coma separa argumentos y elementos de listas. No hay separador de miles.
- Vensim calcula en coma flotante. Las versiones de doble precisión aparecen en los metadatos como "double precision".

### 7.6 Constantes especiales

- `:NA:`, ver §5.10.
- **No hay `PI` en Vensim**: PySD solo la contempla para XMILE y `test-models/tests/pi` dice "pi function only defined in XMILE (not Vensim)". Define `pi = 3.14159265358979 ~ Dmnl ~|` (verificar en versiones recientes).
- Los valores lógicos son 1 y 0. No existen `TRUE` ni `FALSE` como palabras clave (verificar).

### 7.7 Llamadas a funciones

- Forma: `NOMBRE DE FUNCIÓN(arg1, arg2, …)`. Los nombres de función tienen espacios (`IF THEN ELSE`, `DELAY FIXED`, `RANDOM UNIFORM`). No distinguen mayúsculas y Vensim los guarda en MAYÚSCULAS.
- Los argumentos son expresiones arbitrarias, incluidas otras llamadas. Hay restricciones: `ACTIVE INITIAL` debe ser lo primero y lo único del RHS. Algunas funciones vectoriales exigen variables, no expresiones; por ejemplo, Vensim rechaza `VECTOR ELM MAP(x[three]*1, …)` con "Argument 1 to function VECTOR ELM MAP must be a normal variable" (prueba registrada en Simlin).
- Las **cadenas** (rutas, hojas, celdas en `GET XLS …` y `GET DIRECT …`) van entre **comillas simples**: `GET DIRECT CONSTANTS('inputs.xlsx', 'tab1', 'var1_')`.
- Las funciones de retardo y suavizado (`SMOOTH`, `DELAY1`, `DELAY3`, `TREND`, `FORECAST`, `NPV`…) se implementan como macros con **Levels ocultos**. Cada llamada crea su propio estado (§10).

---

## 8. Unidades y rangos

### 8.1 Unidades

- Van en el primer campo tras `~`: `Person/Year`, `unit/(Person*Month)`, `1/Year`, `$/unit`, `Month/Year`. Se admiten `*`, `/`, `^` y paréntesis.
- **Adimensional**: `Dmnl`. Otras grafías como `dmnl` o `1` dependen de la versión (verificar).
- Las unidades de tiempo deben coincidir con las de `INITIAL TIME` (§6).
- Las **equivalencias de unidades**, por ejemplo singular y plural, se declaran en los ajustes del modelo y quedan en la sección de configuración del `.mdl` (tipo 22 en el parser de Simlin). No se escriben en las ecuaciones.
- Comprobación con Model › Units Check. Es recomendable porque detecta errores estructurales.
- **En macros**, la unidad puede ser el **nombre de un argumento** de entrada (`~ input`): se hereda la unidad del argumento real en cada llamada (§10).

### 8.2 Rangos (`[min,max]`, `[min,max,incremento]`)

Se escriben **al final del campo de unidades**:

```vensim
Limited Flow=
	1
	~	Widgets/Month [-10,10,1]
	~	Entre -10 y 10, con incrementos de 1.
	|

Lower Bounded Stock= INTEG (
	-Outflow,
		10)
	~	 [0,?]
	~	Sin unidades, solo rango: el ? indica que no hay límite.
	|
```
(Ambos casos vienen de `test-models/tests/limits` y `variable_ranges`.)

- `?` en cualquiera de los extremos significa abierto: `[0,?]`, `[?,10]`.
- El tercer valor es el **incremento** del slider en SyntheSim.
- En el Equation Editor corresponden a los campos Min, Max e Incr (verificar etiquetas).
- Los rangos también documentan el dominio válido de la variable. Si Vensim avisa al salirse del rango depende de la configuración (verificar).

---

## 9. Grupos y el flag `:SUPPLEMENTARY`

### 9.1 Grupos

Los grupos organizan las ecuaciones en el archivo y en el Document Tool. **No afectan a la simulación.**

```vensim
********************************************************
	.Population
********************************************************~
		Ecuaciones del sector de población.
	|
```

- La estructura es: línea de asteriscos, `.Nombre`, línea de asteriscos terminada en `~`, comentario del grupo y `|`. Es una entrada de dos campos (`elemento ~ elemento |` en la gramática de PySD).
- Las ecuaciones que siguen pertenecen a ese grupo hasta que aparece otro marcador.
- Hay nombres jerárquicos con punto, como `.Energy.Sources` en modelos reales. La semántica de anidamiento está por verificar.
- El léxico de Simlin y xmutil reconoce también un formato antiguo `{**Nombre**}` (verificar).

### 9.2 `:SUPPLEMENTARY`

```vensim
net change check=
	births - deaths
	~	Person/Year
	~		~	:SUPPLEMENTARY
	|
```
`[PySD ✓ s01]`

- Se escribe en un **cuarto campo** tras un tercer `~`, y se acepta también abreviado como `:SUP` (parser de Simlin). Corresponde a la casilla *Supplementary* del Equation Editor (verificar etiqueta).
- Marca variables informativas que no forman parte de la estructura de realimentación. Su efecto práctico es que Vensim **no las reporta como definidas pero no usadas** (mensajes USE FLAG) (verificar efectos adicionales).
- Aparece en muchos modelos reales: `test-models/tests/constant_expressions`, `subscript_docs` y otros.

---

## 10. Macros (`:MACRO:` … `:END OF MACRO:`)

### 10.1 Sintaxis completa

```vensim
:MACRO: MY SMOOTH(input, delay time)
MY SMOOTH= INTEG (
	(input - MY SMOOTH) / delay time,
		input)
	~	input
	~	Las unidades = nombre de un argumento: se heredan del argumento real.
	|

:END OF MACRO:
```
Uso `[PySD ✓ s08b]`:

```vensim
smoothed signal=
	MY SMOOTH(signal, 2)
	~	unit
	~		|
```

**Con salidas adicionales**, separadas de las entradas por `:` en la cabecera y en la llamada (ejemplo `add3` de "Using Macros"):

```vensim
:MACRO: ADD3(val1, val2, val3 : minval, maxval)
ADD3=
	val1 + val2 + val3
	~	val1
	~		|

minval=
	MIN(val1, MIN(val2, val3))
	~	val1
	~		|

maxval=
	MAX(val1, MAX(val2, val3))
	~	val1
	~		|

:END OF MACRO:

total=
	ADD3(1, 5, 3 : lowest, highest)
	~	unit
	~	lowest y highest pasan a ser variables del modelo.
	|
```
PySD parsea la **cabecera** con `:`, pero **no** la llamada con `:` (`IncompleteParseError`) `[PySD ✗ en la llamada]`. xmutil tampoco admite la lista de salidas. La documentación de Vensim **desaconseja** usar salidas adicionales.

### 10.2 Reglas

| Regla | Detalle (documentación "Defining Macros" y "Using Macros") |
|---|---|
| Orden | **El macro debe definirse antes de usarse**. Es la única regla de orden del lenguaje; si no se cumple da error de sintaxis |
| Nombre | Cualquier nombre válido sin comillas, con espacios si se quiere (`RAMP FROM TO`) |
| Salida principal | Dentro del macro tiene que haber **una ecuación cuyo LHS sea el nombre del macro**. Es el valor que devuelve |
| Salidas extra | Tras `:` en la cabecera; cada una necesita una ecuación dentro del macro |
| Argumentos | Posicionales y sin subíndices en la cabecera. En la llamada se aceptan expresiones y variables subindicadas (`SMOOTH(tadum[house], 20)`) |
| Ámbito | Los nombres internos son **locales**: no chocan con los del modelo ni con los de otros macros |
| Variables del modelo | Solo con el sufijo **`$`** y solo si no tienen subíndices: `TIME STEP$`, `Time$` |
| Subíndices | **No se admiten dentro de la definición**. Las variables generadas heredan los subíndices del LHS de la llamada |
| Estado | Cada llamada crea **sus propios Levels**: dos llamadas no comparten stock |
| Anidamiento | Un macro puede llamar a otros ya definidos y se expande recursivamente. No se pueden anidar bloques `:MACRO:` uno dentro de otro |
| Edición | Definir macros requiere Vensim **Pro o DSS**. PLE y PLE Plus no pueden |

La documentación recomienda usar macros "con moderación", porque pueden introducir dinámica oculta.

---

## 11. Funciones definidas por el usuario y externas

- Dentro del lenguaje de ecuaciones, el único mecanismo para "definir funciones" es **`:MACRO:`** (§10).
- Vensim DSS admite además **funciones externas** compiladas en una DLL, con su propio registro y nombre. Su sintaxis de llamada es la de una función normal. Los detalles de declaración y compilación son específicos de DSS y quedan fuera de este archivo (verificar en la documentación de External Functions).
- En la otra dirección, Vensim se puede controlar desde fuera con la DLL y los comandos de scripting. Lo trata otro archivo.

---

## 12. Subíndices: resumen de sintaxis

(Otro archivo los trata en profundidad.) Todo lo siguiente está validado `[PySD ✓ s07, s15]` salvo indicación.

```vensim
Region:
	north, south, east
	~	
	~	Rango de subíndices (dimensión).
	|

Layer:
	(L1-L4)
	~	
	~	Rango numérico: L1, L2, L3, L4.
	|

Coastal:
	north, east
	~	
	~	Subrango de Region.
	|

Origin<->Region
	~	
	~	Equivalencia: Origin es un alias de Region.
	|

Zone:
	z1, z2, z3 -> Region
	~	
	~	Mapeo posicional z1->north, z2->south, z3->east.
	|

region from zone[Region]=
	zone data[Zone]
	~	Person
	~	Mapeo: LHS con la dimensión destino (Region), RHS con la origen (Zone).
	|

growth[Region]:EXCEPT:[south]=
	0.02 ~~|
growth[south]=
	0.05
	~	1/Year
	~	Excepción + ecuación específica de elemento.
	|

total population=
	SUM(population[Region!])
	~	Person
	~	! marca la dimensión sobre la que se agrega.
	|

layer index[Layer]=
	Layer
	~	Dmnl
	~	Un rango usado como valor devuelve la posición (1, 2, ...).
	|
```

| Construcción | Sintaxis |
|---|---|
| Definir un rango | `Dim: a, b, c ~~\|`. En el `.mdl`, las definiciones de rango llevan `:` en lugar de `=` |
| Rango numérico | `(a1-a10)`, combinable con otros elementos: `(da1-da4), da5` |
| Subrango | Otro rango cuyos elementos pertenecen a uno mayor |
| Uso | `x[Dim]`, `x[elemento]`, `x[Dim1, Dim2]` |
| Mapeo | `DimA: a1, a2 -> DimB`. Se usa con la dimensión destino en el LHS y la de origen en el RHS (`test-models/subscript_mapping_vensim`). Mapeo parcial: `-> (DimB: b2, b1)` (gramática de PySD; PySD no lo soporta) |
| Equivalencia | `DimA <-> DimB` |
| Excepciones | `x[d1,d2] :EXCEPT: [e1,e2], [e3,e4] = …`, con varios grupos `[PySD ✓ s15]` |
| Constantes en tabla | `1,2,3;4,5,6;` (§5.9) |
| Desde Excel | `Dim: GET XLS SUBSCRIPT('file', 'sheet', 'A1', 'C1', '')` (forma importada; detalle en otro archivo) |
| Funciones vectoriales | `SUM`, `PROD`, `VMIN`, `VMAX`… con `!` en la dimensión que se reduce: `SUM(m[Origin, Region!])` |
| Rango como valor | Dentro de una ecuación sobre `Dim`, `Dim` vale la posición (base 1) del elemento |

Reglas que conviene recordar:
- **Un rango que aparece en el RHS tiene que aparecer también en el LHS**, salvo que se reduzca con `!` o se mapee (ref_subscripts, citado por Simlin).
- No se puede repetir una dimensión en el LHS. Vensim responde "DimA appears more than once on LHS" (prueba registrada en Simlin).
- Una lista de constantes debe cubrir exactamente los elementos del LHS.

---

## 13. Orden de evaluación y semántica de simulación

### 13.1 Independencia del orden

"Vensim uses the causal structure to determine the appropriate sequence of computation. The order in which you define the variables makes no difference" ("Computational Sequence"). La excepción son los macros (§10.2).

### 13.2 Ciclo de simulación (Euler)

1. **Inicialización**: `Time = INITIAL TIME`. Se evalúan las Constants y Data. Para **cada Level**, Vensim calcula su valor inicial: resuelve recursivamente las variables que aparecen en el argumento inicial de `INTEG` hasta llegar a constantes o datos. Por el camino se calculan las auxiliares que hagan falta y se fijan las `INITIAL`.
2. **Cálculo de auxiliares y flujos** (comp_aux y comp_rate): con los Levels conocidos se evalúan todas las auxiliares en **orden de dependencia** (orden topológico) y después las tasas de cambio de cada Level.
3. **Guardado**: si `Time` es múltiplo de `SAVEPER` desde `INITIAL TIME`, se guardan los valores.
4. **Integración**: `Level(t+dt) = Level(t) + dt · flujo_neto(t)` (Euler). Los Levels **solo** cambian aquí.
5. `Time = Time + TIME STEP`. Se repite desde el paso 2 hasta `FINAL TIME`.

Consecuencias prácticas:
- Un Level en `t` depende de los flujos en `t − dt`. Por eso los **Levels rompen los ciclos de realimentación**: todo bucle de realimentación debe pasar por al menos un Level, sea explícito o uno oculto en `SMOOTH`, `DELAY` y similares.
- Las Data se interpolan en cada `Time` según su modo (§5.6). Los Lookups se evalúan cada vez que se invocan.
- Con Runge-Kutta, las auxiliares se evalúan varias veces por paso (verificar detalles en "Runge-Kutta Integration").

### 13.3 Ecuaciones simultáneas (error)

Si hay un ciclo formado **solo por auxiliares** (sin Level), Vensim no puede ordenarlas y da un **error de ecuaciones simultáneas** en Check Model:

```vensim
a=
	b + 1
	~	Dmnl
	~		|

b=
	a * 0.5
	~	Dmnl
	~		|
```
PySD lo traduce, pero al ejecutarlo da `RecursionError` `[PySD s13: falla como se esperaba]`.

**Soluciones**: introducir un Level (por ejemplo una percepción con `SMOOTH`), reformular la ecuación de forma algebraica explícita o, si es un ciclo solo de inicialización, usar `ACTIVE INITIAL`.

### 13.4 Ciclos de inicialización y `ACTIVE INITIAL`

Un valor inicial de Level no puede depender de sí mismo, ni siquiera indirectamente. Si ocurre, Vensim avisa con "Simultaneous initial value equations…", texto que aparece en el foro de Ventana. `ACTIVE INITIAL(expr_activa, expr_inicial)` usa `expr_inicial` durante la inicialización y `expr_activa` durante la simulación. **Debe ser lo primero y lo único del RHS** `[PySD ✓ s06]`:

```vensim
Capacity= INTEG (
	(target capacity - Capacity) / 4,
		target capacity)
	~	unit
	~	Inicializado en equilibrio con su propio objetivo.
	|

target capacity=
	ACTIVE INITIAL(Capacity * utilization effect, 100)
	~	unit
	~	Durante la simulación usa la 1.ª expresión; en la inicialización usa 100.
	|
```

### 13.5 Funciones con estado

`SMOOTH*`, `DELAY*`, `TREND`, `FORECAST`, `NPV` y `SAMPLE IF TRUE` contienen **Levels ocultos**: participan en la inicialización y rompen bucles igual que un `INTEG`. Las variables con `INITIAL` se congelan tras la inicialización.

---

## 14. Editor de ecuaciones frente a edición del `.mdl` como texto; errores comunes

### 14.1 Equation Editor

- Se abre con la herramienta **Equations** (botón `y = x²` de la barra) haciendo clic en una variable del diagrama. Muestra el nombre, el campo de la ecuación, **Units**, **Comment**, el tipo (Type y Sub-type: Normal, With Lookup…), **Min/Max/Incr**, el grupo, la casilla *Supplementary* y el teclado de funciones y variables (verificar etiquetas exactas por versión; Vensim 10 trae un editor renovado y la documentación conserva "Legacy: The Equation Editor Dialog").
- En el editor **solo se escribe el lado derecho**: el LHS es la variable seleccionada.
  - En un **Level** el editor pone `INTEG(` por su cuenta y tiene un campo separado para el **valor inicial** (verificar).
  - En un **Lookup** se introducen los puntos como texto o con *As Graph*.
  - Las unidades y el comentario se escriben una sola vez aunque haya varias ecuaciones por subíndices.
- Si escribes un nombre que no existe en el modelo, al pulsar Check te pregunta si quieres crear la variable. Si no cuadra la lista de entradas (las flechas del diagrama), pregunta si quieres actualizarla.
- Botones: **Check Syntax** (la ecuación aislada) y **Check Model** (todo el modelo: errores semánticos y mensajes de uso).

### 14.2 Editar el `.mdl` como texto

Vensim incluye un editor de texto. Las reglas de la documentación se refieren a él, como la de `~~|` en ecuaciones múltiples (verificar la ruta de menú en la versión actual). También se puede usar un editor externo con el modelo cerrado en Vensim.

Reglas al editar a mano:
1. Toda entrada termina en `|`, y las unidades y el comentario van tras `~`. Ecuaciones múltiples: `~~|` en todas menos la última (§2.4).
2. **No uses `~` ni `|` en los comentarios**. Usa `|` dentro de nombres solo entre comillas.
3. Los nombres con caracteres especiales van **siempre** entre comillas dobles, en todas las apariciones.
4. **No toques la sección del sketch**, salvo para renombrar: el propio encabezado dice "do not modify anything except names". Si renombras una variable en las ecuaciones, renómbrala también en el sketch. De lo contrario, el diagrama pierde la referencia.
5. Las ecuaciones añadidas a mano no aparecen en ninguna vista del diagrama, aunque el modelo simula.
6. Respeta `{UTF-8}` si usas caracteres no ASCII y guarda el archivo en UTF-8. Vensim usa CRLF en Windows.
7. Al reabrir el archivo y guardarlo, Vensim lo normaliza (§2.6).

### 14.3 Secuencia de verificación

Según "Error Checking Sequence": primero se comprueba la **sintaxis** de cada ecuación por separado (incluidas las ecuaciones incompletas); después, el **uso de lookups** y el **uso de subíndices**; luego vienen los errores semánticos de modelo (tipos, simultaneidad) y los **mensajes de uso** (verificar el orden exacto de las fases posteriores). Si se ignora un error de sintaxis, la ecuación se guarda tal cual como A FUNCTION OF.

### 14.4 Errores frecuentes

El texto de los mensajes es aproximado salvo cuando va entre comillas literales.

| Síntoma o mensaje | Causa típica | Solución |
|---|---|---|
| Error de sintaxis con el cursor en una posición | Paréntesis desequilibrados, coma de más, `:AND` sin el segundo `:`, nombre con caracteres especiales sin comillas | Corregir en la posición señalada |
| Variable nueva al pulsar Check | Errata en un nombre: `birth rte` | Responder *No* y corregir |
| **NOT DEFINED** (mensaje de uso) | Variable usada sin ecuación; normalmente una errata | Definirla o corregir el nombre. Si debe ser exógena, cargar datos |
| **USE FLAG**: definida pero no usada | Variable suelta | No impide simular. Usarla, borrarla o marcarla `:SUPPLEMENTARY` |
| Ecuaciones simultáneas | Ciclo de auxiliares sin Level (§13.3) | Introducir un Level o reformular |
| "Simultaneous initial value equations involving…" | Ciclo en valores iniciales (§13.4) | `ACTIVE INITIAL` o un valor inicial independiente |
| Problemas de tipos de variable | Mezcla no permitida entre elementos (§5.14), o `INTEG` no es la expresión entera | `INTEG(0, x)`; separar en auxiliares |
| Rango de subíndices en el RHS que no está en el LHS | Falta `!` o falta el mapeo | `SUM(x[Dim!])` o declarar el mapeo `->` |
| "DimA appears more than once on LHS" | `x[DimA, DimA]` | Usar un alias `<->` |
| "Argument 1 to function VECTOR ELM MAP must be a normal variable" | Se pasó una expresión a una función que exige una variable | Crear una variable auxiliar |
| Error de macro "no definido" | Se usa un macro antes de su `:MACRO:` | Mover la definición más arriba |
| Error de punto flotante en simulación (overflow o división por 0), con variable y tiempo | División por 0, `LN` de un número ≤ 0, crecimiento explosivo, `TIME STEP` demasiado grande | `XIDZ`, `ZIDZ`, `MAX(ε, x)`, reducir `TIME STEP` |
| `IF a THEN b ELSE c` "funciona" pero devuelve un valor raro | Se ha creado una variable con ese nombre (§3.2) | `IF THEN ELSE(a, b, c)` |
| El modelo no simula por A FUNCTION OF | Ecuación incompleta o error de sintaxis ignorado | Completar la ecuación |

---

## 15. Portabilidad: diferencias detectadas con PySD y SDEverywhere

Resultados de las pruebas de este documento con **PySD 3.14.3** y de la lectura de los parsers de SDEverywhere y Simlin (xmutil):

| Construcción Vensim | PySD 3.14.3 | Otras herramientas |
|---|---|---|
| Variable de datos sin ecuación ni palabra clave (`x ~ ~ \|`) | **Falla**: exige `:INTERPOLATE:` u otra palabra clave | SDEverywhere y xmutil la aceptan |
| Comentarios en línea `{…}` | **Falla** (`IncompleteParseError`) | SDEverywhere los elimina |
| Llamada a macro con salidas `M(a, b : o1, o2)` | **Falla** | xmutil tampoco la admite |
| `:AND:` y `:OR:` mezclados sin paréntesis | **Agrupa mal** | Simlin agrupa según XMILE y Vensim |
| `2^3^2` | 512 (por la derecha) | SDEverywhere: por la izquierda (64). Vensim: verificar |
| `x = :NA:` | Siempre falso (`NaN`) | SDEverywhere usa un centinela numérico |
| `A FUNCTION OF(...)` | Simula como `NaN` | Vensim no simula |
| Ciclo de auxiliares | `RecursionError` al ejecutar | Vensim da error en Check Model |
| `:RAW:` y `:=` | Semántica aproximada | |
| Comparación suelta `x = Time > 2` | Booleano | Vensim recomienda usarla dentro de `IF THEN ELSE` |
| Reality Check | Se parsea y se ignora | |
| `GAME(x)` | Se trata como `x` | |
| `PI` | Solo en XMILE | Vensim no la tiene |

**Recomendaciones para modelos portables**: paréntesis explícitos en lógica y potencias, comentarios solo en el campo de comentario, palabra clave en las variables de datos, sin salidas extra en los macros y `:NA:` usado solo con `:RAW:` y `IF THEN ELSE`.

---

## 16. Chuleta (cheat sheet)

Los patrones de las tablas están validados en `s17` y `s18` `[PySD ✓]` salvo indicación.

### 16.1 Estructura `[PySD ✓ s19]`

```vensim
nombre = expresión ~ unidades [min,max,inc] ~ comentario |
x[Dim] = 1, 2, 3 ~~|
tabla( [(0,0)-(10,1)], (0,0), (5,0.8), (10,1) ) ~ Dmnl ~ |
dato :INTERPOLATE: ~ unidades ~ |
dato2 :HOLD BACKWARD: := dato * 2 ~ unidades ~ |
constante fija == 12 ~ Month/Year ~ |
Dim: a, b, c ~~|
DimAlias <-> Dim ~~|
```

### 16.2 Patrones de ecuación

| Patrón | Ecuación |
|---|---|
| Stock con flujos | `Inventory = INTEG(production - shipments, desired inventory)` |
| Stock en equilibrio inicial | segundo argumento de `INTEG` igual al valor de equilibrio |
| Crecimiento exponencial | `births = Population * birth rate` |
| Decaimiento de primer orden | `deaths = Population / average lifetime` |
| Búsqueda de meta (goal seeking) | `correction = (desired - Stock) / adjustment time` |
| Logístico | `adoption rate = Adopters * growth fraction * (1 - Adopters / carrying capacity)` |
| Flujo no negativo | `production = MAX(0, shipments + correction)` |
| Tope | `capped = MIN(production, 115)` |
| División protegida | `XIDZ(a, b, valor_si_b_es_0)`, `ZIDZ(a, b)` |
| Condicional | `IF THEN ELSE(cond, si_verdadero, si_falso)` |
| Ventana temporal | `IF THEN ELSE(Time >= 1 :AND: Time < 3, 1, 0)` |
| Interruptor de política | `policy switch = 1 ~ Dmnl [0,1,1]` y `IF THEN ELSE(policy switch = 1, A, B)` |
| Entradas de prueba | `STEP(altura, t)`, `RAMP(pendiente, t_ini, t_fin)`, `PULSE(t_ini, duración)` |
| Expectativa adaptativa | `SMOOTH(x, tiempo)`, `SMOOTH3(x, tiempo)`, `SMOOTHI(x, tiempo, inicial)` |
| Retardo material | `DELAY1(x, t)`, `DELAY3(x, t)`, `DELAY FIXED(x, t, inicial)` |
| Efecto no lineal | `effect = effect table(x / x reference)` |
| Lookup en línea | `WITH LOOKUP(x, ([(0,0)-(2,2)], (0,0), (1,1), (2,1.5)))` |
| Capturar el valor inicial | `INITIAL(x)` |
| Muestrear y congelar | `SAMPLE IF TRUE(cond, x, inicial)` |
| Romper un ciclo de inicialización | `ACTIVE INITIAL(expr_activa, expr_inicial)` |
| Agregar subíndices | `SUM(x[Dim!])`, `VMAX(x[Dim!])`, `PROD(x[Dim!])` |
| Excepción | `x[Dim] :EXCEPT: [e] = 0 ~~\|` y `x[e] = 1` |
| Dato ausente | `IF THEN ELSE(dato raw = :NA:, modelo, dato raw)` (semántica Vensim; en PySD no funciona) |
| Juego | `GAME(expr)` |
| Tiempo transcurrido | `Time - INITIAL TIME` |
| π | `pi = 3.14159265358979` (no hay función PI) |

### 16.3 Recordatorios rápidos

- `^` va antes que el signo: `-2^2 = -4`. Usa `(-2)^2` si quieres 4.
- Las variables de control son `INITIAL TIME`, `FINAL TIME`, `TIME STEP` y `SAVEPER`, todas en `.Control`.
- Espacio ≡ `_`, sin distinguir mayúsculas, como máximo 255 caracteres; los nombres especiales van entre `"…"` con `\"` para escapar comillas.
- Nada de `~` ni `|` en los comentarios.
- Todo ciclo de realimentación debe pasar por un Level.
- Los macros se definen antes de usarse; dentro de ellos, `nombre$` hace referencia a variables del modelo.
- Los lookups no extrapolan: mantienen el valor del extremo.

---

## 17. Registro de validación con PySD

PySD **3.14.3** (Python 3.11). Cada fragmento se envolvió en un modelo mínimo con sección `.Control` (`INITIAL TIME = 0`, `FINAL TIME = 4`, `TIME STEP = 1`, salvo en s14). Se tradujo con `pysd.read_vensim()` y se ejecutó con `.run()`. Los archivos están en `scratchpad/work-lang/snippets/`.

| Id | Contenido | Resultado |
|---|---|---|
| s01_basic | Level `INTEG`, auxiliares, constantes, rangos `[0,?]` y `[0,0.1,0.005]`, comentario multilínea con `\`, `:SUPPLEMENTARY` | ✓ |
| s02_names | Nombres entre comillas, `\"`, `$`, `'`, `_` ≡ espacio, espacios múltiples, mayúsculas | ✓ |
| s03_ops | `-2^2 = -4`, `2^3^2 = 512`, precedencia aritmética, notación científica y `.25`, `:AND:`, `:OR:`, `:NOT:`, `<>` | ✓ (con la anomalía de `:AND:`/`:OR:` descrita en §7.4) |
| s04_lookups | Lookup con y sin rango, puntos de referencia en `[ ]`, invocación, sin extrapolación, `WITH LOOKUP` | ✓ |
| s05_data | `:INTERPOLATE:`, `:HOLD BACKWARD:`, `:RAW: :=`, `:INTERPOLATE: :=`, `:LOOK FORWARD: :=` (con `data_files=.tab`) | ✓ (semántica aproximada) |
| s05_data_novkw | Dato sin ecuación ni palabra clave | ✗ en PySD (Vensim válido) |
| s06_initial | `INITIAL`, `ACTIVE INITIAL` con ciclo de inicialización, `==` | ✓ |
| s07_subs | Rangos, `(L1-L4)`, subrango, `<->`, `->`, listas 1D y 2D, `:EXCEPT:`, ecuaciones por elemento `~~\|`, `SUM(x[d!])`, rango como valor | ✓ |
| s08_macro | Macro con salidas `:` en la llamada | ✗ en PySD (solo la llamada) |
| s08b_macro | Macro con Level interno y unidades = argumento | ✓ |
| s09_misc | `GAME`, `:NA:`, `TABBED ARRAY`, continuación `\` en mitad de un nombre | ✓ (`x = :NA:` da falso en PySD) |
| s10_rc | `:TEST INPUT:`, `:THE CONDITION:`, `:IMPLIES:` | ✓ (ignorados) |
| s11_comments | Comentarios en línea `{…}` | ✗ en PySD |
| s12_afo | `A FUNCTION OF(Investment, -Discards)` | ✓ en el parseo (NaN) |
| s13_simul | Ciclo de auxiliares | Error esperado (`RecursionError`) |
| s14_control | `INITIAL TIME = 2020`, `TIME STEP = 0.25`, `SAVEPER = 1`, `Time - INITIAL TIME` | ✓ |
| s15_sublookup | Lookup subindicado por elemento, `:EXCEPT:` con dos grupos | ✓ |
| s16_logic2 | Paréntesis en lógica, comparación suelta, `:NOT:` sobre comparación | ✓ |
| s17_cheat | INTEG en equilibrio, MAX, MIN, SMOOTH, STEP, RAMP, PULSE, XIDZ, ZIDZ, DELAY1, SAMPLE IF TRUE | ✓ |
| s18_cheat2 | Logístico, interruptor, ventana temporal, DELAY3, DELAY FIXED, SMOOTH3, SMOOTHI | ✓ |
| s19_cheatstruct | Formas de una sola línea de la chuleta §16.1: `= … ~ … ~ … \|`, lista de constantes, lookup, dato con palabra clave, `:=`, `==`, rango y alias `<->` | ✓ (`:HOLD BACKWARD: :=` interpolado en PySD) |

---

## 18. Fuentes

**Documentación de Vensim.** vensim.com estaba bloqueado por el proxy, así que estas páginas se consultaron a través de extractos de resultados de búsqueda o de citas en los repositorios:
- Operators: https://vensim.com/documentation/operators.html
- Logical Functions and Operators: https://www.vensim.com/documentation/21270.html
- Equation Format and Conventions: https://www.vensim.com/documentation/22030.html
- Entering Equations: https://www.vensim.com/documentation/23090.html
- Rules for Variable Names: https://www.vensim.com/documentation/ref_variable_names.html
- Multiple Equations for a Subscripted Variable: https://vensim.com/documentation/21265.html
- Subscripting Constants: https://www.vensim.com/documentation/22070.html
- Variable Types: https://www.vensim.com/documentation/21995.html y https://www.vensim.com/documentation/ref_variable_types.html
- Mixed Variable Types: http://vensim.com/documentation/22080.html
- Problems with Variable Types: https://www.vensim.com/documentation/22215.html
- INTEG: https://www.vensim.com/documentation/fn_integ.html
- ACTIVE INITIAL: http://vensim.com/documentation/fn_active_initial.html
- IF THEN ELSE: http://vensim.com/documentation/fn_if_then_else.html
- A FUNCTION OF: https://www.vensim.com/documentation/fn_a_function_of.html (citado en Simlin)
- Data Equations: https://www.vensim.com/documentation/dataequations.html
- Special Interpolation Modes: https://www.vensim.com/documentation/22825.html
- Keywords: https://www.vensim.com/documentation/keywords.html
- Data: https://www.vensim.com/documentation/data.html
- Computational Sequence: https://www.vensim.com/documentation/computationalsequence.html
- Details of the Compilation Process: https://www.vensim.com/documentation/25935.html
- Euler Integration: https://www.vensim.com/documentation/euler.html
- Runge-Kutta Integration: https://www.vensim.com/documentation/rungekutta.html
- Simultaneous Equations: http://vensim.com/documentation/simultaneousequations.html
- Error Checking Sequence: http://vensim.com/documentation/22195.html
- Legacy: Syntax Errors: http://vensim.com/documentation/23135.html
- Legacy: Semantic Errors and Messages: https://www.vensim.com/documentation/23140.html
- Not Defined: https://www.vensim.com/documentation/22235.html
- Usage Messages: https://www.vensim.com/documentation/22230.html
- Simulation Error Messages: https://www.vensim.com/documentation/ref_sim_errors.html
- Legacy: The Equation Editor Dialog: https://www.vensim.com/documentation/23080.html
- Macros: https://www.vensim.com/documentation/macros.html
- Defining Macros: https://www.vensim.com/documentation/22145.html
- Using Macros: https://www.vensim.com/documentation/22150.html
- Subscripts y mapeos: https://www.vensim.com/documentation/ref_subscripts.html y https://www.vensim.com/documentation/ref_subscript_mapping.html (citados en Simlin)
- Foro de Ventana, "Simultaneous initial value equation involving…": https://www.ventanasystems.co.uk/forum/viewtopic.php?t=6992

**Repositorios locales** (`scratchpad/src/`):
- PySD: `pysd/pysd/translators/vensim/parsing_grammars/{common_grammar,components,element_object,file_sections,lookups,section_elements}.peg`, `vensim_element.py`, `vensim_structures.py`, `vensim_file.py`, `vensim_utils.py`; `pysd/docs/structure/vensim_translation.rst`; `pysd/docs/tables/{unary,binary,functions}.tab`.
- test-models: `tests/{special_characters, fully_invalid_names, line_continuation, line_breaks, multiple_lines_def, na, pi, number_handling, zeroled_decimals, unchangeable_constant, variable_ranges, limits, logicals, exponentiation (output_vensimdss63dp.csv), active_initial_circular, initial_function, game, reality_checks, lookups_inline, lookups_with_expr, lookups_without_range, with_lookup, tabbed_arrays, odd_number_quotes, data_from_other_model, control_vars, unicode_characters, model_doc, constant_expressions, function_capitalization, subscript_numeric_range, subscript_mapping_vensim, subscript_copy, except, subscript_aggregation, vector_order, get_with_missing_values_xlsx}`.
- SDEverywhere: `packages/parse/src/vensim/{parse-vensim-expr.spec.ts, parse-vensim-equation.spec.ts, preprocess-vensim.ts}`, `packages/parse/src/_shared/canonical-id.ts`, `packages/compile/src/generate/gen-expr.js`; modelos `models/{comments, specialchars, extdata, preprocess}`.
- Simlin: `docs/design/mdl-parser.md`, `docs/reference/vensim-macros.md`, `src/simlin-engine/src/mdl/{CLAUDE.md, lexer.rs, reader.rs, ast.rs, builtins.rs, writer.rs}`, `src/simlin-engine/src/ast/expr0.rs`, `vensim-probes/README.md`; modelos `test/metasd/FREE/FREE6/FREE6-original/energy_pos_loop.mdl` y `test/metasd/theil-statistics/Theil_2011.mdl`.
- Pruebas propias: `scratchpad/work-lang/check.py`, `check_data.py`, `snippets/s01…s18*.mdl`.
