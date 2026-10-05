# 13 — Buenas prácticas, errores y depuración en Vensim

> Convenciones de modelado, formulaciones robustas, catálogo de errores/advertencias con causa y solución, metodología de depuración con las herramientas de Vensim y lista de verificación antes de entregar un modelo. Los textos de mensajes entre comillas proceden de la documentación de Vensim cuando se indica; el resto se marca **(verificar)**. Los experimentos marcados "PySD" se ejecutaron con PySD 3.14.3 en este entorno.

## Tabla de contenidos

1. [Convenciones de modelado](#1-convenciones-de-modelado)
2. [Formulaciones robustas](#2-formulaciones-robustas)
3. [Catálogo de errores y advertencias](#3-catálogo-de-errores-y-advertencias)
4. [Metodología de depuración](#4-metodología-de-depuración)
5. [Lista de verificación antes de entregar un modelo](#5-lista-de-verificación-antes-de-entregar-un-modelo)
6. [Fuentes](#6-fuentes)

Documentos relacionados: `08-simulacion-e-integracion.md` (TIME STEP, métodos de integración), `09-unidades-y-reality-check.md` (unidades y Reality Check en detalle), `06-subindices-y-arrays.md` (errores de subíndices), `07-datos-lookups-import-export.md` (datos externos), `12-formatos-de-archivo.md` (formatos), `14-ejemplos-de-modelos.md` (modelos que aplican estas prácticas).

---

## 1. Convenciones de modelado

### 1.1 Nombres descriptivos

- Usar frases completas que digan **qué es** la variable y, si aplica, de qué depende: `tiempo de ajuste de inventario`, no `TAI` ni `t1`. Vensim admite espacios en los nombres; no distingue mayúsculas, y el espacio y `_` son equivalentes (`tasa_de_natalidad` ≡ `tasa de natalidad`).
- Convención útil (Sterman): **stocks con mayúscula inicial** (`Inventario`), flujos y auxiliares en minúscula, constantes descriptivas (`cobertura deseada de inventario`).
- Prefijos/sufijos consistentes: `... deseado(a)`, `... esperado(a)`, `... percibido(a)`, `efecto de X sobre Y`, `tiempo para ...`, `fraccion ...`, `... normal`, `... inicial`.
- Evitar caracteres problemáticos si el modelo se va a usar fuera de Vensim (PySD, SDEverywhere, scripts `.cmd`, DLL): tildes, ñ, `"`, `|`, `~`, `[`, `]`, `:`; un nombre con caracteres especiales debe ir entre comillas dobles en Vensim (`"Expert-Hours Worked per Week"`). Los modelos de `14-ejemplos-de-modelos.md` usan nombres en español sin tildes y comentarios con tildes (UTF-8).
- No reutilizar nombres de funciones como nombres de variables (`IF THEN ELSE`, `MIN`, `SMOOTH`) ni escribir `IF a THEN b ELSE c` (Vensim lo interpreta como un nombre de variable; ver `04-lenguaje-de-ecuaciones.md`).

### 1.2 Unidades en todas las variables

- Cada variable lleva unidades; `Dmnl` para adimensionales; tasas fraccionales en `1/Year`; flujos en `cosa/tiempo`.
- Declarar sinónimos (singular/plural) en *Model > Settings > Units Equiv* (`Person, People, Persons`) para evitar falsos errores.
- Ejecutar *Units Check* (**Ctrl+U**) con frecuencia; el objetivo es el mensaje **"Units are A.O.K."** (documentación de Vensim).
- Activar ocasionalmente la opción *Use strictest testing* para descubrir constantes numéricas escondidas en ecuaciones (detalle en `09-unidades-y-reality-check.md`).

### 1.3 Sin "números mágicos"

Toda constante con significado va en una variable con nombre, unidades, comentario y rango:

```vensim
{ Mal: parámetro escondido, sin unidades, imposible de calibrar o variar en SyntheSim }
envios = Inventario/2

{ Bien }
envios maximos = Inventario/tiempo minimo de procesamiento        ~ Widget/Week
tiempo minimo de procesamiento = 1                                ~ Week [0.25,4,0.25]
```

Excepciones aceptables: `0`, `1` y constantes matemáticas en expresiones como `1 - fraccion`, `MAX(0, x)`, `LN(2)`.

### 1.4 Documentación

- Campo *Comment* de cada variable: definición, fuente del valor, supuestos. En el `.mdl` es el texto tras el segundo `~`.
- Rango `[min,max,incremento]` en las constantes: define los deslizadores de SyntheSim y documenta el dominio plausible (no recorta valores durante la simulación; ver `09`).
- Comentarios en el sketch (herramienta *Comment*) para títulos de vistas, supuestos clave e identificadores de bucles (`R1`, `B2`) con nombres significativos ("B1 Ajuste de inventario").
- *Document* (herramienta de análisis) genera un listado de ecuaciones, unidades y comentarios para revisión.
- Mantener un registro de cambios (en el control de versiones o en un comentario de grupo).

### 1.5 Lookups normalizados

- Entrada adimensional y normalizada (`X / X normal`); salida multiplicativa que vale **1 en (1,1)** para que el parámetro "normal" conserve su sentido.
- El eje X debe cubrir todo el rango que la simulación visitará; si no, Vensim mantiene el valor extremo y advierte (sección 3.6).
- Formas suaves y monótonas salvo justificación; pendientes razonables en el punto normal.
- Documentar en el comentario la forma y los puntos de referencia. Ver `02-fundamentos-dinamica-de-sistemas.md` §5.3.

### 1.6 Estructura modular: vistas, colores, convenciones gráficas

- Una **vista por subsistema** (demanda, producción, fuerza laboral, finanzas), más una vista de "panel" con indicadores y una de control/escenarios. Las vistas no crean espacios de nombres: todas las variables son globales.
- Las conexiones entre vistas se hacen con **variables sombra** (§1.7).
- Convención de colores coherente y explicada en una leyenda (p. ej. constantes de política en azul, datos exógenos en verde, variables de diagnóstico en gris) **(convención del modelador; Vensim no impone colores)**.
- Flujos principales de izquierda a derecha; evitar cruces de flechas; flechas curvas para enlaces de realimentación cortos.
- Un modelo grande se construye y prueba **por partes** (cada vista con entradas temporales exógenas antes de cerrar los bucles).

### 1.7 Variables sombra (*shadow variables*)

- Herramienta *Shadow Variable*: muestra una variable definida en otro lugar como `<nombre>` en gris, sin dibujar sus causas.
- Úsela para `Time`, `TIME STEP`, constantes globales, variables de otras vistas y para evitar flechas largas que cruzan el diagrama (ejemplos en los modelos 2, 3, 5, 6 y 7 de `14-ejemplos-de-modelos.md`).
- No abuse: un diagrama lleno de sombras oculta la realimentación. Los bucles importantes deben verse en una sola vista.

### 1.8 Separar datos de estructura

- La estructura (ecuaciones) va en el `.mdl`; los datos históricos y de escenario, fuera: datasets (`.vdf`/`.vdfx`), hojas de cálculo (`GET XLS ...`/`GET DIRECT ...`), archivos de cambios de constantes y lookups (`.cin`).
- Un escenario = un `.cin` con nombre descriptivo; las corridas se nombran en la barra de herramientas (no sobrescribir `Current`).
- La conectividad con datos no está en Vensim PLE (sí en PLE Plus, Professional y DSS según la tabla comparativa; ver `01` y `07`) **(verificar en la tabla vigente)**.

### 1.9 Control de versiones

- El `.mdl` es **texto plano**: guárdelo en git. Evite el formato binario `.vmf` para el trabajo diario (convertir con *Save As* o `FILE>VMF2MDL`; ver `12-formatos-de-archivo.md`).
- La sección de sketch (tras `\\\---///`) cambia de coordenadas con cada movimiento de un objeto: los diffs de geometría son ruidosos. Revise los diffs en la sección de ecuaciones (antes del sketch) y haga commits separados para "cambios de diagrama" y "cambios de ecuaciones".
- No versione resultados regenerables (`*.vdf`, `*.vdfx`) ni archivos temporales; sí los `.cin`, `.cmd`, `.vgd` (definiciones de gráficos) y datos de entrada.
- Etiquete la versión del modelo usada en cada informe.
- Un `.gitattributes` con `*.mdl text eol=crlf` (o `lf`) evita cambios masivos de fin de línea entre Windows y macOS **(Vensim acepta ambos finales de línea: verificar en su versión)**.
- Pruebas de regresión automatizadas: un script PySD (o simlin) que compare variables clave con valores de referencia tras cada cambio (ver §4.6).

---

## 2. Formulaciones robustas

### 2.1 Stocks no negativos: control de primer orden

Un stock físico (inventario, personas, recursos) no puede ser negativo. La forma robusta es limitar el **flujo de salida** con lo que el stock puede proporcionar:

```vensim
envios = MIN(envios deseados, Inventario/tiempo minimo de envio)      ~ Widget/Week
```

Experimento (PySD, `Inventario` inicial 100, salida deseada 10 Widget/Week, dt = 0.25):

| t (semanas) | Salida constante `envios = 10` | Control de primer orden (`tiempo minimo de envio = 1`) |
|-------------|--------------------------------|--------------------------------------------------------|
| 6 | 40 | 40 |
| 10 | 0 | 3.16 |
| 20 | **−100** | 0.00003 |

Reglas:
- El `tiempo minimo` debe ser ≥ TIME STEP (idealmente 2–4 dt): con un tiempo mínimo menor que dt, Euler oscila y el stock se vuelve negativo igualmente (comprobado en `08-simulacion-e-integracion.md`).
- **No** use `Stock = INTEG(..., ...)` seguido de `stock usado = MAX(0, Stock)`: oculta el problema y **rompe la conservación** (el material "creado" para llegar a 0 no sale de ninguna parte).
- `Stock / TIME STEP` (vaciar en un paso) garantiza la no negatividad con Euler, pero hace la estructura dependiente de dt; prefiera un tiempo mínimo con significado físico.
- Para el lado de la entrada (contratación negativa = despidos), aplique el mismo principio: `despidos = MIN(despidos deseados, Fuerza laboral/tiempo minimo de despido)`. El modelo 4 de `14-ejemplos-de-modelos.md` muestra lo que pasa si no se hace: con retrasos largos la `Fuerza laboral` llega a −256.6.

### 2.2 Divisiones: XIDZ, ZIDZ, MIN/MAX

```vensim
productividad relativa = XIDZ(produccion, trabajadores, productividad normal)   { valor alternativo con sentido físico }
fraccion de mayores = ZIDZ(Mayores, poblacion total)                            { 0 si poblacion total = 0 }
cobertura = XIDZ(Inventario, envios, cobertura maxima)
```

- `XIDZ(a, b, x)` devuelve `x` y `ZIDZ(a, b)` devuelve 0 cuando |b| es menor que 1E-6 (documentación de Vensim, "Preventing Division by Zero" y fichas XIDZ/ZIDZ).
- Elegir el valor alternativo con sentido físico (no siempre 0).
- `MAX(denominador, valor minimo)` es una alternativa cuando el denominador tiene un mínimo físico (p. ej. `MAX(capacidad, capacidad minima)`).
- Argumentos de `LN`/`LOG`/`SQRT`/potencias fraccionarias: proteger con `MAX(epsilon, x)` sólo si el valor cero es legítimo; si no, buscar por qué llega a cero.

### 2.3 Evitar IF THEN ELSE discontinuos

- Los saltos bruscos (`IF THEN ELSE(Inventario < 100, 50, 0)`) no son realistas para decisiones agregadas, generan "chattering" (conmutación en cada paso) y hacen los resultados sensibles a dt y al método de integración.
- Alternativas: `MIN`/`MAX` (límites duros pero continuos), lookups suaves (`efecto(Inventario/Inventario deseado)`), `SMOOTH` de la señal de decisión.
- `IF THEN ELSE` **no protege** de errores: no use `IF THEN ELSE(b = 0, 0, a/b)` para evitar divisiones por cero (use `XIDZ`/`ZIDZ`); las funciones con estado (`SMOOTH`, `DELAY...`) dentro de una rama no seleccionada siguen evolucionando (ver `05-referencia-de-funciones.md`).
- Usos legítimos: interruptores de escenario/política (`IF THEN ELSE(politica activa = 1, ...)` con `politica activa` constante 0/1 o `STEP`), reglas discretas reales (cierre de planta).

### 2.4 Independencia respecto del TIME STEP

- Los resultados no deben cambiar apreciablemente al dividir TIME STEP por 2 (prueba de error de integración). Ejemplo real: en el modelo de Bass, con TIME STEP 0.25 el pico de adopción se desplaza de t = 3.28 a t = 3.75 años (tabla en `14-ejemplos-de-modelos.md`).
- Regla práctica: TIME STEP menor que 1/3 de la constante de tiempo más corta del modelo según la ayuda de Vensim (*TIME STEP*); Sterman recomienda entre 1/4 y 1/10. Si aparece una oscilación con periodo cercano a 2·TIME STEP, sospeche de dt (documentación de Vensim).
- Use potencias de 2 (1, 0.5, 0.25, 0.125, 0.0625, 0.03125…): se representan exactamente en binario y evitan errores de redondeo en el tiempo. `SAVEPER` debe ser múltiplo entero de `TIME STEP`.
- No escriba ecuaciones que dependan explícitamente de `TIME STEP` salvo para estructuras discretas deliberadas.
- `PULSE(inicio, duracion)` con duración menor que dt se ajusta a un paso de cálculo: el área del pulso depende de dt **(verificar comportamiento exacto)**. Para impulsos de magnitud fija, use `PULSE(inicio, TIME STEP) * cantidad / TIME STEP` de forma consciente o prefiera `STEP`/`RAMP`.

### 2.5 DELAY FIXED y TIME STEP

`DELAY FIXED(entrada, tiempo de retraso, valor inicial)` (documentación de Vensim):
- usa **sólo el valor inicial** de `tiempo de retraso` (cambios posteriores se ignoran);
- el retraso mínimo es TIME STEP; retrasos menores equivalen a TIME STEP;
- es discreta: sólo cambia en múltiplos de TIME STEP, sea cual sea el método de integración; PySD documenta `N = round(retraso / TIME STEP)` pasos (ver `08`), así que conviene que el retraso sea múltiplo de TIME STEP;
- debe ir inmediatamente tras el signo igual (no puede formar parte de una expresión).

Si el tiempo de retraso varía durante la simulación, o la salida debe conservar material con retraso variable, use `DELAY N`/`DELAY3` (exponenciales) o `DELAYP`/`DELAY MATERIAL` según el caso (ver `02` §4).

### 2.6 Inicialización y equilibrio

- Inicialice los stocks en **equilibrio** para las pruebas de respuesta (valor inicial = valor deseado/de estado estacionario). Así cualquier dinámica observada se debe a la perturbación (modelo 4 del doc 14: constante hasta t = 10).
- `INITIAL(expresion)` congela un valor calculado al inicio (p. ej. un valor de referencia histórico).
- Si el valor inicial de un stock depende de variables que dependen del propio stock, Vensim informa *Simultaneous initial value equations* (§3.2). Rompa el ciclo con `ACTIVE INITIAL(expresion activa, expresion inicial)` o con una formulación inicial independiente.
- Funciones con estado (`SMOOTH`, `DELAY3`…) se inicializan con su entrada; use las variantes `...I` cuando el equilibrio exija otro valor.

### 2.7 Método de integración

- Euler (por defecto) para la mayoría de modelos de DS y obligatoriamente si hay `STEP`, `PULSE`, `IF THEN ELSE` conmutando, `DELAY FIXED`, `SAMPLE IF TRUE` o ruido.
- RK4 sólo para modelos continuos y suaves (físicos, oscilatorios), comprobando que el resultado no cambia con dt/2. Detalle y ejemplos en `08-simulacion-e-integracion.md`.

---

## 3. Catálogo de errores y advertencias

Tabla resumen (detalles en las subsecciones):

| Mensaje / síntoma | Cuándo aparece | Causa típica | Solución |
|-------------------|----------------|--------------|----------|
| Error de sintaxis en el *Equation Editor* (línea *Errors*) | Al comprobar la ecuación o *Check Model* | Paréntesis/comas, nombre mal escrito, función mal usada, `INTEG` no al principio | §3.1 |
| "Simultaneous equations" | *Check Model* / al simular | Bucle algebraico sin stock | §3.2 |
| "Simultaneous initial value equations involving : ..." | *Check Model* / al simular | Ciclo en los valores iniciales de los stocks | §3.2 |
| Floating point error / overflow | Al simular | División por cero, `LN(0)`, overflow por inestabilidad | §3.3 |
| `:NA:` o valores absurdos (≈ −1.298e33) | Resultados | Datos faltantes, `:RAW:`, lookup de datos sin valor | §3.4 |
| Errores de unidades ("Right hand and left hand units do not match.") | *Units Check* | Inconsistencia dimensional | §3.5 |
| Advertencia de lookup fuera de rango | Al simular | Entrada fuera del eje X | §3.6 |
| `"x" is not used in the model` (*USE FLAG*) | *Check Model* | Variable definida pero no usada | §3.7 |
| *NOT DEFINED* / variable no definida | *Check Model* | Nombre mal escrito o variable sin ecuación | §3.7 |
| Nivel sin valor inicial / `INTEG` mal colocado | *Check Model* | Falta el segundo argumento de `INTEG` | §3.8 |
| Errores de subíndices (rango en el lado derecho que no está en el izquierdo; familias incompatibles) | *Check Model* | Uso inconsistente de rangos | §3.9 |
| Fallo al leer datos externos (`GET XLS ...`) | Al simular | Ruta, Excel, nombres de hoja/celda | §3.10 |
| Fallo de Reality Check | *Reality Check* | El modelo viola una restricción | §3.11 |
| Función o característica no disponible | Al abrir/comprobar | Edición de Vensim insuficiente | §3.12 |
| Error al cargar un dataset `.vdf` | Al abrir resultados | Run de otro modelo/versión, archivo bloqueado | §3.13 |

### 3.1 Errores de sintaxis del editor de ecuaciones

Vensim informa los errores de sintaxis al pulsar *Check Syntax* o *Check Model* en el *Equation Editor*, en la línea *Errors*, señalando la posición lo más cerca posible del error en la ecuación o en las unidades (documentación "Legacy: Syntax Errors"). Causas habituales:

| Síntoma | Causa | Solución |
|---------|-------|----------|
| Paréntesis o comas desbalanceados | Edición manual | Revisar; el editor resalta la posición |
| Nombre desconocido en la ecuación | Errata (`inventaro`) o variable aún no creada | Corregir; en el sketch, dibujar la flecha antes de escribir la ecuación para que la variable aparezca en la lista de variables |
| Variable usada en la ecuación sin flecha en el diagrama | Vensim exige coherencia entre las flechas del sketch y las ecuaciones (marca la variable en el sketch como incompleta) **(verificar el mensaje exacto)** | Dibujar la flecha que falta o quitar la referencia |
| Flecha en el sketch sin uso en la ecuación | Ídem | Usar la variable o borrar la flecha |
| `INTEG`, `DELAY FIXED`, `ACTIVE INITIAL`… no al principio | Estas funciones deben ir inmediatamente tras el `=` y no pueden formar parte de una expresión mayor (documentación de INTEG, DELAY FIXED y ACTIVE INITIAL; lista en `05-referencia-de-funciones.md` §19, punto 20). Las funciones-macro `SMOOTH*`, `DELAY1/3`, `TREND`… **sí** pueden ir dentro de una expresión (p. ej. `k * DELAY3(x, t)` en modelos de SDEverywhere con salida de Vensim) | Crear una variable auxiliar intermedia |
| Número de argumentos incorrecto | P. ej. `DELAY3(x)` | Consultar la firma en `05-referencia-de-funciones.md` |
| Unidades mal escritas | Caracteres no válidos en el campo *Units* | Usar `Widget/(Person*Week)`, `1/Year`, `Dmnl` |
| Lookup con puntos X no crecientes | Edición manual del lookup | Ordenar los puntos por X |

### 3.2 "Simultaneous equations" y "Simultaneous initial value equations"

**Simultaneous equations.** Para simular, Vensim ordena las ecuaciones de modo que cada variable se calcule después de sus causas; si una cadena de auxiliares se cierra sobre sí misma sin pasar por un stock (bucle algebraico), no hay orden posible y Vensim informa un error de ecuaciones simultáneas (documentación "Simultaneous Equations").

```vensim
a = b + 1
b = a * 0.5          { bucle algebraico: a depende de b y b de a, sin stock intermedio }
```

- PySD con este mismo modelo falla con `RecursionError: maximum recursion depth exceeded` (comprobado).
- Soluciones: (1) casi siempre el bucle omite un **stock o un retraso** real (una percepción, un inventario): introducir `SMOOTH` o un nivel con su constante de tiempo; (2) si el bucle es una relación algebraica genuina, resolverla analíticamente; (3) según la documentación ("Iterative Solutions to Active Simultaneous Equations"), Vensim dispone de una función `SIMULTANEOUS` para resolver iterativamente bucles simultáneos activos (firma, edición y versión: verificar; `05-referencia-de-funciones.md` no la ha podido confirmar).

**Simultaneous initial value equations.** El valor inicial de cada stock se calcula recursivamente a partir de las variables de su expresión inicial hasta llegar a constantes o datos; si se detecta un ciclo, Vensim emite el error (documentación "Initial Conditions"/"Legacy: Semantic Errors"). Ejemplo literal de la documentación:

> `ERROR: Simultaneous initial value equations involving : Population : income : avg income`

```vensim
Stock = INTEG(-salida, valor inicial)
valor inicial = objetivo
objetivo = Stock*2          { el inicial de Stock depende de Stock }
```

- PySD: `ValueError: Circular initialization... Not able to initialize the following objects: _integ_stock` (comprobado).
- Solución estándar: `ACTIVE INITIAL(expresion durante la simulacion, expresion para la inicializacion)`, que debe ir sola tras el signo igual (documentación de ACTIVE INITIAL). Ejemplo típico: la capacidad deseada depende de la capacidad durante la simulación, pero se inicializa con la demanda inicial:

```vensim
capacidad deseada = ACTIVE INITIAL(Capacidad*efecto de la utilizacion(utilizacion), demanda inicial/utilizacion normal)
```

### 3.3 Floating point error, overflow y división por cero

Según la documentación de Vensim, los errores de coma flotante ocurren cuando los números crecen demasiado, hay una división por cero o una función recibe un argumento fuera de rango (p. ej. `ARCSIN`/`ARCCOS` con |x| > 1). Vensim detiene la simulación, conserva los resultados hasta ese instante (incluido, si es posible, el instante del error) e indica qué ecuación se estaba calculando; en SyntheSim los gráficos se resaltan en amarillo y pueden quedar en blanco o cortados, y el mensaje aparece en la barra de estado (texto exacto del mensaje: verificar).

Diagnóstico:
1. Leer **qué variable** y **en qué instante** falló.
2. Si el error es en `t = INITIAL TIME`: los gráficos estarán vacíos; use la herramienta *Table* con *Causes Tree*: las variables que nunca llegaron a calcularse aparecen como `--` (documentación "Errors at Time Zero"). Remonte las causas hasta encontrar el cero (el ejemplo de la documentación termina en una demanda de referencia igual a 0).
3. Si es a mitad de la simulación: grafique la variable y sus causas (*Causes Strip*) hasta el instante del error; busque stocks que se vuelven negativos o cero, o crecimiento explosivo.
4. Corrija la **causa** (stock negativo → control de primer orden; parámetro nulo → validar entradas) y sólo después proteja con `XIDZ`/`ZIDZ`/`MAX`.

Overflow por inestabilidad numérica: un bucle con constante de tiempo menor que dt produce oscilaciones crecientes con Euler (factor `1 - dt/τ` < −1). Reducir TIME STEP o revisar la constante.

PySD (comprobado): `x = 1/(Time - 5)` detiene la ejecución con `ZeroDivisionError: float division by zero` en t = 5; con `ZIDZ(1, Time - 5)` continúa.

### 3.4 `:NA:` inesperados

- `:NA:` es el valor especial de "dato ausente"; internamente es un número centinela muy negativo (≈ −1.298e33). Si aparece en gráficos como un valor enorme negativo o como huecos, alguna variable está tomando `:NA:`.
- Causas: series de datos con huecos leídas con `:RAW:`, datos que no cubren el horizonte de simulación, `GET XLS DATA` con celdas vacías, uso deliberado de `:NA:` en `IF THEN ELSE` que luego entra en cálculos.
- Solución: rellenar los datos (interpolación, `:HOLD BACKWARD:`/`:LOOK FORWARD:`), ampliar el rango de datos, o comprobar `x = :NA:` antes de usarlo (ver `04-lenguaje-de-ecuaciones.md` §5.10 y `07`). Ojo: PySD traduce `:NA:` a `NaN`, con semántica distinta en comparaciones.
- La documentación de Vensim advierte que los datos faltantes en variables *Data* usadas extensamente pueden provocar errores de coma flotante.

### 3.5 Errores de unidades

- *Units Check* (Ctrl+U) produce una ventana de texto con **errores** (inconsistencia dimensional) y **advertencias** (variables sin unidades; variables con dimensiones usadas como entrada de un lookup) (documentación "Units Check Output").
- Mensaje típico: **"Right hand and left hand units do not match."** Ejemplo de la documentación: `nails shipped = boxes shipped * nails per box` con unidades `Nails/Month` da `Nails*Boxes/(Month*Box)` porque `Boxes` y `Box` no se cancelan → declarar la equivalencia `Box, Boxes`.
- Estrategia: corregir el **primer** error y volver a comprobar (un problema dimensional genera varios mensajes en cascada).
- Los errores de unidades no impiden simular, pero suelen revelar errores de formulación (un tiempo usado como tasa, una fracción sin `/Year`).
- Tabla de errores frecuentes y reglas por función en `09-unidades-y-reality-check.md` §6–8.

### 3.6 Lookups fuera de rango

- Si la entrada de un lookup sale del rango de X definido, Vensim **mantiene el primer o último valor** y genera una advertencia que indica el instante y si la entrada quedó por encima o por debajo (documentación "Using Lookups", "LOOKUP EXTRAPOLATE"; texto exacto: verificar).
- Soluciones: (1) ampliar el eje X del lookup con valores extremos razonables (preferible: obliga a pensar qué pasa en condiciones extremas); (2) usar `LOOKUP EXTRAPOLATE(tabla, x)`, que extrapola linealmente y suprime la advertencia; (3) revisar por qué la entrada llega tan lejos (quizá un error de normalización o de unidades).
- La documentación menciona además opciones para suprimir estos avisos en archivos de cambios (`:LBELOW`/`:LABOVE`) **(verificar sintaxis y alcance)**.

### 3.7 Variables no usadas y no definidas

- **No usada**: Vensim señala variables definidas que no se usan en ninguna parte (no forman parte de ningún bucle). La documentación muestra el mensaje como `USE FLAG: "profit" is not used in the model` **(verificar formato exacto en su versión)**. No impide simular. Si la variable es un indicador de salida deliberado, márquela como **Supplementary** (casilla en el *Equation Editor*) para silenciar el aviso.
- **No definida** (*NOT DEFINED*): la variable se usa pero no tiene ecuación. Vensim la considera exógena y exige cargar un dataset con esa variable para simular. Causa más común: **errata en el nombre**: si aparecen a la vez `"profit" is not used` y `"profits" NOT DEFINED`, se ha usado `profit` en un sitio y `profits` en otro (ejemplo de la documentación "Not Defined").
- Si *Check Model* sólo informa *use flags* y variables *NOT DEFINED*, el modelo puede simularse (las no definidas requieren datos).

### 3.8 Nivel sin valor inicial / INTEG mal formulado

- `INTEG(flujo neto, valor inicial)` requiere **dos** argumentos y debe ir inmediatamente tras el `=`. En el *Equation Editor* de un *Level* la casilla *Initial Value* se resalta en rojo si falta (documentación de INTEG/"Writing Equations").
- Formas válidas: `L = INTEG(R * SUM(A[S1!]), 0.0)`, `L = INTEG(MAX(A, B), C)` (ejemplos de la documentación). Inválida: `L = 2 * INTEG(R, 0)`.
- Un stock cuyo valor inicial depende de sí mismo: §3.2.
- Síntoma relacionado: una variable dibujada como stock (caja) pero con ecuación de auxiliar o viceversa; Vensim informa un problema de tipo de variable **(verificar texto; documentación "Problems with Variable Types")**.

### 3.9 Errores de subíndices

Familia de errores más frecuente con arrays (documentación "Subscript Errors"; detalle en `06-subindices-y-arrays.md` §15):

| Error | Ejemplo | Solución |
|-------|---------|----------|
| Rango en el lado derecho que no aparece en el izquierdo | `total = poblacion[Region]` | Agregar: `total = SUM(poblacion[Region!])`, o subindicar el lado izquierdo, o elegir un elemento `poblacion[norte]` |
| Incompatibilidad de familia (número de subíndices) | `population[country]` en un sitio y `population[country,income]` en otro | Una variable debe usar siempre el mismo número de subíndices de las mismas familias |
| Familias distintas en la misma posición | `population[country,income]` y `population[country,region]` | Unificar o declarar mapeo/equivalencia |
| Rangos distintos del mismo tamaño que se espera emparejar por posición | `x[DimA] = y[DimB]` | Declarar mapeo `DimB: (...) -> DimA` o equivalencia `<->` |
| Elementos sin definir en ecuaciones por elemento | Falta `migracion neta[sur]` | Definir todos los elementos (o usar `:EXCEPT:`) |
| Lista de constantes con número de valores incorrecto | `fecundidad[Region] = 0.04` con 2 regiones y un solo valor | Dar un valor por elemento (`0.04, 0.025`) o un único valor sin lista si es común **(verificar si Vensim replica un valor único)** |

Los subíndices requieren Vensim Professional o DSS (no PLE/PLE Plus, según `01-productos-licencias-versiones.md`).

### 3.10 Datos externos: GET XLS / archivos no encontrados

- Si `GET XLS DATA` falla, abra el archivo en Excel primero (documentación "GET XLS... notes"). Los archivos descargados pueden requerir pulsar *Enable Editing* en Excel antes de que se puedan leer.
- Todos los argumentos deben ser literales entre comillas simples (`'datos.xlsx'`, `'Hoja1'`, `'A'`, `'B2'`) o variables de cadena.
- Use rutas relativas a la carpeta del modelo (si no se indica directorio, Vensim añade el del modelo).
- Excel no permite abrir a la vez dos archivos con el mismo nombre en carpetas distintas; Vensim avisa si encuentra abierta otra copia.
- `GET XLS ...` requiere Windows con Excel; `GET DIRECT ...` lee el archivo directamente (Windows y macOS). Ver `07-datos-lookups-import-export.md`.

### 3.11 Reality Check fallido

- Las restricciones (*Constraints*) tienen una condición y una consecuencia; al ejecutar *Reality Check*, Vensim fuerza la condición (activando las *Test Inputs*) y comprueba la consecuencia; si la condición se cumple y la consecuencia no, informa un fallo (documentación "Constraints").
- Sintaxis (detalle en `09` §11):

```vensim
inventario acotado :THE CONDITION: :IMPLIES: Inventario >= 0
sin trabajadores no hay produccion :THE CONDITION: Fuerza laboral = 0 :IMPLIES: produccion = 0
TI demanda cero :TEST INPUT: pedidos de clientes = RC STEP(pedidos de clientes, 0)
```

La documentación da el ejemplo de condición vacía `debt bounded :THE CONDITION: :IMPLIES: debt < 4E6`.
- Un fallo indica una formulación que viola el sentido común (p. ej. producción sin trabajadores, stock negativo). Corríjalo con las formulaciones de §2; no relaje la restricción sin justificación.

### 3.12 Problemas de licencia/edición

- Cada edición es un superconjunto de la anterior: PLE ⊂ PLE Plus ⊂ Professional ⊂ DSS (`01-productos-licencias-versiones.md`).
- Un modelo creado en Pro/DSS se puede abrir en PLE/PLE Plus, pero si usa características no incluidas (subíndices, macros, funciones sólo-DSS, conectividad con datos) la edición inferior no lo simulará o dará error al comprobarlo **(texto exacto y comportamiento: verificar)**.
- Soluciones: eliminar la característica (p. ej. desplegar un array pequeño en variables separadas), publicar el modelo para *Model Reader* (`.vpm`/`.vpmx`), o usar una edición superior.
- Ejemplo en esta base: `cadena_envejecimiento.mdl` (subíndices) requiere Professional/DSS; los otros seis modelos de `14-ejemplos-de-modelos.md` sólo usan funciones básicas.

### 3.13 Errores al cargar datasets `.vdf`

Posibles causas (texto exacto de los mensajes: verificar):
- El `.vdf` pertenece a otro modelo o a una versión anterior del modelo (variables renombradas): Vensim carga sólo las variables coincidentes.
- Diferencias de formato entre versiones (`.vdf` clásico frente a `.vdfx` de versiones recientes/64 bits; ver `12-formatos-de-archivo.md`).
- Archivo bloqueado por otro proceso (otra instancia de Vensim, sincronización en la nube) o en una carpeta sin permisos de escritura al simular con el mismo nombre de run.
- Solución general: volver a simular para regenerar el dataset; nombrar los runs; no versionar `.vdf`.

---

## 4. Metodología de depuración

### 4.1 Herramientas de Vensim y para qué sirven

| Herramienta | Uso en depuración |
|-------------|-------------------|
| *Check Model* (**Ctrl+T**) | Sintaxis, coherencia sketch-ecuaciones, variables no usadas/no definidas, ecuaciones simultáneas, errores de subíndices |
| *Units Check* (**Ctrl+U**) | Consistencia dimensional ("Units are A.O.K.") |
| *Causes Tree* / *Uses Tree* | Qué determina una variable / a qué afecta; encontrar el origen de un valor anómalo |
| *Loops* | Bucles que pasan por la variable; verificar que existe la realimentación prevista |
| *Causes Strip* | Gráficos de la variable y de sus causas directas en paralelo: seguir la causalidad en el tiempo (base del *Causal Tracing*) |
| *Graph* / *Table* | Comportamiento de una variable; *Table* imprescindible para errores en t = 0 (valores `--` = no calculado) |
| *Table Time Down* | Tabla con el tiempo en filas; detectar el instante exacto en que algo se descontrola y copiar a una hoja de cálculo |
| *Runs Compare* | Diferencias de parámetros/ecuaciones entre dos runs |
| *SyntheSim* | Re-simula en cada cambio de un deslizador: pruebas de condiciones extremas y de sensibilidad inmediatas |
| *Reality Check* | Pruebas automáticas de restricciones (§3.11) |
| *Document* | Listado completo para revisión por pares |

### 4.2 Proceso general

1. **Reproducir**: anotar el run, parámetros y el síntoma (variable, instante, valor).
2. **Localizar en el tiempo**: *Table Time Down* o gráficos con zoom; ¿desde t = 0 o a partir de un evento (STEP, umbral)?
3. **Localizar en la estructura**: *Causes Strip* sobre la variable anómala y recorrer hacia atrás hasta la primera causa anómala.
4. **Formular una hipótesis** (signo invertido, unidades, constante de tiempo, stock negativo, lookup fuera de rango).
5. **Probar con un cambio mínimo** en SyntheSim o con un run nuevo; comparar con *Runs Compare*.
6. **Corregir la causa**, documentar y volver a correr *Check Model*, *Units Check* y la batería de pruebas.

### 4.3 Pruebas estructurales rápidas

- **Prueba de equilibrio**: inicialice todo en equilibrio y simule sin perturbaciones; ninguna variable debe moverse. Si algo cambia, hay una inconsistencia en las condiciones iniciales o una fuga en la conservación. (Modelo 4 del doc 14: Inventario y Fuerza laboral constantes hasta t = 10.)
- **Conservación**: cree una variable de control `total = suma de stocks + acumulado de salidas − acumulado de entradas` y verifique que es constante (modelo 7: tareas totales = 1000.000 al final; modelo 2: S + I + R = 10 000).
- **Condiciones extremas** (SyntheSim): poner a 0 o a valores enormes la demanda, la productividad, la fuerza laboral, los tiempos de ajuste; los stocks no deben volverse negativos y los flujos deben tener sentido físico. Ejemplo real: en el modelo 4, `tiempo de ajuste de inventario = 4` y `retraso de contratacion = 6` producen Inventario −131.6 y Fuerza laboral −256.6 → falta control de primer orden en los despidos.
- **Respuesta a entradas de prueba**: `STEP`, `PULSE`, `RAMP` en las entradas exógenas; la respuesta debe ser explicable con los bucles del modelo.
- **Desactivación de bucles**: fijar un efecto en 1 (o una percepción en su valor inicial) para ver qué bucle genera cada parte del comportamiento.
- **Reducir TIME STEP a la mitad**: si cambian los resultados, el problema es numérico (§2.4).
- **Cambiar el método de integración** (Euler ↔ RK4): diferencias grandes indican dt grande o discontinuidades.

### 4.4 Aislar subsistemas

- Romper un bucle temporalmente sustituyendo la entrada de un subsistema por una constante o una serie exógena (`STEP`, datos) y verificar el subsistema por separado.
- Usar vistas separadas y variables sombra para que el aislamiento sea sólo un cambio de ecuación.
- Reconectar los subsistemas de uno en uno, repitiendo la prueba de equilibrio.

### 4.5 Errores en t = 0

Flujo de trabajo de la documentación ("Errors at Time Zero"): el error indica qué variable se calculaba; como no hay gráficos, seleccionar la variable, usar *Table* y luego *Causes Tree*/las tablas de sus causas; las variables con `--` nunca se calcularon; seguir hasta la constante o el dato causante (en el ejemplo de Vensim, una demanda de referencia igual a 0 que provoca una división por cero).

### 4.6 Pruebas automatizadas fuera de Vensim (PySD)

Para modelos sin funciones exclusivas de Vensim, PySD permite pruebas de regresión en Python (validado en este entorno con los siete modelos de `14-ejemplos-de-modelos.md`):

```python
import pysd
m = pysd.read_vensim("inventario_fuerza_laboral.mdl")
base = m.run()
assert abs(base["Inventario"].iloc[0] - 400) < 1e-9                          # equilibrio inicial
assert (base["Inventario"] >= 0).all()                                       # no negatividad
fino = pysd.read_vensim("inventario_fuerza_laboral.mdl").run(time_step=0.03125, saveper=0.0625)
assert (abs(fino["Fuerza laboral"] - base["Fuerza laboral"].reindex(fino.index)).max() < 1)   # error de integración acotado (observado: 0.28 Person)
extremo = m.run(params={"tiempo de ajuste de inventario": 4, "retraso de contratacion": 6})
print(extremo["Fuerza laboral"].min())                                       # -256.6: prueba extrema que falla
```

Precauciones observadas con PySD 3.14.3: cambiar el paso con `run(time_step=...)` (no con `params={"TIME STEP": ...}`); no regenerar y volver a traducir un `.mdl` del mismo nombre y tamaño en el mismo segundo (caché de bytecode); PySD no ejecuta *Reality Check* ni *Units Check* (el motor `simlin` sí comprueba unidades). Más en `11-automatizacion-scripts-dll-python.md`.

### 4.7 Errores frecuentes de formulación que no generan mensajes

| Síntoma | Causa probable |
|---------|----------------|
| Crecimiento o colapso inesperado | Signo invertido en un bucle B (se volvió R); brecha calculada al revés (`Stock - deseado`) |
| Stock que no se mueve | Flujo conectado al stock equivocado; constante de tiempo enorme; unidades de tiempo mal (años vs meses) |
| Oscilación de periodo 2·dt | dt demasiado grande respecto de una constante de tiempo |
| Resultados que cambian con el método de integración | Discontinuidades (`IF THEN ELSE`, `PULSE`) con RK |
| Doble conteo | El mismo flujo restado de dos stocks o sumado a dos |
| Fuga de conservación | `MAX(0, Stock)` usado en lugar de control de primer orden; flujos entre stocks con ecuaciones distintas a cada lado |
| Retraso aparente "instantáneo" | `DELAY FIXED` con retraso < dt; `SMOOTH` con tiempo ≈ dt |

---

## 5. Lista de verificación antes de entregar un modelo

**Propósito y frontera**
- [ ] El problema, el horizonte temporal y los modos de referencia están documentados (comentario de grupo o vista de introducción).
- [ ] Diagrama de frontera: variables endógenas, exógenas y excluidas justificadas.

**Estructura y ecuaciones**
- [ ] *Check Model* sin errores; *use flags* revisados (indicadores marcados como *Supplementary*).
- [ ] Ninguna variable *NOT DEFINED* salvo datos cargados a propósito.
- [ ] Sin números mágicos: toda constante tiene nombre, unidades, comentario y rango.
- [ ] Lookups normalizados (pasan por (1,1)), con eje X que cubre el rango visitado y sin advertencias de fuera de rango.
- [ ] Stocks físicos protegidos con control de primer orden; divisiones con `XIDZ`/`ZIDZ`.
- [ ] Sin `IF THEN ELSE` discontinuos salvo interruptores de escenario justificados.
- [ ] Conservación verificada en cadenas de stocks.
- [ ] Bucles principales identificados (R/B) con nombre en el diagrama y polaridades correctas.

**Unidades y numérica**
- [ ] *Units Check*: "Units are A.O.K." (y revisado con *strictest testing* si procede).
- [ ] TIME STEP potencia de 2, ≤ 1/4 de la constante de tiempo más corta; resultados estables con dt/2.
- [ ] SAVEPER múltiplo de TIME STEP; método de integración justificado (Euler si hay discontinuidades).

**Pruebas de comportamiento**
- [ ] Prueba de equilibrio superada.
- [ ] Condiciones extremas (SyntheSim / Reality Check) sin stocks negativos ni comportamientos absurdos.
- [ ] Reproduce los modos de referencia (y datos, si los hay) con parámetros plausibles.
- [ ] Análisis de sensibilidad de los parámetros inciertos; las conclusiones de política son robustas.

**Presentación y entrega**
- [ ] Vistas por subsistema, diagrama legible, leyenda de colores, variables sombra donde evitan cruces.
- [ ] Comentarios completos (fuentes de datos y supuestos).
- [ ] Datos separados de la estructura (`.cin`, hojas de cálculo, datasets) y rutas relativas.
- [ ] Edición de Vensim requerida indicada (p. ej. subíndices → Professional/DSS) o modelo publicado para *Model Reader*.
- [ ] `.mdl` (texto) versionado, con etiqueta de versión; sin `.vdf` en el repositorio.
- [ ] Runs de referencia nombrados y reproducibles (lista de `.cin`/comandos).

---

## 6. Fuentes

- Documentación de Vensim (consultada mediante extractos de búsqueda; vensim.com no era accesible directamente): "Simulation Error Messages" (`ref_sim_errors.html`), "Model Errors" (`ref11_model_errors.html`), "Errors at Time Zero" (`20505.html`), "Preventing Division by Zero" (`20530.html`), XIDZ (`fn_xidz.html`), ZIDZ (`fn_zidz.html`), "Simultaneous Equations" (`simultaneousequations.html`), "Iterative Solutions to Active Simultaneous Equations" (`simultaneousiterative.html`), "Legacy: Semantic Errors and Messages" (`23140.html`), "Legacy: Syntax Errors" (`23135.html`), "Usage Messages" (`22230.html`), "Not Defined" (`22235.html`), "Subscript Errors" (`22220.html`), "Units Check Output" (`22270.html`), "Correcting Units Errors" (`22285.html`), "Checking for Model Syntax and Units Errors" (`20405.html`), "Using Lookups" (`22820.html`), LOOKUP EXTRAPOLATE (`fn_lookup_extrapolate.html`), ACTIVE INITIAL (`fn_active_initial.html`), INTEG (`fn_integ.html`), "Problems with Variable Types" (`22215.html`), DELAY FIXED (`fn_delay_fixed.html`), TIME STEP (`ref_time_step.html`), "Euler Integration" (`euler.html`), "Constraints" (`20970.html`), "GET XLS... notes" (`fn_get_xls____notes.html`), ARCSIN/ARCCOS (`fn_arcsin.html`, `fn_arccos.html`).
- Sterman, J. D. (2000). *Business Dynamics*. Irwin/McGraw-Hill: cap. 13 (formulación: control de primer orden, robustez), cap. 21 (pruebas de validación), apéndice sobre integración numérica.
- Experimentos propios con PySD 3.14.3 (ecuaciones simultáneas, inicialización circular, stock negativo vs control de primer orden, división por cero) y con los modelos de `examples/`.
- Documentos hermanos de esta base: `01`, `04`, `05`, `06`, `07`, `08`, `09`, `11`, `12`, `14`.
