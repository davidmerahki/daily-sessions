# Vensim: productos, licencias y versiones

Referencia sobre la empresa, las ediciones ("configurations") de Vensim, qué incluye cada una, cómo se licencia e instala, la evolución por versiones y dónde aprender. Datos actualizados a octubre de 2026 a partir de extractos de vensim.com (el sitio no se pudo consultar directamente). Lo marcado como **(verificar)** es plausible, pero no quedó confirmado en ninguna fuente.

## Tabla de contenidos
1. [Ventana Systems y Vensim](#1-ventana-systems-y-vensim)
2. [Línea de productos (configuraciones)](#2-línea-de-productos-configuraciones)
3. [Tabla comparativa de características](#3-tabla-comparativa-de-características)
4. [Licenciamiento, precios y mantenimiento](#4-licenciamiento-precios-y-mantenimiento)
5. [Plataformas, instalación y activación](#5-plataformas-instalación-y-activación)
6. [Historial de versiones](#6-historial-de-versiones)
7. [Formatos de archivo y compatibilidad entre ediciones](#7-formatos-de-archivo-y-compatibilidad-entre-ediciones)
8. [Recursos de aprendizaje y soporte](#8-recursos-de-aprendizaje-y-soporte)
9. [Preguntas frecuentes: ¿qué edición necesito?](#9-preguntas-frecuentes-qué-edición-necesito)
10. [Fuentes](#fuentes)

---

## 1. Ventana Systems y Vensim

### Empresa
- **Ventana Systems, Inc.** se fundó en **1985** en **Harvard, Massachusetts (EE. UU.)**. Su objetivo era aplicar técnicas modernas de simulación y análisis de datos a problemas de negocio, economía e ingeniería. Los fundadores estudiaron dinámica de sistemas en el MIT con **Jay W. Forrester**.
- **Ventana Systems UK** se encarga de la atención al cliente: pedidos, resolución de bugs, calendario de formación, red de distribuidores y el foro de soporte (ventanasystems.co.uk/forum).
- Personas clave:
  - **Robert (Bob) Eberlein**: arquitecto y desarrollador principal de Vensim desde su origen hasta aprox. 2010. Dejó Ventana tras más de 22 años (la fecha exacta de salida está sin verificar). Después fue co-presidente de isee systems (Stella/iThink). Coautor del estándar XMILE (2013) y profesor de análisis de modelos en el Worcester Polytechnic Institute.
  - **Tom Fiddaman**: entró en Ventana en 1997. Hoy es Chairman y CTO y actúa como *Vensim Product Manager*. Ganó el Forrester Prize 2006. Escribe el blog **metasd.com**, con muchos modelos y artículos sobre Vensim.
  - **Tony Kennedy** (Ventana Systems UK): *Director of Vensim Development & Support*, con unos 30 años trabajando con Vensim.
  - Equipo directivo citado en la web: Alan Graham, Tony Kennedy, Tom Fiddaman, Marios Kagarlis y David Peterson. Que David W. Peterson fuera cofundador está sin verificar.

### Origen de Vensim
- Ventana creó su propio lenguaje para acortar el desarrollo de modelos. Al principio era una **extensión de Pascal**: el modelo se escribía en Vensim y se traducía a Pascal para ejecutarlo.
- **1988**: el lenguaje y el sistema de soporte se portan a **C** y al entorno gráfico **X-Window**.
- **1991**: primera versión comercial, **Vensim 1.50**, para Windows. Se publicó a raíz de la salida de Windows 3.0 y era una "technical release" pensada para modeladores expertos.
- El nombre suele interpretarse como *Ventana Simulation* (verificar).
- Algunas tecnologías son marcas o patentes de Ventana: **Causal Tracing®** (método patentado de trazado interactivo del comportamiento a través de los enlaces causales), **Reality Check®** y **SyntheSim**.

### Qué es y para qué se usa
Vensim es un entorno de modelado y simulación de **dinámica de sistemas**: diagramas causales (CLD), modelos de stocks y flujos, simulación continua o discreta en tiempo, y análisis de estructura y de comportamiento. Usos típicos:
- **Docencia** de dinámica de sistemas. Vensim PLE es gratis para uso educativo.
- **Consultoría y estrategia**: dinámica de mercados, cadenas de suministro, recursos humanos, proyectos.
- **Políticas públicas y ciencia**: salud y epidemiología, energía y clima, recursos naturales.
- **Calibración y análisis estadístico** de modelos con datos (optimización, MCMC/bayesiano, filtro de Kalman).
- **Simuladores de gestión** (*management flight simulators*) y aplicaciones web publicadas desde el modelo.

### Producto hermano: Ventity
- **Ventity** es otro producto de Ventana, para modelar sistemas dinámicos con **entidades** en lugar de arrays. Las "colecciones de entidades" se identifican por atributos, lo que favorece la modularidad y la orientación a objetos.
- Permite crear y eliminar componentes y relaciones durante la simulación (útil para modelos tipo agente). También ofrece colaboración en equipo, federación de modelos, submodelos y gráficos avanzados.
- Hitos: beta pública en 2015 y **Ventity 3** en 2019 (anunciado junto con Vensim 8).
- Licencia por **suscripción de 99 USD/año**. Es **gratuita** para quien tenga una licencia **Vensim Pro o DSS con mantenimiento vigente**.

---

## 2. Línea de productos (configuraciones)

Vensim se vende en varias **configuraciones**. Todas comparten la misma interfaz y **cada una es un superconjunto de la anterior**: PLE ⊂ PLE Plus ⊂ Professional ⊂ DSS.

| Configuración | Posicionamiento | Notas clave |
|---|---|---|
| **Vensim PLE** (*Personal Learning Edition*) | Aprendizaje y aula | **Gratis para uso educativo y personal**; barata para uso comercial (evaluación comercial de 90 días). Menús y diálogos simplificados, menos opciones, **toolset fijo**, menos herramientas de construcción y **menos funciones**. Incluye modelos de ejemplo y ayuda. |
| **Vensim PLE Plus** (PLE+) | Puente entre PLE y Pro | Añade **conectividad con datos**, **múltiples vistas**, **sensibilidad Monte Carlo**, **simulaciones de juego (gaming)** y la interfaz de usuario de modelo (**Input/Output Controls**: sliders, gráficos y tablas en el sketch). Desde 10.4/10.5 permite **editar los toolsets de análisis** como Pro/DSS y tiene **Diagram only mode**. |
| **Vensim Professional** ("Vensim Pro") | Modelado profesional | Añade **subíndices (arrays)**, **optimización** (calibración y optimización de políticas), Causal Tracing completo, editor de texto del modelo, macros (verificar si son solo DSS; ver tabla), **filtro de Kalman**. "Vensim Pro" no es otro producto, solo la abreviatura de Professional. |
| **Vensim DSS** (*Decision Support System*) | Sistemas de apoyo a decisiones y simuladores | Añade construcción de **management flight simulators / Venapps**, **funciones externas (DLL)**, **simulaciones compiladas**, más **capacidad de modelo**, **multi-core** (sensibilidad/optimización), **Vensim DLL**, scripts y automatización, ODBC, publicación web avanzada y servidor MCP ("Agentic Vensim", 10.5). |
| **Vensim Model Reader** | Distribución de modelos | **Gratis** y **redistribuible** (también en uso comercial). Acceso **de solo lectura/ejecución** a modelos **publicados** (`.vpm`), aplicaciones (`.vpa`, Venapps) o binarios `.vmf`. También abre aplicaciones que usan la Vensim DLL. |

> El "PLE comercial" requiere licencia de pago tras 90 días de evaluación. PLE educativo y Model Reader no necesitan código de registro.

---

## 3. Tabla comparativa de características

Reconstruida a partir de la *Comparison Chart for Vensim Configurations* oficial (vensim.com/comparison-chart-for-vensim-configurations/), las descripciones de producto, la FAQ y las notas de versión. Las celdas con "(v)" están sin confirmar.

Leyenda: ✔ incluido · — no incluido · (v) verificar.

| Característica | PLE | PLE Plus | Professional | DSS | Model Reader |
|---|---|---|---|---|---|
| Sketch: diagramas causales y de stocks y flujos | ✔ | ✔ | ✔ | ✔ | solo ver |
| Equation Editor, Check Model, Units Check | ✔ | ✔ | ✔ | ✔ | — |
| Herramientas estructurales (Causes/Uses Tree, Loops, Document) | ✔ (toolset fijo) | ✔ | ✔ | ✔ | ✔ (v) |
| Herramientas de datasets (Graph, Table, Causes Strip, Runs Compare) | ✔ | ✔ | ✔ | ✔ | ✔ (v) |
| SyntheSim (simulación en vivo con sliders) | ✔ | ✔ | ✔ | ✔ | (v) |
| **Reality Check®** | ✔ | ✔ | ✔ | ✔ | ✔ |
| SILS (Shortest Independent Loop Set), desde 10.2.2 | ✔ | ✔ | ✔ | ✔ | (v) |
| Múltiples vistas (views) | — (v) | ✔ | ✔ | ✔ | ✔ |
| Edición de toolsets de análisis | — | ✔ (desde 10.4/10.5) | ✔ | ✔ | — |
| Diagram only mode (oculta las herramientas de simulación) | (v) | ✔ (10.4/10.5) | (v) | (v) | — |
| Conectividad con datos (variables Data, datasets externos, Excel) | — (v) | ✔ | ✔ | ✔ | ✔ (v) |
| Sensibilidad **Monte Carlo** | — | ✔ | ✔ | ✔ | (v) |
| **Gaming** (simulación por pasos con decisiones) | (v) | ✔ | ✔ | ✔ | (v) |
| **Input/Output Controls** (sliders, gráficos y tablas en el sketch) | — (v) | ✔ | ✔ | ✔ | ✔ (v) |
| **Subíndices / arrays** (hasta 8 dimensiones según el chart) | — | — | ✔ | ✔ | ✔ |
| Editor de texto del modelo (View as text) | — | — | ✔ | ✔ | — |
| Macros | — | — | ✔ (v) | ✔ | — |
| Causal Tracing® completo / Causal Table / Causal Chain | parcial (v) | parcial (v) | ✔ | ✔ | (v) |
| **Calibración** (optimización contra datos) | — | — | ✔ | ✔ | ✔ |
| **Optimización de políticas** | — | — | ✔ | ✔ | ✔ |
| **MCMC / inferencia bayesiana** | — | — | ✔ (v) | ✔ | — (v) |
| **Filtro de Kalman** | — | — | ✔ | ✔ | — |
| Sensitivity2All (Vensim 10) | (v) | (v) | ✔ (v) | ✔ | — |
| **Multi-core** en sensibilidad y optimización | — | — | — | ✔ | — |
| Publicar modelo para Model Reader (`.vpm`) | — | — | ✔ (v) | ✔ | n/a |
| Publicación web (WebAssembly, dashboards, datos) | — | — | ✔ (v) | ✔ | — |
| **Venapps** / management flight simulators | — | — | — | ✔ | ejecuta `.vpa` |
| **Funciones externas (DLL)** y **simulación compilada** | — | — | — | ✔ | — |
| **Vensim DLL** (Windows; dylib en Mac) | — | — | — | ✔ | — |
| Command scripts, Action recorder (9.3), Run configuration tool (9.4) | — | — | — (v) | ✔ | — |
| Notebook control (varios gráficos/tablas en un "notebook" del sketch, 10.2) | — | — | — | ✔ | — |
| ODBC (lectura/escritura en bases de datos) | — | — | — | ✔ | — |
| Servidor HTTP integrado (10.4) / servidor MCP "Agentic Vensim" (10.5) | — | — | — | ✔ | — |
| Mayor capacidad de modelo | — | — | — | ✔ | — |
| Suscripción Ventity incluida con mantenimiento vigente | — | — | ✔ | ✔ | — |

Matices importantes:
- **Multi-core**: las notas de Vensim 10 lo presentan como "Windows only for now" y la 10.2 añadió sensibilidad multi-core en Mac. El comparison chart lo restringe a **DSS**.
- **Model Reader**: según el chart, puede usar Reality Check, calibración y optimización de políticas, y subíndices sobre modelos publicados. No permite editar el modelo.
- **PLE y gaming/sensibilidad**: la FAQ dice que PLE Plus "adds to PLE … Monte Carlo or sensitivity simulation". Una página de ayuda describe el menú de simulación "In Vensim PLE and PLE Plus" con Run Game y Sensitivity, pero el texto parece cubrir ambas ediciones a la vez. Ante la duda, comprobar en el comparison chart actual.

---

## 4. Licenciamiento, precios y mantenimiento

### Tipos de licencia
| Tipo | A quién aplica | Notas |
|---|---|---|
| **Educativa gratuita (PLE)** | Estudiantes, docentes, uso personal o de aprendizaje | Sin código de registro. Puede instalarse en un servidor **sin límite de usuarios simultáneos** si todos son usuarios educativos. |
| **Académica** | Universidades, docentes e investigadores académicos | Precio reducido. Existe el **Academic Lab-Pack** de 5 licencias, ampliable licencia a licencia. |
| **Public research** | Investigación pública o sin ánimo de lucro (verificar alcance exacto) | Precio intermedio. |
| **Comercial** | Empresas y consultoras | Precio completo, con **descuentos por volumen** y **site licenses** (página "Volume Discounts and Site License Pricing"). |
| **Evaluación comercial de PLE** | Empresas que prueban PLE | Hasta **90 días** gratis; después hay que comprar licencia. |
| **Model Reader** | Cualquiera | Gratuito y redistribuible con los modelos, también en uso comercial. |

### Instalación en red
- El software puede instalarse en un **servidor de red** siempre que el uso respete la licencia: el número de usuarios simultáneos no puede superar el de licencias adquiridas.
- Un **Educational Lab Pack (≥5 licencias)** permite instalarlo en un servidor para uso simultáneo hasta el número de licencias.
- **Licencias flotantes** con gestor de licencias: no apareció en las fuentes consultadas. Para configuraciones concretas de red, consultar a Ventana (verificar).

### Precios de lista
Precios en USD, vistos en extractos de vensim.com/purchase y de la tienda, consultados en oct. 2026. La página no tiene fecha visible; comprobar que siguen vigentes antes de citarlos.

| Producto | Comercial | Public research | Académico |
|---|---|---|---|
| **Vensim DSS** | 1.995 | 998 | 798 |
| **Vensim Professional** | 1.195 | 598 | 478 |
| **Vensim PLE Plus** | 169 | 89 | 89 |
| **Vensim PLE** | uso comercial de pago, precio no recogido (verificar) | — | gratis (educativo) |
| **Model Reader** | gratis | gratis | gratis |
| **Ventity** (suscripción) | 99/año (gratis con Pro/DSS y mantenimiento vigente) | | |

| Academic Lab-Pack (5 licencias) | Precio | Licencia adicional |
|---|---|---|
| DSS | 2.790 | +75 c/u |
| Professional | 1.965 | +75 c/u |
| PLE Plus | 356 | +20 c/u |

Volumen comercial (ejemplo a 10 copias): DSS 10.474, Professional 6.274, PLE Plus 887. Las cantidades intermedias tienen precios escalonados.

### Mantenimiento
- **Todas las licencias incluyen 1 año de mantenimiento**: soporte, actualizaciones y nuevas versiones.
- Después se renueva anualmente. Existe un formulario académico con columna "Maintenance Renewal".
- **Soporte técnico gratuito** para Professional y DSS con mantenimiento vigente.
- Con mantenimiento vigente, **Pro y DSS incluyen suscripción a Ventity**.
- Desde Vensim 5, las actualizaciones se distribuyen electrónicamente a través de la web.

---

## 5. Plataformas, instalación y activación

### Requisitos
| Plataforma | Requisitos y notas |
|---|---|
| **Windows** | Windows **10/11**; no funciona en XP, Vista ni 7/8/8.1. Hay versiones de **32 y 64 bits**; la DSS incluye además una **DLL de 32 bits** desde 10.1. El instalador requiere **permisos de administrador**. |
| **macOS** | La FAQ actual pide **macOS 12 o superior**. Desde **Vensim 8** hay ejecutables de **64 bits** para Mac. Las versiones anteriores a 8.0 son de 32 bits y **no funcionan desde Catalina (10.15)**. En **Apple silicon** se recomienda **8.2 o posterior**. |
| Hardware | Unos **60 MB** de disco para la instalación completa y "cualquier cantidad razonable de memoria". El multi-core acelera sensibilidad, optimización y MCMC (Vensim 10). |
| Linux | Sin versión nativa (verificar). Los modelos `.mdl` se pueden ejecutar fuera de Vensim con herramientas de terceros como PySD (Python) o SDEverywhere (C/JS), con cobertura parcial de funciones. |

### Instalación y activación
1. **PLE educativo y Model Reader**: se descargan de la página **Free Downloads** (vensim.com/free-downloads/; antes vensim.com/freedownload.html) y **no requieren código de registro**.
2. **PLE Plus, Professional, DSS y PLE comercial** requieren un **Registration Code**:
   - Se recibe por email (compra online) o impreso en el certificado de licencia o en la funda del CD (licencias antiguas).
   - Formato: letras, dígitos y guiones. **No distingue mayúsculas**, y los guiones pueden sustituirse por espacios. Lo más seguro es copiar y pegar desde el email.
   - El **nombre de la empresa** debe coincidir **exactamente** con el asociado al código (tampoco distingue mayúsculas).
   - En el centro de descargas se elige **Install a Registered Vensim Application** y se introduce el código para lanzar el instalador.
3. **Código perdido**: escribir a **vensim@vensim.com** con todos los datos posibles (empresa, fecha de compra, número de serie).
4. Desde 9.4, el instalador añade un **conjunto de fuentes** para que los sketches se vean igual entre equipos.
5. **Idioma**: desde 10.2.2 hay interfaz en **chino** (Tools > Language). Otros idiomas de interfaz: verificar.

---

## 6. Historial de versiones

Las notas de versión están en la ayuda online (*Release Notes*), en orden cronológico inverso. Fechas en formato "mes año" cuando la fuente las da.

### Resumen

| Versión | Fecha | Novedades clave |
|---|---|---|
| 1.50 | 1991 | Primera versión comercial (Windows 3.0), para expertos. |
| 4 | finales de los 90 (verificar) | Varitas separadas **Hide/Unhide Wand**; varios **niveles de ocultación** (8 según la nota; la ayuda actual habla de 1–9 o 1–16); tecla **H** alterna mostrar u ocultar todo; **Home/End** cambian el nivel. |
| **5.0** | feb 2002 | **SyntheSim** por primera vez (simular tan rápido que los resultados se ven al instante). Actualizaciones distribuidas por web. |
| 5.1 | 2002–03 (verificar) | Funciones financieras con unidades de tiempo distintas. **ODBC** solo en DSS. |
| 5.2 | (verificar) | Herramienta de sketch **Reference Mode** para dibujar modos de referencia en el diagrama. |
| 5.5 – 5.10b | hasta ~2010 (5.10a: ago 2010) | Mantenimiento y mejoras incrementales. |
| **6.0** | jun–jul 2012 | **Nuevo Equation Editor**, **nuevas barras de herramientas y cursores**. **Optimización estocástica**, restricciones discretas en parámetros, payoffs extendidos, **MCMC y simulated annealing**. 6.0a (sep 2012); 6.0b (dic 2012) con E/S de datos **CSV**. |
| 6.x | 2012–2014 | Subíndices configurados al vuelo (**GET DIRECT SUBSCRIPTS**, **GET ODBC SUBSCRIPTS**), sentencias **:EXCEPT:**. |
| 6.3 | may 2014 | Gran mejora de rendimiento de **MCMC** y simulated annealing; multistart aleatorio con mejor distribución inicial (**MWYS**). |
| 6.4 | ~2015–16 (verificar) | Modo **64 bits** con más memoria direccionable. Lookup editor con la curva en azul. Había compilaciones *DP* (doble precisión) separadas, p. ej. "Vensim DSSDP 6.4E for Mac". |
| **7.0** | 2017 (noticia "Vensim 7 Release", 29 jun 2017; verificar) | **Sensibilidad interactiva en SyntheSim**; exportación de percentiles de sensibilidad; payoffs de calibración que comparan variables entre sí; *trigger* para recalcular datos durante optimización y sensibilidad; caché de datos; payoffs **Poisson, Binomial y Huber robusto**; nuevos gráficos *anti-aliased* e interactivos en Graph y Strip Graph. |
| 7.1 – 7.3.x | 2017–2020 | 7.1/7.1a (2017), 7.2 (Mac, 2018), **7.3.4** (Windows, ediciones de **precisión simple y doble**, x32). Muy usada como referencia en tests de PySD. |
| **8.0** | jun 2019 | **64 bits en Windows y Mac**. **Doble precisión en todas las configuraciones**. Compresión ZIP interna de runs. Mejor compilación en DSS (Mac y Windows). Librerías de ejemplo de funciones externas. **Nuevos formatos de archivo** para 64 bits. Nuevos editores de *savelist*. Tamaño configurable de *behavior graphs*. Mejor soporte **XMILE**. Panel de navegación redimensionable. Mac mucho más estable; trabajo en una *dylib* equivalente a la DLL. |
| 8.0.8–8.0.9, 8.1.0–8.1.2, 8.2.x | 2019–2021 | Mantenimiento. **8.2** es la mínima recomendada en Apple silicon. |
| **9.0** | ~2021 (verificar) | **Nuevo aspecto de la interfaz** (*Tools > Switch to new sketch*); nuevas herramientas de **búsqueda** y de búsqueda de vistas; nueva implementación de **Molecules**; lanzar **SDM-Doc** desde Vensim; modo **Simulation setup** (*Simulation > Simulation control* o botón **Sim Control**: todos los parámetros de simulación con el sketch activo para cambiar constantes y lookups); **polaridad de flechas** rápida; **sliders de SyntheSim rediseñados**. |
| 9.2 | 2022 | Corrector ortográfico mejorado; **exportar sketch a SVG**; **Kalman filtering** con panel propio en Simulation Control; herramientas de análisis "*sticky*" (se activan al hacer clic en una variable); **unidades visibles en el sketch**; Project explorer (copiar, borrar y renombrar archivos); fuentes y colores por defecto aplicables a todas las vistas. |
| 9.3 | 2022 (9.3.2 jul 2022) | **Action recorder** (graba acciones como *command script*, DSS); **panel de errores de sintaxis** con doble clic para ir al elemento. |
| 9.4 – 9.4.2 | 2023 | **Run configuration tool** (escenarios predefinidos, DSS); múltiples *template screens*; instalación de fuentes. 9.4.1–9.4.2: mantenimiento. |
| **10.0** | 2023 (verificar) | **Sensitivity2All** (resumen de cómo influye **cada constante** en las variables de interés); **multi-core** (Windows) para sensibilidad, optimización y MCMC; en SyntheSim se guardan todos los cambios de constantes o solo los movimientos de sliders; enlaces URL a documentos Office en SharePoint; mejoras en Lookup editor y SyntheSim. |
| 10.1.0 – 10.1.5 | 2023–2024 | **Causal Table**; SDK WebAssembly 3.1.44; función de script/Venapp **PROCESS**; comandos Venapp para **Reality Check**; DLL de 32 bits en DSS; selección rápida de subíndices; árboles Causes/Uses de **profundidad variable en PLE** (*Tools > Options* → "Causes/uses tree depth"); subíndices y valores de constantes en **tooltips** (*Model > Settings > Sketch*). |
| **10.2.0** | ~jun 2024 | **Nueva herramienta Loops** que resalta la estructura en el sketch; **Causal chain** (rutas entre dos variables, resaltadas); nuevos **editores de Custom Graph y Custom Table**; sensibilidad multi-core en **Mac**; búsqueda **dentro de ecuaciones** (p. ej. "XLS"); **Notebook control** (DSS); *drag & drop* (custom graph del Control Panel al sketch, cargar y descargar runs). |
| 10.2.1 | jul 2024 | Mantenimiento. |
| 10.2.2 | sep 2024 | Interfaz en **chino** (*Tools > Language*); **SILS** en todas las ediciones (clic derecho sobre la herramienta Loops); funciones **FACTORIAL** y **FACTORIAL LN**. |
| **10.3** | feb 2025 (otra fuente dice mar 2025) | **Equation Editor rediseñado** (detalle abajo); variables **Data** al publicar en web; paletas de color aptas para **daltonismo** (pasa a ser la paleta por defecto); exportar **varios datasets a la vez**; MCMC con inicialización **en paralelo** (gran mejora con el método *Hybrid*) y mejores diagnósticos (umbral PSRF más bajo, más informes); **inferencia bayesiana**: payoff de tipo prior **'R'**, priors en la lista de parámetros del archivo de control de optimización y palabra clave **SYNTHETIC** para generar datos sintéticos; **Presentation mode** (oculta barras y desactiva la mayoría de menús). |
| **10.4.x** | 2025 (verificar fecha) | **Causal tracing rediseñado**; **Document tool rediseñado**; **menú contextual** con clic derecho en el sketch; exportar causal table, *delay marking* y colores; **comentarios en flechas** y sketch comments adjuntos a flechas; doble clic configurable (*Tools > Options*); transparencia en comentarios; **Sample models explorer**. PLE+: toolsets editables y **Diagram only mode** (*View > Diagram only mode*). Pro/DSS: datos incluidos en la publicación web y **dashboards web**. DSS: **servidor HTTP integrado** para probar publicaciones web. |
| **10.5** | jun 2026 | **Publicación web con plantillas**: apps en navegador a velocidad de SyntheSim y con datos exógenos; mejoras grandes de rendimiento y salida en **optimización y MCMC**; Causal Tracing® rediseñado y Document tool reconstruido (consolidan lo de 10.4); Sample models explorer; toolset editing y Diagram only mode en PLE+; **configuración más rápida de inferencia bayesiana**; **Kalman rápido** con un motor de álgebra lineal 1–2 órdenes de magnitud más veloz; **"Agentic Vensim"** (DSS): **servidor MCP local** que puede **editar y ejecutar modelos** desde agentes de IA. |

> No se encontró ninguna **Vensim 11** a octubre de 2026. La última versión documentada es la **10.5** (anuncio "Vensim/Ventity news, June 2026"). Puede haber parches 10.5.x posteriores (verificar).

### Detalle: el Equation Editor rediseñado (10.3)
- Diálogo **más grande**. Funciones, variables y subíndices se ven **sin cambiar de pestaña**, lo que reduce los movimientos de ratón.
- Sección **"Edit a Different Variable"** para saltar a otra variable, con filtros por **Causes**, **Uses**, tipo de variable, **Range** y pertenencia a **grupos**.
- **PLE** gana acceso a **Groups** y a esta navegación.
- La herramienta **Change Font** permite resaltar partes de una ecuación larga con otro color, tamaño o estilo.
- **Editor antiguo**, disponible "por tiempo limitado":
  - clic derecho en el botón del editor de ecuaciones → **Use legacy editor**, o
  - **Tools > Options > General** → marcar **Use legacy equation editor**.
- La documentación del editor antiguo aparece en la ayuda con el prefijo "Legacy :" (p. ej. "Legacy : The Equation Editor Dialog").

---

## 7. Formatos de archivo y compatibilidad entre ediciones

| Extensión | Qué es | Notas |
|---|---|---|
| `.mdl` | Modelo en **texto** (ecuaciones + sketch + settings) | Formato nativo y portable entre ediciones y versiones. Apto para control de versiones. Lo leen PySD y SDEverywhere. |
| `.vmf` | Modelo **binario** | Se abre con *Open Model* y con el Model Reader. |
| `.vpm` | Modelo **publicado** (*packaged*) | Para distribuir con Model Reader. Ver "Publishing a Packaged Model" en la ayuda. |
| `.vpa` | **Venapp** publicada | DSS la crea; Model Reader la ejecuta. |
| `.vdf` / `.vdfx` | **Datasets** (resultados de simulación) | Vensim 8 introdujo nuevos formatos para 64 bits. Se cree que `.vdfx` es el formato de dataset de 64 bits (verificar). |
| `.voc`, `.vsc`, `.lst`, `.vpd` | Control de optimización, control de sensibilidad, savelist, payoff | Ver los archivos de optimización y sensibilidad de esta base. |
| `.cmd` | Command script | Automatización; ver la tabla de ediciones. |
| `.xmile` / `.stmx` | Intercambio XMILE | Soporte mejorado desde Vensim 8. Alcance exacto de importación y exportación: verificar. |

Compatibilidad práctica:
- Un `.mdl` creado en Pro/DSS **se puede abrir** en PLE o PLE Plus. Si usa características no incluidas (subíndices, macros, funciones solo-DSS…), la edición inferior **no lo simulará** o dará error al comprobarlo (verificar el comportamiento exacto). La solución para terceros sin licencia es **publicar** el modelo y abrirlo con **Model Reader**.
- Desde Vensim 8 todas las ediciones calculan en **doble precisión**. Resultados de 7.x en precisión simple pueden diferir ligeramente.

---

## 8. Recursos de aprendizaje y soporte

### Documentación oficial (vensim.com/documentation/, "Vensim Help")
La ayuda es 100 % electrónica y se organiza así:
1. **General Information**: información general, licencia, *legal notices*, soporte técnico.
2. **Release Notes**: novedades por versión, con subpáginas como "Function and Language Changes" y "DLL, Venapp and Command Changes".
3. **Introduction and Tutorial** (antes *User Guide* / *User's Guide*): la interfaz (cap. 2, "The Vensim User Interface"), un ejemplo práctico (cap. 3, "A Hands-On Example"), diagramas causales (cap. 4, "Causal Loop Diagramming"), stocks y flujos, Reference Modes, Model Reader, publicación, etc. Incluye los "User's Guide Models".
4. **Modeling Guide — Concepts with Examples**: metodología de dinámica de sistemas con ejemplos (proceso de modelado, modos de referencia, fases y oscilación, modelado financiero, etc.).
5. **Reference Guide**: descripción detallada del **lenguaje** (ecuaciones, funciones, subíndices, unidades) y del **entorno** (menús, toolsets, herramientas de sketch y de análisis, Simulation Control, SyntheSim, Gaming, optimización, sensibilidad, Kalman, Reality Check).
6. **DSS for Software Developers** / *DSS Supplement – Compiling, Automation & Publishing*: compilación, funciones externas, DLL, Venapps, command scripts, publicación web (requiere instalar el **Emscripten SDK**).

Otros recursos de Ventana:
- **Vensim Video Library** (vensim.com/vensim-video-library/) y tutoriales en vídeo y texto anunciados en el foro.
- **Modelos de ejemplo** incluidos en la instalación (carpetas de modelos *sample* y *guide*, verificar los nombres exactos), con el **Sample models explorer** desde 10.4/10.5.
- **Vensim PLE Quick Reference and Tutorial**: guía rápida clásica de Ventana.
- **Molecules** (Jim Hines; "Modeling with Molecules 2.02"): biblioteca de estructuras genéricas reutilizables, reimplementada dentro de Vensim en 9.0.
- **SDM-Doc**: herramienta de documentación y evaluación de modelos, que puede lanzarse desde Vensim desde 9.0.
- **Cursos** de Ventana (impartidos, entre otros, por Tom Fiddaman) y materiales de conferencia ("Conference Resources ISDC 2026" en vensim.com/conference/).
- **Newsletter** (vensim.com/lists/) y sección **News** (anuncios de versiones).

### Comunidad
- **Vensim Forum** (Ventana UK): **https://www.ventanasystems.co.uk/forum/**. Foro abierto sobre el uso de Vensim y cuestiones de modelado. Tiene subforos de Vensim y Ventity e hilos de anuncio de cada versión (p. ej. "Vensim 10.3 is now available for download").
- **metasd.com** (Tom Fiddaman): blog con modelos Vensim descargables, análisis de modelos publicados y trucos.
- **System Dynamics Society** (systemdynamics.org): conferencia anual ISDC, *System Dynamics Review*, grupos de interés.
- Vídeos de terceros en YouTube: p. ej. Bob Gotwals ("Intro to Vensim", "Building a Simple Vensim Model") y el curso completo grabado de Ted Pavlic (Arizona State University). Si Ventana tiene canal oficial propio está sin verificar.

### Libros de referencia
| Libro | Relación con Vensim |
|---|---|
| J. D. Sterman, *Business Dynamics: Systems Thinking and Modeling for a Complex World* (2000) | Texto de referencia de la disciplina. Sus modelos se distribuyen en formato Vensim (verificar la disponibilidad actual). |
| E. Pruyt, *Small System Dynamics Models for Big Issues* (TU Delft, 2013) | Libro electrónico gratuito basado en Vensim, con muchos ejercicios. |
| D. Meadows, *Thinking in Systems* (2008) | Conceptual, sin software concreto. |
| A. Ford, *Modeling the Environment* | Usa principalmente Stella. Si hay versión con modelos Vensim, verificar. |
| J. Morecroft, *Strategic Modelling and Business Dynamics* | Usa iThink/Stella. Conceptos transferibles. |

### Soporte técnico
- Gratuito para Professional y DSS con mantenimiento vigente (página "Technical Support" de la ayuda y vensim.com/support/).
- Usuarios de PLE: foro.
- Contacto: vensim@vensim.com.

---

## 9. Preguntas frecuentes: ¿qué edición necesito?

| Necesidad | Edición mínima |
|---|---|
| Aprender o enseñar CLD y stocks y flujos, simular y usar SyntheSim | **PLE** (gratis en educación) |
| Uso comercial de un modelo sencillo | PLE con licencia comercial (o PLE Plus) |
| Leer datos externos o usar variables Data, múltiples vistas, sliders y gráficos en el sketch, Monte Carlo, gaming | **PLE Plus** |
| **Subíndices/arrays**, calibrar contra datos, optimizar políticas, Kalman, MCMC, editor de texto | **Professional** |
| Venapps / flight simulators, DLL, funciones externas, simulación compilada, multi-core, ODBC, scripts y automatización, servidor MCP | **DSS** |
| Que un tercero **ejecute** un modelo con subíndices u optimización sin comprar Vensim | Publicar (`.vpm`/`.vpa`) desde Pro/DSS y usar **Model Reader** (gratis) |
| Ejecutar `.mdl` en Python o en la web sin Vensim | Herramientas externas: PySD, SDEverywhere (cobertura parcial de funciones) |
| Modelado basado en entidades o agentes | **Ventity** (gratis con Pro/DSS y mantenimiento vigente) |

Señales de que un modelo necesita una edición superior:
- Hay corchetes `[...]` en los nombres de variables (subíndices) → Pro.
- Hay `:MACRO:` → Pro o DSS (verificar).
- Hay `EXTERNAL` o funciones definidas por el usuario en una DLL → DSS.
- Hay archivos `.voc`/`.vpd` (optimización) → Pro.
- Hay archivos `.vsc` (sensibilidad) → PLE Plus.

---

## Fuentes

**vensim.com y sitios de Ventana** (vistos como extractos de búsqueda; acceso directo bloqueado):
- https://vensim.com/comparison-chart-for-vensim-configurations/ (también https://vensim.com/comparison/)
- https://test.vensim.com/faqs/what-are-the-differences-among-ple-ple-plus-professional-and-dss/
- https://vensim.com/vensim-ple-plus/
- https://vensim.com/vensim-personal-learning-edition/
- https://vensim.com/vensim-model-reader/ · https://www.vensim.com/documentation/usr19_model_reader.html · https://vensim.com/running-models-with-vensim-ple-and-the-model-reader/
- https://vensim.com/vensim-applications/
- https://vensim.com/purchase/ · https://vensim.com/volume-discounts-and-site-license-pricing/ · https://www.vensim.com/store/ · https://vensim.com/wp-content/uploads/2023/05/Academic-Order-Form-_-Vensim.pdf
- https://vensim.com/license/ · https://www.vensim.com/documentation/license_agreement.html
- https://vensim.com/free-downloads/ · https://vensim.com/download/ · https://vensim.com/documentation/20050.html (Installing Vensim)
- https://test.vensim.com/faqs/what-are-the-hardware-requirements/ · https://vensim.com/faq/ · https://www.vensim.com/documentation/macintosh_notes.html
- https://vensim.com/vensim-history/ · https://www.ventanasystems.com/company_history/ · https://www.ventanasystems.com/company_ourteam/
- https://vensim.com/documentation/release_notes.html · http://vensim.com/documentation/changes_from_vensim_3.html (Version 4)
- https://www.vensim.com/documentation/version_5_10a___-__august_2010.html y demás páginas "Version 5.x"
- https://www.vensim.com/documentation/version_6_0.html · https://vensim.com/2012/07/vensim-6-released/ · https://vensim.com/2014/06/vensim-6-3-released/ · https://vensim.com/vensim-6-4-released/
- https://vensim.com/vensim-7-release/
- https://www.vensim.com/documentation/vensim_8_0_-_june_2019.html · https://vensim.com/2019/09/september-newsletter-ventana-news-vensim-8-ventity-3-releases/
- http://vensim.com/documentation/vensim-8_2_2.html (Vensim 9.0) · https://www.vensim.com/documentation/vensim-9_2.html · https://www.vensim.com/documentation/vensim-9_3.html · https://www.vensim.com/documentation/vensim-9_4.html · https://vensim.com/documentation/vensim-9_4_1.html
- https://vensim.com/documentation/vensim-10.html · https://vensim.com/documentation/vensim-10_0_1.html · https://vensim.com/documentation/vensim-10_2_0.html · https://vensim.com/documentation/vensim-10_2_1-(july-2024).html · https://vensim.com/documentation/vensim-10_2_2-(september-2024).html
- https://vensim.com/documentation/vensim-10_3.html · https://www.vensim.com/documentation/equation_editor.html · https://www.vensim.com/documentation/23080.html
- https://www.vensim.com/documentation/vensim-10_4_x.html
- https://vensim.com/2026/06/vensim-ventity-news-june-2026/ · https://vensim.com/news/ · https://vensim.com/2024/07/vensim-newsletter-june-2024/
- https://www.ventity.vensim.com/ · https://vensim.com/2015/08/ventity-beta-available/ · https://www.vensim.com/store/index.php?route=product/product&product_id=61
- https://www.vensim.com/documentation/ · https://vensim.com/documentation/ref01.html · https://vensim.com/documentation/modeling_guide.html · https://vensim.com/documentation/users_guide.html · https://vensim.com/documentation/dss_supplement.html · https://vensim.com/documentation/1_-install-the-emscripten-sdk_.html
- https://vensim.com/support/ · https://www.vensim.com/documentation/technical_support.html · https://vensim.com/resources/ · https://vensim.com/conference/ · https://vensim.com/modeling-with-molecules-2-02/
- https://www.ventanasystems.co.uk/forum/ · https://www.ventanasystems.co.uk/forum/viewtopic.php?t=8478 · https://www.ventanasystems.co.uk/forum/viewtopic.php?t=4905

**Otras**: https://en.wikipedia.org/wiki/Vensim · https://onlinelibrary.wiley.com/doi/10.1002/sdr.1504 (XMILE, Eberlein) · https://www.iseesystems.com/connector/2020/spring.aspx · https://metasd.com/tag/vensim/ · https://www.linkedin.com/in/tom-fiddaman/

**Repos locales usados** (`scratchpad/src/`):
- `test-models/tests/*/README.md`: versiones y fechas reales de Vensim usadas para generar resultados (6.3/6.4E Mac, 7.1/7.2/7.3.4 en precisión simple y doble, 8.0.9, 9.2.4, 9.3.1, 9.3.4, PLE 10.1.4).
- `test-models/samples/teacup/teacup.mdl`: estructura del `.mdl` (ecuaciones, sketch y settings).
- `pysd/docs/structure/vensim_translation.rst`, `pysd/pysd/translators/vensim/parsing_grammars/sketch.peg`.
