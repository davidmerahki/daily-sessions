# Interfaz de Vensim: sketch, herramientas y flujo de trabajo

Guía práctica de la interfaz gráfica de Vensim (versiones 9.x–10.5): la ventana principal, las herramientas de dibujo, los diagramas causales y de stocks y flujos, las vistas, las herramientas de análisis, el Control Panel, los modos de simulación desde la UI, el editor de ecuaciones y los ajustes del modelo. El detalle de ecuaciones, funciones, optimización y sensibilidad está en otros archivos de esta base. Lo marcado como **(verificar)** es plausible pero no quedó confirmado en la documentación consultada.

## Tabla de contenidos
1. [Anatomía de la ventana (Workbench)](#1-anatomía-de-la-ventana-workbench)
2. [Menús](#2-menús)
3. [Barras de herramientas y Status bar](#3-barras-de-herramientas-y-status-bar)
4. [Herramientas de sketch, una por una](#4-herramientas-de-sketch-una-por-una)
5. [Atajos de teclado](#5-atajos-de-teclado)
6. [Diagramas causales (CLD) y diagramas de stocks y flujos](#6-diagramas-causales-cld-y-diagramas-de-stocks-y-flujos)
7. [Vistas, navegación, formato y ocultación](#7-vistas-navegación-formato-y-ocultación)
8. [Herramientas de análisis y Workbench Variable](#8-herramientas-de-análisis-y-workbench-variable)
9. [Control Panel](#9-control-panel)
10. [Simular desde la interfaz](#10-simular-desde-la-interfaz)
11. [Editor de ecuaciones, editor de texto y comprobaciones](#11-editor-de-ecuaciones-editor-de-texto-y-comprobaciones)
12. [Model > Settings y Tools > Options](#12-model--settings-y-tools--options)
13. [Cómo se guarda el sketch en el `.mdl`](#13-cómo-se-guarda-el-sketch-en-el-mdl)
14. [Flujos de trabajo y consejos de productividad](#14-flujos-de-trabajo-y-consejos-de-productividad)
15. [Fuentes](#fuentes)

---

## 1. Anatomía de la ventana (Workbench)

La ventana principal de Vensim se llama **Workbench**. Con un modelo abierto contiene, de arriba abajo:

| Elemento | Ubicación | Función |
|---|---|---|
| **Title Bar** | Arriba | Muestra el **modelo cargado** y la **Workbench Variable** actual. |
| **Menu** | Bajo el título | Menús contextuales: los comandos se aplican a la ventana activa. |
| **Main Toolbar** | Bajo el menú | Atajos a comandos del menú: abrir, guardar, simular, SyntheSim, configurar simulación, nombre de la run, etc. |
| **Sketch Tools** (Sketch toolbar) | Arriba de la ventana de construcción (*Build Window*), bajo la Main Toolbar | Solo en el **Sketch Editor**. Sirven para construir y editar el diagrama. |
| **Analysis Tools** (Analysis toolbar) | Normalmente a la **izquierda** | Analizan la estructura y el comportamiento de la **Workbench Variable**. |
| **Status Bar** | Abajo | Estado actual y atajos de formato (fuente, color, negrita, cursiva, forma, estilo y color de flecha) para los objetos seleccionados. |
| **Build Windows** | Área central | Ventanas de sketch (una por modelo, con varias **views**) o de texto. |
| **Output Windows** | Flotantes | Salidas de las herramientas de análisis: gráficos, tablas, árboles, listados de bucles. |
| **Control Panel** | Diálogo | Variable, eje de tiempo, escalado, datasets y gráficos personalizados (sección 9). |

Notas de versiones recientes:
- **9.0**: nuevo aspecto visual del sketch (*Tools > Switch to new sketch*) y nuevas herramientas de búsqueda, incluida la búsqueda de vistas.
- **8.0/9.2**: hay un **panel de navegación** redimensionable y un **Project explorer** para copiar, borrar y renombrar archivos del proyecto (ubicación exacta: verificar).
- **10.3**: **Presentation mode**. Al abrir un modelo en este modo se ocultan las barras y se desactivan la mayoría de menús.
- **10.4**: **menú contextual** con clic derecho sobre el sketch.
- **10.4/10.5**: **Diagram only mode** en PLE+ (*View > Diagram only mode*). Oculta todas las herramientas de simulación, para quien solo dibuja diagramas.

---

## 2. Menús

Según la ayuda, la barra de menús clásica tiene estos menús. El contenido varía con la edición: PLE tiene menús simplificados.

| Menú | Contenido principal |
|---|---|
| **File** | New Model, Open Model (texto `.mdl` o binario `.vmf`), Save, Save As, Print, publicación de modelos, salir. **New Model** abre directamente el diálogo de *Model Settings* con los límites de tiempo (verificar en 10.x). |
| **Edit** | Copy/Paste de partes del modelo, Select All, **búsqueda de variables** (Ctrl+F). Desde 10.2 también busca **dentro de las ecuaciones**. |
| **View** | Apariencia del sketch: zoom, **Show Hidden** / nivel de ocultación, gestión de vistas (*View > New*…). **Vista del modelo como texto**, solo en Professional y DSS. *Diagram only mode* en PLE+ desde 10.4. |
| **Insert** | Inserción de objetos en el sketch (página "The Insert Menu" de la ayuda). Contenido exacto: verificar. |
| **Layout** | Alineación y espaciado de los objetos seleccionados (ver sección 7). |
| **Model** | **Settings** (Model Settings), **Check Model**, **Units Check**, importar y exportar **datasets**. En PLE y PLE Plus también tiene Simulate, Start SyntheSim, Run Game, Sensitivity y Reality Check. |
| **Simulation** | Las notas de 9.0 citan el ítem **Simulation > Simulation control**, que entra en el modo *Simulation setup*. Se presume un menú Simulation en la interfaz nueva (verificar su composición). |
| **Tools** | **Options** (opciones globales), edición de **toolsets** de análisis y de sketch (*Toolset Editor*), **Language** (10.2.2), *Switch to new sketch* (9.0). |
| **Window(s)** | Cambiar entre ventanas abiertas: sketch, outputs, Control Panel. El nombre exacto es "Window" o "Windows" según la versión (verificar). |
| **Help** | Ayuda online (vensim.com/documentation), información de versión y registro. |

Clic derecho:
- En **10.4+** abre un **menú contextual** en el sketch.
- Sobre un objeto, desde siempre, abre su **diálogo de opciones**: forma, fuente y color de variables; polaridad, delay mark y color de flechas.
- En Mac se usa **Ctrl+Click** si no hay botón derecho.

---

## 3. Barras de herramientas y Status bar

### Main Toolbar
Los botones confirmados en la documentación son:
- **Simulate** (icono de "corredor"): ejecuta el modelo con la última configuración usada. Atajo **Ctrl+R**.
- **SyntheSim**: entra en modo de simulación automática con sliders (ver sección 10).
- **Set Up a Simulation** / **Sim Control**: entra en el modo **Simulation setup** (**Ctrl+E**), con acceso a todos los parámetros de *Simulation Control* y el sketch activo para cambiar constantes y lookups.
- **Run name**: cuadro editable con el nombre del dataset que se generará (por defecto `Current`). Si ya existe, Vensim pregunta si se sobrescribe.
- **Game** y **Reality**: inician una simulación de juego y un Reality Check.
- Otros botones habituales: New, Open, Save, Print, Cut, Copy, Paste, Stop, **Build Windows / Output Windows** (alternar el tipo de ventana visible), **Control Panel**, **Search Model** (Ctrl+F). El orden exacto depende de la versión (verificar).
- En **modo Simulation setup**, el botón de más a la izquierda **alterna el método de integración**: Euler → RK4 → Difference → RK2F → RK2 → RK4F.

### Status Bar (formato rápido)
Se seleccionan objetos con *Move/Size* y se hace clic en la Status Bar para:
- cambiar **color de fuente**, **negrita** e **cursiva**;
- cambiar la **forma** del objeto (caja, sin forma, círculo…);
- cambiar el **estilo de flecha** y el **color de flecha**.

Para fuente y tamaño se usa el diálogo **Font Selection**. En flechas de línea perpendicular (las tuberías de flujo) también se elige la separación entre líneas.

La parte inferior de la ventana de sketch tiene una zona (*Bottom Toolbar*) con el **selector de vistas** (verificar ubicación exacta en 10.x).

---

## 4. Herramientas de sketch, una por una

El **Sketch toolset** por defecto, según la Reference Guide ("Sketch Tools"), contiene herramientas de las clases *Pointer, Variable, Arrow, Rate, Existing Variable, Merge, Sketch Comment, Input Output Object, Magic Wand, Delete* y *Equations*.

| Herramienta | Nombre en Vensim | Qué hace | Cómo se usa |
|---|---|---|---|
| Candado | **Lock** (Lock Pointer) | El sketch queda bloqueado: se puede **seleccionar** objetos y fijar la **Workbench Variable**, pero no mover. Los **output objects** (gráficos y tablas en el sketch) están activos con esta herramienta. | **Esc** o tecla **1**. Herramienta segura para analizar sin estropear la disposición. |
| Puntero | **Move/Size** (Movement Pointer) | Mueve, redimensiona y selecciona variables, flechas, comentarios. Arrastrando el **asa** (círculo) de una flecha se cambia su curvatura. | Arrastrar para seleccionar en rectángulo; Ctrl/Shift+clic para seleccionar varios (verificar). |
| Variable | **Variable** (Auxiliary/Constant) | Crea variables **sin caja**: auxiliares, constantes, datos, lookups. El tipo lo da la **ecuación**, no la herramienta. | Clic en zona vacía, escribir el nombre, Enter. Teclas **V** o **A**. |
| Nivel | **Box Variable** / **Level** (Stock) | Crea variables con **forma de caja**: los Levels (stocks, variables de estado). | Tecla **S** (orden por defecto). |
| Flecha | **Arrow** (Cause Arrow) | Crea **flechas causales** rectas o curvas entre variables. | Clic en la causa y clic en el efecto. Un clic intermedio en zona vacía crea un arco (verificar). Tecla **C**. |
| Flujo | **Rate** (Flow) | Crea un **flujo completo**: variable de tasa, **válvula**, tubería de doble línea y, si hace falta, **nubes** (fuente o sumidero). | Clic en el origen (un stock, o una zona vacía que crea una nube) y clic en el destino. Escribir el nombre de la tasa. Tecla **F**. Codos en ángulo recto: Shift o clics intermedios (verificar). |
| Variable existente | **Model Variable** | Añade a la vista una variable que **ya existe** en el modelo. | Clic, elegir la variable de la lista. |
| Sombra | **Shadow Variable** | Añade una variable existente como **sombra**, **sin sus causas**. Se muestra entre `< >` y en **gris**, p. ej. `<Time>`. Clic sobre una variable normal → ofrece convertirla en sombra y elimina sus causas en esa vista si no se usan en otro sitio. | Para traer `Time`, constantes globales o variables de otra vista sin duplicar estructura. |
| Fusionar | **Merge** | Fusiona dos variables distintas en una. | Arrastrar una sobre otra (verificar los detalles, p. ej. con nubes). |
| E/S | **Input Output Object** | Añade **sliders** de entrada (para constantes y variables de juego) y **gráficos o tablas** de salida al sketch. Los *input objects* funcionan en simulation setup, gaming y SyntheSim. Los *output objects* se refrescan al terminar cada simulación. | Clic en una zona vacía (no sobre una palabra o flecha). Disponible desde **PLE Plus**. |
| Comentario | **Sketch Comment** | Añade texto, formas, **imágenes** e identificadores de bucle (formas *Loop Clockwise* / *Loop Counterclockwise*). Desde 10.4 se pueden adjuntar a flechas y tienen transparencia. | Clic, escribir el texto y elegir la forma en el diálogo. |
| Mostrar | **Unhide Wand** (Unhide Magic Wand) | Revela palabras y flechas ocultas. | Ver la sección 7, Ocultación. |
| Ocultar | **Hide Wand** (Hide Magic Wand) | Oculta palabras (y sus flechas) o flechas sueltas (clic en la **punta** de la flecha). | Útil para revelar un diagrama por etapas. |
| Borrar | **Delete** | Borra estructura: variables **del modelo**, flechas y comentarios. | Cuidado: no borra solo de la vista, sino del modelo (verificar si hay variantes según el caso). |
| Ecuaciones | **Equations** | Abre el **Equation Editor** de la variable clicada. Al activarla se **resaltan** las variables sin ecuación (verificar el estilo de resaltado). | Recorrer el diagrama completando las ecuaciones pendientes. |
| Modo de referencia | **Reference Mode** | Dibuja **modos de referencia** (comportamiento esperado o histórico) sobre el diagrama para cualquier variable dinámica. Disponible desde Vensim 5.2. | Fase de conceptualización y ejercicios de integración mental. |

Notas:
- Los toolsets son **configurables** (*Tools* → Toolset Editor, "Modifying Sketch Tools"). En **PLE** el toolset es fijo. En **PLE+** desde 10.4/10.5 se pueden editar los **toolsets de análisis**.
- Las teclas numéricas activan las herramientas **por posición** en la barra, que depende de la configuración. Ver la sección 5.

---

## 5. Atajos de teclado

Fuente: "Keyboard Shortcuts" y "General Navigation" de la ayuda. En macOS el modificador puede ser Cmd en lugar de Ctrl (verificar).

### Comunes
| Atajo | Acción |
|---|---|
| **Ctrl+R** | Simular (Run) |
| **Ctrl+E** | Entrar en **Simulation setup** |
| **Ctrl+F** | Buscar variable para editar (equivale al botón *Search Model*) |
| **Ctrl+S** | Guardar |
| **Ctrl+O** | Abrir modelo |
| **Ctrl+T** | **Check Model** (en ventanas de sketch o de texto) |
| **Ctrl+Tab** | Pasar entre ventanas de la misma clase |
| **Ctrl+Shift+Tab** | Pasar entre clases de ventana (build ↔ output…) |

### Sketch
| Atajo | Acción |
|---|---|
| **1 2 3 4 5 6 7 8 9 0 Q W E R T Y** | Activan las herramientas de sketch **en orden de la barra** (1 = Lock en el orden por defecto) |
| **Esc** | Herramienta **Lock** |
| **S** | Box Variable / Level (stock) |
| **F** | Rate / Flow |
| **A** o **V** | Variable auxiliar |
| **C** | Cause Arrow |
| **+ − S O U ? N** (justo después de dibujar una flecha) | Asignar **polaridad**. `+` o `S` = mismo sentido; `−` o `O` = sentido opuesto. `U` y `?` indican polaridad desconocida o ambigua (verificar) y `N` parece "ninguna" (verificar). |
| **Page Up / Page Down** | Vista anterior / siguiente. Con Shift o Ctrl desplazan izquierda/derecha dentro de la vista. |
| **H** | Alternar entre mostrar **todo** lo oculto y **nada** |
| **Home / End** | Disminuir o aumentar la **profundidad de ocultación** visible. Pulsar End repetidamente revela la estructura paso a paso. |
| **↑ / ↓** | Cambiar el nivel de ocultación (según "Hiding Sketch Elements") |
| **Ctrl+H** | Ocultar al nivel actual, según las notas de la versión 4 (verificar en 10.x) |

---

## 6. Diagramas causales (CLD) y diagramas de stocks y flujos

### Diagrama causal (Causal Loop Diagram)
1. Con la herramienta **Variable**, escribir los conceptos como **palabras sin caja**.
2. Con **Arrow**, unir causa → efecto. Una flecha curva se consigue arrastrando el **asa** (círculo central) con Move/Size.
3. **Polaridad**: tecla inmediatamente después de dibujar la flecha (`+`/`−`, `S`/`O`), o clic derecho en el asa o en la base de la punta → **Arrow Options**, campo de polaridad. Desde 9.0 hay cambio rápido de polaridad.
4. **Retrasos**: en Arrow Options, marcar **Delay Mark**. Se dibuja una **doble línea perpendicular** en el asa de la flecha (convención `||`). Desde 10.4 las marcas de retraso se pueden exportar.
5. **Identificadores de bucle**: **Sketch Comment** con forma **Loop Clockwise** o **Loop Counterclockwise** y texto **R**/**B** (o R1, B2…). La forma dibuja una flecha circular alrededor del texto. Es habitual usar color distinto según el sentido de giro y negrita.
6. Desde 10.4 las flechas admiten **comentarios** y sketch comments adjuntos.
7. Los CLD **no son simulables** sin ecuaciones. Sirven para conceptualizar. *Diagram only mode* (PLE+) evita que aparezcan las herramientas de simulación.

### Diagrama de stocks y flujos
| Elemento | Herramienta | Representación |
|---|---|---|
| **Level / Stock** | Box Variable | Rectángulo. Su ecuación es `INTEG(flujos, inicial)`. |
| **Rate / Flow** | Rate | Tubería (doble línea) con **válvula** y nombre de la tasa. **Nubes** en los extremos sin stock. |
| **Auxiliary / Constant / Data / Lookup** | Variable | Palabra sin caja. |
| **Shadow** | Shadow Variable | `<Nombre>` en gris. |
| **Information link** | Arrow | Flecha simple. Las flechas que entran a un Level solo tienen sentido como **causas iniciales**. Si se muestran o no lo decide *Model Settings* ("whether initial causes will be shown in sketches"). |

```vensim
Population = INTEG(births - deaths, initial population)
	~	Person
	~	Stock dibujado con Box Variable.
	|
births = Population * birth rate
	~	Person/Year
	~	Rate (válvula) creado con la herramienta Rate.
	|
```

Buenas prácticas de sketch:
- Los flujos entran y salen por la izquierda y la derecha de los stocks.
- Las flechas de información no cruzan tuberías si se puede evitar.
- `TIME STEP` y `Time` se traen como **sombras** cuando hacen falta.
- Una vista por sector del modelo.

---

## 7. Vistas, navegación, formato y ocultación

### Vistas (views)
- Un modelo puede tener **varias vistas**: PLE Plus, Pro y DSS (en PLE, verificar). Cada una es una página del sketch y en el `.mdl` aparece como `*Nombre de vista`.
- **Navegación**: Page Up y Page Down, o el selector de vistas de la parte inferior.
- **Nueva vista**: *View > New*.
- **Duplicar una vista como imagen**: Select All → Copy → nueva vista → Paste eligiendo **Picture**.
- Las variables definidas en una vista se usan en otras como **shadow variables**.
- **Zoom**: *View* → zoom. Se recuerda por vista y entre sesiones, y no cambia el sketch real.
- **Búsqueda**: Ctrl+F y las herramientas de búsqueda de 9.0, incluida la búsqueda de vistas, que localizan dónde aparece una variable.

### Formato
- **Por objeto**: clic derecho → diálogo de opciones (forma, fuente, color, posición del texto), o Status Bar para cambios rápidos.
- **Por defecto**: *Sketch Defaults* / *Sketch Options* fijan fuentes, colores y formas por defecto. Desde 9.2 se pueden aplicar a **todas las vistas**.
- **Flechas**: color, grosor, curva, polaridad, delay mark y ocultación en *Arrow Options*.
- **Unidades en el sketch** (9.2) y **tooltips** con subíndices y valores de constantes (10.1, *Model > Settings > Sketch*).
- **Exportar**: el sketch se exporta a **SVG** desde 9.2. Copy/paste como imagen a otras aplicaciones.

### Menú Layout
Opera sobre la selección. *LastSel* es el último objeto seleccionado, que sirve de referencia.

| Comando | Efecto |
|---|---|
| **Center on LastSel** | Mismo centro horizontal que LastSel |
| **Left Align on LastSel** / **Right Align on LastSel** | Alinear a izquierda o derecha |
| **Vertical on LastSel** | Alinear el centro vertical |
| **Horizontal Spacing** / **Vertical Spacing** | Espaciar uniformemente |

### Ocultación (hide levels)
- **Hide Wand**:
  - clic en una palabra → la oculta **junto con sus flechas**;
  - clic en la **punta** de una flecha → oculta la flecha.
- Hay varios **niveles de ocultación**. La ayuda actual habla de niveles 1–9 ("10 levels: Unhidden + 1–9") y también de 1–16, según la página (verificar). Las notas de la versión 4 hablaban de 8.
- **Mostrar**:
  - *View > Show Hidden* → None / Depth 1 / … / All;
  - teclas **H** (todo o nada) y **Home/End** (bajar o subir profundidad).
- **Des-ocultar**: primero hay que hacer visible el nivel (End o *View > Hidden Elements*) y luego usar **Unhide Wand**.
- Uso típico: **contar la historia del modelo por capas** en una presentación, pulsando End sucesivamente.
- En el `.mdl`, el nivel de ocultación se guarda en cada línea de variable del sketch (ver sección 13).

---

## 8. Herramientas de análisis y Workbench Variable

### Workbench Variable
- Es la variable "de trabajo" sobre la que actúan las herramientas de análisis. Aparece en la **barra de título**.
- **Cómo fijarla**:
  - clic sobre la variable en el sketch (con Lock o Move/Size);
  - pestaña **Variable** del Control Panel;
  - búsqueda Ctrl+F;
  - clic en una variable dentro de un árbol o de una salida (verificar).
- Desde 9.2 las herramientas pueden ser **sticky**: se ejecutan automáticamente al hacer clic en una variable.

### Herramientas estructurales (no necesitan simulación)
| Herramienta | Salida |
|---|---|
| **Causes Tree** | Árbol de la variable, sus causas y las causas de estas. En PLE la profundidad se configura desde 10.1 (*Tools > Options*, "Causes/uses tree depth"). |
| **Uses Tree** | Árbol de las variables que **usan** la variable, recursivamente. |
| **Loops** | Lista de **bucles de realimentación** que pasan por la variable, con su longitud. Desde 10.2 **resalta el bucle en el sketch**. Clic derecho → **SILS** (Shortest Independent Loop Set, 10.2.2, todas las ediciones). |
| **Document** | Ecuación, unidades y comentario de la variable. Rediseñado en 10.4/10.5. Informa valores en *Special time*. |
| **Causal Table** (10.1) | Visualización tabular de las relaciones causales. Exportable desde 10.4. |
| **Causal Chain** (10.2) | Rutas entre **dos variables**, resaltadas en el sketch. |

### Herramientas de datasets (necesitan runs cargadas)
| Herramienta | Salida |
|---|---|
| **Causes Strip** | Tira de gráficos de la variable y sus **causas directas**. Es la base del **Causal Tracing®**. |
| **Graph** | Gráfico temporal con una línea por **run cargada** (y por elemento de subíndice si se seleccionan varios). Usa Start/End time del Control Panel. |
| **Table** | Valores en tabla, con el tiempo en horizontal. Configurable para mostrar causas o usos. |
| **Table Time Down** | Tabla con el tiempo en filas, cómoda para copiar a una hoja de cálculo. |
| **Runs Compare** | Diferencias de constantes y lookups **entre dos runs** cargadas. Responde a "¿qué cambié?". |
| **Bar Graph** | Valores en *Special time* (útil con subíndices). |
| **Statistics** | Estadísticos de la variable por run (verificar el nombre exacto). |
| **Gantt Chart** | Mencionada por la ayuda del Time Axis. |
| **Sensitivity Graph** | Bandas de confianza tras una simulación de sensibilidad (verificar el nombre exacto). |

- Las salidas se abren en **Output Windows**: se pueden copiar, guardar y enviar a impresora.
- Los **toolsets de análisis** son editables en Pro/DSS (y en PLE+ desde 10.4/10.5): por ejemplo, profundidad de árboles o qué causas mostrar en tablas.
- **Custom graphs** y **custom tables**: se definen en el Control Panel (pestaña Graphs). Desde 10.2 tienen editores nuevos y se pueden **arrastrar al sketch**.

---

## 9. Control Panel

Tiene **5 pestañas**:

| Pestaña | Uso |
|---|---|
| **Variable** | Elegir la Workbench Variable de una lista, con filtros (verificar). |
| **Time Axis** | Rango del eje de tiempo: **Start time** y **End time** los usan Graph, Strip Graph y Gantt. **Special time** lo usan Table, Bar Graph y Document. |
| **Scaling** | Control del escalado automático y del número de divisiones de los gráficos. |
| **Datasets** | **Cargar, descargar y borrar** runs (`.vdf`/`.vdfx`). Las herramientas de análisis trabajan sobre las runs cargadas, y el **orden** importa (la primera es la referencia). Desde 10.2 admite drag & drop. |
| **Graphs** | **Custom graphs**: New, Modify, Display. Se pueden mostrar varios a la vez seleccionándolos. Desde 10.2 hay un editor nuevo y se pueden arrastrar al sketch. |

---

## 10. Simular desde la interfaz

Esta sección solo cubre la interfaz. El detalle técnico de cada modo está en los archivos de simulación, sensibilidad y optimización de esta base.

| Modo | Cómo se lanza | Qué ocurre |
|---|---|---|
| **Simulate** | Botón Simulate o **Ctrl+R** | Corre con la configuración actual y guarda el dataset con el **Run name** del toolbar. |
| **Simulation setup** | Botón *Set Up a Simulation* / *Sim Control*, **Ctrl+E**, o *Simulation > Simulation control* (9.0+) | Las **constantes** quedan editables en el sketch (clic para cambiar el valor) y los **lookups** editables. Se puede cambiar de vista, pero no modificar estructura. Da acceso al diálogo **Simulation Control**: simulación normal, gaming, Reality Check, optimización, sensibilidad y, desde 9.2, panel de **Kalman**. |
| **SyntheSim** | Botón SyntheSim | **Simula en cada cambio**: aparece un **slider** junto a cada constante y mini-gráficos de comportamiento sobre las variables. Los lookups se editan gráficamente. El rango del slider sale de los campos *Min/Max/Increment* de la ecuación, `~ unidades [min,max,paso]`. Desde 7.0 admite sensibilidad interactiva. Desde 10.0 se puede guardar todos los cambios o solo los de sliders. |
| **Gaming** | Botón *Game* / *Run Game* | Avanza por intervalos discretos y en cada paso se pueden cambiar las variables de decisión (`GAME`). Los sliders de *Input Output Objects* sirven de controles. |
| **Sensitivity** | Simulation Control → Sensitivity (asistente) | Monte Carlo sobre parámetros con distribuciones. El resultado se ve con gráficos de **bandas de confianza**. Disponible desde PLE Plus. |
| **Sensitivity2All** | Vensim 10+ (ubicación en menú: verificar) | Resumen automático de la influencia de **todas** las constantes sobre una variable de interés. |
| **Optimize** | Simulation Control → Optimization (Pro/DSS) | **Calibración** (ajustar constantes a datos) u **optimización de políticas** (maximizar o minimizar un payoff). |
| **Reality Check®** | Botón *Reality* / Model o Simulation menu | Evalúa **restricciones** con **test inputs** definidas en ecuaciones de Reality Check. |
| **Run configuration tool** | DSS 9.4+ | Define y ejecuta varios escenarios predefinidos. |

- Tras simular, la nueva run se **carga automáticamente** y las herramientas de análisis la muestran junto con las demás runs cargadas.
- Para comparar escenarios basta con cambiar el *Run name* antes de simular. Luego se usan **Graph** y **Runs Compare**.

---

## 11. Editor de ecuaciones, editor de texto y comprobaciones

### Equation Editor
Se abre con la herramienta **Equations** (clic sobre la variable). Desde 10.4 el doble clic es configurable en *Tools > Options*. Campos y elementos típicos:
- **Nombre** de la variable y **Type**: Auxiliary, Constant, Level, Data, Lookup…, con subtipos (p. ej. "with Lookup").
- **Equation**: expresión. Para Levels el editor separa la expresión del **valor inicial** (verificar en el editor nuevo).
- **Units**: campo de unidades, con rango opcional `[min,max,increment]` para sliders.
- **Comment**: documentación de la variable. Aparece en el Document tool y en los tooltips.
- **Group**: grupo de la variable. En PLE disponible desde 10.3.
- Paneles de **variables** (causas disponibles, es decir, las conectadas con flechas en el sketch), **funciones** y **subíndices**; teclado numérico y botones de operadores.
- Botones de **comprobación de sintaxis** y del modelo. Ante un error, el editor coloca el cursor en el punto problemático.

**Editor rediseñado en 10.3**:
- Diálogo más grande. Funciones, variables y subíndices se ven **sin pestañas**.
- Sección **Edit a Different Variable**, con filtros por Causes, Uses, tipo, Range y grupo.
- **Change Font** para resaltar partes de la ecuación con color, tamaño o estilo.
- **Editor antiguo**, temporalmente: clic derecho sobre el botón del editor → **Use legacy editor**, o *Tools > Options > General* → **Use legacy equation editor**.

Regla práctica:
- Si una variable usada en la ecuación **no está conectada con flecha**, Check Model avisa de inconsistencia entre sketch y ecuación.
- Si hay una flecha que la ecuación no usa, también avisa.
- Hay que dibujar la flecha o cambiar la ecuación.

### Editor de texto del modelo
- **View → como texto** (Professional y DSS). Muestra el `.mdl` completo: ecuaciones, unidades y comentarios separados por `~` y `|`.
- Útil para ediciones masivas: renombrar con buscar/reemplazar, pegar bloques de ecuaciones, revisar subíndices.
- **Ctrl+T** comprueba el modelo dentro del editor de texto.
- Vensim mantiene archivos de **backup/history** del texto (página "Backup and History Files").
- Al volver al sketch, las variables nuevas creadas en texto no tienen posición en el diagrama. Se añaden con **Model Variable** o con la construcción de sketch desde el modelo ("Building Sketches from Models").

### Comprobaciones
- **Check Model** (Ctrl+T): sintaxis, variables sin definir, coherencia entre sketch y ecuaciones. Desde 9.3 los errores aparecen en un **panel de errores de sintaxis**; con doble clic se navega al elemento.
- **Units Check** (*Model > Units Check*): coherencia dimensional. Usa los sinónimos de *Units Equiv*.
- **Corrector ortográfico** del sketch y los comentarios, mejorado en 9.2.

---

## 12. Model > Settings y Tools > Options

### Model > Settings (Model Settings dialog)
Diálogo con pestañas:

| Pestaña | Contenido |
|---|---|
| **Time Bounds** (en versiones nuevas, *Time Bounds and Dates*) | **INITIAL TIME**, **FINAL TIME**, **TIME STEP**, **SAVEPER** y **Units for Time**, con lista de unidades comunes o texto libre. Todos los campos numéricos se miden en esa unidad. Las versiones recientes admiten **formato de fecha** en el eje de tiempo: el `.mdl` guarda líneas `35:Date`, `36:YYYY-MM-DD` en la sección de settings. |
| **Info/Sketch** | Información del modelo: **comentario y copyright**. Opciones del sketch como **mostrar causas iniciales**. |
| **Units Equiv** | **Sinónimos de unidades** (`Person, People, Persons`), para que Units Check no dé falsos errores. En el `.mdl` se guardan como líneas `22:` en la sección de settings. |
| **Sketch** (10.1+) | Tooltips con **subíndices** y **valores de constantes**. |
| Otras | La ayuda tiene una página "Reference Modes Tab". Si "Appearance" es una pestaña, y cuál es el contenido exacto en 10.5, está sin verificar. |

> Un **"Model > Documentation"** como ítem de menú no está confirmado. Para documentar el modelo se usa el **Document tool**, el comentario de *Info/Sketch* o **SDM-Doc**, que se lanza desde Vensim desde 9.0 (verificar).

### Tools > Options (opciones globales)
- **General**: *Use legacy equation editor* (10.3+), comportamiento de inicio, etc.
- **Causes/uses tree depth** (PLE, 10.1+).
- **Doble clic configurable** (10.4+): qué ocurre al hacer doble clic sobre objetos del sketch.
- **Sketch**: opciones globales de dibujo ("Sketch" en la Reference Guide).
- **Advanced Options**: página "Advanced Options" de la ayuda (verificar contenido).
- PLE y PLE Plus tienen su propio conjunto reducido ("Options for PLE and PLE Plus").
- **Tools > Language**: idioma de la interfaz (chino desde 10.2.2).

---

## 13. Cómo se guarda el sketch en el `.mdl`

Útil para diagnosticar archivos dañados o generar diagramas por programa. La sección de sketch empieza tras `\\\---/// Sketch information - do not modify anything except names` y termina en `///---\\\`. Después viene la sección de **settings** (`:L<%^E!@`), con líneas numeradas como `22:` (Units Equiv) o `1:Current.vdf`.

Ejemplo real del modelo *teacup* (`test-models/samples/teacup/teacup.mdl`):

```vensim
\\\---/// Sketch information - do not modify anything except names
V300  Do not put anything below this section - it will be ignored
*View 1
$192-192-192,0,Times New Roman|12||0-0-0|0-0-0|0-0-255|-1--1--1|-1--1--1|72,72,100,0
10,1,Teacup Temperature,307,235,40,20,3,3,0,0,0,0,0,0
12,2,48,479,235,10,8,0,3,0,0,-1,0,0,0
1,3,5,2,4,0,0,22,0,0,0,-1--1--1,,1|(441,235)|
1,4,5,1,100,0,0,22,0,0,0,-1--1--1,,1|(374,235)|
11,5,48,408,235,6,8,34,3,0,0,1,0,0,0
10,6,Heat Loss to Room,408,251,49,8,40,3,0,0,-1,0,0,0
10,7,Room Temperature,469,304,49,8,8,3,0,0,0,0,0,0
10,8,Characteristic Time,408,174,49,8,8,3,0,0,0,0,0,0
1,9,8,5,0,0,0,0,0,64,0,-1--1--1,,1|(408,198)|
```

| Código inicial | Objeto |
|---|---|
| `*Nombre` | Inicio de una **vista** |
| `$...` | Fuente y colores por defecto de la vista |
| `10` | **Variable**: id, nombre, x, y, ancho, alto, forma (caja = Level), nivel de ocultación… El campo "arrows in allowed" **par** indica **sombra** (según la gramática de PySD). |
| `11` | **Válvula** de un flujo |
| `12` | **Comentario**, **nube** (nombre `48`) u otro objeto multipropósito, incluidos los identificadores de bucle con texto R/B |
| `1` | **Flecha**: id, origen, destino, … El código de **delay mark** y la polaridad van en sus campos. |
| `30`, `31` | Otros objetos (p. ej. I/O objects; verificar) |

Desde Vensim 8.2.1 las líneas de variable llevan **bytes extra**, y los parsers antiguos pueden fallar con ellos.

> Regla de oro: solo editar **nombres** en esta sección a mano. Para cambios de estructura, usar la interfaz.

---

## 14. Flujos de trabajo y consejos de productividad

### Construir un modelo de stocks y flujos desde cero
1. **File > New Model** → fijar INITIAL TIME, FINAL TIME, TIME STEP, SAVEPER y **Units for Time** en Model Settings.
2. Dibujar los **stocks** (`S`), los **flujos** (`F`, desde o hacia nubes o stocks), las **auxiliares y constantes** (`V`) y las **flechas** (`C`).
3. Herramienta **Equations**: completar las variables resaltadas (sin ecuación), con **unidades** y **comentario**.
4. **Ctrl+T** (Check Model) y **Units Check**. Corregir desde el panel de errores (9.3+).
5. **Ctrl+R** (Simulate). Seleccionar la variable y usar **Graph**, **Causes Strip** y **Table**.
6. Explorar con **SyntheSim** y fijar rangos de sliders con `[min,max,paso]` en las unidades.
7. Escenarios: cambiar el *Run name*, simular y comparar con **Graph** y **Runs Compare**.

### Taller de diagramas causales
- Activar **Diagram only mode** (PLE+ 10.4+) para una interfaz limpia.
- Polaridad con teclas `+`/`−` justo al soltar la flecha.
- **Delay Mark** en las flechas con retraso. Identificadores de bucle con Sketch Comment *Loop Clockwise/Counterclockwise*.
- **Hide Wand** con niveles para revelar el diagrama bucle a bucle (End/Home). **Presentation mode** (10.3+) para exponer.

### Depuración y comprensión de modelos ajenos
- **Causes Tree / Uses Tree** para orientarse.
- **Loops** (con resaltado en el sketch, 10.2+) y **SILS** para la estructura de realimentación.
- **Causal Chain** (10.2+) para "¿cómo llega A a influir en B?".
- **Causes Strip** para rastrear un comportamiento extraño hasta su origen (Causal Tracing).
- **Document tool** para ver la ecuación y las unidades sin abrir el editor.
- Búsqueda **dentro de ecuaciones** (10.2+): p. ej. buscar `XLS` para localizar todas las lecturas de Excel.
- **Sensitivity2All** (10.0+) para saber qué constantes importan antes de calibrar.

### Consejos generales
- **Esc** antes de hacer clic para analizar: así no se mueve nada por accidente con Move/Size.
- Usar **sombras** para `Time`, parámetros globales y conexiones entre vistas, en lugar de cruzar flechas largas. Una **vista por sector**.
- Trabajar en `.mdl` (texto) y versionarlo con Git. El editor de texto (Pro/DSS) sirve para cambios masivos.
- Alinear con **Layout > … on LastSel** y espaciar con *Horizontal/Vertical Spacing* para diagramas legibles.
- Fijar **Sketch Defaults** al inicio (fuente, colores). Desde 9.2 se aplican a todas las vistas.
- Para documentación externa: **SDM-Doc** (lanzable desde 9.0) y exportación del sketch a **SVG** (9.2).
- Si un cambio del editor nuevo de ecuaciones molesta, volver temporalmente al **legacy editor**. No hay que contar con él a largo plazo.
- **Sample models explorer** (10.4/10.5) para encontrar ejemplos de estructuras y funciones.

---

## Fuentes

**Documentación de vensim.com** (vista como extractos de búsqueda; acceso directo bloqueado):
- Interfaz: http://vensim.com/documentation/usr02.html · https://www.vensim.com/documentation/vendemo_development.html · https://www.vensim.com/documentation/introduction.html · https://www.vensim.com/documentation/20110.html · https://www.vensim.com/documentation/sketchlayout.html
- Menús: http://vensim.com/documentation/main_menu_2.html · https://www.vensim.com/documentation/20100.html · https://vensim.com/documentation/25595.html · http://vensim.com/documentation/24060.html (File) · https://www.vensim.com/documentation/23205.html y https://www.vensim.com/documentation/editmenusketch.html (Edit) · https://www.vensim.com/documentation/viewmenu.html y https://www.vensim.com/documentation/23215.html (View) · https://www.vensim.com/documentation/23210.html (Insert) · https://www.vensim.com/documentation/layoutmenu.html (Layout) · https://www.vensim.com/documentation/24070.html (Model)
- Barras: https://www.vensim.com/documentation/main_toolbar.html · https://www.vensim.com/documentation/24090.html · https://www.vensim.com/documentation/23300.html · https://www.vensim.com/documentation/statusbar.html · https://www.vensim.com/documentation/20135.html
- Herramientas de sketch: https://www.vensim.com/documentation/ref_sketch_tools.html · https://www.vensim.com/documentation/20130.html · https://www.vensim.com/documentation/20245.html · https://www.vensim.com/documentation/20265.html · https://vensim.com/documentation/20645.html · https://vensim.com/documentation/20665.html · https://www.vensim.com/documentation/22890.html · https://www.vensim.com/documentation/22945.html · https://www.vensim.com/documentation/20455.html · https://www.vensim.com/documentation/22935.html · https://www.vensim.com/documentation/20375.html · https://www.vensim.com/documentation/23730.html · https://www.vensim.com/documentation/ref_tools.html
- Atajos y navegación: http://vensim.com/documentation/shortcuts.html · http://vensim.com/documentation/general_navigation.html · https://www.vensim.com/documentation/20040.html
- CLD y formato: https://www.vensim.com/documentation/usr04.html · http://vensim.com/documentation/23025.html (Arrow Options) · https://www.vensim.com/documentation/23015.html (Sketch Comment Options) · https://www.vensim.com/documentation/20280.html · https://www.vensim.com/documentation/24210.html · https://www.vensim.com/documentation/20275.html · https://www.vensim.com/documentation/20350.html · https://www.vensim.com/documentation/ref_options_sketch.html · https://www.vensim.com/documentation/ref_fonts.html · https://www.vensim.com/documentation/24305.html
- Ocultación: https://www.vensim.com/documentation/20365.html · http://vensim.com/documentation/22955.html · http://vensim.com/documentation/changes_from_vensim_3.html
- Reference modes: https://www.vensim.com/documentation/usr20.html · https://www.vensim.com/documentation/reference_modes.html
- Análisis: https://www.vensim.com/documentation/20150.html · https://www.vensim.com/documentation/analysis.html · https://www.vensim.com/documentation/20305.html · https://www.vensim.com/documentation/treetool.html · https://www.vensim.com/documentation/ref_graph_tool.html · https://www.vensim.com/documentation/23865.html · https://www.vensim.com/documentation/21320.html · https://www.vensim.com/documentation/20210.html
- Control Panel: https://www.vensim.com/documentation/control_panel.html · https://www.vensim.com/documentation/timeaxis.html · https://vensim.com/documentation/scaling.html · https://www.vensim.com/documentation/customgraphcontrol.html
- Simulación: https://www.vensim.com/documentation/ref_sim_control.html · https://www.vensim.com/documentation/simulation.html · https://www.vensim.com/documentation/ref__starting_synthesim.html · https://www.vensim.com/documentation/synthesim.html · https://www.vensim.com/documentation/ref_gaming.html
- Ecuaciones y texto: https://www.vensim.com/documentation/equation_editor.html · http://vensim.com/documentation/ref_eqn_editor.html · https://www.vensim.com/documentation/23080.html · https://www.vensim.com/documentation/23090.html · https://www.vensim.com/documentation/24440.html · https://www.vensim.com/documentation/ref_text_history.html · https://www.vensim.com/documentation/22200.html · https://www.vensim.com/documentation/22970.html
- Settings y opciones: http://vensim.com/documentation/model_settings.html · https://www.vensim.com/documentation/timeboundsdates.html · https://www.vensim.com/documentation/ref_units_equiv.html · https://www.vensim.com/documentation/advanced_options.html · https://www.vensim.com/documentation/ref17_options_for_ple_and_ple_plus.html
- Notas de versión: http://vensim.com/documentation/vensim-8_2_2.html y http://vensim.com/documentation/vensim-8_2_2_2.html (9.0) · https://www.vensim.com/documentation/vensim-9_2.html · https://www.vensim.com/documentation/vensim-9_3.html · https://vensim.com/documentation/vensim-10_0_1.html · https://vensim.com/documentation/vensim-10_2_0.html · https://vensim.com/documentation/vensim-10_2_2-(september-2024).html · https://vensim.com/documentation/vensim-10_3.html · https://www.vensim.com/documentation/vensim-10_4_x.html · https://vensim.com/2026/06/vensim-ventity-news-june-2026/

**Repos locales usados** (`scratchpad/src/`):
- `test-models/samples/teacup/teacup.mdl`: ejemplo de sección de sketch y settings.
- `pysd/pysd/translators/vensim/parsing_grammars/sketch.peg` y `pysd/pysd/translators/vensim/vensim_file.py`: códigos de objetos del sketch, detección de sombras y nivel de ocultación.
- `simlin/docs/design/mdl-parser.md`: tipos de elementos de vista (10 variable, 11 válvula, 12 comentario/nube, 1 conector).
