# 07 · Datos, lookups, importación y exportación en Vensim

Referencia experta sobre tablas (*lookups*), variables de datos (*Data*), funciones `GET …` para leer hojas de cálculo y archivos de texto, *datasets* (`.vdf`), y exportación de resultados.

> Convenciones: funciones, menús y palabras clave en inglés como en Vensim. Ejemplos en sintaxis `.mdl`. Lo marcado **(verificar)** no pudo confirmarse en la documentación oficial durante la redacción (vensim.com no era accesible directamente; se usaron extractos de búsqueda, modelos guardados por Vensim y traductores de código abierto validados contra Vensim). Los textos entre llaves `{…}` son anotaciones: Vensim admite comentarios entre llaves dentro del texto de una ecuación (p.ej. `b = 3 {transportation sector}`), pero colocados tras `|` son sólo explicativos; elimínelos al copiar un ejemplo (PySD no acepta llaves fuera de una ecuación).

## Tabla de contenidos

1. [Panorama: constantes, lookups, datos y datasets](#1-panorama-constantes-lookups-datos-y-datasets)
2. [Lookups (tablas)](#2-lookups-tablas)
3. [Variables de datos (Data)](#3-variables-de-datos-data)
4. [Funciones sobre variables de datos](#4-funciones-sobre-variables-de-datos)
5. [Funciones GET para archivos externos](#5-funciones-get-para-archivos-externos)
6. [Datasets (.vdf/.vdfx) e importación](#6-datasets-vdfvdfx-e-importación)
7. [Usar datos en simulaciones y comparar con resultados](#7-usar-datos-en-simulaciones-y-comparar-con-resultados)
8. [Exportar resultados](#8-exportar-resultados)
9. [Disponibilidad por edición y plataforma](#9-disponibilidad-por-edición-y-plataforma)
10. [Errores comunes](#10-errores-comunes)
11. [Ejemplo integrado validado](#11-ejemplo-integrado-validado)
12. [Fuentes](#12-fuentes)

---

## 1. Panorama: constantes, lookups, datos y datasets

| Concepto | Sintaxis típica | Varía con el tiempo | Cambiable en SyntheSim / `.cin` | Se compara/calibra contra simulaciones | Uso típico |
|---|---|---|---|---|---|
| Constante | `x = 5` / `x[R] = 1, 2, 3` / `GET … CONSTANTS` | No | Sí (sliders, cambios) | No | Parámetros |
| Lookup | `tbl( (x1,y1), … )` + `tbl(input)` | Según su entrada (p.ej. `tbl(Time)`) | Editable (verificar edición en SyntheSim) | No | Relaciones no lineales, efectos normalizados, series exógenas simples |
| Data | `x := GET … DATA(…)` o sin ecuación | Sí (serie temporal) | No | Sí (aparece como dato, sirve para *payoff*) | Series históricas, escenarios exógenos |
| Dataset `.vdf` | Archivo binario | — | — | Sí | Contenedor de datos importados o resultados de corridas |

Regla práctica: **relaciones no lineales → lookups; series temporales observadas → variables Data**. Una serie histórica como `tbl(Time)` funciona, pero pierde las ventajas de los datos (modos de interpolación, `:NA:`, comparación y calibración con datasets).

---

## 2. Lookups (tablas)

### 2.1 Sintaxis completa

```vensim
effect of price on demand(
	[(0,0)-(2,1.5)], (0,1.5), (0.5,1.3), (1,1), (1.5,0.6), (2,0.4))
	~	Dmnl
	~	Efecto normalizado: entrada = precio relativo.
	|
```

- Forma: `nombre( [(xmin,ymin)-(xmax,ymax)], (x1,y1), (x2,y2), … )`.
- El bloque de rango `[(xmin,ymin)-(xmax,ymax)]` es **opcional** (sólo define los ejes del editor gráfico; no recorta valores). Sin rango: `g((0,0),(1,1),(2,2))`.
- Los valores x deben ser crecientes. Entre puntos la interpolación es **lineal por tramos**.
- Dentro de los corchetes pueden aparecer puntos adicionales tras el rango, p.ej. `[(0,0)-(2,10),(-1,10),(-0.74,5.79),…]`; Vensim los guarda para la curva de referencia del editor y **no afectan a la simulación** (los traductores los descartan) **(verificar su función exacta en el editor)**.
- Formato heredado "vector XY" (`nombre(x1, x2, …, xN, y1, y2, …, yN)`) aún reconocido por parsers como xmutil **(verificar si Vensim actual lo acepta)**.

Invocación: el lookup se usa como una función de un argumento:

```vensim
demand = normal demand * effect of price on demand(price / reference price) ~ Widget/Month ~ |
policy schedule = schedule tbl(Time) ~ Dmnl ~ |   { serie temporal "a mano" }
```

### 2.2 Comportamiento en los extremos (saturación)

Por defecto los lookups **no extrapolan**: fuera del rango de x devuelven el primer o el último y. Con `g((0,0),(1,1),(2,2))`: `g(-1) = 0`, `g(2.5) = 2` (salida de Vensim en `SDEverywhere/models/lookup/lookup.dat`). Para extrapolar linealmente se usa `LOOKUP EXTRAPOLATE`.

### 2.3 `WITH LOOKUP` (tabla embebida)

```vensim
Variable with Inline Lookup = WITH LOOKUP(
	Key Variable,
	([(0,0)-(100,1)], (0,0), (5,0.01), (20,0.2), (30,0.5), (70,0.9), (100,1)))
	~	Dmnl [0,1]
	~	|
```

- Combina la entrada y la tabla en una sola variable (en el Equation Editor: tipo *Auxiliary* con subtipo *with Lookup* — verificar nombre exacto del subtipo).
- Misma saturación en extremos: `WITH LOOKUP(2.5, ([(0,0)-(2,2)],(0,0),(1,1),(2,2)))` = 2 (validado con salida de Vensim).
- La entrada puede ser cualquier expresión: `WITH LOOKUP(1 + SIN(2*3.14*Time/30), (…))`.
- Desventaja: la tabla no puede reutilizarse en otras variables; para efectos compartidos defina un lookup con nombre.

### 2.4 Funciones de lookup

| Función | Firma | Resultado |
|---|---|---|
| (llamada directa) | `tbl(x)` | Interpolación lineal; satura en extremos |
| `LOOKUP EXTRAPOLATE` | `LOOKUP EXTRAPOLATE(tbl, x)` | Como `tbl(x)` pero extrapola linealmente fuera del rango usando el segmento extremo |
| `LOOKUP FORWARD` | `LOOKUP FORWARD(tbl, x)` | Sin interpolar: y del siguiente punto con x ≥ input |
| `LOOKUP BACKWARD` | `LOOKUP BACKWARD(tbl, x)` | Sin interpolar: y del punto anterior con x ≤ input |
| `LOOKUP INVERT` | `LOOKUP INVERT(tbl, y)` | x correspondiente a un y (requiere tabla monótona; verificar comportamiento si no lo es) |
| `LOOKUP AREA` | `LOOKUP AREA(tbl, x1, x2)` | Área bajo la curva entre x1 y x2 (3 argumentos, confirmado por xmutil; tratamiento fuera de rango: verificar) |
| `LOOKUP SLOPE` | `LOOKUP SLOPE(tbl, x)` | Pendiente en x — versiones recientes **(verificar)** |
| `VECTOR LOOKUP` | `VECTOR LOOKUP(vec[first], x, xmin, xmax, type)` | Usa un vector equiespaciado como tabla (ver archivo 06) |

Valores de referencia (Vensim) para `g((0,0),(1,1),(2,2))`:

| x | `LOOKUP FORWARD(g,x)` | `LOOKUP BACKWARD(g,x)` |
|---|---|---|
| −1 | 0 | 0 |
| 0.5 | 1 | 0 |
| 1.0 | 1 | 1 |
| 1.5 | 2 | 1 |
| 2.5 | 2 | 2 |

Y para un lookup leído de CSV con puntos anuales: `LOOKUP INVERT(a[A1], 0.5) = 2035`; `LOOKUP FORWARD(a[A1], 2028.1) = 0.3`; `a[A1](2028.1) = 0.27` (interpolado).

### 2.5 Edición gráfica

- En el **Equation Editor**, elija el tipo *Lookup* y pulse **As Graph** para abrir el editor gráfico: se añaden/arrastran puntos, se fijan los límites de entrada/salida y también pueden teclearse los pares en una tabla (nombres exactos de los campos: verificar en su versión).
- Los límites del gráfico se guardan como el bloque `[(xmin,ymin)-(xmax,ymax)]`.
- Buenas prácticas: **lookups normalizados** — entrada adimensional (p.ej. `precio/precio de referencia`) y salida adimensional que multiplica a un valor "normal"; que la curva pase por el punto de referencia (1,1). Vensim emite una advertencia en *Units Check* si la entrada de un lookup tiene unidades (ver archivo 09).

### 2.6 Lookups con subíndices

Cada elemento tiene su propia tabla y se invoca como `tbl[elem](x)`:

```vensim
lookup1dim[A]( (2,3), (4,7), (7,1) ) ~~|
lookup1dim[B]( (3,4), (4,-1), (8,1.5) ) ~~|
lookup1dimtime[dim1] = lookup1dim[dim1](Time) ~~|
lookup1var3dim[dim1, dim3] = lookup1dim[dim1](vardim3[dim3]) ~~|
```

Detalles y variantes 2D en el archivo 06, sección 11.

### 2.7 Lookups desde archivo: `GET XLS LOOKUPS` / `GET DIRECT LOOKUPS`

```vensim
lookupv = GET DIRECT LOOKUPS('inputs.xlsx', 'Global', 'Timev', 'valuev') ~~|
a[DimA] = GET DIRECT LOOKUPS('lookups.csv', ',', '1', 'E2') ~~|      { x en fila 1; filas E2.., E3.. = A1, A2.. }
lookup function[B, Rows] = GET XLS LOOKUPS('input.xls', 'Sheet1', '4', 'C7') ~~|
lookup function[A, Rows]( GET XLS LOOKUPS('input.xls', 'Sheet1', '4', 'C5') ) ~~|  { forma alternativa }
y = a[A1](Time) ~~|
```

Argumentos: `('archivo', 'hoja o delimitador', 'fila o columna de x', 'celda inicial')`, análogos a `GET … DATA` (sección 5). Si la fila/columna de x está en una fila (número), los valores se leen hacia la derecha; si está en una columna (letra), hacia abajo.

---

## 3. Variables de datos (Data)

### 3.1 Formas de definir datos

1. **Con `:=` y una función GET** (datos externos):

```vensim
sales data := GET XLS DATA('ourstore.xls', 'sales', '1', 'B5')
	~	Widget/Month
	~	Tiempo en la fila 1, primer dato en B5.
	|
```

2. **Sin ecuación** (los valores vienen de un *dataset* `.vdf` indicado al simular):

```vensim
Historical Sales
	~	Widget/Month
	~	Serie histórica; se carga desde un dataset.
	|
A Values[DimA] ~~|
```

3. **Data equations**: ecuaciones `:=` que combinan otras variables de datos (`total data := data a + data b`); se calculan en los instantes con datos **(verificar alcance y edición en la página *Data Equations*)**.

En el Equation Editor el tipo de variable es *Data*. Las variables Data se dibujan en el diagrama como cualquier variable y se pueden usar en ecuaciones normales (`gap = target - Historical Sales`).

### 3.2 Modos de interpolación (palabras clave)

La palabra clave se escribe entre el nombre (con sus subíndices) y `:=`; en los archivos guardados por Vensim aparece pegada: `data lf:LOOK FORWARD::= GET XLS DATA(…)`. En variables sin ecuación: `var 1dim[dim1]:HOLD BACKWARD: ~~|`.

| Palabra clave | Entre puntos de datos | Comentario |
|---|---|---|
| (ninguna) / `:INTERPOLATE:` | Interpolación lineal | Comportamiento por defecto |
| `:HOLD BACKWARD:` | Mantiene el último valor disponible (escalón) | Para series "vigente hasta el siguiente cambio" |
| `:LOOK FORWARD:` | Usa el **siguiente** valor disponible | |
| `:RAW:` | `:NA:` donde no hay dato | Para comparar sólo en los instantes observados |

Ejemplo validado (datos en 2000, 2002, 2005; TIME STEP 1):

| Año | 2000 | 2001 | 2002 | 2003 | 2004 | 2005 |
|---|---|---|---|---|---|---|
| interpolado | 100 | 110 | 120 | 130 | 140 | 150 |
| `:HOLD BACKWARD:` | 100 | 100 | 120 | 120 | 120 | 150 |
| `:LOOK FORWARD:` | 100 | 120 | 120 | 150 | 150 | 150 |
| `:RAW:` | 100 | NA | 120 | NA | NA | 150 |

(Los mismos patrones aparecen en la salida de Vensim DSS 7.3.4 de `test-models/tests/data_from_other_model` con TIME STEP 0.5.)

### 3.3 `:NA:` y datos faltantes

- `:NA:` es la constante de "valor no disponible" de Vensim; puede usarse en ecuaciones y comparaciones: `IF THEN ELSE(x[R!] = :NA:, 0, x[R!])`. Su valor numérico interno es un negativo enorme (≈ −1.298e33) **(verificar)**.
- Celdas vacías en la hoja: en modo interpolado se interpola sobre los huecos; en `:RAW:` el instante sin dato da `:NA:`.
- Al exportar a `.tab`, los `:NA:` de `:RAW:` aparecen como celdas vacías (salida de Vensim en `data_from_other_model/output.tab`).
- Fuera del rango de tiempo de los datos, PySD y SDEverywhere mantienen el primer/último valor **(verificar el comportamiento exacto de Vensim; si importa, cubra todo el horizonte o use `:RAW:`)**.

### 3.4 Datos frente a constantes y lookups

- Una variable Data **no** puede recibir un valor en SyntheSim ni en un `.cin`; para escenarios use constantes o lookups.
- Los datos se interpolan al TIME STEP del modelo; el eje temporal de los datos debe estar en las **mismas unidades de tiempo** que el modelo (si el modelo va en meses y los datos en años, convierta la columna de tiempo).
- Para desplazar una serie en el tiempo, use `GET DATA BETWEEN TIMES(data, Time - k, mode)` o `TIME SHIFT` (sección 4).

---

## 4. Funciones sobre variables de datos

Familia documentada en *Data Functions* (fn_data.html). Firmas confirmadas con modelos guardados por Vensim cuando se indica; el resto **(verificar)**:

| Función | Firma | Qué devuelve |
|---|---|---|
| `GET DATA BETWEEN TIMES` | `GET DATA BETWEEN TIMES(data, time, mode)` | Valor de la serie en `time`; `mode` 0 = interpolar, 1 = hacia delante, −1 = hacia atrás (confirmada) |
| `GET DATA AT TIME` | `GET DATA AT TIME(data, time)` | Valor de la serie en un instante (2 argumentos confirmados vía xmutil; ver archivo 05) |
| `GET DATA FIRST TIME` | `GET DATA FIRST TIME(data)` | Primer instante con dato (verificar) |
| `GET DATA LAST TIME` | `GET DATA LAST TIME(data)` | Último instante con dato (1 argumento, confirmado vía xmutil) |
| `GET DATA MAX` / `GET DATA MIN` | `GET DATA MAX(data, start time, end time)` | Máx./mín. de la serie en un intervalo (verificar firma) |
| `GET DATA MEAN` | `GET DATA MEAN(data, start time, end time)` | Promedio en un intervalo (3 argumentos confirmados; nombres verificar) |
| `GET DATA TOTAL POINTS` | `GET DATA TOTAL POINTS(data)` | Nº de puntos de datos (verificar) |
| `TIME SHIFT` | `TIME SHIFT(data, shift)` | Serie desplazada en el tiempo (verificar firma) |

Uso validado (SDEverywhere `models/getdata`, salida de Vensim):

```vensim
Interpolate = 0 ~~|
Forward = 1 ~~|
Backward = -1 ~~|
Values[DimA] ~~|   { datos sin ecuación, desde un dataset }
Value one year ago[DimA] = GET DATA BETWEEN TIMES(Values[DimA], MAX(INITIAL TIME, Time - 1), Interpolate) ~~|
Initial value next year[DimA] = INITIAL(GET DATA BETWEEN TIMES(Values[DimA], MIN(FINAL TIME, Time + 1), Interpolate)) ~~|
```

Matiz observado al comparar con Vensim: en los modos 1 y −1 Vensim parece **truncar el tiempo a entero** y el modo −1 devuelve el valor del punto *anterior* (comentarios de la implementación de SDEverywhere). Si su modelo depende de esos modos, compruébelo en Vensim.

PySD no implementa `TIME SHIFT` ni `SHIFT IF TRUE` (documentado en su traductor).

---

## 5. Funciones GET para archivos externos

### 5.1 Firmas

| Familia | Firma | Tipo de variable |
|---|---|---|
| `GET XLS DATA` / `GET DIRECT DATA` | `('file', 'tab', 'time row or col', 'first data cell')` | Data (`:=`) |
| `GET XLS CONSTANTS` / `GET DIRECT CONSTANTS` | `('file', 'tab', 'first cell')` | Constante (`=`) |
| `GET XLS LOOKUPS` / `GET DIRECT LOOKUPS` | `('file', 'tab', 'x row or col', 'first cell')` | Lookup |
| `GET XLS SUBSCRIPT` / `GET DIRECT SUBSCRIPT` | `('file', 'tab', 'first cell', 'last cell', 'prefix')` | Rango de subíndices (`:`) |
| `GET 123 DATA/CONSTANTS/LOOKUPS` | Mismos argumentos que `GET XLS` | Heredadas (Lotus 1-2-3), **(verificar vigencia)** |
| `GET VDF DATA/CONSTANTS/LOOKUPS` | `('archivo.vdf', 'nombre variable', …)` | Lee de un `.vdf` **(verificar firma)** |

Todos los argumentos son **cadenas entre comillas simples**.

### 5.2 Argumentos

**`'file'`**
- Ruta relativa a la carpeta del modelo (`'data/a.csv'`) o absoluta.
- **Referencia indirecta `?alias`**: `GET XLS DATA('?groupon data', 'users', '4', 'd20')`. El alias se resuelve con una tabla de archivos que Vensim guarda en la sección de *settings* del `.mdl` como líneas `30:?alias=archivo.xlsx` (p.ej. `30:?groupon data=groupon data.xlsx`). Permite cambiar de archivo sin editar ecuaciones. Vensim también registra ahí los archivos referenciados directamente (`30:?input.xlsx=input.xlsx`). La pantalla donde se edita esta tabla **(verificar)**.

**`'tab'`**
- En hojas de cálculo: nombre de la hoja (admite Unicode: `'தாள்'`).
- En archivos de texto con `GET DIRECT`: el **delimitador**, p.ej. `','` para `.csv`. Para tabuladores, `'\t'` **(verificar)**.

**`'time row or col'` / `'x row or col'`**
- Un **número** = fila que contiene los tiempos → el tiempo corre **a lo ancho** (por columnas).
- Una **letra** = columna que contiene los tiempos → el tiempo corre **hacia abajo** (por filas).
- Puede ser un nombre de rango de Excel (`'Time1'`).

**`'first data cell'`**
- Celda del primer valor (`'B2'`; minúsculas aceptadas: `'b2'`), o un nombre de rango de Excel (`'value1'`).
- En `… CONSTANTS`, un `*` al final (`'B2*'`) **transpone** la lectura.

Ejemplos de la documentación:

```vensim
sales data := GET XLS DATA('ourstore.xls', 'sales', '1', 'B5') ~~|
{ tiempos en la fila 1; datos desde B5 hacia la derecha }
funny data := GET XLS DATA('data.xls', 'datatab', 'A', 'B2') ~~|
{ tiempos en la columna A; datos desde B2 hacia abajo }
```

### 5.3 Orientación con subíndices

- **DATA / LOOKUPS**: con tiempo hacia abajo (columna), cada elemento sucesivo se lee de la **columna siguiente**; con tiempo a lo ancho (fila), de la **fila siguiente**.

```vensim
e[DimA] := GET DIRECT DATA('e_data.csv', ',', 'A', 'B2') ~~|   { A1 = col B, A2 = col C }
m[DimM] := GET DIRECT DATA('m.csv', ',', '1', 'B2') ~~|        { M1 = fila 2, M2 = fila 3 … }
data function table[B, Rows] := GET XLS DATA('input2.xls', 'Sheet1', '4', 'C7') ~~|
```

- **CONSTANTS**: vector → a lo largo de la fila; tabla 2D → 1.ª dimensión hacia abajo, 2.ª hacia la derecha; `*` transpone.
- Se pueden mezclar definiciones por elemento con distintas fuentes (`Variable[ext data, DimAB]:INTERPOLATE::= GET DIRECT DATA(…)`, `Variable[ext const, DimAB] = GET DIRECT CONSTANTS(…)`, `Variable[const, DimAB] = 2, 4`).

### 5.4 `GET XLS` vs `GET DIRECT` vs otros

| | `GET XLS …` | `GET DIRECT …` |
|---|---|---|
| Plataforma | Windows | Windows y macOS |
| Requiere Excel instalado | Sí (Vensim se comunica con Excel) | No (lee el archivo directamente) |
| Formatos | Los que abra Excel | `.xlsx` y texto delimitado (`.csv`); otros (`.xls`, `.xlsm`, `.tab`) **(verificar)** |
| Texto delimitado | — | Sí, con el delimitador en `'tab'` |
| Nombres de rango de Excel | Sí | Sí (en `.xlsx`) |

Recomendación: use **`GET DIRECT`** para portabilidad (Mac, servidores, herramientas externas como PySD y SDEverywhere, que tratan ambas familias igual).

### 5.5 Cuándo se leen

- Los valores se leen del archivo al **inicializar la simulación** (no durante los pasos de tiempo); cambiar el archivo requiere volver a simular. Para conjuntos de datos grandes o usados en muchas corridas (optimización, sensibilidad), importarlos a un `.vdf` evita lecturas repetidas **(verificar si Vensim cachea las lecturas en la sesión)**.
- Los rangos `GET … SUBSCRIPT` se leen al cargar/comprobar el modelo, ya que definen su estructura.

---

## 6. Datasets (.vdf/.vdfx) e importación

### 6.1 Qué es un dataset

- `.vdf` (*Vensim Data File*) es un formato **binario propietario**. Hay dos clases: archivos de **corrida** (resultados de una simulación, p.ej. `Current.vdf`) y archivos de **dataset** importados (datos externos); internamente difieren en la cabecera, pero Vensim los usa igual en gráficos y tablas.
- Las versiones de 64 bits de Vensim escriben por defecto `.vdfx` y las de 32 bits `.vdf` (ver archivos 11 y 12; **verificar** la versión exacta en que se introdujo). Ambos se usan igual en la interfaz y en los comandos.
- Un `.vdf` puede abrirse en Vensim sin el `.mdl` correspondiente, porque guarda nombres y series.

### 6.2 Importar datos (`Model > Import Dataset…`)

- Ubicación: menú `Model`, junto a `Export Dataset…` (la entrada `Model > Export Dataset…` está confirmada; la de importación, **verificar** en su versión).
- Convierte un archivo de datos de texto u hoja de cálculo en un `.vdf`. Formatos de entrada: `.dat` (formato propio de Vensim), texto tabulado `.tab`/`.txt`, `.csv` y hojas de cálculo **(verificar lista exacta y opciones del diálogo, p.ej. "time running down/across")**.
- En texto tabulado, una fila/columna contiene el tiempo y las demás una serie por variable, con el nombre de la variable (incluidos subíndices `var[elem]`) como encabezado.

### 6.3 Formato `.dat`

Formato de texto en bloques: una línea con el nombre de la variable y, a continuación, una línea por punto con `tiempo<TAB>valor`:

```text
Historical Sales
1990	610
2005	600
2015	590
Values[A1]
0	0
1	10
9	70
```

- Los subíndices van en el nombre (`Values[A1]`).
- Sólo se listan los instantes con dato (series dispersas permitidas). Los archivos `.dat` que acompañan a SDEverywhere son exportaciones de Vensim en este formato.

### 6.4 Archivos auxiliares relacionados

| Extensión | Qué es | Uso |
|---|---|---|
| `.vdf` / `.vdfx` | Resultados o dataset | Gráficos, comparación, datos de entrada |
| `.dat` | Datos en texto (bloques) | Importar/exportar |
| `.tab` / `.csv` | Texto tabulado / CSV | Importar/exportar |
| `.cin` | *Changes file*: líneas `Constante = valor` | Cambios de parámetros sin editar el modelo (Simulation Control / scripts) |
| `.lst` | *Savelist*: lista de variables a guardar/exportar | Reduce el tamaño de `.vdf` y exportaciones **(verificar edición)** |

---

## 7. Usar datos en simulaciones y comparar con resultados

- **Datos sin ecuación**: al simular, indique el/los dataset(s) que aportan los valores en el cuadro de control de simulación (*Simulation Control*, campo de datos usados / *data sources*) **(verificar etiqueta exacta)**. Si falta la fuente de una variable Data sin ecuación, Vensim lo advierte al simular **(verificar mensaje/comportamiento)**.
- **Comparar datos vs simulación**: cargue el dataset en el *Control Panel > Datasets* (junto a la corrida actual); las herramientas *Graph*, *Table* y los *custom graphs* muestran la serie de datos como otra "corrida". Un dataset importado con los mismos nombres de variable que el modelo se superpone directamente con la simulación.
- **Calibración**: los datos (variables Data o datasets cargados) se usan en el *payoff* de optimización (`.vpd`) para ajustar parámetros (Professional/DSS; ver archivo de optimización).
- **Scripts/commands**: en archivos de comandos (`.cmd`) y Venapps, `SIMULATE>DATA|historico.vdfx` indica los datasets de datos y `SIMULATE>READCIN|escenario.cin` carga un archivo de cambios (detalle y fuentes en el archivo 11).

---

## 8. Exportar resultados

### 8.1 `Model > Export Dataset…`

Procedimiento (documentado por el proyecto `SDXorg/test-models` para producir salidas canónicas):

1. Simular el modelo.
2. `Model > Export Dataset…`.
3. Elegir la corrida (por defecto `Current.vdf`).
4. En *Export To*, escribir el nombre del archivo de salida.
5. En *Export As*, elegir el formato (`tab`; otros como `dat`, `csv`, hoja de cálculo **(verificar lista)**).
6. En *Time Running*, elegir `down` (tiempo en filas) o `across`.
7. OK.

Notas:
- Las constantes pueden aparecer sólo en el primer instante de la exportación tabulada (hay que propagarlas si se necesita una columna completa).
- Se puede limitar a un subconjunto de variables con un *savelist* `.lst` **(verificar)**.

### 8.2 Herramientas de análisis

- **Table** / **Table Time Down**: muestran los valores de la variable seleccionada; el contenido puede copiarse al portapapeles (`Edit > Copy`) y pegarse en una hoja de cálculo **(verificar detalle de menús)**.
- Los gráficos pueden guardarse/copiarse como imagen; para datos numéricos use la tabla o Export Dataset.

### 8.3 Automatización

- Los archivos de comandos incluyen órdenes `MENU>…` de conversión: exportar `MENU>VDF2TAB|vdf|tabfile|savelist|…`, `MENU>VDF2CSV|vdf|csvfile|savelist|…`, `MENU>VDF2DAT`, `MENU>VDF2XLS`, `MENU>VDF2TIDY`; importar `MENU>TAB2VDF`, `MENU>DAT2VDF`, `MENU>XLS2VDF`. Ejemplo: `MENU>VDF2CSV|base.vdfx|base.csv|salida.lst`. Argumentos y opciones completos en el archivo 11 (documentación *VDF2CSV*/*VDF2TAB*).
- Fuera de Vensim: `simlin.load_vdf("Current.vdf")` (pysimlin) lee `.vdf` de corridas y datasets a un DataFrame de pandas; PySD devuelve directamente un DataFrame al simular el `.mdl`.

---

## 9. Disponibilidad por edición y plataforma

- **Lookups** y `WITH LOOKUP`: todas las ediciones.
- **Conectividad con datos** (variables Data, datasets externos, Excel): PLE Plus, Professional y DSS; **no** en PLE, según la tabla comparativa oficial (ver archivo 01). Qué funciones `GET` concretas incluye cada edición: **verificar** en la tabla vigente.
- **`GET XLS …`**: sólo Windows con Excel instalado. **`GET DIRECT …`**: Windows y macOS.
- Modelos con datos externos en **Model Reader**: requieren que los archivos de datos acompañen al modelo (verificar).

---

## 10. Errores comunes

| Problema | Causa | Solución |
|---|---|---|
| Valores "desplazados" o leídos en la dirección equivocada | Confusión entre fila (número) y columna (letra) del tiempo | `'1'` = tiempo en fila 1 (a lo ancho); `'A'` = tiempo en columna A (hacia abajo) |
| Tabla 2D transpuesta | Orientación de `GET … CONSTANTS` | Añadir `*` a la celda (`'B2*'`) |
| Error de archivo no encontrado | Ruta relativa a otra carpeta / alias `?` sin definir | Rutas relativas a la carpeta del `.mdl`; revisar la tabla de alias |
| `GET XLS` falla en macOS o en un servidor | Requiere Excel en Windows | Usar `GET DIRECT` |
| Delimitador incorrecto en CSV | `'tab'` debe ser el delimitador en archivos de texto | `','` para CSV |
| Serie escalonada inesperada | Palabra clave `:HOLD BACKWARD:`/`:LOOK FORWARD:` | Quitar la palabra clave o usar `:INTERPOLATE:` |
| Lookup "plano" fuera de rango | Los lookups saturan en extremos | Ampliar la tabla o usar `LOOKUP EXTRAPOLATE` |
| Advertencia de unidades en lookup | Entrada con unidades | Normalizar la entrada (archivo 09) |
| Datos en años y modelo en meses | Eje temporal en otras unidades | Convertir la columna de tiempo o el modelo |
| Variable Data sin valores | Falta el dataset en la simulación | Indicar el `.vdf` en el control de simulación |
| `:NA:` propagado en cálculos | `:RAW:` o huecos | Filtrar con `IF THEN ELSE(x = :NA:, …)` o cambiar el modo |

---

## 11. Ejemplo integrado validado

Archivos de entrada (`hist.csv`, `consts.csv`, `regions.csv`, `lk.csv`):

```text
hist.csv            consts.csv             regions.csv   lk.csv
Year,north,south    Param,north,south      Region        x,0,1,2
2000,100,50         cap,10,20              north         north,0,0.5,1
2002,120,60         cost,1.5,2.5           south         south,0,1,2
2005,150,
```

Modelo:

```vensim
Region: GET DIRECT SUBSCRIPT('regions.csv', ',', 'A2', 'A', '') ~~|
Param: cap, cost ~~|
sales[Region] := GET DIRECT DATA('hist.csv', ',', 'A', 'B2')
	~	Widget/Year
	~	Interpolado (por defecto).
	|
sales hold[Region]:HOLD BACKWARD::= GET DIRECT DATA('hist.csv', ',', 'A', 'B2') ~ Widget/Year ~ |
sales raw[Region]:RAW::= GET DIRECT DATA('hist.csv', ',', 'A', 'B2') ~ Widget/Year ~ |
params[Param, Region] = GET DIRECT CONSTANTS('consts.csv', ',', 'B2') ~ Dmnl ~ |
params T[Region, Param] = GET DIRECT CONSTANTS('consts.csv', ',', 'B2*') ~ Dmnl ~ |
eff tbl[Region] = GET DIRECT LOOKUPS('lk.csv', ',', '1', 'B2') ~ Dmnl ~ |
eff[Region] = eff tbl[Region](1.5) ~ Dmnl ~ |
tbl( [(0,0)-(2,2)], (0,0), (1,1), (2,1.5) ) ~ Dmnl ~ |
y hi = tbl(5) ~ Dmnl ~ |
wl = WITH LOOKUP(Time - 2000, ([(0,0)-(4,4)], (0,0), (4,4))) ~ Dmnl ~ |
INITIAL TIME = 2000 ~ Year ~ |
FINAL TIME = 2006 ~ Year ~ |
TIME STEP = 1 ~ Year [0,?] ~ |
SAVEPER = TIME STEP ~ Year [0,?] ~ |
```

Resultados (PySD 3.14.3): `sales[north]` 100, 110, 120, 130, 140, 150, 150; `sales hold[north]` 100, 100, 120, 120, 120, 150; `sales raw[north]` NA en 2001, 2003, 2004; `params[cost,south] = 2.5` y `params T[south,cost] = 2.5`; `eff[north] = 0.75`, `eff[south] = 1.5`; `y hi = 1.5` (saturación); `wl` = 0, 1, 2, 3, 4, 4, 4.

---

## 12. Fuentes

- Vensim Documentation – *GET XLS DATA*: https://www.vensim.com/documentation/fn_get_xls_data.html
- Vensim Documentation – *GET DIRECT DATA*: https://www.vensim.com/documentation/fn_get_direct_data.html
- Vensim Documentation – *GET XLS… notes*: https://vensim.com/documentation/fn_get_xls____notes.html
- Vensim Documentation – *GET DIRECT CONSTANTS* (transposición con `*`): https://www.vensim.com/documentation/fn_get_direct_constants.html
- Vensim Documentation – *GET XLS CONSTANTS*, *GET 123 CONSTANTS*, *GET VDF CONSTANTS*: https://www.vensim.com/documentation/fn_get_xls_constants.html, …/fn_get_123_constants.html, …/fn_get_vdf_constants.html
- Vensim Documentation – *Preparing, Using and Exporting Data*: https://www.vensim.com/documentation/ref_data.html
- Vensim Documentation – *Getting Data from Spreadsheets*: http://vensim.com/documentation/22050.html ; *Active Links to Spreadsheets*: https://www.vensim.com/documentation/23455.html
- Vensim Documentation – *Data Equations*: https://www.vensim.com/documentation/dataequations.html ; *Special Interpolation Modes*: https://www.vensim.com/documentation/22825.html ; *Data Functions*: https://www.vensim.com/documentation/fn_data.html ; *GET DATA BETWEEN TIMES*: https://www.vensim.com/documentation/fn_get_data_between_times.html
- Vensim Documentation – comandos *VDF2CSV* y *VDF2TAB* (vía archivo 11 de esta base): https://vensim.com/documentation/vdf2csv.html, https://www.vensim.com/documentation/vdf2tab.html
- Vensim Documentation – *Keywords* (`:HOLD BACKWARD:`, `:INTERPOLATE:`, `:RAW:`, `:LOOK FORWARD:`, `:NA:`): https://www.vensim.com/documentation/keywords.html
- Vensim Documentation – *WITH LOOKUP*, *LOOKUP FORWARD*, *LOOKUP BACKWARD*, *LOOKUP EXTRAPOLATE*, *VECTOR LOOKUP*: https://www.vensim.com/documentation/fn_with_lookup.html, …/fn_lookup_forward.html, …/fn_lookup_backward.html, …/fn_lookup_extrapolate.html, …/fn_vector_lookup.html
- Vensim Documentation – *Using Lookups*: https://www.vensim.com/documentation/22820.html ; *Normalized Lookups*: https://www.vensim.com/documentation/20545.html ; *Units and Lookup Functions*: https://www.vensim.com/documentation/22280.html
- Vensim – *Comparison Chart for Vensim Configurations*: https://vensim.com/comparison-chart-for-vensim-configurations/ ; *Vensim PLE Plus*: https://vensim.com/vensim-ple-plus/
- `SDXorg/test-models` (Vensim DSS 7.3.4/9.3.1): `tests/get_*`, `data_from_other_model`, `lookups*`, `subscripted_lookups`, `vector_order`; README (procedimiento *Export Dataset*).
- SDEverywhere `models/` con salidas `.dat` de Vensim: `lookup`, `directdata`, `directconst`, `directlookups`, `directsubs`, `getdata`, `extdata`, `sumif`; runtime C `packages/cli/src/c/vensim.c` (semántica de lookups y `GET DATA BETWEEN TIMES`).
- PySD 3.14.3: `py_backend/external.py`, `py_backend/data.py`, `docs/structure/vensim_translation.rst`, `docs/tables/get_functions.tab`.
- simlin: `docs/design/vdf.md` (formato VDF: corrida vs dataset), `src/simlin-engine/src/mdl/settings.rs` (línea `30:` de alias de archivo), `src/pysimlin/simlin/vdf.py`.
- Modelos *groupon* (metasd) en `simlin/test/metasd/social-network-valuation/` (uso real de `'?alias'`).
- Validaciones propias con PySD.
