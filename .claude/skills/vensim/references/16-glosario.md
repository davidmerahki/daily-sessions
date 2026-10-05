# Glosario Vensim / Dinámica de Sistemas (EN ↔ ES)

Términos tal como aparecen en Vensim (inglés) con su equivalente y significado en español. Útil para traducir preguntas de usuarios hispanohablantes a la terminología del software y viceversa.

## Tabla de contenidos
- [Estructura del modelo](#estructura-del-modelo)
- [Ecuaciones y tipos de variable](#ecuaciones-y-tipos-de-variable)
- [Simulación](#simulación)
- [Análisis](#análisis)
- [Interfaz](#interfaz)
- [Archivos](#archivos)
- [Ediciones y productos](#ediciones-y-productos)

## Estructura del modelo

| Vensim (EN) | Español | Significado |
|---|---|---|
| Stock / Level | Stock / Nivel / Acumulación | Variable de estado que acumula flujos: `INTEG(entradas - salidas, valor inicial)`. Se dibuja con *Box Variable*. |
| Flow / Rate | Flujo / Tasa | Variable que cambia un stock por unidad de tiempo. Se dibuja con *Rate* (tubería con válvula). |
| Auxiliary | Auxiliar | Variable calculada a partir de otras en cada paso; sin memoria. |
| Constant | Constante / Parámetro | Valor que no cambia durante una simulación (pero sí entre corridas). |
| Unchangeable constant (`==`) | Constante inmutable | Constante que no aparece en SyntheSim/cambios de simulación. |
| Lookup / Table function / Graphical function | Tabla / Función de tabla / Función gráfica | Relación no lineal definida por puntos (x, y). |
| Data variable | Variable de datos | Serie temporal externa (dataset, Excel, CSV). |
| Shadow variable / Model variable | Variable sombra | Copia visual (`<Nombre>`) de una variable definida en otro lugar o vista. |
| Cloud (source/sink) | Nube (fuente/sumidero) | Límite del modelo en un flujo: origen o destino fuera del sistema modelado. |
| Valve | Válvula | Símbolo del flujo que controla la tasa. |
| Arrow / Connector / Causal link | Flecha / Conector / Enlace causal | Relación de información entre variables. |
| Polarity (+/−, s/o) | Polaridad | Signo de la relación causal (mismo sentido / sentido opuesto). |
| Feedback loop | Bucle de realimentación | Cadena causal cerrada. |
| Reinforcing loop (R) | Bucle reforzador (positivo) | Amplifica cambios (crecimiento/colapso exponencial). |
| Balancing loop (B) | Bucle balanceador / compensador (negativo) | Busca un objetivo, contrarresta cambios. |
| Loop identifier | Identificador de bucle | Símbolo en el diagrama (R1, B1) con sentido de giro. |
| Causal Loop Diagram (CLD) | Diagrama causal / de bucles causales | Diagrama cualitativo de relaciones y bucles. |
| Stock and Flow Diagram | Diagrama de stocks y flujos / de Forrester | Diagrama cuantitativo con niveles y flujos. |
| Delay (material / information) | Retraso / Demora (material / de información) | DELAY1/3/N/FIXED (material), SMOOTH (información). |
| Aging chain | Cadena de envejecimiento | Serie de stocks donde el contenido avanza de uno a otro. |
| Co-flow | Coflujo | Estructura paralela que rastrea un atributo de un stock. |
| Subscript / Subscript range | Subíndice / Rango de subíndices | Dimensión de un array (p.ej. `Region: norte, sur`). |
| Subscript element | Elemento de subíndice | Valor individual de un rango. |
| Subrange | Subrango | Subconjunto de un rango. |
| Mapping (`->`) | Mapeo | Correspondencia entre elementos de dos rangos. |
| Equivalence (`<->`) | Equivalencia / alias | Dos nombres para el mismo rango. |
| Macro | Macro | Estructura reutilizable definida con `:MACRO:` … `:END OF MACRO:`. |
| View | Vista | Hoja/página del diagrama. Un modelo puede tener varias. |
| Group | Grupo | Sección lógica de ecuaciones en el .mdl (`****...` + `.Nombre`). |

## Ecuaciones y tipos de variable

| Vensim (EN) | Español | Significado |
|---|---|---|
| Equation editor | Editor de ecuaciones | Diálogo para escribir ecuaciones, unidades, comentarios y tipo. |
| Units | Unidades | Unidades de medida tras el primer `~`. |
| Dmnl (dimensionless) | Adimensional | Unidad de magnitudes sin dimensión (`Dmnl` o `1`). |
| Units Equivalence | Equivalencia de unidades | Sinónimos de unidades (`Year`, `Years`, `yr`). |
| Comment / Documentation | Comentario / Documentación | Texto tras el segundo `~`. |
| Initial value | Valor inicial | Segundo argumento de INTEG; o variable `INITIAL(...)`. |
| Active initial | Inicial activo | ACTIVE INITIAL: valor distinto para la inicialización, rompe ciclos simultáneos. |
| `:NA:` | No disponible | Marcador de dato faltante. Es un número real muy negativo (no un NaN IEEE): usarlo solo para *probar* si falta un dato, nunca en aritmética. |
| Simultaneous equations | Ecuaciones simultáneas | Ciclo de dependencias sin un Level de por medio: error. |
| Reference mode | Modo de referencia | Comportamiento histórico/esperado que el modelo debe explicar. |

## Simulación

| Vensim (EN) | Español | Significado |
|---|---|---|
| INITIAL TIME / FINAL TIME | Tiempo inicial / final | Horizonte de simulación. |
| TIME STEP (dt) | Paso de tiempo / paso de integración | Intervalo de cálculo. |
| SAVEPER | Periodo de guardado | Cada cuánto se guardan resultados. |
| Integration type: Euler, RK4, RK2, RK4 Auto, RK2 Auto, Difference | Método de integración | Algoritmo numérico de integración. |
| Run / Simulation | Corrida / Simulación | Ejecución del modelo; produce un dataset `.vdf`/`.vdfx`. |
| Dataset | Conjunto de datos | Resultados de una corrida o datos importados. |
| Changes file (`.cin`) | Archivo de cambios | Parámetros alternativos para una corrida (escenario). |
| SyntheSim | SyntheSim (simulación sintética) | Modo con deslizadores y resultados instantáneos sobre el diagrama. |
| Slider | Deslizador | Control para variar una constante en SyntheSim. |
| Gaming | Modo juego | Simulación interactiva paso a paso con variables GAME. |
| Equilibrium | Equilibrio | Estado donde todos los flujos netos son cero. |

## Análisis

| Vensim (EN) | Español | Significado |
|---|---|---|
| Workbench variable | Variable de trabajo | Variable seleccionada sobre la que actúan las herramientas de análisis. |
| Causes Tree / Uses Tree | Árbol de causas / Árbol de usos | Qué influye en la variable / a qué influye. |
| Loops | Bucles | Lista de bucles de realimentación que pasan por la variable. |
| Causes Strip | Tira de causas | Gráficos de la variable y sus causas directas. |
| Table / Table Time Down | Tabla / Tabla con tiempo hacia abajo | Resultados numéricos. |
| Runs Compare | Comparar corridas | Diferencias en constantes/lookups entre corridas. |
| Custom graph | Gráfico personalizado | Gráfico definido por el usuario (guardado en `.vgd` o en el modelo). |
| Sensitivity analysis / Monte Carlo | Análisis de sensibilidad / Monte Carlo | Muchas corridas con parámetros aleatorios (`.vsc`). |
| Confidence bounds | Bandas de confianza | Percentiles (50/75/95/100 %) de la sensibilidad. |
| Optimization / Calibration | Optimización / Calibración | Ajuste de parámetros (`.voc` + `.vpd`). |
| Payoff | Función objetivo / de pago | Lo que el optimizador maximiza (o error a minimizar). |
| Policy optimization | Optimización de políticas | Búsqueda de parámetros de decisión que maximizan un objetivo. |
| Kalman filtering | Filtrado de Kalman | Estimación de estado con ruido (Professional y DSS según `01-productos-licencias-versiones.md`). |
| MCMC | MCMC (Monte Carlo por cadenas de Markov) | Calibración bayesiana / distribución posterior. |
| Reality Check | Prueba de realidad | Pruebas formales de comportamiento bajo condiciones extremas. |
| Units Check | Comprobación de unidades | Verificación de consistencia dimensional. |

## Interfaz

| Vensim (EN) | Español | Significado |
|---|---|---|
| Sketch | Diagrama / Bosquejo | El dibujo del modelo. |
| Sketch tools | Herramientas de dibujo | Barra de herramientas para crear/editar el diagrama. |
| Analysis tools | Herramientas de análisis | Barra con Causes Tree, Graph, Table, etc. |
| Control Panel | Panel de control | Gestión de variables, eje de tiempo, datasets y gráficos. |
| Status bar | Barra de estado | Muestra vista, fuente, color, etc. |
| Lock | Bloquear | Herramienta para evitar modificar el diagrama al hacer clic. |
| Hide/Unhide | Ocultar/Mostrar | Ocultar elementos del diagrama (p.ej. variables sombra). |

## Archivos

| Extensión | Español |
|---|---|
| `.mdl` | Modelo en texto (ecuaciones + diagrama) |
| `.vpmx` / `.vpm` | Modelo publicado/empaquetado (Model Reader) |
| `.vdfx` / `.vdf` | Dataset (resultados/datos) |
| `.vgd` | Definiciones de gráficos personalizados |
| `.cin` | Archivo de cambios (escenarios) |
| `.vsc` | Control de sensibilidad |
| `.voc` | Control de optimización |
| `.vpd` | Definición de payoff |
| `.lst` | *Savelist*: lista de variables a guardar/exportar (una por línea) |
| `.out` | Parámetros resultantes de una optimización |
| `.cmd` | Script de comandos |

## Ediciones y productos

| Producto | Descripción breve |
|---|---|
| Vensim PLE | Personal Learning Edition: gratuita para uso educativo/personal, funciones básicas. |
| Vensim PLE Plus | PLE + conectividad con datos, múltiples vistas, sensibilidad Monte Carlo, gaming y controles de E/S en el sketch (sin subíndices). |
| Vensim Professional (Pro) | Edición profesional: subíndices, optimización/calibración, MCMC, Kalman, macros, editor de texto, etc. |
| Vensim DSS | Decision Support System: todo lo de Pro + DLL, command scripts, Venapps, funciones externas, simulación compilada, multi-core, servidor MCP (10.5), etc. |
| Vensim Model Reader | Visor gratuito para ejecutar modelos publicados. |
| Ventity | Producto hermano de Ventana Systems para modelos basados en entidades. |

> El detalle de qué incluye cada edición está en `01-productos-licencias-versiones.md`.
