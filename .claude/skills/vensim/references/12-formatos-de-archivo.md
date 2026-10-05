# 12 · Formatos de archivo de Vensim

> Referencia detallada de los archivos que lee y escribe Vensim, con énfasis en el formato de texto `.mdl` (ecuaciones + sketch + settings).
> Basado en la documentación de Vensim (extractos), en parsers abiertos (PySD, Simlin —port del conversor `xmutil` de Bob Eberlein—, SDEverywhere) y en el análisis de **525 archivos `.mdl` reales** (repos `test-models`, `simlin/test`, `SDEverywhere/models`).
> Lo marcado **(verificar)** es inferencia u observación no documentada oficialmente.

## Tabla de contenidos

1. [Tabla resumen de extensiones](#1-tabla-resumen-de-extensiones)
2. [El archivo `.mdl`: visión general](#2-el-archivo-mdl-visión-general)
3. [Sección de ecuaciones](#3-sección-de-ecuaciones)
   - 3.1 [Cabecera de codificación](#31-cabecera-de-codificación)
   - 3.2 [Anatomía de una entrada](#32-anatomía-de-una-entrada)
   - 3.3 [Tipos de definición (lado izquierdo / operador)](#33-tipos-de-definición-lado-izquierdo--operador)
   - 3.4 [Grupos y el grupo `.Control`](#34-grupos-y-el-grupo-control)
   - 3.5 [Macros](#35-macros)
   - 3.6 [Reglas léxicas útiles](#36-reglas-léxicas-útiles)
4. [Sección sketch (diagrama)](#4-sección-sketch-diagrama)
   - 4.1 [Cabecera de cada vista](#41-cabecera-de-cada-vista)
   - 4.2 [Tipos de registro](#42-tipos-de-registro)
   - 4.3 [Tipo 10 – variable](#43-tipo-10--variable)
   - 4.4 [Tipo 11 – válvula](#44-tipo-11--válvula)
   - 4.5 [Tipo 12 – comentario, nube u objeto de E/S](#45-tipo-12--comentario-nube-u-objeto-de-es)
   - 4.6 [Tipo 1 – flecha / conector / tubería](#46-tipo-1--flecha--conector--tubería)
   - 4.7 [Tipos 30/31 – imágenes](#47-tipos-3031--imágenes)
   - 4.8 [Ejemplo anotado (teacup)](#48-ejemplo-anotado-teacup)
5. [Definiciones de gráficos, tablas e informes (`:GRAPH`…)](#5-definiciones-de-gráficos-tablas-e-informes-graph)
6. [Sección de settings (`:L<%^E!@`)](#6-sección-de-settings-le)
7. [Editar o generar `.mdl` programáticamente](#7-editar-o-generar-mdl-programáticamente)
8. [Otros formatos](#8-otros-formatos)
   - 8.1 [Binarios propietarios: `.vmf/.vmfx`, `.vdf/.vdfx`, `.vpm/.vpmx`](#81-binarios-propietarios-vmfvmfx-vdfvdfx-vpmvpmx)
   - 8.2 [Archivos de control: `.cin`, `.lst`, `.vsc`, `.voc`, `.vpd`, `.out`](#82-archivos-de-control-cin-lst-vsc-voc-vpd-out)
   - 8.3 [Custom graphs `.vgd/.vgf` y Venapps `.vcd/.vcf`](#83-custom-graphs-vgdvgf-y-venapps-vcdvcf)
   - 8.4 [Datos de texto: `.tab`, `.csv`, `.dat`](#84-datos-de-texto-tab-csv-dat)
   - 8.5 [Varios: `.cmd`, `.2mdl`, `vensim.err`, `.ini`](#85-varios-cmd-2mdl-vensimerr-ini)
9. [XMILE y compatibilidad con Stella/iThink](#9-xmile-y-compatibilidad-con-stellaithink)
10. [Lista de puntos (verificar)](#10-lista-de-puntos-verificar)
11. [Fuentes](#11-fuentes)

---

## 1. Tabla resumen de extensiones

| Ext. | Nombre / propósito | Texto/Binario | Lo crea | Lo leen |
|---|---|---|---|---|
| `.mdl` | Modelo en formato texto (ecuaciones + sketch + settings). Formato por defecto y recomendado para control de versiones | Texto | File>Save / Save As | Vensim, PySD, SDEverywhere, Simlin, xmutil, Stella (import) |
| `.vmf` | Modelo binario (*Vensim Model Format*), propietario y no documentado; abre más rápido, algo mayor que `.mdl` | Binario | Save As (binario), `FILE>MDL2VMF` | Vensim, Model Reader |
| `.vmfx` | Variante del modelo binario para las versiones de 64 bits (introducidas con Vensim 8 según archivo 01; verificar) | Binario | Vensim 64 bits | Vensim |
| `.vpm` | *Packaged/published model*: modelo + archivos de soporte | Binario (cifrado/comprimido; cabecera observada `CD DE 3D 5A`) | File>Publish, `FILE>PUBLISH` | Model Reader, DLL (venpy, EMA) |
| `.vpmx` | Paquete moderno (64 bits / versiones recientes) | Binario (misma cabecera observada) | File>Publish | Model Reader reciente, `vendll64` |
| `.vdf` | Dataset (*Vensim Data Format*): resultados de simulación o datos convertidos | Binario no documentado | Simulación, import de datos | Vensim, DLL, `pysimlin.load_vdf`, `GET VDF *` |
| `.vdfx` | Dataset en versiones de 64 bits/recientes (EMA: `Current.vdfx` en 64 bits, `Current.vdf` en 32) | Binario (misma cabecera observada que `.vdf`) | Simulación | Vensim, DLL |
| `.vgd` | *Vensim Graph Definition*: custom graphs | Texto | Control Panel>Graphs / editor | Vensim (`SPECIAL>READCUSTOM`) |
| `.vgf` | Versión binaria de `.vgd` | Binario | `FILE>VGD2VGF` | Vensim |
| `.vcd` | *Vensim Custom Description*: Venapp (DSS) | Texto | Editor de texto | Vensim DSS / runtime |
| `.vcf` | Versión binaria de `.vcd` | Binario | `FILE>VCD2VCF` | Vensim |
| `.vsc` | *Vensim Sensitivity Control* | Texto | Asistente de sensibilidad | Vensim (`SIMULATE>SENSITIVITY`) |
| `.voc` | *Vensim Optimization Control* (Pro/DSS) | Texto | Asistente de optimización | Vensim (`SIMULATE>OPTPARM`) |
| `.vpd` | *Vensim Payoff Definition* (Pro/DSS) | Texto | Asistente de optimización | Vensim (`SIMULATE>PAYOFF`) |
| `.prm` | Formato antiguo de parámetros de optimización/sensibilidad — **obsoleto** (sustituido por `.vpd/.voc/.vsc`) | Texto | Versiones antiguas | — |
| `.cin` | *Constant INput*: cambios de constantes y lookups | Texto | Editor / `WRITECIN` | Vensim (`READCIN/ADDCIN`) |
| `.lst` | Lista de variables a guardar (savelist) | Texto | Editor | Vensim (`SAVELIST`, `SENSSAVELIST`, `VDF2CSV`) |
| `.out` | Parámetros resultantes de una optimización (formato tipo `.cin`) | Texto | Optimización (`run.out`) | Vensim (como archivo de cambios) |
| `.log` / `.rep` | Progreso de la optimización / informe de payoff | Texto | Optimización | Usuario |
| `.vpa` | Venapp publicada (según archivo 01; verificar) | Binario | DSS (Publish) | Model Reader |
| `.cmd` | Command script | Texto | Editor | Vensim DSS |
| `.tab` / `.csv` | Datos/resultados delimitados | Texto | Export Dataset, `VDF2TAB/CSV` | Vensim (`TAB2VDF`, `GET DIRECT`), PySD |
| `.dat` | Formato DAT de Vensim (variable + pares tiempo/valor) | Texto | `VDF2DAT` | Vensim (`DAT2VDF`), SDEverywhere (`sde compare`) |
| `.xls/.xlsx` | Datos de hoja de cálculo | Binario | Excel | `GET XLS *` (Excel), `GET DIRECT *`, `XLS2VDF` |
| `.2mdl` | Copia de seguridad (*backup*) del modelo | Texto (copia del `.mdl`) | Vensim al guardar | Vensim |
| `.xmile/.xml/.stmx` | XMILE (estándar OASIS; `.stmx` = Stella) | Texto XML | Vensim (export) / Stella | Vensim (≥ 7.3.4 mejorado), PySD, SDE, Simlin |
| `vensim.err` | Log de errores/comandos (con `NOINTERACTION`) | Texto | Vensim | Usuario |

---

## 2. El archivo `.mdl`: visión general

Según la documentación ("`.mdl` Model Files"), el archivo consta, en orden, de:

1. (Opcional) cabeceras de **grupos de ecuaciones**,
2. definiciones de **macros**,
3. **ecuaciones** normales,
4. **información del sketch**,
5. **settings**.

Esqueleto real:

```text
{UTF-8}
<macros :MACRO: ... :END OF MACRO:>
<ecuaciones>
********************************************************
	.Control
********************************************************~
		Simulation Control Parameters
	|
<FINAL TIME, INITIAL TIME, SAVEPER, TIME STEP>
\\\---/// Sketch information - do not modify anything except names
V300  Do not put anything below this section - it will be ignored
*View 1
$192-192-192,0,Times New Roman|12||0-0-0|0-0-0|0-0-255|-1--1--1|-1--1--1|96,96,100,0
<registros 10/11/12/1/30...>
[\\\---/// Sketch information ... (una cabecera por vista adicional)]
///---\\\
[:GRAPH / :TABLE / :REPORT ... definiciones opcionales]
:L<%^E!@
<líneas código:valor>
```

- Saltos de línea: CRLF en Windows (los `.mdl` antiguos de Mac pueden usar CR). Los parsers deben tolerar ambos.
- La documentación indica que el `.mdl` es apto para respaldo/archivo y abre con cualquier editor; también existe "guardar en formato de texto de la versión 1.62" (formato legado).

---

## 3. Sección de ecuaciones

### 3.1 Cabecera de codificación

- Primera línea `{UTF-8}` en archivos modernos: indica codificación UTF‑8. Archivos antiguos pueden carecer de ella (codificación de página de códigos local — verificar).
- Gramática PySD: `encoding = ~r"\{[^\}]*\}"` (cualquier `{...}` inicial).

### 3.2 Anatomía de una entrada

```text
<lado izquierdo> <operador> <expresión>
	~	<unidades> [<mín>,<máx>,<incremento>]
	~	<comentario / documentación>
	[~	:SUPPLEMENTARY]
	|
```

Ejemplo real (teacup):

```text
Room Temperature=
	70
	~	Degrees Fahrenheit [-459.67,?]
	~	Put in a check to ensure the room temperature is not driven below absolute \
		zero.
	|
```

- Separadores: `~` separa ecuación / unidades / comentario; `|` cierra la entrada (gramática PySD: `entry = element "~" element "~" doc ("~" element)? "|"`).
- **Unidades**: expresión de unidades seguida opcionalmente de un **rango** `[mín,máx]` o `[mín,máx,incremento]`; `?` = sin límite. Este rango alimenta los *sliders* de SyntheSim y los atributos 11–13 de `vensim_get_varattrib`.
- **Cuarto campo opcional**: banderas como `:SUPPLEMENTARY` (variable suplementaria, no marcada como "no usada"). Formas observadas: `~	:SUPPLEMENTARY`, `~~~:SUPPLEMENTARY|` (forma compacta: unidades y comentario vacíos).
- **Forma compacta**: `x = 3 ~~|` (sin unidades ni comentario) es válida.
- El formato del editor (saltos tras `=`, tabuladores) no es significativo.

### 3.3 Tipos de definición (lado izquierdo / operador)

| Forma | Significado |
|---|---|
| `x = expr` | Auxiliar/constante normal. |
| `x = INTEG(flujo_neto, inicial)` | Nivel (stock). |
| `x == expr` | *Unchangeable constant* (no modificable en SyntheSim/cambios). |
| `x := expr` | Ecuación de datos (*data equation*). |
| `x` + palabra clave (`:INTERPOLATE:`, `:RAW:`, `:HOLD BACKWARD:`, `:LOOK FORWARD:`) | Variable de datos sin ecuación (se lee de un `.vdf`) con modo de interpolación. |
| `tabla( [(xmin,ymin)-(xmax,ymax)], (x1,y1), (x2,y2), ... )` | Lookup (tabla). El rango entre corchetes es opcional. |
| `x = WITH LOOKUP(entrada, ([(..)-(..)],(x1,y1),...))` | Lookup en línea. |
| `Dim: (A1-A5)` / `Dim: A1, A2, A3` / `Dim: A1, A2 -> OtraDim` | Rango de subíndices (con mapeo opcional `->`). `GET XLS/DIRECT SUBSCRIPT(...)` también define rangos. |
| `Dim1 <-> Dim2` | Equivalencia (copia) de rangos de subíndices. |
| `x[DimA] :EXCEPT: [A1] = expr` | Definición con excepciones. |
| `x[DimA] = 1, 2, 3` | Lista de números (*number list*); `TABBED ARRAY(...)` para matrices pegadas desde hojas. |
| `nombre :THE CONDITION: cond :IMPLIES: consecuencia` | Restricción de Reality Check (verificar sintaxis completa). |
| `x :TEST INPUT: expr` | Entrada de prueba de Reality Check. |
| `x = GAME(expr)` | Variable *gaming*. |
| `x = A FUNCTION OF(a, b)` | Marcador de ecuación incompleta (impide simular). |

### 3.4 Grupos y el grupo `.Control`

Cabecera de grupo (forma moderna, observada en todos los archivos):

```text
********************************************************
	.Control
********************************************************~
		Simulation Control Parameters
	|
```

- El nombre empieza por `.`; los niveles se separan con `.` (observado: `.Energy.Sources`).
- Todas las ecuaciones que siguen pertenecen al grupo hasta la siguiente cabecera.
- `.Control` agrupa `FINAL TIME`, `INITIAL TIME`, `SAVEPER`, `TIME STEP` (más integración en settings).
- Formas antiguas `{**nombre**}` / `***nombre***|` son reconocidas por xmutil/Simlin (verificar en qué versiones de Vensim se escribían).

### 3.5 Macros

```text
:MACRO: EXPRESSION MACRO(input, parameter)
EXPRESSION MACRO = INTEG(input, parameter)
	~	input
	~	tests basic macro containing a stock but no output
	|

:END OF MACRO:
```

- Van antes de las ecuaciones normales (aunque los parsers toleran otras posiciones).
- Salidas adicionales tras `:` en la lista de argumentos: `:MACRO: M(in1, in2 : out2)` (gramática PySD: `"(" (name ","?)+ ":"? (name ","?)* ")"`).

### 3.6 Reglas léxicas útiles

- Nombres con espacios; no distinguen mayúsculas; entre comillas `"..."` si tienen caracteres especiales (con `\"` escapado); un salto de línea visible en el nombre se guarda como `\n` dentro de comillas.
- Continuación de línea: `\` al final de línea (visto en comentarios largos).
- Comentarios en línea dentro de ecuaciones: `{ ... }` (anidables).
- Operadores lógicos `:AND:`, `:OR:`, `:NOT:`; `:NA:` = valor NA (`-1.298074E+33`).
- Fin de ecuaciones: la línea que empieza con `\\\---///` (Simlin acepta también `\\---///`).

---

## 4. Sección sketch (diagrama)

> La documentación ("Sketch Information") advierte que esta parte **no está pensada para modificarse a mano** salvo nombres, pero da un resumen de su estructura. Las descripciones campo a campo de abajo combinan la referencia ("Sketch Object Detail", citada por Simlin), la gramática de PySD (`sketch.peg`) y estadísticas sobre 525 archivos.

### 4.1 Cabecera de cada vista

```text
\\\---/// Sketch information - do not modify anything except names
V300  Do not put anything below this section - it will be ignored
*View 1
$192-192-192,0,Times New Roman|12||0-0-0|0-0-0|0-0-255|-1--1--1|-1--1--1|96,96,100,0
```

- **Línea 1**: separador; se repite al comienzo de **cada vista** (modelos con varias vistas tienen varias cabeceras).
- **Línea 2 `V300`**: código de versión; la documentación dice que Vensim 3, 4 y 5 usan el mismo código (300) y que Vensim lo comprueba para asegurar el formato esperado. En el corpus **todos** los archivos usan `V300`, incluidos modelos guardados con Vensim DSS 9.3.4 (no hay `.mdl` de Vensim 10 en el corpus). Simlin/xmutil reconocen también `V364` (no observado; verificar).
- **Línea 3 `*Nombre`**: nombre de la vista (límite documentado de 30 caracteres).
- **Línea 4 `$...`**: fuente y colores por defecto de la vista. Formato documentado: `$iniarrow,n2,face|size|attributes|color|shape|arrow|fill|background|ppix,ppiy,zoom,tf`:
  - `192-192-192` → primer campo (color R-G-B; etiquetado *iniarrow* en la referencia),
  - `0` → `n2` (significado no documentado en los extractos),
  - `Times New Roman|12|` → fuente, tamaño (pt) y atributos (combinación de `B` negrita, `U` subrayado, `S` tachado, `I` cursiva; vacío = normal),
  - `0-0-0` color de texto, `0-0-0` color de formas, `0-0-255` color de flechas, `-1--1--1` relleno y fondo (`-1--1--1` = ninguno/por defecto),
  - `96,96,100,0` → píxeles por pulgada x,y (72 en archivos antiguos de Mac), **zoom %** (p. ej. 75), `tf`.
- Colores: `R-G-B` con componentes 0–255.

### 4.2 Tipos de registro

Cada línea siguiente es un objeto: `tipo,id,...`. Frecuencias en el corpus: tipo 10 (8 717), 1 (8 607), 12 (1 687), 11 (531), 30 (4).

| Tipo | Objeto |
|---|---|
| `10` | Variable (stock, flujo, auxiliar, constante, sombra/*ghost*) |
| `11` | Válvula de un flujo |
| `12` | Comentario, nube (fuente/sumidero) u objeto de entrada/salida (slider, gráfico) |
| `1` | Flecha (conector causal) o tubería de flujo |
| `30` / `31` | Imagen (bitmap / metafile) |

- `id`: entero único **dentro de la vista**, referenciado por las flechas.
- Coordenadas `x,y`: centro del objeto, en píxeles de la vista (pueden ser negativas).

### 4.3 Tipo 10 – variable

```text
10,id,nombre,x,y,ancho,alto,shape,bits,hid,hasfont,tpos,boxwidth,nav1,nav2[,colores y fuente][,6 campos extra]
10,1,Teacup Temperature,307,235,40,20,3,3,0,0,0,0,0,0
10,6,Heat Loss to Room,408,251,49,8,40,3,0,0,-1,0,0,0
10,11,Time,477,111,26,11,8,2,0,3,-1,0,0,0,128-128-128,0-0-0,|0||128-128-128
10,1,RAMP1,385,134,43,23,8,3,0,0,-1,0,0,0,0,0,0,0,0,0
```

| Campo | Contenido | Notas / valores observados |
|---|---|---|
| 1 | `10` | tipo |
| 2 | id | |
| 3 | nombre | igual que en la ecuación; puede ir entre comillas |
| 4–5 | x, y | centro |
| 6–7 | ancho, alto | semiejes/medidas en píxeles (stock por defecto 40×20) |
| 8 | **shape** | Observado: `3` (≈ caja de nivel/stock, 437 casos), `8` (variable sin caja: auxiliar/constante, 6 694), `40` = 8+32 (nombre de flujo **adjunto a válvula**, 419), `0`, `32`, `56`. Bit 5 (`0x20`) = adjunto a válvula (Simlin). Resto: verificar. |
| 9 | **bits** | Bit 0: 1 = definición primaria, **0 = variable sombra/*ghost*** (se dibuja `<nombre>`). Observado: `3` (normal), `2` (sombra), `131`/`130` (=128+3/+2; bit 7 sin documentar), `19`. PySD: "si es par, es una variable sombra". |
| 10 | `hid` | nivel de ocultación (0 = visible) |
| 11 | `hasfont` | ≠0 ⇒ siguen campos de color/fuente propios (p. ej. `3`) |
| 12 | `tpos` | posición del texto respecto de la forma (p. ej. `0` centro en stocks, `-1` en auxiliares/flujos) |
| 13 | `boxwidth` | grosor del borde |
| 14–15 | `nav1,nav2` | navegación/enlaces (verificar) |
| opc. | colores, fuente | si `hasfont`≠0: color de caja, color de relleno, `fuente\|tamaño\|atributos\|color` |
| opc. | 6 enteros extra | **desde Vensim 8.2.1** (gramática PySD: `extra_bytes`, "required since Vensim 8.2.1") |

Número de campos observado: 15 (formato clásico), 18/21/24 (extensiones con fuente/colores y/o los 6 campos extra).

### 4.4 Tipo 11 – válvula

```text
11,5,48,408,235,6,8,34,3,0,0,1,0,0,0
```

Mismos campos posicionales que el tipo 10 (`id,nombre,x,y,ancho,alto,shape,bits,…`).
- El campo "nombre" de la válvula no se muestra: normalmente `48` (o `0`; también valores numéricos grandes en algunos archivos).
- `shape` observado `34` (= 32+2) o `33` (= 32+1); bit 5 = adjunta a un flujo. Posible codificación de la orientación de la tubería en los bits bajos (verificar).
- La válvula **precede** a la variable tipo 10 que lleva el nombre del flujo (con `shape` 40).

### 4.5 Tipo 12 – comentario, nube u objeto de E/S

```text
12,2,48,479,235,10,8,0,3,0,0,-1,0,0,0                     ← nube (fuente/sumidero)
12,10,0,315,86,45,14,8,7,0,0,-1,0,0,0                      ← comentario; texto en la línea siguiente
This does not test negative values
12,1,0,286,104,89,28,8,135,0,18,-1,0,0,0,-1--1--1,0-0-0,|12|B|128-0-0   ← comentario con fuente propia
TREND - simple trend of input (fractional rate of change)
12,8,0,418,171,80,20,3,124,0,0,0,0,0,0                     ← slider (tpos 0)
Gamed Variable,0,100,0
12,7,0,787,203,156,81,3,188,0,0,2,0,0,0                    ← herramienta sobre variable (tpos 2)
Stock,Graph
12,15,0,798,218,267,170,3,188,0,0,1,0,0,0                  ← custom graph por nombre (tpos 1)
Forecast
```

- **Nube**: campo nombre `48` y `shape` `0` (patrón usado también por Simlin al escribir: `12,uid,48,x,y,10,8,0,3,0,0,-1,0,0,0`).
- **bits**: bit 2 (`4`) ⇒ el **texto real está en la línea siguiente** (*scratch name*); bit 3 (`8`) ⇒ **objeto de entrada/salida**.
- Para objetos de E/S, `tpos` (tercer campo tras `bits`) indica el tipo, y la línea siguiente su contenido:
  - `0` **slider**: `variable,mín,máx,incremento`;
  - `1` **custom graph**: nombre del gráfico definido con `:GRAPH`;
  - `2` **herramienta aplicada a una variable**: `variable,herramienta` (p. ej. `Graph`, `Table`).
- `shape` de comentarios observado: 8, 3, 6, 5, 4, 0 (formas de caja/elipse/etc.; mapeo exacto: verificar).

### 4.6 Tipo 1 – flecha / conector / tubería

```text
1,id,desde,hasta,shape,hid,pol,thick,hasf,dtype,res,color,font,np|(x1,y1)|...|
1,9,8,5,0,0,0,0,0,64,0,-1--1--1,,1|(408,198)|          ← conector causal (Characteristic Time → válvula)
1,3,5,2,4,0,0,22,0,0,0,-1--1--1,,1|(441,235)|          ← tubería válvula → nube (aguas abajo)
1,4,5,1,100,0,0,22,0,0,0,-1--1--1,,1|(374,235)|        ← tubería válvula → stock (aguas arriba)
1,73,54,58,36,0,0,22,0,64,0,-1--1--1,,3|(125,144)|(125,144)|(182,144)|   ← polilínea de 3 puntos
```

| Campo | Contenido | Observaciones |
|---|---|---|
| `desde`, `hasta` | ids de los objetos que une, **en el sentido de la causalidad** | En tuberías: desde la válvula hacia el stock/nube |
| `shape` | forma de la flecha (arco, polilínea…) | Observado: `0` y `1` en conectores; en tuberías `4` (extremo aguas abajo) y `100` (extremo aguas arriba), también 36/68 (Simlin) |
| `hid` | oculto | |
| `pol` | **polaridad como código ASCII**: `43` = `+`, `45` = `-`, `83` = `S`, `79` = `O`; `0` = sin polaridad | Observados también 49–53 (`'1'`–`'5'`; significado no documentado) |
| `thick` | grosor; **> 20 ⇒ doble línea paralela** (tubería de flujo usa `22`) | |
| `hasf` | fuente propia | |
| `dtype` | tipo de dibujo/flags | Observado 64, 0, 128, 192 (verificar) |
| `res` | reservado | |
| `color`, `font` | `-1--1--1` = por defecto | |
| `np\|(x,y)\|...` | nº de puntos y lista de puntos de control | 1 punto = punto de control del arco (`(0,0)` ≈ recta en algunos lectores) |

Los nombres de campos siguen la referencia de Vensim tal como la citan Simlin/PySD; su lista exacta: **verificar**.

### 4.7 Tipos 30/31 – imágenes

```text
30,15,wrld3-030000.bmp,1431,591,8,8,8,0,0,0,-1,0,0,0,0,0,0,0,0,0
```
Tipo 30 = bitmap, 31 = metafile; el tercer campo es el archivo de imagen asociado. Parsers abiertos los ignoran.

### 4.8 Ejemplo anotado (teacup)

```text
10,1,Teacup Temperature,307,235,40,20,3,3,0,0,0,0,0,0     stock (shape 3), id 1
12,2,48,479,235,10,8,0,3,0,0,-1,0,0,0                     nube, id 2 (sumidero)
1,3,5,2,4,0,0,22,0,0,0,-1--1--1,,1|(441,235)|             tubería válvula(5)→nube(2)
1,4,5,1,100,0,0,22,0,0,0,-1--1--1,,1|(374,235)|           tubería válvula(5)→stock(1)
11,5,48,408,235,6,8,34,3,0,0,1,0,0,0                      válvula id 5
10,6,Heat Loss to Room,408,251,49,8,40,3,0,0,-1,0,0,0     nombre del flujo (shape 40 = adjunto)
10,7,Room Temperature,469,304,49,8,8,3,0,0,0,0,0,0        constante
10,8,Characteristic Time,408,174,49,8,8,3,0,0,0,0,0,0     constante
1,9,8,5,0,0,0,0,0,64,0,-1--1--1,,1|(408,198)|             conector 8→válvula
1,10,1,6,1,0,0,0,0,64,0,-1--1--1,,1|(340,296)|            conector stock→flujo (curvo)
1,11,7,6,1,0,0,0,0,64,0,-1--1--1,,1|(437,284)|            conector Room T→flujo
///---\\\
```

---

## 5. Definiciones de gráficos, tablas e informes (`:GRAPH`…)

Entre el terminador del sketch `///---\\\` y los settings pueden aparecer definiciones de **custom graphs**, **tablas** e **informes** (mismo lenguaje que los `.vgd`):

```text
:GRAPH TREND
:TITLE TREND
:SCALE
:VAR input
:SCALE
:VAR input TREND

:TABLE Summary_Statistics
:TITLE Summary Statistics
:PRETTYNUM
:X-MIN 100
:X-MAX 100
:FIRST-CELLWIDTH 30
:CELLWIDTH 14
:FONT Times New Roman|12||0-0-0
:VAR r2
:VAR mape

:REPORT COMM1
:TITLE COMM1
:FONT Times New Roman|10||0-0-0
	Texto libre del informe...
:END-OF-REPORT
```

Palabras clave observadas (frecuencia en el corpus): `:VAR`, `:LINE-WIDTH`, `:SCALE`, `:TITLE`, `:GRAPH`, `:DATASET`, `:X-MAX`, `:X-MIN`, `:X-DIV`, `:Y-DIV`, `:Y-MAX`, `:Y-MIN`, `:FORMAT`, `:X-AXIS`, `:FONT`, `:LINE-COLOR`, `:DOTS`, `:TABLE`, `:PRETTYNUM`, `:NO-LEGEND`, `:FIRST-CELLWIDTH`, `:CELLWIDTH`, `:SOFT-BOUNDS`, `:STACK-FILL`, `:PRINT-EVERY`, `:TIME-DOWN`, `:REPORT`, `:LINE-STYLE`, `:END-OF-REPORT`, `:NOTIME`, `:COMLINE`, `:WIP`, `:MAX-POINTS`. (Semántica detallada: ver "Graph Tool Keywords" de la referencia; nombres auto-explicativos, detalles verificar.)

---

## 6. Sección de settings (`:L<%^E!@`)

- Empieza con la línea marcador `:L<%^E!@`; en archivos modernos lleva un carácter **DEL (`0x7F`) entre `:L` y `<`** (`:L\x7F<%^E!@`), que Simlin documenta como requerido por el parser de Vensim al escribir.
- Después, líneas `código:valor` (separar solo por el **primer** `:`; los valores pueden contener rutas con `:`).
- El orden de las líneas varía entre versiones.

Ejemplo (teacup):

```text
:L<%^E!@
1:Current.vdf
9:Current
22:$,Dollar,Dollars,$s
22:Hour,Hours
15:0,0,0,0,0,0
19:100,0
27:2,
34:0,
4:Time
5:Heat Loss to Room
35:Date
36:YYYY-MM-DD
37:2000
38:1
39:1
40:6
41:0
42:1
24:0
25:30
26:30
```

Códigos (✔ = significado documentado o evidente por los valores; ◐ = inferido, verificar):

| Código | Ejemplos observados | Significado |
|---|---|---|
| `1` | `Current.vdf`, `Current.vdfx` | ◐ Dataset de la última simulación |
| `4` | `Time` | ◐ Nombre del eje/variable de tiempo |
| `5` | `Heat Loss to Room`, `count4[dim1]` | ◐ *Workbench variable* seleccionada |
| `6` | `A`, `Entry 1` (varias líneas) | ◐ Elementos de subíndice seleccionados en el Control Panel |
| `8` | `Covid19USv8.vgd` | ◐ Archivo de custom graphs asociado |
| `9` | `Current` | ◐ Nombre de la próxima corrida |
| `10` | `a.cin,b.out` | ◐ Archivos de cambios (`.cin/.out`) de la configuración de simulación |
| `11` | `realopt2.voc` | ◐ Archivo de control de optimización |
| `12` | `realpay.vpd` | ◐ Archivo de payoff |
| `13` | `data.vdf`, `ReferenceMode` | ◐ Dataset(s) de datos para la simulación |
| `15` | `0,0,0,0,0,0` | ✔ (Simlin/xmutil) **Integración**: el 4.º campo es el método. Simlin interpreta `0` Euler, `1`/`5` RK4, `3`/`4` RK2 (auto/fijo — verificar cuál es cuál; "Difference" no mapeado). Deducción por el orden del botón de integración de la UI: 0 Euler, 1 RK4 Auto, 2 Difference, 3 RK2 Fixed, 4 RK2 Auto, 5 RK4 Fixed (ver `08-simulacion-e-integracion.md`) |
| `18` | `seed.vsc` | ◐ Archivo de control de sensibilidad |
| `19` | `100,0` | ◐ (zoom/visualización; verificar) |
| `20` | `sensi.lst` | ◐ Savelist de sensibilidad |
| `22` | `$,Dollar,Dollars,$s` | ✔ **Equivalencias de unidades**: nombre y alias separados por coma; un token con `$` inicial aporta la ecuación |
| `23` | `0` | ◐ desconocido |
| `24`,`25`,`26` | `0`,`30`,`30` | ◐ Rango de tiempo de los gráficos (Simlin: inicio/fin de visualización, coinciden con INITIAL/FINAL TIME) |
| `27`,`34` | `2,` / `0,` | ◐ desconocido |
| `30` | `?inputs.xlsx=inputs.xlsx` | ✔ **Alias de archivos** (`?alias` usado en `GET DIRECT/XLS`) |
| `31`,`32`,`33` | `0,ReferenceMode`, `11,Boston`, pares `(x,y)` | ◐ desconocido |
| `35`–`42` | `Date`, `YYYY-MM-DD`, `2000`, `1`, `1`, … | ◐ Configuración de fechas/calendario (etiqueta, formato, origen año/mes/día, tipo) |
| `43` | `output`, `output.tab` | ◐ Nombre del archivo de exportación |
| `44` | `65001` | ◐ Página de códigos de exportación (65001 = UTF‑8) |
| `45`–`59`, `71`–`111` | mayormente `0`/`1`/vacío | ◐ Opciones de versiones recientes; `104:Courier\|12\|\|0-0-0\|...` es una fuente |

Los parsers abiertos (Simlin, xmutil) **solo interpretan 15, 22 y 30**; Vensim ignora/reescribe el resto si faltan (al generar un `.mdl` mínimo basta con `:L<%^E!@` y opcionalmente `15:` y `22:`; verificar que Vensim no exige más).

---

## 7. Editar o generar `.mdl` programáticamente

- **Sección de ecuaciones**: segura de editar con texto (renombrar requiere cambiar todas las referencias **y** el nombre en el sketch). Añadir una variable sin registro en el sketch es válido: aparece en el modelo pero no en el diagrama.
- **Sketch**: mantener `id` únicos por vista; las flechas deben referenciar ids existentes; los flujos necesitan válvula (11) + nombre (10, shape 40) + tuberías (1, thick 22) hacia stocks o nubes (12 con nombre 48).
- Si el sketch está dañado, Vensim lo ignora/descarta; el modelo (ecuaciones) sigue siendo usable. La documentación advierte "do not modify anything except names".
- Para convertir binarios: `FILE>VMF2MDL` antes de procesar con herramientas externas.
- Herramientas: PySD (gramáticas PEG en `pysd/translators/vensim/parsing_grammars/*.peg`), Simlin (`simlin-cli convert --to mdl|xmile`), SDEverywhere (`@sdeverywhere/parse`, preprocesa eliminando macros y *tabbed arrays*).

Mínimo `.mdl` válido (estructura usada por Simlin al escribir):

```text
{UTF-8}
x = 1
	~	Unit
	~	|

FINAL TIME = 10 ~ Month ~ |
INITIAL TIME = 0 ~ Month ~ |
SAVEPER = TIME STEP ~ Month ~ |
TIME STEP = 1 ~ Month ~ |

\\\---/// Sketch information - do not modify anything except names
V300  Do not put anything below this section - it will be ignored
*View 1
$192-192-192,0,Times New Roman|12||0-0-0|0-0-0|0-0-255|-1--1--1|-1--1--1|96,96,100,0
10,1,x,100,100,40,20,8,3,0,0,-1,0,0,0
///---\\\
:L<%^E!@
15:0,0,0,0,0,0
```
(Probado: PySD 3.14.3 y pysimlin 0.8.5 lo leen y simulan. Apertura sin avisos en Vensim: verificar.)

---

## 8. Otros formatos

### 8.1 Binarios propietarios: `.vmf/.vmfx`, `.vdf/.vdfx`, `.vpm/.vpmx`

- Vensim declara **propietarios y no documentados** los formatos `.vmf`, `.vdf`, `.vgf` y `.vcf`.
- `.vdf` (ingeniería inversa de Simlin, `docs/design/vdf.md`):
  - Magia de 4 bytes: `7F F7 17 52` = corrida de simulación; `7F F7 17 41` = dataset/datos convertidos; `7F F7 17 53` = corrida de sensibilidad/optimización.
  - Cabecera de 168 bytes con texto ASCII tipo `"(Sun Nov 30 23:28:16 2008) From bact.mdl"`; secciones delimitadas por `A1 37 4C BF`; valores `float32` little‑endian; sin campo de versión.
  - Contiene también variables internas de SMOOTH/DELAY (p. ej. `#DL<SMOOTH3(...)#`).
  - Los `.vdfx` observados comparten la misma cabecera mágica.
- Leer sin Vensim: `simlin.load_vdf(path)` (pysimlin) → DataFrame; o exportar con `MENU>VDF2CSV`.
- `.vpm` y `.vpmx`: comienzan con `CD DE 3D 5A` (observado); contenido cifrado/comprimido.

### 8.2 Archivos de control: `.cin`, `.lst`, `.vsc`, `.voc`, `.vpd`, `.out`

**`.cin`** — cambios de constantes y lookups (ejemplo real, World3):

```text
initial nonrenewable resources = 2e12
persistent pollution technology change mult table (
 (-1,-.03),(0,0))
land life policy implementation time =1995
```
Subíndices: `precio[Norte] = 12`. Se aplican con `READCIN`/`ADDCIN` o desde el diálogo de simulación.

**`.lst`** — una variable por línea (ejemplo real):

```text
Active Infectious
Cumulative Cost
Total Deaths
```

**`.vsc`** — control de sensibilidad (ejemplo real, oficial de Ventana):

```text
100,M,1234,,0
Log10 Fatality Rate=RANDOM_NORMAL(-3,-1,-2.3,0.3)
R0=RANDOM_TRIANGULAR(2.2,5,2.5,3.5,4.5)
Statistical Value of Life=RANDOM_TRIANGULAR(0,1.5e+07,1e+06,1e+07,1.5e+07)
```
- Cabecera: `nº_simulaciones, método, semilla, archivo, avisos` — `M` multivariante, `L` Latin Hypercube, `F` muestra leída de archivo (p. ej. de un MCMC); detalle en `10-analisis-avanzado-sensibilidad-optimizacion.md`.
- Cada línea: `parámetro=DISTRIBUCIÓN(mín,máx,…)`; en archivos generados por Vensim los nombres llevan guion bajo (`RANDOM_NORMAL(min,max,media,desv)`, `RANDOM_TRIANGULAR(min,max,inicio,pico,fin)`), la documentación también muestra la forma con espacio (`RANDOM UNIFORM(11,15)`).

**`.voc`** — control de optimización: primero opciones `:CLAVE=valor` (p. ej. `:OPTIMIZER=Powell`, `:MULTIPLE_START=…`, `:SENSITIVITY=PAYOFF_VALUE`, opciones `:MC…` para MCMC), después un parámetro por línea:

```text
:OPTIMIZER=Powell
0 <= Characteristic Time = 10 <= 30
4 <= WORK SPEED BASE <= 10
```
(`mín <= parámetro = valor_inicial <= máx`; valor inicial opcional. Lista completa de claves: archivo 10.)

**`.vpd`** — payoff: líneas de tipo (`*C` calibración, `*P` política, variantes como `*CG`, `*PF`, `*RI`…) seguidas de elementos:

```text
*C
wolves|measured wolves/1
*P
Cumulative Profit/1
```
(calibración `modelo|datos/peso`; política `variable/peso`; ver archivo 10.)

**`.out`, `.log`, `.rep`** — salidas de una optimización `run`: `run.out` con los valores óptimos de parámetros (formato tipo `.cin`, reutilizable como archivo de cambios; aparece junto a `.cin` en el código de settings `10:`), `run.log` (progreso) y `run.rep` (informe de payoff, si se pide).

### 8.3 Custom graphs `.vgd/.vgf` y Venapps `.vcd/.vcf`

`.vgd` real (World3):

```text
:GRAPH STATE_OF_WORLD
:TITLE State of the World
:X-DIV 2
:Y-DIV 1
:SOFT-BOUNDS
:SCALE
:VAR population
:Y-MIN 0
:Y-MAX 1.2e+010
:SCALE
:VAR food
:Y-MIN 0
:Y-MAX 6e+012
```
Se carga con `SPECIAL>READCUSTOM|archivo.vgd` y se muestra con `CUSTOM>STATE_OF_WORLD`. Palabras clave: ver §5.

`.vcd`: ver archivo 11 §5 (pantallas `:SCREEN`, objetos `BUTTON`, `TEXTMENU`, `MODVAR`…).

### 8.4 Datos de texto: `.tab`, `.csv`, `.dat`

- **`.tab`/`.csv` de exportación**: por defecto **una fila por variable y el tiempo a lo ancho** (la opción `*` de `VDF2TAB/CSV` pone el tiempo hacia abajo). Variables subindicadas: `"Inflow A[Entry 1,Column 1]"`.
- **Import (`TAB2VDF`, `GET DIRECT DATA`)**: tiempos en una fila o columna y una serie por variable.
- **`.dat`** (formato DAT de Vensim): línea con el nombre de la variable seguida de líneas `tiempo<TAB>valor`; las constantes solo tienen el tiempo inicial:

```text
Average Duration of Illness d
0	2
Contact Rate c
0	2.5
2	2.5
```

### 8.5 Varios: `.cmd`, `.2mdl`, `vensim.err`, `.ini`

- `.cmd`: command scripts (archivo 11 §2).
- `.2mdl`: copia de seguridad del `.mdl` (Vensim la crea al guardar; en el ejemplo observado contiene la versión anterior del modelo).
- `vensim.err`: log de mensajes con `SPECIAL>NOINTERACTION|1`.
- `.ini`: configuraciones leídas con `SPECIAL>READINI` (formato: verificar).
- `.frm`: archivo de configuración de publicación usado por `FILE>PUBLISH|frmfile` (verificar).

---

## 9. XMILE y compatibilidad con Stella/iThink

- **XMILE** (OASIS, v1.0, 2015): estándar XML de intercambio de modelos SD; Stella Architect/Professional guardan nativamente `.stmx` (XMILE con extensiones `isee:`); iThink `.itmx`.
- **Vensim → XMILE**: Vensim DSS 7.3.4 produjo exportaciones XMILE observadas (`<product version="1.0" lang="en">Vensim</product>`, `<vendor>Ventana Systems, Inc.</vendor>`). En esas exportaciones **no se incluyó la vista (`<views>`)** y algunas funciones se tradujeron con semántica distinta: `INTEGER` → `INT` (Vensim trunca hacia cero; XMILE `INT` es *floor*) y `MODULO` → `mod` — cuidado con negativos. (Menú exacto de exportación y comportamiento en Vensim 10: verificar.)
- **XMILE → Vensim**: desde **7.3.4** Vensim "intentará leer" modelos XMILE (File>Open, cambiar el tipo a XMILE, que incluye `.stmx`; también se puede renombrar `.stmx` a `.xmile/.xml`).
- **Stella antiguo**: utilidad `stel2ven.exe` convierte modelos Stella/iThink guardados **como ecuaciones** (texto) a Vensim; `stella.mac` contiene macros para funciones de Stella no soportadas por Vensim; el diagrama no se convierte.
- **xmutil** (Bob Eberlein, C++): convierte `.mdl` → XMILE (con diagrama); lo usan `test-models` (producto `Vensim, xmutil`) y es la base del lector MDL de Simlin.
- Diferencias que rompen la conversión: macros de Vensim, funciones específicas (`DELAY FIXED`, `ALLOCATE…`, `GET XLS/DIRECT…`, `VECTOR…`), subíndices con mapeos/`:EXCEPT:`, unidades, conveyors/queues de Stella, módulos de Stella (Vensim no tiene módulos), integración RK. Validar siempre comparando corridas (`test-models` usa `output.csv/.tab` como referencia canónica).
- Herramientas que leen ambos: PySD (`read_vensim`/`read_xmile`), SDEverywhere (`.mdl` y `.stmx`), Simlin (`.mdl`, `.stmx`, `.xmile`), `readsdr` (R).

---

## 10. Lista de puntos (verificar)

1. Significado exacto de `shape` (variables y comentarios), bit 7 de `bits`, `dtype` y polaridades 49–53 en flechas.
2. Nombres oficiales de todos los campos de los registros (página "Sketch Object Detail").
3. Códigos de settings marcados ◐ (en especial 1, 5, 9, 10–13, 18–20, 24–26, 35–44).
4. Mapeo del 4.º campo de `15:` a Euler/RK4 auto/RK4 fijo/RK2 auto/RK2 fijo/Difference.
5. Confirmar que `.vdfx/.vmfx/.vpmx` llegaron con Vensim 8 (64 bits) y sus diferencias internas con `.vdf/.vmf/.vpm`.
6. Campos 4–5 de la cabecera de `.vsc` (archivo/avisos) y claves menos comunes de `.voc` (ver archivo 10).
7. Menú y alcance actual de la exportación XMILE en Vensim 10 (¿incluye vistas?).
8. Si un `.mdl` mínimo sin la mayoría de settings abre sin avisos en Vensim 10.

---

## 11. Fuentes

**Documentación de Vensim (extractos de búsqueda):**
- File Types: https://www.vensim.com/documentation/file_types.html · File Formats: https://www.vensim.com/documentation/refad.html · `.mdl` Model Files: https://www.vensim.com/documentation/_mdl_model_files.html · Sketch Information: https://www.vensim.com/documentation/ref_sketch_format.html · Sketch Object Detail (citada por Simlin): https://www.vensim.com/documentation/24305.html · File format: https://www.vensim.com/documentation/file-format.html · File Format – vgd: https://www.vensim.com/documentation/23985.html · Graph Tool Keywords: https://www.vensim.com/documentation/24000.html
- Control File Format – Sensitivity: https://www.vensim.com/documentation/sensitivitycontrol.html · Save Lists: https://www.vensim.com/documentation/ref_savelist.html · SENS2FILE: https://www.vensim.com/documentation/sens2file.html · Exporting Datasets: https://www.vensim.com/documentation/data_export.html · Preparing, Using and Exporting Data: https://www.vensim.com/documentation/ref_data.html
- Model Files: http://vensim.com/documentation/26055.html · MDL2VMF: https://www.vensim.com/documentation/25030.html · VMF2MDL: https://www.vensim.com/documentation/25050.html · Binary Format for Venapps: https://www.vensim.com/documentation/24545.html · Publishing a Packaged Model: https://www.vensim.com/documentation/usr19_saving_to_a_binary_file.html · Model Reader: https://vensim.com/vensim-model-reader/
- XMILE / Stella: Vensim 7.3.4: https://www.vensim.com/documentation/vensim_7_3_-_july_2018.html · Converting Stella or ithink Models: https://www.vensim.com/documentation/24290.html · readsdr (CRAN): https://cran.r-project.org/web/packages/readsdr/readsdr.pdf

**Código y datos inspeccionados localmente:**
- Simlin: `src/simlin-engine/src/mdl/view/{types,elements,processing}.rs`, `mdl/settings.rs`, `mdl/writer.rs`, `mdl/CLAUDE.md`, `docs/design/mdl-parser.md`, `docs/design/vdf.md`.
- PySD: `pysd/translators/vensim/parsing_grammars/{sketch,file_sections,section_elements,element_object}.peg`, `vensim_file.py`.
- SDEverywhere: `README.md`, `models/*/*.dat`.
- Corpus: 525 `.mdl` (`test-models`, `simlin/test` incl. modelos de MetaSD y C-LEARN, `SDEverywhere/models`) — estadísticas de registros y settings calculadas con awk; World3‑03 (`.VGD`, `.VCD`, `.CIN`, `SCEN01.VDF`); `VensimOfficial/venpy` (`.vsc`, `.lst`, `.cin`, `.2mdl`, `.vpm`, `.vpmx`); XMILE exportados por Vensim DSS 7.3.4 en `test-models/tests/*/`.
