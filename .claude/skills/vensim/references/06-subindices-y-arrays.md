# 06 · Subíndices (arrays) en Vensim

Referencia experta sobre subíndices (*subscripts*) en Vensim: definición de rangos, subrangos, mapeos, equivalencias, `:EXCEPT:`, constantes tabulares, operaciones vectoriales, niveles y lookups con subíndices, importación de rangos desde archivos, interfaz y errores típicos.

> Convenciones: las palabras clave y funciones se escriben como en Vensim (`SUM`, `:EXCEPT:`, `GET DIRECT SUBSCRIPT`...). Los ejemplos están en sintaxis de archivo `.mdl` (texto). `~` separa ecuación / unidades / comentario y `|` termina la definición. Lo marcado **(verificar)** no pudo confirmarse en la documentación oficial durante la redacción. Los textos entre llaves `{…}` son anotaciones: Vensim admite comentarios entre llaves dentro del texto de una ecuación (p.ej. `b = 3 {transportation sector}`), pero colocados tras `|` son sólo explicativos; elimínelos al copiar un ejemplo (PySD no acepta llaves fuera de una ecuación).

## Tabla de contenidos

1. [Conceptos y disponibilidad](#1-conceptos-y-disponibilidad)
2. [Definir rangos de subíndices](#2-definir-rangos-de-subíndices)
3. [Equivalencias `<->`](#3-equivalencias---)
4. [Mapeos `->`](#4-mapeos--)
5. [Ecuaciones con subíndices](#5-ecuaciones-con-subíndices)
6. [Constantes tabulares y `TABBED ARRAY`](#6-constantes-tabulares-y-tabbed-array)
7. [Posición numérica de los elementos](#7-posición-numérica-de-los-elementos)
8. [Operador `!` y funciones de agregación](#8-operador--y-funciones-de-agregación)
9. [Funciones `VECTOR …` y matriciales](#9-funciones-vector--y-matriciales)
10. [Niveles (INTEG), flujos y retardos con subíndices](#10-niveles-integ-flujos-y-retardos-con-subíndices)
11. [Lookups con subíndices](#11-lookups-con-subíndices)
12. [Rangos y valores desde archivos externos](#12-rangos-y-valores-desde-archivos-externos)
13. [Interfaz de usuario: Subscript Control, gráficos, SyntheSim](#13-interfaz-de-usuario-subscript-control-gráficos-synthesim)
14. [Buenas prácticas](#14-buenas-prácticas)
15. [Errores comunes y diagnóstico](#15-errores-comunes-y-diagnóstico)
16. [Compatibilidad con otras herramientas](#16-compatibilidad-con-otras-herramientas)
17. [Fuentes](#17-fuentes)

---

## 1. Conceptos y disponibilidad

- Un **rango de subíndices** (*subscript range*, "dimensión") es un conjunto ordenado de **elementos** (*subscript elements*). Una variable con subíndices (`Population[Region]`) es un array con un valor por elemento (o por combinación de elementos si tiene varias dimensiones).
- Una sola ecuación puede definir todos los elementos ("apply-to-all"), o pueden escribirse ecuaciones separadas por elemento o por subrango.
- Casi todo lo que funciona con escalares funciona elemento a elemento: niveles (`INTEG`), retardos, `SMOOTH`, lookups, datos, constantes, sliders de SyntheSim.
- **Disponibilidad por edición**: los subíndices son una característica de **Vensim Professional y DSS**; PLE y PLE Plus no permiten construir modelos con subíndices (la descripción oficial de configuraciones dice que "Professional allows you to use subscripts..."). Model Reader puede ejecutar modelos con subíndices publicados. La tabla comparativa indica hasta 8 dimensiones por variable (ver archivo 01). *(verificar la tabla vigente de su versión).*

Términos útiles:

| Término | Significado |
|---|---|
| Rango (*range*) | Nombre que agrupa elementos: `Region: north, south, east` |
| Elemento | Miembro de un rango: `north` |
| Subrango (*subrange*) | Rango cuyos elementos son todos elementos de otro rango |
| Familia (*family*) | El rango "máximo" que contiene a un elemento o subrango; los subrangos de una misma familia se pueden combinar (término usado por los traductores PySD/SDEverywhere; Vensim no lo expone como palabra clave) |
| Mapeo (`->`) | Correspondencia posicional entre elementos de rangos distintos |
| Equivalencia (`<->`) | Copia de un rango con los mismos elementos (alias) |

---

## 2. Definir rangos de subíndices

La definición de un rango usa `:` (no `=`). En el `.mdl` lleva campos de unidades/comentario como cualquier ecuación (normalmente vacíos).

### 2.1 Lista de elementos

```vensim
Region: north, south, east, west
	~
	~	Regiones del modelo.
	|
```

- Los elementos se separan por comas; el orden de declaración es el orden del array (importa para listas de constantes, `VECTOR …`, posiciones numéricas y mapeos).
- Los nombres siguen las reglas de nombres de variables de Vensim (pueden llevar espacios: `Entry 1`, `Water Transport`). No distinguen mayúsculas/minúsculas.

### 2.2 Rangos numéricos `(a1-a10)`

```vensim
Cohort: (c1-c10)            ~~|   { c1, c2, ..., c10 }
DimA: (da1-da4), da5        ~~|   { mezcla de rango numérico y elementos sueltos }
subdim2: (bc1-bc5), subsubdim, bc17, bc18 ~~|
```

- `(prefijo N - prefijo M)` expande a `prefijoN, …, prefijoM` (ambos extremos incluidos). El prefijo debe coincidir en ambos extremos.
- Puede combinarse con elementos sueltos y con nombres de subrangos en la misma definición (validado con modelos de prueba de Vensim 7.3.4/9.x en `test-models/tests/subscript_numeric_range` y `subscript_definition`).
- Rangos compuestos solo por números sin prefijo (p.ej. `(1-10)`): **(verificar)**; la práctica habitual es usar siempre un prefijo alfabético.

### 2.3 Subrangos y rangos anidados

Un subrango es simplemente otro rango cuyos elementos pertenecen a un rango ya existente. Vensim detecta automáticamente la relación:

```vensim
Age: infant, child, teen, adult, old ~~|
Older: child, teen, adult, old       ~~|   { subrango de Age }
Working Age: teen, adult             ~~|   { otro subrango de Age }
```

Un rango puede declararse **usando subrangos como "elementos"**; Vensim los expande (rango anidado):

```vensim
DimA: A1, A2, A3 ~~|
SubA: A2, A3     ~~|
DimX: SubA, A1   ~~|   { = A2, A3, A1 (en ese orden) }

dim: A, subdim1, B, subdim2, C ~~|
subdim1: (ab1-ab20) ~~|
subdim2: (bc1-bc5), subsubdim, bc17, bc18 ~~|
subsubdim: (abc6-abc17) ~~|        { anidamiento de varios niveles (test subscript_definition) }
subdim2 copy: subdim2 ~~|          { copia escribiendo el nombre de otro rango }
subdim1 copy <-> subdim1 ~~|       { copia con equivalencia }
```

Notas:
- Un rango puede tener los mismos elementos que otro (`sector` y `sector1` con idénticos elementos): ambos son "subrangos" mutuos y pueden usarse como dos dimensiones de una matriz (ejemplo `subscript_transposition`). Para eso es más claro usar `<->` (sección 3).
- También se puede definir un rango como copia de otro escribiendo su nombre como único "elemento": `DimT': DimT ~~|` (usado en modelos de SDEverywhere validados contra Vensim). La forma recomendada es `<->`.
- Un mismo elemento puede pertenecer a varios rangos (p.ej. `DimAB1: A1, B1` en un modelo que también define `DimA: A1, A2, A3`); en ese caso el rango que contiene a todos (`DimABC`) actúa como familia.

### 2.4 Familias de subíndices

En la práctica, Vensim trata como compatibles los rangos que comparten elementos de una misma familia:
- Una variable puede definirse por partes sobre subrangos de la misma familia (`Rank[DimA] = …` y `Rank[DimB] = …` si ambos son subrangos de `DimABC`).
- En una ecuación, un subrango del lado izquierdo (LHS) puede emparejarse con el mismo subrango en el lado derecho (RHS) aunque la variable del RHS esté definida sobre el rango completo:

```vensim
Age: infant, child, teen, adult, old ~~|
Older: child, teen, adult, old ~~|
Younger: infant, child, teen, adult -> Older ~~|
aging[Age] = Population[Age] / cohort duration[Age] ~ Person/Year ~ |
Population[infant] = INTEG(births - aging[infant], init pop[infant]) ~~|
Population[Older] = INTEG(aging[Younger] - aging[Older], init pop[Older]) ~ Person ~ |
```

`aging` y `init pop` están definidos sobre `Age`, pero la ecuación de `Population[Older]` usa sólo sus elementos de `Older`; `aging[Younger]` es válido porque `Younger` está mapeado a `Older` (sección 4). Validado con PySD.

Diferentes partes del modelo pueden usar familias distintas y totalmente independientes (`test-models/tests/subscript_multiples`).

### 2.5 Rangos leídos desde archivos

Ver sección [12](#12-rangos-y-valores-desde-archivos-externos): `GET XLS SUBSCRIPT` / `GET DIRECT SUBSCRIPT`.

---

## 3. Equivalencias `<->`

`<->` crea **una copia** (alias) de un rango con exactamente los mismos elementos. Es la forma idiomática de tener dos dimensiones sobre el mismo conjunto (matrices origen–destino, transiciones, distancias):

```vensim
Region: north, south, east ~~|
To Region <-> Region       ~~|

migration fraction[Region, To Region] =
	0,    0.02, 0.01;
	0.03, 0,    0.02;
	0.01, 0.01, 0;
	~	1/Year
	~	Fila = origen, columna = destino.
	|

out migration[Region] = Population[Region] * SUM(migration fraction[Region, To Region!])
	~	Person/Year ~ |
in migration[To Region] = SUM(Population[Region!] * migration fraction[Region!, To Region])
	~	Person/Year ~ |
```

- El orden de las declaraciones no importa (`DimB<->DimA` puede escribirse antes o después de `DimA: …`; test `subscript_copy`).
- Los rangos equivalentes son intercambiables: una variable definida sobre `DimB` puede referenciarse con `[DimA]` en una ecuación cuyo LHS usa `DimA` (test `subscript_copy`: `Vector C[DimA] = Level 1[DimA]` con `Level 1[DimB]`).
- Documentación: "Vensim offers a convenient notation for making a second copy of a subscript range, using the notation <->".

---

## 4. Mapeos `->`

Regla base (documentación de Vensim, *Subscripts*): **cuando un rango de subíndices aparece en el lado derecho de una ecuación, debe aparecer también en el lado izquierdo**, salvo que exista un **mapeo** que lo relacione con un rango del LHS (o que se agregue con `!`). El mapeo se declara en la definición del rango de origen con `->`.

### 4.1 Mapeo simple (posicional)

```vensim
MFG SKILLS: MACHINERS, ASSEMBLERS -> PRODUCTS ~~|
PRODUCTS: PARTS, SYSTEMS ~~|

WORK FLOW[PRODUCTS] = WORK FORCE[MFG SKILLS] * PRODUCTIVITY[MFG SKILLS]
	~	Part/Year ~ |
{ MACHINERS -> PARTS, ASSEMBLERS -> SYSTEMS }
```

Ejemplo tomado de la documentación de Vensim (reproducido en `test-models/tests/subscript_mapping_vensim`). Ambos rangos deben tener el mismo número de elementos; la correspondencia es por posición.

El mapeo se puede declarar en cualquiera de los dos rangos, o en ambos (mapeo bidireccional):

```vensim
DimB: db1, db2, db3 -> DimC ~~|
DimC: dc1, dc2, dc3 -> DimB ~~|
```

### 4.2 Mapeos múltiples

Un rango puede mapearse a varios rangos, separados por comas:

```vensim
DimA: A1, A2, A3 -> (DimB: B3, B2, B1), DimC ~~|
DimB: B1, B2, B3 ~~|
DimC: C1, C2, C3 ~~|

a[DimA] = 1, 2, 3 ~~|
b[DimB] = a[DimA] ~~|   { b[B1]=3, b[B2]=2, b[B3]=1  (mapeo explícito invertido) }
c[DimC] = a[DimA] ~~|   { c[C1]=1, c[C2]=2, c[C3]=3  (mapeo posicional) }
```

(Resultados verificados con la salida de Vensim incluida en `SDEverywhere/models/multimap/multimap.dat`.)

### 4.3 Mapeo a una lista explícita (reordenar, a subrangos)

Sintaxis general (documentación *Mapping of Subscript Ranges*):

```
Rhsub: rh1, rh2 -> (Lhsub: lh1, lh2), (Lhbigger: Lhbsubr1, Lhbsubr2), (lhopposite: lho2, lho1)
```

La lista entre paréntesis indica, en orden, a qué elemento **o subrango** del rango destino corresponde cada elemento del rango de origen. El número de entradas debe coincidir con el número de elementos del rango de origen.

Mapear un elemento a un **subrango** (un elemento de origen alimenta varios de destino):

```vensim
DimA: A1, A2, A3 ~~|
SubA: A1, A2 ~~|
DimB: B1, B2 -> (DimA: SubA, A3) ~~|

b[DimB] = 1, 2 ~~|
a[DimA] = b[DimB] * 10 ~~|   { a[A1]=10, a[A2]=10, a[A3]=20 }
```

Mapear un **subrango usado como elemento** del rango origen a un índice del destino:

```vensim
SubC: C1, C2 ~~|
DimC: SubC, C3 -> DimD ~~|   { DimC = C1, C2, C3 }
DimD: D1, D2, D3 ~~|
c[DimC] = 1, 2, 3 ~~|
d[DimD] = c[DimC] * 10 ~~|  { d = 10, 20, 30 }
```

(Ambos verificados con `SDEverywhere/models/mapping/mapping.dat`, generado con Vensim.)

### 4.4 Patrón clásico: cadena de envejecimiento (aging chain)

Ejemplo adaptado de la documentación de Vensim (allí `aging` es una constante). Un rango "cohorte anterior" mapeado a "todos menos el más joven":

```vensim
AGE: INFANT, CHILD, TEEN, MIDDLE, OLD ~~|
ALL BUT YOUNGEST: CHILD, TEEN, MIDDLE, OLD ~~|
PREVIOUS COHORT: INFANT, CHILD, TEEN, MIDDLE -> ALL BUT YOUNGEST ~~|

POPULATION[INFANT] = INTEG(births - aging[INFANT], INITIAL POPULATION[INFANT]) ~~|
POPULATION[ALL BUT YOUNGEST] = INTEG(
	aging[PREVIOUS COHORT] - aging[ALL BUT YOUNGEST],
	INITIAL POPULATION[ALL BUT YOUNGEST])
	~	People
	~	Cohortes de edad.
	|

aging[AGE] = POPULATION[AGE] / cohort duration[AGE] ~ People/Year ~ |
```

El mismo patrón sirve para desplazamientos ("elemento anterior/siguiente"):

```vensim
i: (i1-i5) ~~|
i prev: (i1-i4) -> i next ~~|
i next: (i2-i5) -> i prev ~~|
gap[i prev] = x[i next] - x[i prev] ~~|
```

### 4.5 Reglas y limitaciones de los mapeos

- El mapeo sólo se usa cuando un rango del RHS **no** está en el LHS; Vensim busca un mapeo del rango del RHS hacia algún rango del LHS.
- Si un rango del RHS tiene mapeos hacia varios rangos presentes en el LHS, la interpretación puede ser ambigua: evítelo (use rangos equivalentes `<->` o defina ecuaciones por elemento).
- Mapeos "parciales" a una lista explícita (`-> (DimA: SubA, A3)`) funcionan en Vensim pero **no** están soportados por PySD (sólo mapeos a rango completo).

---

## 5. Ecuaciones con subíndices

### 5.1 Ecuación "apply-to-all"

```vensim
share[Region] = sales[Region] / SUM(sales[Region!]) ~ Dmnl ~ |
cost[Region, Product] = unit cost[Product] * volume[Region, Product] ~ $/Year ~ |
```

- Las dimensiones del LHS determinan las del resultado. Las del RHS se emparejan por nombre de rango (no por posición); por eso el orden puede diferir:

```vensim
p[DimB, DimA] = f[DimA, DimB] ~~|      { transposición }
Two Dims[Dim1, Dim2] = One Dim[Dim1] ~~|   { "updimensioning": se repite en Dim2 }
```

### 5.2 Ecuaciones por elemento

```vensim
b[A1] = 1 ~~|
b[A2] = 2 ~~|
b[A3] = 3
	~	Widget
	~	Valores por elemento.
	|
```

- En el `.mdl`, las ecuaciones de una misma variable se escriben consecutivas; todas menos la última suelen terminar en `~~|` (unidades y comentario vacíos) y la última lleva unidades y comentario. Vensim las agrupa en una sola variable.
- Se puede referenciar un elemento concreto en el RHS: `c[DimA] = b[A1] + 1`, `Required energy for water transport[fuels] = Required energy by sector and fuel[fuels, Water Transport]`.
- Una variable puede definirse sólo sobre parte de un rango (sólo se simulan los elementos definidos).

### 5.3 Ecuaciones por subrango

```vensim
merged upper[upper] = upper values[upper] ~~|
merged upper[Layer4] = 40 ~~|
{ Layers: Layer1..Layer4; upper: Layer1..Layer3 }
```

Mezclas de dimensiones completas, subrangos y elementos fijos en varias posiciones también son válidas (`Variable[ext data, DimAB]`, `d[D1, DimB, DimC]`).

### 5.4 `:EXCEPT:`

Define una ecuación para todos los elementos **excepto** los indicados; los excluidos se definen aparte:

```vensim
g[DimA] :EXCEPT: [A1] = 7 ~~|
g[A1] = 0 ~~|

h[DimA] :EXCEPT: [SubA] = 8 ~~|          { se puede excluir un subrango }
p[DimA, DimC] :EXCEPT: [A1, C1] = 10 ~~| { excluye una combinación }
r[DimA, DimC] :EXCEPT: [DimA, C1] = 12 ~~| { excluye toda una "columna" }
```

Varias exclusiones se separan con comas, cada una entre corchetes:

```vensim
dim1: (sub1-sub10) ~~|
dim1up: (sub1-sub5) ~~|
dim2: (d1-d5) ~~|
my var[dim1, dim2] :EXCEPT: [dim1up, d1], [dim1up, d3], [dim1up, d5] = Time ~~|
my var[dim1up, d1] = -Time ~~|
my var[dim1up, d3] = 2*Time ~~|
my var[dim1up, d5] = -2*Time
	~	Dmnl ~ |
```

Reglas prácticas:
- El grupo de exclusión debe tener tantas posiciones como el LHS.
- Los elementos excluidos que no se definan en otra ecuación quedan sin definir (Vensim lo reporta como variable incompleta al comprobar el modelo; verificar mensaje exacto).
- `:EXCEPT:` también se combina con subrangos en el LHS: `o[SubA] :EXCEPT: [SubA2] = 9`.

### 5.5 Selección de elementos en el RHS

```vensim
Subset[Dim1] = Two Dimensional Variable[Dim1, D] ~~|  { fija la 2.ª dimensión }
e[B1] = b[B1] ~~|
```

---

## 6. Constantes tabulares y `TABBED ARRAY`

### 6.1 Listas (1D) y tablas (2D)

```vensim
base[Region] = 10, 20, 30, 40 ~ Widget ~ |

flow matrix[Region, Region2] =
	1, 2, 3, 4;
	5, 6, 7, 8;
	9, 10, 11, 12;
	13, 14, 15, 16;
	~	Widget/Year ~ |
```

- En 1D los valores siguen el orden de los elementos.
- En 2D cada fila (separada por `;`) corresponde a un elemento de la **primera** dimensión del LHS y cada columna (separada por `,`) a uno de la **segunda**. El `;` final es opcional/habitual.
- Para 3 o más dimensiones se escribe una tabla 2D por cada elemento de las dimensiones restantes:

```vensim
Matrix A[DimA, DimB, dc1] =
	0.1, 0.01, 0.5;
	0.3, 0.2, 0.12; ~~|
Matrix A[DimA, DimB, dc2] =
	0.5, 0.2, 0.8;
	0.03, 0.05, 0.7;
	~	Dmnl ~ |
```

- También se aceptan listas sobre subrangos (`u[SubA] = 1, 2`) o con un elemento fijo (`v[DimA, B1] = 1, 2, 3`).
- Constante "inmutable" con `==` (no aparece como parámetro modificable): `x[Region] == 1, 2, 3, 4`.
- Una lista de constantes es "constante": puede cambiarse en SyntheSim (un slider por elemento) o con archivos `.cin`.

### 6.2 `TABBED ARRAY`

Permite pegar valores separados por tabuladores/espacios (por ejemplo copiados de Excel) sin comas ni puntos y comas:

```vensim
initial population[country, blood type] = TABBED ARRAY(
	1	2	3	4
	5	6	7	8
	9	10	11	12)
	~	Person ~ |
```

Equivale a `1,2,3,4; 5,6,7,8; 9,10,11,12;`. Cada línea es una fila (primera dimensión). Validado con PySD (`test-models/tests/tabbed_arrays`).

---

## 7. Posición numérica de los elementos

El nombre de un rango usado como **valor** dentro de una ecuación devuelve la **posición (base 1)** del elemento que se está calculando:

```vensim
DimA: A1, A2, A3 ~~|
idx[DimA] = DimA ~~|                               { 1, 2, 3 }
r[DimA] = IF THEN ELSE(DimA = Selected A, 1, 0) ~~|  { compara con un número }
v[DimA] = IF THEN ELSE(DimA = A2, 1, 0) ~~|          { compara con un elemento }
w[DimX, DimY] = DimX - DimY ~~|                     { aritmética con posiciones }
s[DimA] = DimB ~~|   { con DimB -> DimA: posición del elemento mapeado }
```

- Comparar `DimA = A2` funciona porque el elemento se interpreta también por su posición.
- Muy útil para matrices triangulares (`IF THEN ELSE(i = j, 1, …)`), selección de un elemento con un parámetro, o construir perfiles por posición.
- Con subrangos, la posición se refiere al **rango de la ecuación** (verificar en casos con subrangos; en SDEverywhere la posición de un subrango se resuelve dentro de la familia).
- `ELMCOUNT(Range)` devuelve el número de elementos (útil para promedios: `SUM(x[R!]) / ELMCOUNT(R)`).

Validado: salida de Vensim en `SDEverywhere/models/subscript/subscript.dat` (`s`, `r`, `v`, `w`) y PySD (`idx`, `flag`).

---

## 8. Operador `!` y funciones de agregación

El sufijo `!` marca la dimensión **sobre la que se agrega** dentro de una función vectorial; el resultado ya no tiene esa dimensión.

```vensim
total = SUM(sales[Region!]) ~~|
by product[Product] = SUM(sales[Region!, Product]) ~~|          { suma "por columnas" }
weighted = SUM(price[Product!] * volume[Product!]) ~~|           { producto escalar }
grand = SUM(m[DimD!, DimE!]) ~~|                                 { suma 2D completa }
v[DimT] = SUM(t two dim[DimT, DimT!]) ~~|  { mismo rango en dos posiciones: suma sobre la 2.ª }
```

| Función | Resultado | Notas |
|---|---|---|
| `SUM(x[R!])` | Suma | Admite expresiones: `SUM(a[R!] * b[R!] / TIME STEP)` |
| `PROD(x[R!])` | Producto | |
| `VMIN(x[R!])` / `VMAX(x[R!])` | Mínimo / máximo de los elementos | No confundir con `MIN(a,b)`/`MAX(a,b)` (dos argumentos) |
| `ELMCOUNT(R)` | Número de elementos del rango | Argumento: el nombre del rango (sin `!`) |
| `SUM(x[SubR!])` | Agrega sólo sobre un subrango | `VMAX(x[SubX!])` |

Notas importantes:
- Si en una misma expresión aparecen **dos rangos distintos con `!`**, se agrega sobre el **producto cartesiano**: `SUM(a[DimA!] + h[DimC!])` con `a = 1,2,3` y `h = 10,20,30` da `3·6 + 3·60 = 198` (salida de Vensim en `SDEverywhere/models/sum`).
- Se pueden anidar condiciones: `SUM(IF THEN ELSE(x[R!] = :NA:, 0, x[R!]))`, `VMAX(IF THEN ELSE(Time > 3, a[R!, S], b[R!, S]))`.
- `!` sólo tiene sentido dentro de funciones vectoriales (`SUM`, `PROD`, `VMIN`, `VMAX`, `VECTOR SELECT`…). Fuera de ellas, un rango del RHS que no esté en el LHS produce error.
- En XMILE/Stella el equivalente es `[*]` (`SUM(sales[*])`); **en ecuaciones de Vensim `[*]` no es sintaxis válida**.

---

## 9. Funciones `VECTOR …` y matriciales

Firmas (según la documentación de Vensim reflejada en PySD/SDEverywhere; comportamiento validado con salidas de Vensim cuando se indica):

| Función | Firma | Qué hace |
|---|---|---|
| `VECTOR SELECT` | `VECTOR SELECT(sel[R!], expr[R!], missing value, numerical action, error action)` | Agrega `expr` sólo donde `sel ≠ 0` |
| `VECTOR ELM MAP` | `VECTOR ELM MAP(vec[start elm], offset)` | Valor del elemento situado `offset` posiciones (base 0) después de `start elm` |
| `VECTOR SORT ORDER` | `VECTOR SORT ORDER(vec[R], direction)` | Índices (base 0) que ordenan el vector; `direction` 1 = ascendente, 0 = descendente |
| `VECTOR REORDER` | `VECTOR REORDER(vec[R], sort order[R])` | Reordena `vec` según un vector de orden |
| `VECTOR RANK` | `VECTOR RANK(vec[R], direction)` | Rango (posición) de cada elemento, base 1 (así lo implementa PySD frente a `test-models/vector_order`) |
| `VECTOR LOOKUP` | `VECTOR LOOKUP(vec[first elm], x, xmin, xmax, type)` | Usa un vector como tabla equiespaciada entre `xmin` y `xmax` |
| `INVERT MATRIX` | `INVERT MATRIX(m[R, R'], size)` | Inversa de una matriz cuadrada |
| `ELMCOUNT` | `ELMCOUNT(R)` | Nº de elementos |

**`VECTOR SELECT`** — códigos (docstring de PySD basado en la documentación de Vensim):
- *numerical action*: 0 suma ponderada (sel·expr), 1 producto, 2 mínimo, 3 máximo, 4 promedio (todas ponderadas por `sel`); 5 producto de `expr^sel`; 6 suma, 7 producto, 8 mínimo, 9 máximo, 10 promedio, **sin ponderar** (sólo donde `sel ≠ 0`).
- *error action*: 0 sin error; 1 error si no hay ningún seleccionado; 2 error si hay más de uno; 3 error si no hay exactamente uno.
- Es habitual declarar constantes con nombre para los códigos:

```vensim
VSSUM == 0 ~~|
VSMAX == 3 ~~|
VSERRNONE == 0 ~~|
VSERRATLEASTONE == 1 ~~|
Total for selected[DimE] = VECTOR SELECT(C Selection[DimC!], EBC Values[DimE, DimC!], 0, VSSUM, VSERRATLEASTONE) ~~|
```

**`VECTOR ELM MAP`** (validado con Vensim): con `b[DimB] = 1, 2` y `a[DimA] = 0, 1, 1`, `c[DimA] = 10 + VECTOR ELM MAP(b[B1], a[DimA])` da `11, 12, 12`. Con `x[DimX] = 1..5`, `VECTOR ELM MAP(x[three], DimA - 1)` devuelve `x[three], x[four], x[five]`.

**`VECTOR SORT ORDER`** (validado con Vensim): `h = 2100, 2010, 2020` → ascendente `1, 2, 0`; descendente `0, 2, 1` (índices base 0 del elemento que ocupa cada posición). Ordena siempre sobre la **última** dimensión.

**`VECTOR LOOKUP`** — `type` (según comentarios de un modelo de T. Fiddaman en la galería metasd): 0 lookup normal; 1 equivalente a `LOOKUP AREA`; 2 `LOOKUP BACKWARD`; 3 `LOOKUP EXTRAPOLATE`; 4 `LOOKUP FORWARD`; 5 `LOOKUP INVERT`; 6 `LOOKUP SLOPE`; 7–9 área/inversa/pendiente con extrapolación **(verificar)**.

Otras funciones de arrays (ver archivo de funciones): `ALLOCATE AVAILABLE`, `ALLOCATE BY PRIORITY`, `DEMAND AT PRICE`/`SUPPLY AT PRICE`/`FIND MARKET PRICE` (verificar), `SHIFT IF TRUE`.

---

## 10. Niveles (INTEG), flujos y retardos con subíndices

```vensim
Stock[Region] = INTEG(inflow[Region] - outflow[Region], initial stock[Region])
	~	Widget ~ |
```

- Las dimensiones del flujo y del valor inicial deben ser compatibles con las del nivel (mismo rango, rango equivalente, mapeo o subrango adecuado).
- Un nivel puede definirse por elemento o por subrango, siempre con `INTEG` en todas las partes (ejemplo `POPULATION[INFANT]` / `POPULATION[ALL BUT YOUNGEST]`, o un bloque por elemento de la tercera dimensión en `subscript_individually_defined_stocks`). Mezclar elementos `INTEG` con elementos auxiliares en la misma variable no es válido **(verificar mensaje)**.
- Transferencias entre elementos con matrices de transición:

```vensim
Cats: c1, c2, c3 ~~|
dummy: c1, c2, c3 ~~|     { mismo conjunto, segunda dimensión }
Categories[Cats] = INTEG(Switching In[Cats] - Switching Out[Cats], Initial Categories[Cats]) ~~|
Switching In[dummy] = Gain * SUM(Transition Matrix[Cats!, dummy] * Categories[Cats!]) ~~|
Switching Out[Cats] = Gain * SUM(Transition Matrix[Cats, dummy!] * Categories[Cats]) ~~|
```

(En modelos nuevos use `dummy <-> Cats` en lugar de repetir elementos.)

- `SMOOTH`, `SMOOTH3`, `DELAY1`, `DELAY3`, `DELAY FIXED`, `TREND`, `FORECAST`, etc. aceptan argumentos con subíndices y crean un retardo independiente por elemento: `perceived[Region] = SMOOTH(actual[Region], delay time[Region])`.
- Mezcla de escalares y arrays: un escalar en el RHS se replica a todos los elementos (`a[DimA] = c`).

---

## 11. Lookups con subíndices

Un lookup con subíndices se define **elemento por elemento** (cada elemento tiene su propia tabla) y se invoca con el subíndice antes del argumento:

```vensim
effect tbl[north]( [(0,0)-(2,2)], (0,0), (1,1), (2,1.5) ) ~~|
effect tbl[south]( [(0,0)-(2,2)], (0,0), (1,0.8), (2,1.2) )
	~	Dmnl ~ |

effect[Region] = effect tbl[Region](relative price[Region]) ~ Dmnl ~ |
effect at time[Region] = effect tbl[Region](Time) ~~|
fixed[Region] = effect tbl[north](x[Region]) ~~|   { misma tabla para todos }
```

- También funciona con varias dimensiones: `lookup2dim[A, C]( (2,3),(4,7),(7,1) ) ~~| …` y `out[dim1, dim2, dim3] = lookup2dim[dim1, dim2](vardim3[dim3])`.
- Las tablas de los distintos elementos pueden tener distinto número de puntos.
- Una tabla sin subíndices aplicada a un argumento con subíndices: `y[Region] = tbl(x[Region])`.
- Lookups con subíndices desde Excel/CSV: `GET XLS LOOKUPS` / `GET DIRECT LOOKUPS` (cada fila o columna es un elemento):

```vensim
lookup function[A, Rows]( GET XLS LOOKUPS('input.xls', 'Sheet1', '4', 'C5') ) ~~|
lookup function[B, Rows] = GET XLS LOOKUPS('input.xls', 'Sheet1', '4', 'C7') ~~|
lookup call[Dim, Rows] = lookup function[Dim, Rows](Time) ~~|
```

(Ambas formas, con `(` o con `=`, aparecen en modelos guardados por Vensim; ver archivo 07.)

---

## 12. Rangos y valores desde archivos externos

### 12.1 `GET XLS SUBSCRIPT` / `GET DIRECT SUBSCRIPT`

```
Range: GET XLS SUBSCRIPT('file', 'tab', 'first cell', 'last cell', 'prefix')
Range: GET DIRECT SUBSCRIPT('file', 'tab o delimitador', 'first cell', 'last cell', 'prefix')
```

- `first cell`: celda del primer nombre de elemento (puede ser un nombre de rango de Excel).
- `last cell`: celda final; si es **sólo una letra de columna** (`'A'`) se lee hacia abajo hasta la primera celda vacía; si es **sólo un número de fila** (`'2'`) se lee hacia la derecha; también puede ser una celda completa (`'D3'`). Vacío = hasta el final (comportamiento de PySD; verificar en Vensim).
- `prefix`: texto que se antepone a cada valor leído (`'Entry'` + celda `1` → elemento `Entry1`, sin espacio; validado con la salida de Vensim en `get_subscript_3d_arrays_xls`). Use `''` si no hace falta prefijo.
- Las referencias de celda pueden escribirse en minúsculas.

```vensim
Region: GET DIRECT SUBSCRIPT('regions.csv', ',', 'A2', 'A', '') ~~|     { columna A desde la fila 2 }
DimC:   GET DIRECT SUBSCRIPT('c_subs.csv', ',', 'a2', '2', '') ~~|      { fila 2 hacia la derecha }
Depth:  GET DIRECT SUBSCRIPT('input.xls', 'Sheet1', 'C3', 'D3', 'Depth') ~~|
DimA: A1, A2, A3 -> DimB, DimC ~~|   { un rango leído de archivo puede ser destino de mapeos }
```

- `GET XLS …` requiere Windows y Excel; `GET DIRECT …` lee el archivo directamente (`.xlsx`, `.csv`…). Detalles en el archivo 07. Los subíndices leídos de archivo (`GET DIRECT SUBSCRIPT`) aparecieron en la serie 6.x (ver archivo 01).

### 12.2 Constantes con subíndices desde archivo

```vensim
c[DimB, DimC] = GET DIRECT CONSTANTS('data/c.csv', ',', 'B2') ~~|   { filas = DimB, columnas = DimC }
e[DimC, DimB] = GET DIRECT CONSTANTS('data/c.csv', ',', 'B2*') ~~|  { '*' = leer transpuesto }
b[DimB] = GET DIRECT CONSTANTS('data/b.csv', ',', 'B2*') ~~|        { vector leído en columna }
f[DimC, SubA] = GET DIRECT CONSTANTS('data/f.csv', ',', 'B2') ~~|
f[DimC, DimA] :EXCEPT: [DimC, SubA] = 0 ~~|
```

Regla de orientación: un vector 1D se lee **a lo largo de una fila** (columnas sucesivas) a partir de la celda; una tabla 2D lee la primera dimensión **hacia abajo** (filas) y la segunda **hacia la derecha** (columnas). Un `*` al final de la celda inicial transpone la lectura (documentado en `fn_get_direct_constants`; validado con PySD).

---

## 13. Interfaz de usuario: Subscript Control, gráficos, SyntheSim

- **Crear/editar rangos**: en el Equation Editor se elige el tipo *Subscript Range* (o se escribe la definición `Rango: e1, e2` directamente en el Text Editor / editor de ecuaciones). El cuadro **Subscript Control** lista los rangos existentes, permite crear nuevos, editarlos y seleccionar qué elementos se muestran en las herramientas de análisis **(verificar la ubicación exacta del menú en su versión, p.ej. `Windows > Subscript Control` o botón de subíndices del Equation Editor)**.
- Al escribir la ecuación de una variable con subíndices, los subíndices se indican en el nombre (`Stock[Region]`) o en el campo de subíndices del Equation Editor.
- **Gráficos y tablas**: las herramientas *Graph*, *Table*, *Causes Strip* muestran por defecto una serie por elemento (`Population[north]`, `Population[south]`…). Con muchas combinaciones conviene restringir los elementos visibles con Subscript Control o crear *custom graphs* que nombren elementos concretos (`Population[north]`). No existe en Vensim la notación `[*]` de XMILE en ecuaciones; para mostrar agregados cree una variable auxiliar con `SUM(...[R!])`.
- **SyntheSim**: una constante con subíndices genera un slider por elemento.
- **Causes Tree / Uses Tree** muestran la variable completa, no elemento por elemento.

---

## 14. Buenas prácticas

1. **Nombre los rangos en singular o con mayúsculas** (`Region`, `AGE`) y los elementos con nombres cortos y únicos; evite reutilizar el mismo nombre de elemento en familias no relacionadas.
2. Use `<->` para segundas dimensiones del mismo conjunto (origen/destino) en lugar de duplicar listas.
3. Prefiera **subrangos + `:EXCEPT:`** a decenas de ecuaciones por elemento; deja explícitas las excepciones.
4. Declare los **mapeos en la definición del rango** y documente en el comentario qué representa la correspondencia.
5. Para agregados use siempre `SUM(x[R!])` en una variable auxiliar con nombre (ayuda a los gráficos y a las unidades).
6. Mantenga el **orden de elementos** estable: las listas de constantes, `GET … CONSTANTS`, `VECTOR …` y las posiciones numéricas dependen de él.
7. Para tablas grandes, lea de archivo (`GET DIRECT CONSTANTS`) o use `TABBED ARRAY` para pegar desde hoja de cálculo.
8. Antes de escalar (muchas dimensiones), compruebe el tamaño: el número de valores guardados crece con el producto de los tamaños de los rangos; use *savelists* (`.lst`) si el `.vdf` crece demasiado.
9. Si el modelo se traducirá a PySD/SDEverywhere, evite mapeos parciales a listas explícitas y funciones no soportadas (ver sección 16).

---

## 15. Errores comunes y diagnóstico

| Síntoma | Causa típica | Solución |
|---|---|---|
| Error al comprobar la ecuación: rango del RHS no presente en el LHS | Se usó `x[Region]` en una ecuación cuyo LHS no tiene `Region` | Añadir la dimensión al LHS, agregarla con `SUM(x[Region!])`, seleccionar un elemento o declarar un mapeo |
| *Dimension mismatch* entre rangos distintos de igual tamaño | Se espera que Vensim empareje `DimA` con `DimB` por posición | Declarar mapeo `DimB: … -> DimA` o equivalencia `<->` |
| Mapeo ambiguo / resultado inesperado | El rango del RHS mapea a varios rangos del LHS, o se mapea a ambos sentidos con órdenes distintos | Simplificar; usar mapeos explícitos `-> (Dest: e3, e2, e1)` |
| Variable "incompleta" | Faltan elementos tras un `:EXCEPT:` o definiciones por elemento | Definir todos los elementos o restringir el LHS a un subrango |
| Valores desordenados en una tabla 2D | Se asumió que las filas eran la segunda dimensión | Filas = 1.ª dimensión del LHS; usar `*` en `GET … CONSTANTS` para transponer |
| Número de valores incorrecto en una lista | La lista no coincide con el número de elementos | Revisar el rango (incluye expansiones `(a1-a10)` y subrangos anidados) |
| `SUM` da un valor enorme | Dos rangos con `!` en la misma expresión → suma cartesiana | Usar un solo `!` por dimensión que se quiera agregar |
| `VECTOR SORT ORDER` "desplazado en 1" | Devuelve índices base 0 | Sumar 1 si se necesitan posiciones base 1 |
| `[*]` no reconocido | Sintaxis XMILE | Usar `!` dentro de funciones vectoriales |
| Lookup con subíndices sin tabla para un elemento | Falta una definición por elemento | Definir todas las tablas (o usar una tabla común) |

Herramientas: `Model > Check Model` (sintaxis/estructura), `Model > Units Check` (unidades, también por elemento), *Text Editor* para revisar definiciones en bloque.

---

## 16. Compatibilidad con otras herramientas

- **PySD** (traductor Vensim→Python): soporta rangos, subrangos, `<->`, mapeos a rango completo, `:EXCEPT:` con cualquier número de argumentos, rangos usados como valor, `SUM/PROD/VMIN/VMAX/ELMCOUNT`, `VECTOR SELECT/SORT ORDER/REORDER/RANK`, `INVERT MATRIX`, `GET … SUBSCRIPT`. **No** soporta mapeos parciales a listas explícitas (`-> (DimA: SubA, A3)`).
- **SDEverywhere**: soporta mapeos a listas/subrangos, `VECTOR ELM MAP`, `VECTOR SELECT`, `VECTOR SORT ORDER`, `GET DIRECT …` (incluido `?alias` vía *spec*).
- **XMILE/Stella**: `!` ↔ `[*]`; `ELMCOUNT` ↔ `SIZE`; `VMAX/VMIN` ↔ `MAX/MIN` de un argumento.

Todos los ejemplos marcados como "validado" se ejecutaron con PySD 3.14.3 o se contrastaron con salidas de Vensim incluidas en los repositorios de prueba.

---

## 17. Fuentes

- Vensim Documentation – *Mapping of Subscript Ranges*: https://www.vensim.com/documentation/ref_subscript_mapping.html
- Vensim Documentation – *Mapping Subscripts*: https://www.vensim.com/documentation/21260.html
- Vensim Documentation – *Subscripts* (regla "When you use a Subscript Range in an equation it must appear on the left hand side"): https://www.vensim.com/documentation/ref_subscripts.html (citado en `simlin/docs/design/mdl-parser.md`)
- Vensim Documentation – *GET DIRECT CONSTANTS* (`*` para transponer): https://www.vensim.com/documentation/fn_get_direct_constants.html (citado en el código de SDEverywhere `gen-direct-const.js`)
- Vensim Documentation – *VECTOR SELECT*, *VECTOR SORT ORDER*, *VECTOR REORDER*, *VECTOR RANK*: https://www.vensim.com/documentation/fn_vector_select.html, …/fn_vector_sort_order.html, …/fn_vector_reorder.html, …/fn_vector_rank.html (citados en `pysd/py_backend/functions.py`)
- Vensim – *Comparison Chart for Vensim Configurations* / FAQ de diferencias PLE/PLE Plus/Professional/DSS: https://vensim.com/comparison-chart-for-vensim-configurations/
- Repositorio `SDXorg/test-models` (modelos guardados con Vensim 7.3.4 y 9.3.1): `tests/subscript_*`, `except*`, `subrange_merge`, `tabbed_arrays`, `subscripted_lookups`, `get_subscript_3d_arrays_xls`, `invert_matrix`, `vector_select`, `vector_order`.
- Repositorio SDEverywhere `models/` con salidas `.dat` generadas por Vensim: `subscript`, `mapping`, `multimap`, `subalias`, `except`, `sum`, `vector`, `elmcount`, `arrays`, `directsubs`, `directconst`, `same_family_*`.
- PySD 3.14.3: `docs/structure/vensim_translation.rst`, `docs/tables/functions.tab`, gramáticas PEG `translators/vensim/parsing_grammars/*.peg`, `py_backend/external.py`.
- Modelo *InterpolatingArrays.mdl* (T. Fiddaman, metasd) en `simlin/test/metasd/interpolating-arrays/` (`VECTOR LOOKUP`, mapeos `i prev`/`i next`).
- Validaciones propias con PySD en `scratchpad/work-subs/subs1.mdl` … `subs4.mdl` (rangos, mapeos, `<->`, `:EXCEPT:`, tablas, `TABBED ARRAY`, posiciones, agregaciones, lookups con subíndices, cadena de envejecimiento).
